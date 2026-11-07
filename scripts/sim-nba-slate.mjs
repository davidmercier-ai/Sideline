/**
 * Rated box for every NBA game on a date.
 * Rotation: players with minutes in that team's last completed game.
 * Volume: that player's own 2026-27 log. A neutral site uses the full log.
 * Shots, free throws, and the contest use NBA 2K27 skill ratings.
 *
 * node scripts/sim-nba-slate.mjs --date 2026-11-07
 */

import { writeFile } from 'node:fs/promises'
import { indexRatings, loadNba2k, meanSkill, ratingName } from './game-ratings.mjs'
import { nbaGamesFromLog, simulateNbaBox } from './statline-sim.mjs'

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

function skill(stats, key) {
  if (!stats) return null
  if (Number.isFinite(stats[key])) return stats[key]
  const found = Object.entries(stats).find(([name]) => name.toLowerCase() === key.toLowerCase())
  return Number.isFinite(found?.[1]) ? found[1] : null
}

function attach(players, ratings, opponents) {
  const cards = opponents.map((player) => ratings.get(ratingName(player.name))).filter(Boolean)
  const contestThree = meanSkill(cards.map((card) => skill(card.stats, 'perimeterDefense')))
  const contestInside = meanSkill(cards.map((card) => skill(card.stats, 'interiorDefense')))
  return players.map((player) => {
    const card = ratings.get(ratingName(player.name))
    if (!card) return { ...player, rating: null }
    return {
      ...player,
      rating: card,
      skills: {
        three: skill(card.stats, 'threePointShot'),
        inside: meanSkill([skill(card.stats, 'closeShot'), skill(card.stats, 'midRangeShot'), skill(card.stats, 'drivingLayup')]),
        ft: skill(card.stats, 'FreeThrow'),
        contestThree,
        contestInside,
      },
    }
  })
}

async function roster(teamId) {
  const schedule = await getJson(`${ESPN}/apis/site/v2/sports/basketball/nba/teams/${teamId}/schedule`)
  const done = [...(schedule.events || [])].reverse().find((event) => {
    const type = Number(event.seasonType?.type ?? event.season?.type)
    return event.competitions?.[0]?.status?.type?.completed && Number(event.season?.year) >= 2026 && type === 2
  })
  if (!done) return { label: null, players: [] }
  const summary = await getJson(`${ESPN}/apis/site/v2/sports/basketball/nba/summary?event=${done.id}`)
  const group = (summary.boxscore?.players || []).find((item) => String(item.team?.id) === String(teamId))
  const players = []
  const seen = new Set()
  for (const stat of group?.statistics || []) {
    const keys = stat.keys || []
    const minutesAt = keys.indexOf('minutes')
    for (const athlete of stat.athletes || []) {
      const id = athlete.athlete?.id
      const name = athlete.athlete?.displayName
      if (!id || !name || seen.has(String(id))) continue
      if (minutesAt >= 0 && !(Number(athlete.stats?.[minutesAt]) > 0)) continue
      seen.add(String(id))
      players.push({ id: String(id), name })
    }
  }
  return { label: done.shortName, players }
}

async function withLog(player, venue, neutral) {
  const data = await getJson(`https://site.web.api.espn.com/apis/common/v3/sports/basketball/nba/athletes/${player.id}/gamelog`)
  const games = nbaGamesFromLog(data)
  const slice = games.filter((game) => game.venue === venue)
  const useVenue = !neutral && slice.length >= 3
  return {
    name: player.name,
    games: useVenue ? slice : games,
    thin: !neutral && !useVenue,
    played: games.length,
  }
}

function shown(player) {
  return player.min + player.fga + player.pts > 0
}

function row(player, rated) {
  const overall = rated?.rating?.overall ?? '—'
  const three = rated?.skills?.three ?? '—'
  return `| ${player.name} | ${overall} | ${three} | ${player.min} | ${player.fgm}-${player.fga} | ${player.fg3m}-${player.fg3a} | ${player.ftm}-${player.fta} | ${player.reb} | ${player.ast} | ${player.stl} | ${player.blk} | ${player.to} | ${player.pf} | ${player.pts} |`
}

function table(players, rated) {
  const ordered = [...players].filter(shown).sort((a, b) => b.pts - a.pts || b.fga - a.fga)
  const header = '| Player | OVR | Three | MIN | FG | 3PT | FT | REB | AST | STL | BLK | TO | PF | PTS |'
  const rule = '| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |'
  return [header, rule, ...ordered.map((player) => row(player, rated.find((item) => item.name === player.name)))].join('\n')
}

async function main() {
  const date = arg('--date', '2026-11-07')
  const out = arg('--out', `docs/projections/${date}-nba-sim.md`)
  const ratings = indexRatings((await loadNba2k()).players)
  const board = await getJson(`${ESPN}/apis/site/v2/sports/basketball/nba/scoreboard?dates=${date.replaceAll('-', '')}`)
  const events = [...(board.events || [])].sort((a, b) => String(a.date).localeCompare(String(b.date)))
  const blocks = [
    `# NBA statline sim ${date}`,
    '',
    `Retrieved ${new Date().toISOString()} UTC. NBA 2K27 ratings, ${ratings.size} current players.`,
    '',
    '2,000 draws. Minutes, shot attempts, free throws, and turnovers come from one game that player already played. The make is that player\'s own rate, moved by the 2K three-point, close-shot, and free-throw ratings against the other team\'s perimeter and interior defense. A missing rating leaves the rate alone. A neutral site uses the full log. The rotation is whoever played minutes in that team\'s last completed game. Each median column is its own median. No book price is read.',
    '',
  ]
  for (const event of events) {
    const competition = event.competitions[0]
    const away = competition.competitors.find((side) => side.homeAway === 'away')
    const home = competition.competitors.find((side) => side.homeAway === 'home')
    const neutral = Boolean(competition.neutralSite)
    const venue = competition.venue?.fullName || ''
    process.stderr.write(`${event.shortName}\n`)
    const [awayRotation, homeRotation] = await Promise.all([roster(away.team.id), roster(home.team.id)])
    const awayLogs = (await pool(awayRotation.players, 6, (player) => withLog(player, 'away', neutral))).filter((player) => player.played > 0)
    const homeLogs = (await pool(homeRotation.players, 6, (player) => withLog(player, 'home', neutral))).filter((player) => player.played > 0)
    const awayRated = attach(awayLogs, ratings, homeLogs)
    const homeRated = attach(homeLogs, ratings, awayLogs)
    const box = simulateNbaBox({
      home: homeRated,
      away: awayRated,
      draws: 2000,
      seed: Number(date.replaceAll('-', '')) + Number(String(event.id).slice(-4)),
    })
    const when = new Date(event.date).toLocaleString('en-US', {
      timeZone: 'America/New_York',
      weekday: 'short',
      hour: 'numeric',
      minute: '2-digit',
    })
    const thin = [...awayRated, ...homeRated].filter((player) => player.thin).map((player) => player.name)
    const matched = [...awayRated, ...homeRated].filter((player) => player.rating).length
    blocks.push(`## ${away.team.shortDisplayName} at ${home.team.shortDisplayName}`)
    blocks.push('')
    blocks.push(`${when} ET.${neutral ? ` Neutral site${venue ? `, ${venue}` : ''}. The full log is used.` : ''}`)
    blocks.push(`Rotation: ${away.team.abbreviation} ${awayRotation.label || 'missing'}, ${home.team.abbreviation} ${homeRotation.label || 'missing'}. 2K cards ${matched} of ${awayRated.length + homeRated.length}.`)
    if (thin.length) blocks.push(`Thin venue log, full season used: ${thin.join(', ')}.`)
    blocks.push(`One draw: ${away.team.abbreviation} ${box.sample.awayScore}, ${home.team.abbreviation} ${box.sample.homeScore}. Median: ${box.awayMedian}-${box.homeMedian}.`)
    blocks.push('')
    blocks.push(...box.sample.plays.slice(0, 6).map((play) => `- ${play}`))
    blocks.push('')
    blocks.push(`### ${away.team.displayName}`)
    blocks.push('')
    blocks.push(table(box.away, awayRated))
    blocks.push('')
    blocks.push(`### ${home.team.displayName}`)
    blocks.push('')
    blocks.push(table(box.home, homeRated))
    blocks.push('')
    process.stderr.write(`  ${box.awayMedian}-${box.homeMedian}\n`)
  }
  await writeFile(out, `${blocks.join('\n')}\n`)
  process.stderr.write(`wrote ${out}\n`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
