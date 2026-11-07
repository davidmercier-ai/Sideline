/**
 * Run one play-by-play box.
 * The rotation is the players who recorded minutes in that team's last
 * completed regular-season game. The shot and pass rates are each player's
 * own 2026-27 log. A venue slice under 3 games uses the full log and is marked thin.
 *
 * node scripts/sim-box.mjs --date 2026-11-07 --match Warriors --out docs/projections/2026-11-07-magic-warriors-sim.md
 */

import { writeFile } from 'node:fs/promises'
import { nbaGamesFromLog, simulateNbaBox } from './statline-sim.mjs'

const ESPN = 'https://site.api.espn.com'
const headers = { Accept: 'application/json', 'User-Agent': 'SidelineProjection/0.1' }

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

function arg(name, fallback) {
  const index = process.argv.indexOf(name)
  return index >= 0 ? process.argv[index + 1] : fallback
}

function minutesOf(stats, keys) {
  const index = keys.indexOf('minutes')
  if (index < 0) return 0
  const value = Number(String(stats[index] ?? '').split(':')[0])
  return Number.isFinite(value) ? value : 0
}

async function lastRotation(teamId) {
  const schedule = await getJson(`${ESPN}/apis/site/v2/sports/basketball/nba/teams/${teamId}/schedule`)
  const done = [...(schedule.events || [])].reverse().find((event) => {
    const competition = event.competitions?.[0]
    if (!competition?.status?.type?.completed) return false
    const year = Number(event.season?.year)
    const type = Number(event.seasonType?.type ?? event.season?.type)
    return year >= 2026 && type === 2
  })
  if (!done) return { label: null, players: [] }
  const summary = await getJson(`${ESPN}/apis/site/v2/sports/basketball/nba/summary?event=${done.id}`)
  const group = (summary.boxscore?.players || []).find((item) => String(item.team?.id) === String(teamId))
  const players = []
  const seen = new Set()
  for (const stat of group?.statistics || []) {
    const keys = stat.keys || stat.labels || []
    for (const athlete of stat.athletes || []) {
      const id = athlete.athlete?.id
      const name = athlete.athlete?.displayName
      if (!id || !name || seen.has(id)) continue
      if (minutesOf(athlete.stats || [], keys) <= 0) continue
      seen.add(id)
      players.push({ id: String(id), name })
    }
  }
  return { label: done.shortName, players }
}

async function loadPlayer(player, venue) {
  const data = await getJson(`https://site.web.api.espn.com/apis/common/v3/sports/basketball/nba/athletes/${player.id}/gamelog`)
  const games = nbaGamesFromLog(data)
  const slice = games.filter((game) => game.venue === venue)
  const useVenue = slice.length >= 3
  return {
    name: player.name,
    games: useVenue ? slice : games,
    thin: !useVenue,
    played: games.length,
  }
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

function line(player) {
  const fg = `${player.fgm}-${player.fga}`
  const three = `${player.fg3m}-${player.fg3a}`
  const ft = `${player.ftm}-${player.fta}`
  return `| ${player.name} | ${player.min} | ${fg} | ${three} | ${ft} | ${player.reb} | ${player.ast} | ${player.stl} | ${player.blk} | ${player.to} | ${player.pf} | ${player.pts} |`
}

function table(players) {
  const ordered = [...players].sort((a, b) => b.pts - a.pts || b.fga - a.fga)
  const header = '| Player | MIN | FG | 3PT | FT | REB | AST | STL | BLK | TO | PF | PTS |'
  const rule = '| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |'
  return [header, rule, ...ordered.map(line)].join('\n')
}

async function main() {
  const date = arg('--date', '2026-11-07')
  const match = arg('--match', 'Warriors')
  const out = arg('--out', `docs/projections/${date}-statline-sim.md`)
  const board = await getJson(`${ESPN}/apis/site/v2/sports/basketball/nba/scoreboard?dates=${date.replaceAll('-', '')}`)
  const event = (board.events || []).find((item) => `${item.shortName} ${item.name}`.toLowerCase().includes(match.toLowerCase()))
  if (!event) throw new Error(`No NBA game matching ${match} on ${date}`)
  const competition = event.competitions[0]
  const away = competition.competitors.find((side) => side.homeAway === 'away')
  const home = competition.competitors.find((side) => side.homeAway === 'home')
  const [awayRotation, homeRotation] = await Promise.all([
    lastRotation(away.team.id),
    lastRotation(home.team.id),
  ])
  process.stderr.write(`${away.team.shortDisplayName} ${awayRotation.players.length} from ${awayRotation.label}\n`)
  process.stderr.write(`${home.team.shortDisplayName} ${homeRotation.players.length} from ${homeRotation.label}\n`)
  const awayPlayers = await pool(awayRotation.players, 6, (player) => loadPlayer(player, 'away'))
  const homePlayers = await pool(homeRotation.players, 6, (player) => loadPlayer(player, 'home'))
  const box = simulateNbaBox({
    home: homePlayers,
    away: awayPlayers,
    draws: 2000,
    seed: Number(date.replaceAll('-', '')),
  })
  const when = new Date(event.date).toLocaleString('en-US', {
    timeZone: 'America/New_York',
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
  const thin = [...awayPlayers, ...homePlayers].filter((player) => player.thin).map((player) => player.name)
  const lines = [
    `# ${away.team.shortDisplayName} at ${home.team.shortDisplayName} statline sim`,
    '',
    `${when} ET. 2,000 draws. Seed ${date.replaceAll('-', '')}.`,
    '',
    'Each draw plays the game one shot, turnover, and free throw at a time. Minutes, shot attempts, free-throw attempts, and turnovers come from one game that player already played. The make, rebound, assist, steal, and block on that play come from the player\'s own 2026-27 rates. A missing rate is skipped. The opponent does not change a make rate. No book price is read. This is separate from the four models and from the team-score resample.',
    '',
    `Rotation: players with minutes in ${away.team.shortDisplayName} ${awayRotation.label} and ${home.team.shortDisplayName} ${homeRotation.label}.`,
    thin.length ? `Thin venue log, full season used: ${thin.join(', ')}.` : 'Every player had at least 3 games at this site.',
    '',
    `Median score: ${away.team.shortDisplayName} ${box.awayMedian}, ${home.team.shortDisplayName} ${box.homeMedian}.`,
    '',
    '## One simulated game',
    '',
    `Final: ${away.team.shortDisplayName} ${box.sample.awayScore}, ${home.team.shortDisplayName} ${box.sample.homeScore}.`,
    '',
    `### ${away.team.displayName}`,
    '',
    table(box.sample.away),
    '',
    `### ${home.team.displayName}`,
    '',
    table(box.sample.home),
    '',
    '### How that game ran',
    '',
    ...box.sample.plays.slice(0, 24).map((play) => `- ${play}`),
    box.sample.plays.length > 24 ? `- … ${box.sample.plays.length - 24} more plays` : '',
    '',
    '## Median line, 2,000 draws',
    '',
    'Each column is its own median. The median points are not the sum of the median makes.',
    '',
    `### ${away.team.displayName}`,
    '',
    table(box.away),
    '',
    `### ${home.team.displayName}`,
    '',
    table(box.home),
    '',
  ]
  await writeFile(out, `${lines.filter((line) => line !== undefined).join('\n')}\n`)
  process.stderr.write(`wrote ${out}\n`)
  process.stdout.write(`${away.team.shortDisplayName} ${box.sample.awayScore} at ${home.team.shortDisplayName} ${box.sample.homeScore}. Median ${box.awayMedian}-${box.homeMedian}. Plays ${box.sample.plays.length}.\n`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
