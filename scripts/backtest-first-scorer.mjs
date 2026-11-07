/**
 * Walk-forward record for first touchdown, first basket, and first goal.
 * Each game uses only that player's earlier games. A yes call needs the venue
 * read and at least three reads at or above one half, with no thin read.
 * The strict call needs all four at or above one half.
 *
 * Run: node scripts/backtest-first-scorer.mjs
 */

import { writeFile } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'
import { looseName } from './player-logs.mjs'
import { readFirstScorer, walkForwardFirst } from './first-scorer.mjs'

const ESPN = 'https://site.api.espn.com'
const LEAGUES = [
  { name: 'NFL', path: 'football/nfl', year: 2026, kind: 'firstTd', label: 'First touchdown' },
  { name: 'NBA', path: 'basketball/nba', year: 2027, kind: 'firstBasket', label: 'First basket' },
  { name: 'NHL', path: 'hockey/nhl', year: 2027, kind: 'firstGoal', label: 'First goal' },
  { name: 'EPL', path: 'soccer/eng.1', year: 2026, kind: 'firstGoal', label: 'First goal' },
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
    const teamId = String(group.team?.id || '')
    const names = new Set()
    for (const stat of group.statistics || []) {
      for (const athlete of stat.athletes || []) {
        if (athlete.athlete?.displayName) names.add(athlete.athlete.displayName)
      }
    }
    if (names.size) found.push({ teamId, names: [...names] })
  }
  if (found.length) return found
  for (const group of summary.rosters || []) {
    const teamId = String(group.team?.id || group.roster?.[0]?.team?.id || '')
    const names = new Set()
    for (const player of group.roster || []) {
      if (player.athlete?.displayName) names.add(player.athlete.displayName)
    }
    if (names.size) found.push({ teamId, names: [...names] })
  }
  return found
}

async function sampleLeague(league) {
  const teamsData = await getJson(`${ESPN}/apis/site/v2/sports/${league.path}/teams?limit=20`)
  const teams = (teamsData.sports?.[0]?.leagues?.[0]?.teams || []).map((entry) => entry.team).filter((team) => team?.id).slice(0, 6)
  const events = new Map()
  for (const team of teams) {
    const schedule = await getJson(`${ESPN}/apis/site/v2/sports/${league.path}/teams/${team.id}/schedule`)
    for (const event of schedule.events || []) {
      const competition = event.competitions?.[0]
      if (!competition?.status?.type?.completed) continue
      if (Number(event.season?.year) !== league.year) continue
      const eventType = Number(event.seasonType?.type ?? event.season?.type?.type ?? event.season?.type)
      if (league.name !== 'EPL' && eventType !== 2) continue
      if (events.has(event.id)) continue
      const sides = competition.competitors || []
      const away = sides.find((side) => side.homeAway === 'away')
      const home = sides.find((side) => side.homeAway === 'home')
      events.set(event.id, {
        id: String(event.id),
        date: event.date || competition.date || '',
        awayId: String(away?.team?.id || ''),
        homeId: String(home?.team?.id || ''),
      })
    }
  }
  const games = [...events.values()].sort((a, b) => String(a.date).localeCompare(String(b.date))).slice(-40)
  const logs = new Map()
  await pool(games, 6, async (game) => {
    try {
      const summary = await getJson(`${ESPN}/apis/site/v2/sports/${league.path}/summary?event=${game.id}`)
      const scorer = readFirstScorer(league.kind, summary)
      const groups = namesFromSummary(summary)
      for (const group of groups) {
        const venue = group.teamId === game.homeId ? 'home' : group.teamId === game.awayId ? 'away' : 'neutral'
        for (const name of group.names) {
          const key = looseName(name)
          const list = logs.get(key) ?? []
          list.push({
            date: game.date,
            venue,
            value: scorer && looseName(scorer) === key ? 1 : 0,
            name,
          })
          logs.set(key, list)
        }
      }
    } catch {
      // A missing summary stays out of the sample.
    }
  })
  const tally = {
    strict: { hits: 0, decided: 0 },
    called: { hits: 0, decided: 0 },
    base: { hits: 0, decided: 0 },
  }
  let players = 0
  for (const rows of logs.values()) {
    if (rows.length < 2) continue
    players += 1
    const scored = walkForwardFirst(rows)
    for (const key of ['strict', 'called', 'base']) {
      tally[key].hits += scored[key].hits
      tally[key].decided += scored[key].decided
    }
  }
  return { ...league, games: games.length, players, tally }
}

function pct(hits, decided) {
  if (!decided) return '0/0'
  return `${((hits / decided) * 100).toFixed(1)}% (${hits}/${decided})`
}

function report(results, retrievedAt) {
  const lines = [
    '# First scorer walk-forward',
    '',
    `Run at ${retrievedAt} UTC. Each game uses only that player's earlier games in this sample. A called row needs the venue read and at least three reads at or above one half, and no thin read. A strict row needs all four reads at or above one half. The base rate is how often a player in the sample was the first scorer. This is not a win probability and it is not a bet.`,
    '',
    'First basket is the first field goal. A free throw does not count. First touchdown ignores field goals. An own goal credits nobody.',
    '',
    '| League | Market | Games | Players | Base rate | Called | Strict |',
    '| --- | --- | --- | --- | --- | --- | --- |',
  ]
  for (const row of results) {
    lines.push(`| ${row.name} | ${row.label} | ${row.games} | ${row.players} | ${pct(row.tally.base.hits, row.tally.base.decided)} | ${pct(row.tally.called.hits, row.tally.called.decided)} | ${pct(row.tally.strict.hits, row.tally.strict.decided)} |`)
  }
  lines.push('')
  lines.push('The sample is six teams and up to 40 completed games in the current season. A player needs two games in that sample before a later game can be scored.')
  lines.push('')
  return lines.join('\n')
}

async function main() {
  const results = []
  for (const league of LEAGUES) {
    process.stderr.write(`loading ${league.name}\n`)
    const row = await sampleLeague(league)
    process.stderr.write(`${league.name}: ${row.games} games, ${row.players} players\n`)
    results.push(row)
  }
  const markdown = `${report(results, new Date().toISOString())}\n`
  await writeFile('docs/projections/FIRST-SCORER-BACKTEST.md', markdown)
  process.stdout.write(markdown)
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  main().catch((error) => {
    console.error(error)
    process.exit(1)
  })
}
