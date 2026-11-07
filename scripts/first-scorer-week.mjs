/**
 * Highest first-scorer share for each upcoming NFL, NHL, and soccer game.
 * The share uses the player's completed regular-season games. It is not a bet.
 *
 * Run: node scripts/first-scorer-week.mjs
 */

import { pathToFileURL } from 'node:url'
import { playerReads } from './projection-math.mjs'
import { looseName } from './player-logs.mjs'
import { rankFirstScorers, readFirstScorer } from './first-scorer.mjs'

const ESPN = 'https://site.api.espn.com'
const DATES = ['20261106', '20261107', '20261108', '20261109', '20261110']
const BOARDS = [
  { name: 'NFL', path: 'football/nfl', year: 2026, kind: 'firstTd', regular: true },
  { name: 'NHL', path: 'hockey/nhl', year: 2027, kind: 'firstGoal', regular: true },
  { name: 'Premier League', path: 'soccer/eng.1', year: 2026, kind: 'firstGoal', regular: false },
  { name: 'MLS', path: 'soccer/usa.1', year: 2026, kind: 'firstGoal', regular: false },
]

async function getJson(url) {
  const response = await fetch(url, { headers: { Accept: 'application/json', 'User-Agent': 'SidelineProjection/0.1' } })
  if (!response.ok) throw new Error(`${response.status} ${url}`)
  return response.json()
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
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, run))
  return results
}

function namesFromSummary(summary) {
  const found = []
  for (const group of summary.boxscore?.players || []) {
    const names = new Set()
    for (const stat of group.statistics || []) {
      for (const athlete of stat.athletes || []) {
        if (athlete.athlete?.displayName) names.add(athlete.athlete.displayName)
      }
    }
    if (names.size) found.push({ teamId: String(group.team?.id || ''), names: [...names] })
  }
  if (found.length) return found
  for (const group of summary.rosters || []) {
    const names = new Set()
    for (const player of group.roster || []) {
      if ((player.starter || player.subbedIn) && player.athlete?.displayName) names.add(player.athlete.displayName)
    }
    if (names.size) found.push({ teamId: String(group.team?.id || ''), names: [...names] })
  }
  return found
}

export async function upcoming(board) {
  const games = new Map()
  for (const date of DATES) {
    const data = await getJson(`${ESPN}/apis/site/v2/sports/${board.path}/scoreboard?dates=${date}&limit=300`)
    for (const event of data.events || []) {
      const competition = event.competitions?.[0]
      if (!competition || competition.status?.type?.completed || games.has(event.id)) continue
      const sides = competition.competitors || []
      const away = sides.find((side) => side.homeAway === 'away')
      const home = sides.find((side) => side.homeAway === 'home')
      games.set(event.id, {
        id: String(event.id),
        date: event.date,
        started: competition.status?.type?.state === 'in',
        away: away?.team?.shortDisplayName || away?.team?.displayName,
        home: home?.team?.shortDisplayName || home?.team?.displayName,
        awayId: String(away?.team?.id || ''),
        homeId: String(home?.team?.id || ''),
      })
    }
  }
  return [...games.values()].sort((a, b) => String(a.date).localeCompare(String(b.date)))
}

async function recentGames(board, teamIds) {
  const events = new Map()
  for (const teamId of teamIds) {
    const schedule = await getJson(`${ESPN}/apis/site/v2/sports/${board.path}/teams/${teamId}/schedule`)
    const rows = []
    for (const event of schedule.events || []) {
      const competition = event.competitions?.[0]
      if (!competition?.status?.type?.completed) continue
      if (Number(event.season?.year) !== board.year) continue
      const eventType = Number(event.seasonType?.type ?? event.season?.type?.type ?? event.season?.type)
      if (board.regular && eventType !== 2) continue
      rows.push({
        id: String(event.id),
        date: event.date || competition.date || '',
      })
    }
    for (const row of rows) {
      if (!events.has(row.id)) events.set(row.id, row)
    }
  }
  return [...events.values()]
}

function addPlayer(logs, name, row) {
  const key = looseName(name)
  const list = logs.get(key) ?? []
  if (list.some((item) => item.eventId === row.eventId)) return
  list.push({ ...row, name })
  logs.set(key, list)
}

export async function loadHistories(board, games) {
  const teamIds = [...new Set(games.flatMap((game) => [game.awayId, game.homeId]))]
  const events = await recentGames(board, teamIds)
  const logs = new Map()
  await pool(events, 8, async (event) => {
    try {
      const summary = await getJson(`${ESPN}/apis/site/v2/sports/${board.path}/summary?event=${event.id}`)
      const competition = summary.header?.competitions?.[0]
      const sides = competition?.competitors || []
      const awayId = String(sides.find((side) => side.homeAway === 'away')?.team?.id || '')
      const homeId = String(sides.find((side) => side.homeAway === 'home')?.team?.id || '')
      const scorer = readFirstScorer(board.kind, summary)
      for (const group of namesFromSummary(summary)) {
        const venue = group.teamId === homeId ? 'home' : group.teamId === awayId ? 'away' : 'neutral'
        for (const name of group.names) {
          addPlayer(logs, name, {
            eventId: event.id,
            date: event.date,
            venue,
            teamId: group.teamId,
            value: scorer && looseName(scorer) === looseName(name) ? 1 : 0,
          })
        }
      }
    } catch {
      // A missing summary stays out of the log.
    }
  })
  return logs
}

function showRead(read) {
  if (!read || read.missing || !Number.isFinite(read.value)) return 'missing'
  const thin = read.thin ? `, n=${read.n}` : ''
  return `${read.value.toFixed(2)}${thin}`
}

export function fieldForGame(game, logs) {
  const candidates = []
  for (const rows of logs.values()) {
    const mine = rows.filter((row) => row.teamId === game.awayId || row.teamId === game.homeId)
    if (!mine.length) continue
    const latest = [...mine].sort((a, b) => String(a.date).localeCompare(String(b.date))).at(-1)
    const venue = latest.teamId === game.homeId ? 'home' : latest.teamId === game.awayId ? 'away' : null
    if (!venue) continue
    const reads = playerReads(mine, venue)
    const venueRead = reads[0]
    if (!venueRead || venueRead.missing || !Number.isFinite(venueRead.value)) continue
    candidates.push({
      name: mine[0].name,
      side: venue === 'home' ? game.home : game.away,
      atHome: venue === 'home',
      reads,
      thin: reads.some((read) => read.thin),
    })
  }
  return rankFirstScorers(candidates)
}

function pickForGame(game, logs) {
  return fieldForGame(game, logs)[0] || null
}

function lineFor(game, pick) {
  const when = new Date(game.date).toLocaleString('en-US', {
    timeZone: 'America/New_York',
    weekday: 'short',
    hour: 'numeric',
    minute: '2-digit',
  })
  const started = game.started ? ' started' : ''
  if (!pick) return `${game.away} at ${game.home}, ${when}${started}: no prior first scorer`
  const reads = pick.reads.map(showRead).join(', ')
  const flag = pick.thin ? ' thin' : ''
  return `${game.away} at ${game.home}, ${when}${started}: ${pick.name} (${pick.side})${flag}. ${reads}`
}

async function main() {
  for (const board of BOARDS) {
    const games = await upcoming(board)
    process.stderr.write(`${board.name} ${games.length}\n`)
    const logs = await loadHistories(board, games)
    process.stdout.write(`\n${board.name}\n`)
    for (const game of games) process.stdout.write(`${lineFor(game, pickForGame(game, logs))}\n`)
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  main().catch((error) => {
    console.error(error)
    process.exit(1)
  })
}
