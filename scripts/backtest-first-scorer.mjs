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
import { readFirstScorer, scoreGameLeaders, walkForwardFirst } from './first-scorer.mjs'

const ESPN = 'https://site.api.espn.com'
const LEAGUES = [
  { name: 'NFL', path: 'football/nfl', year: 2026, kind: 'firstTd', label: 'First touchdown', regular: true },
  { name: 'NBA', path: 'basketball/nba', year: 2027, kind: 'firstBasket', label: 'First basket', regular: true },
  { name: 'NHL', path: 'hockey/nhl', year: 2027, kind: 'firstGoal', label: 'First goal', regular: true },
  { name: 'EPL', path: 'soccer/eng.1', year: 2026, kind: 'firstGoal', label: 'First goal', regular: false },
  { name: 'MLS', path: 'soccer/usa.1', year: 2026, kind: 'firstGoal', label: 'First goal', regular: true },
]

async function getJson(url) {
  let last
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const response = await fetch(url, { headers: { Accept: 'application/json', 'User-Agent': 'SidelineProjection/0.1' } })
      if (!response.ok) throw new Error(`${response.status} ${url}`)
      return await response.json()
    } catch (error) {
      last = error
      await new Promise((resolve) => setTimeout(resolve, 200 * (attempt + 1)))
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
      if ((player.starter || player.subbedIn) && player.athlete?.displayName) names.add(player.athlete.displayName)
    }
    if (names.size) found.push({ teamId, names: [...names] })
  }
  return found
}

async function sampleLeague(league) {
  const teamsData = await getJson(`${ESPN}/apis/site/v2/sports/${league.path}/teams?limit=100`)
  const teams = (teamsData.sports?.[0]?.leagues?.[0]?.teams || []).map((entry) => entry.team).filter((team) => team?.id)
  const events = new Map()
  for (const team of teams) {
    const schedule = await getJson(`${ESPN}/apis/site/v2/sports/${league.path}/teams/${team.id}/schedule`)
    for (const event of schedule.events || []) {
      const competition = event.competitions?.[0]
      if (!competition?.status?.type?.completed) continue
      if (Number(event.season?.year) !== league.year) continue
      const eventType = Number(event.seasonType?.type ?? event.season?.type?.type ?? event.season?.type)
      const typeName = event.seasonType?.name || event.season?.type?.name || ''
      const regularGame = eventType === 2 || /^regular season$/i.test(typeName)
      if (league.regular && !regularGame) continue
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
  const games = [...events.values()].sort((a, b) => String(a.date).localeCompare(String(b.date)))
  const logs = new Map()
  const appearances = []
  let missed = 0
  await pool(games, 8, async (game) => {
    try {
      const summary = await getJson(`${ESPN}/apis/site/v2/sports/${league.path}/summary?event=${game.id}`)
      const scorer = readFirstScorer(league.kind, summary)
      const groups = namesFromSummary(summary)
      for (const group of groups) {
        const venue = group.teamId === game.homeId ? 'home' : group.teamId === game.awayId ? 'away' : 'neutral'
        for (const name of group.names) {
          const key = `${looseName(name)}|${group.teamId}`
          const list = logs.get(key) ?? []
          const row = {
            eventId: game.id,
            date: game.date,
            venue,
            teamId: group.teamId,
            value: scorer && looseName(scorer) === looseName(name) ? 1 : 0,
            name,
          }
          list.push(row)
          logs.set(key, list)
          appearances.push(row)
        }
      }
    } catch (error) {
      missed += 1
      process.stderr.write(`miss ${league.name} ${game.id} ${error.message}\n`)
    }
  })
  appearances.sort((a, b) => String(a.eventId).localeCompare(String(b.eventId)) || String(a.name).localeCompare(String(b.name)))
  const tally = {
    strict: { hits: 0, decided: 0 },
    called: { hits: 0, decided: 0 },
    pair: { hits: 0, decided: 0 },
    base: { hits: 0, decided: 0 },
  }
  let players = 0
  for (const rows of logs.values()) {
    if (rows.length < 2) continue
    players += 1
    const scored = walkForwardFirst(rows)
    for (const key of ['strict', 'called', 'pair', 'base']) {
      tally[key].hits += scored[key].hits
      tally[key].decided += scored[key].decided
    }
  }
  return { ...league, games: games.length, players, missed, tally, leaders: scoreGameLeaders(games, appearances) }
}

function pct(hits, decided) {
  if (!decided) return '0/0'
  return `${((hits / decided) * 100).toFixed(1)}% (${hits}/${decided})`
}

function report(results, retrievedAt) {
  const lines = [
    '# First scorer walk-forward',
    '',
    `Run at ${retrievedAt} UTC. Each game uses only that player's earlier games. A pair row needs the venue read and at least one other read at or above one half, and no thin read. A called row needs the venue read and at least three reads at or above one half. A strict row needs all four. The leader is the highest share in that game. These rows are a record. A share is not a win probability and it is not a bet.`,
    '',
    'First basket is the first field goal. A free throw does not count. First touchdown ignores field goals. An own goal credits nobody.',
    '',
    '| League | Market | Games | Players | Base rate | Pair | Called | Strict |',
    '| --- | --- | --- | --- | --- | --- | --- | --- |',
  ]
  for (const row of results) {
    lines.push(`| ${row.name} | ${row.label} | ${row.games} | ${row.players} | ${pct(row.tally.base.hits, row.tally.base.decided)} | ${pct(row.tally.pair.hits, row.tally.pair.decided)} | ${pct(row.tally.called.hits, row.tally.called.decided)} | ${pct(row.tally.strict.hits, row.tally.strict.decided)} |`)
  }
  lines.push('')
  lines.push('The leader table scores one player per game: the highest venue share among players who had already played. Pair, called, and strict count only when that leader also clears the rule.')
  lines.push('')
  lines.push('| League | Leader | Leader and pair | Leader and called | Leader and strict |')
  lines.push('| --- | --- | --- | --- | --- |')
  for (const row of results) {
    const leaders = row.leaders
    lines.push(`| ${row.name} | ${pct(leaders.leader.hits, leaders.leader.decided)} | ${pct(leaders.pair.hits, leaders.pair.decided)} | ${pct(leaders.called.hits, leaders.called.decided)} | ${pct(leaders.strict.hits, leaders.strict.decided)} |`)
  }
  lines.push('')
  lines.push('The sample is every team and every completed regular-season game in the current season. The Premier League keeps the league games ESPN marks complete for 2026. A player needs two games before a later game can be scored. Soccer counts starters and substitutes. A tie on the four reads goes to the name that sorts first.')
  const missed = results.reduce((sum, row) => sum + (row.missed || 0), 0)
  lines.push(missed === 0 ? 'Every scheduled summary loaded.' : `${missed} summaries failed and stayed out of the sample.`)
  lines.push('')
  return lines.join('\n')
}

async function main() {
  const results = []
  const only = process.argv[2]
  for (const league of LEAGUES.filter((item) => !only || item.name.toLowerCase() === only.toLowerCase())) {
    process.stderr.write(`loading ${league.name}\n`)
    const row = await sampleLeague(league)
    process.stderr.write(`${league.name}: ${row.games} games, ${row.players} players, missed ${row.missed}\n`)
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
