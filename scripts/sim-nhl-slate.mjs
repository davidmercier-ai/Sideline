/**
 * Rated box for every NHL game still to be played.
 * Skater shots come from one of that player's games. Each shot is a goal or a
 * save from his own shooting rate, moved by EA shot ratings against the
 * goalie's save ratings.
 *
 * node scripts/sim-nhl-slate.mjs --date 2026-11-07
 */

import { writeFile } from 'node:fs/promises'
import { indexRatings, loadEaRatings, meanSkill, ratingName } from './game-ratings.mjs'
import { nhlGamesFromLog, simulateNhlBox } from './statline-sim.mjs'

const ESPN = 'https://site.api.espn.com'
const headers = { Accept: 'application/json', 'User-Agent': 'SidelineProjection/0.1' }

function arg(name, fallback) {
  const index = process.argv.indexOf(name)
  return index >= 0 ? process.argv[index + 1] : fallback
}

async function getJson(url) {
  let last
  for (let attempt = 0; attempt < 4; attempt += 1) {
    try {
      const response = await fetch(url, { headers })
      if (!response.ok) throw new Error(`${response.status} ${url}`)
      return response.json()
    } catch (error) {
      last = error
      await new Promise((resolve) => setTimeout(resolve, 250 * (attempt + 1)))
    }
  }
  throw last
}

async function pool(items, limit, worker) {
  const results = []
  let index = 0
  async function run() {
    while (index < items.length) {
      const current = index
      index += 1
      results[current] = await worker(items[current])
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, () => run()))
  return results
}

function toiMinutes(value) {
  const match = String(value ?? '').match(/^(\d+):(\d+)/)
  if (!match) return 0
  return Number(match[1]) + Number(match[2]) / 60
}

function shotSkill(card) {
  return meanSkill([card?.stats?.wristshotAccuracy, card?.stats?.slapshotAccuracy, card?.stats?.handeye])
}

function saveSkill(card) {
  return meanSkill([
    card?.stats?.glovesideHigh,
    card?.stats?.glovesideLow,
    card?.stats?.sticksideHigh,
    card?.stats?.sticksideLow,
    card?.stats?.fiveHole,
  ])
}

async function roster(teamId) {
  const schedule = await getJson(`${ESPN}/apis/site/v2/sports/hockey/nhl/teams/${teamId}/schedule`)
  const done = [...(schedule.events || [])].reverse().find((event) => {
    const type = Number(event.seasonType?.type ?? event.season?.type?.type ?? event.season?.type)
    return event.competitions?.[0]?.status?.type?.completed && Number(event.season?.year) >= 2026 && type === 2
  })
  if (!done) return { label: null, skaters: [], goalie: null }
  const summary = await getJson(`${ESPN}/apis/site/v2/sports/hockey/nhl/summary?event=${done.id}`)
  const group = (summary.boxscore?.players || []).find((item) => String(item.team?.id) === String(teamId))
  const skaters = []
  const seen = new Set()
  let goalie = null
  let goalieMinutes = -1
  for (const stat of group?.statistics || []) {
    const keys = stat.keys || []
    const toiAt = keys.indexOf('timeOnIce')
    if (/goalie/i.test(stat.name || '')) {
      for (const athlete of stat.athletes || []) {
        const minutes = toiMinutes(athlete.stats?.[toiAt])
        if (!athlete.athlete?.id || minutes <= goalieMinutes) continue
        goalieMinutes = minutes
        goalie = { id: String(athlete.athlete.id), name: athlete.athlete.displayName }
      }
      continue
    }
    if (!/forward|defense/i.test(stat.name || '')) continue
    for (const athlete of stat.athletes || []) {
      const id = athlete.athlete?.id
      const name = athlete.athlete?.displayName
      if (!id || !name || seen.has(String(id))) continue
      if (toiMinutes(athlete.stats?.[toiAt]) <= 0) continue
      seen.add(String(id))
      skaters.push({ id: String(id), name })
    }
  }
  return { label: done.shortName, skaters, goalie }
}

async function withLog(player, venue) {
  const data = await getJson(`https://site.web.api.espn.com/apis/common/v3/sports/hockey/nhl/athletes/${player.id}/gamelog`)
  const games = nhlGamesFromLog(data)
  const slice = games.filter((game) => game.venue === venue)
  const useVenue = slice.length >= 3
  return {
    name: player.name,
    games: useVenue ? slice : games,
    thin: !useVenue,
    played: games.length,
  }
}

function dress(player, ratings, save) {
  const card = ratings.get(ratingName(player.name))
  return {
    ...player,
    rating: card || null,
    skills: {
      shot: shotSkill(card),
      save,
    },
  }
}

function dressGoalie(player, ratings) {
  if (!player) return null
  const card = ratings.get(ratingName(player.name))
  return { ...player, rating: card || null, skills: { save: saveSkill(card) } }
}

function minutes(value) {
  if (!Number.isFinite(value)) return '—'
  return Math.round(value)
}

function skaterTable(players, rated) {
  const ordered = [...players].sort((a, b) => b.points - a.points || b.goals - a.goals || b.shots - a.shots)
  const lines = [
    '| Player | OVR | Shot | TOI | G | A | PTS | SOG |',
    '| --- | --- | --- | --- | --- | --- | --- | --- |',
  ]
  for (const player of ordered) {
    const card = rated.find((item) => item.name === player.name)?.rating
    lines.push(`| ${player.name} | ${card?.overall ?? '—'} | ${shotSkill(card) == null ? '—' : Math.round(shotSkill(card))} | ${minutes(player.minutes)} | ${player.goals} | ${player.assists} | ${player.points} | ${player.shots} |`)
  }
  return lines.join('\n')
}

function goalieLine(box, rated) {
  if (!box) return 'Goalie missing.'
  const shots = box.shotsAgainst
  const pct = shots > 0 ? (box.saves / shots).toFixed(3) : '—'
  const overall = rated?.rating?.overall ?? '—'
  const save = saveSkill(rated?.rating)
  return `${box.name} is ${overall} overall${save == null ? '' : `, save rating ${Math.round(save)}`}. ${box.saves} saves on ${shots} shots, ${box.goalsAgainst} goals against, save percentage ${pct}.`
}

async function main() {
  const date = arg('--date', '2026-11-07')
  const out = arg('--out', `docs/projections/${date}-nhl-sim.md`)
  const ratings = indexRatings((await loadEaRatings('nhl')).players)
  const board = await getJson(`${ESPN}/apis/site/v2/sports/hockey/nhl/scoreboard?dates=${date.replaceAll('-', '')}`)
  const events = [...(board.events || [])].sort((a, b) => String(a.date).localeCompare(String(b.date)))
  const blocks = [
    `# NHL statline sim ${date}`,
    '',
    `Retrieved ${new Date().toISOString()} UTC. EA NHL ratings, ${ratings.size} players.`,
    '',
    '2,000 draws for each game that has not started. Each skater\'s shots come from one game he already played. Each shot is a goal or a save from his own shooting rate, moved by the EA wrist-shot, slap-shot, and hand-eye ratings against the goalie\'s five save ratings. A missing rating leaves the shooting rate. The rotation is whoever played in that team\'s last completed game. The goalie is the one with more minutes in that game. No book price is read.',
    '',
  ]
  for (const event of events) {
    const competition = event.competitions[0]
    const away = competition.competitors.find((side) => side.homeAway === 'away')
    const home = competition.competitors.find((side) => side.homeAway === 'home')
    const when = new Date(event.date).toLocaleString('en-US', {
      timeZone: 'America/New_York',
      weekday: 'short',
      hour: 'numeric',
      minute: '2-digit',
    })
    if (competition.status?.type?.state !== 'pre') {
      blocks.push(`## ${away.team.shortDisplayName} at ${home.team.shortDisplayName}`)
      blocks.push('')
      blocks.push(`${when} ET. Live, ${competition.status.type.shortDetail}. ${away.team.abbreviation} ${away.score}, ${home.team.abbreviation} ${home.score}. The clock stays the record. No box was simulated.`)
      blocks.push('')
      continue
    }
    process.stderr.write(`${event.shortName}\n`)
    const [awayRoster, homeRoster] = await Promise.all([roster(away.team.id), roster(home.team.id)])
    const awaySkaters = (await pool(awayRoster.skaters, 6, (player) => withLog(player, 'away'))).filter((player) => player.played)
    const homeSkaters = (await pool(homeRoster.skaters, 6, (player) => withLog(player, 'home'))).filter((player) => player.played)
    const awayGoalie = awayRoster.goalie ? await withLog(awayRoster.goalie, 'away') : null
    const homeGoalie = homeRoster.goalie ? await withLog(homeRoster.goalie, 'home') : null
    const awaySave = saveSkill(ratings.get(ratingName(homeGoalie?.name)))
    const homeSave = saveSkill(ratings.get(ratingName(awayGoalie?.name)))
    const awayDressed = awaySkaters.map((player) => dressSave(player, ratings, awaySave))
    const homeDressed = homeSkaters.map((player) => dressSave(player, ratings, homeSave))
    const box = simulateNhlBox({
      away: { skaters: awayDressed, goalie: dressGoalie(awayGoalie, ratings) },
      home: { skaters: homeDressed, goalie: dressGoalie(homeGoalie, ratings) },
      draws: 2000,
      seed: Number(date.replaceAll('-', '')) + Number(String(event.id).slice(-4)),
    })
    const matched = [...awayDressed, ...homeDressed, dressGoalie(awayGoalie, ratings), dressGoalie(homeGoalie, ratings)]
      .filter((player) => player?.rating).length
    blocks.push(`## ${away.team.shortDisplayName} at ${home.team.shortDisplayName}`)
    blocks.push('')
    blocks.push(`${when} ET. Rotation: ${away.team.abbreviation} ${awayRoster.label || 'missing'}, ${home.team.abbreviation} ${homeRoster.label || 'missing'}. EA cards ${matched}.`)
    blocks.push(`One game: ${away.team.abbreviation} ${box.sample.awayScore}, ${home.team.abbreviation} ${box.sample.homeScore}. Median of 2,000 games: ${box.awayMedian}-${box.homeMedian}.`)
    blocks.push('')
    blocks.push(`### ${away.team.displayName}`)
    blocks.push('')
    blocks.push(goalieLine(box.sample.awayGoalie, dressGoalie(awayGoalie, ratings)))
    blocks.push('')
    blocks.push(skaterTable(box.sample.away, awayDressed))
    blocks.push('')
    blocks.push(`### ${home.team.displayName}`)
    blocks.push('')
    blocks.push(goalieLine(box.sample.homeGoalie, dressGoalie(homeGoalie, ratings)))
    blocks.push('')
    blocks.push(skaterTable(box.sample.home, homeDressed))
    blocks.push('')
    process.stderr.write(`  ${box.awayMedian}-${box.homeMedian}\n`)
  }
  await writeFile(out, `${blocks.join('\n')}\n`)
  process.stderr.write(`wrote ${out}\n`)
}

function dressSave(player, ratings, save) {
  const card = ratings.get(ratingName(player.name))
  return { ...player, rating: card || null, skills: { shot: shotSkill(card), save } }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
