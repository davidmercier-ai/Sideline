/**
 * Walk-forward backtest. Each game is scored from logs that finished before it.
 * The result is a record, not a priced edge.
 *
 * Run: node scripts/backtest-slate.mjs
 */

import { writeFile } from 'node:fs/promises'
import {
  homeMargin,
  medianPair,
  methodConvergence,
  mulberry32,
  projectRate,
  sideOf,
  simulateMatch,
} from './projection-math.mjs'

const ESPN = 'https://site.api.espn.com'
const LEAGUES = [
  { name: 'NFL', path: 'football/nfl', year: 2026, type: 2 },
  { name: 'NBA', path: 'basketball/nba', year: 2027, type: 2 },
  { name: 'NHL', path: 'hockey/nhl', year: 2027, type: 2 },
]

async function getJson(url) {
  let lastError
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const response = await fetch(url, { headers: { Accept: 'application/json', 'User-Agent': 'SidelineProjection/0.1' } })
      if (!response.ok) throw new Error(`${response.status} ${url}`)
      const text = await response.text()
      return text.trim() ? JSON.parse(text) : {}
    } catch (error) {
      lastError = error
      await new Promise((resolve) => setTimeout(resolve, 250 * (attempt + 1)))
    }
  }
  throw lastError
}

async function pool(items, limit, worker) {
  const results = []
  let index = 0
  async function run() {
    while (index < items.length) {
      const current = index
      index += 1
      results[current] = await worker(items[current], current)
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, run))
  return results
}

function values(rows, venue, field) {
  return rows
    .filter((row) => (venue === 'overall' ? true : row.venue === venue))
    .map((row) => row[field])
    .filter((value) => Number.isFinite(value))
}

function lastRows(rows, count = 3) {
  return [...rows].sort((a, b) => String(a.date).localeCompare(String(b.date))).slice(-count)
}

function packMethod(name, away, home) {
  return {
    name,
    margin: homeMargin(home.value, away.value),
    total: Number.isFinite(away.value) && Number.isFinite(home.value) ? away.value + home.value : null,
  }
}

function methodsFor(awayRows, homeRows) {
  const recentAway = lastRows(awayRows)
  const recentHome = lastRows(homeRows)
  return [
    packMethod(
      'Venue-matched mean',
      projectRate(values(awayRows, 'away', 'pointsFor'), values(homeRows, 'home', 'pointsAgainst')),
      projectRate(values(homeRows, 'home', 'pointsFor'), values(awayRows, 'away', 'pointsAgainst')),
    ),
    packMethod(
      'Overall mean',
      projectRate(values(awayRows, 'overall', 'pointsFor'), values(homeRows, 'overall', 'pointsAgainst'), 'overall means'),
      projectRate(values(homeRows, 'overall', 'pointsFor'), values(awayRows, 'overall', 'pointsAgainst'), 'overall means'),
    ),
    packMethod(
      'Venue-matched median',
      medianPair(values(awayRows, 'away', 'pointsFor'), values(homeRows, 'home', 'pointsAgainst')),
      medianPair(values(homeRows, 'home', 'pointsFor'), values(awayRows, 'away', 'pointsAgainst')),
    ),
    packMethod(
      'Last 3 games',
      projectRate(recentAway.map((row) => row.pointsFor), recentHome.map((row) => row.pointsAgainst), 'last 3 games'),
      projectRate(recentHome.map((row) => row.pointsFor), recentAway.map((row) => row.pointsAgainst), 'last 3 games'),
    ),
  ]
}

function seedFor(id) {
  return [...String(id)].reduce((sum, char) => ((sum * 33) + char.charCodeAt(0)) >>> 0, 20261030)
}

function actualSide(margin) {
  if (!Number.isFinite(margin)) return 'missing'
  if (margin > 0.05) return 'home'
  if (margin < -0.05) return 'away'
  return 'tie'
}

async function loadLeague(league) {
  const teamsData = await getJson(`${ESPN}/apis/site/v2/sports/${league.path}/teams?limit=400`)
  const teams = (teamsData.sports?.[0]?.leagues?.[0]?.teams ?? []).map((entry) => entry.team).filter((team) => team?.id)
  const schedules = await pool(teams, 4, async (team) => {
    const schedule = await getJson(`${ESPN}/apis/site/v2/sports/${league.path}/teams/${team.id}/schedule`)
    return { team, schedule }
  })
  const games = new Map()
  for (const { team, schedule } of schedules) {
    const season = schedule.requestedSeason ?? schedule.season ?? {}
    for (const event of schedule.events ?? []) {
      const competition = event.competitions?.[0]
      const status = competition?.status?.type
      if (!status?.completed) continue
      if (Number(event.season?.year) !== league.year) continue
      const eventType = event.seasonType?.type ?? event.season?.type?.type ?? event.season?.type
      if (Number(eventType) !== league.type) continue
      const sides = competition.competitors ?? []
      const away = sides.find((side) => side.homeAway === 'away')
      const home = sides.find((side) => side.homeAway === 'home')
      if (!away?.team?.id || !home?.team?.id) continue
      const awayScore = Number(away.score?.value ?? away.score)
      const homeScore = Number(home.score?.value ?? home.score)
      if (!Number.isFinite(awayScore) || !Number.isFinite(homeScore)) continue
      if (!games.has(event.id)) {
        const spread = Number(competition.odds?.[0]?.spread)
        games.set(event.id, {
          id: event.id,
          date: event.date || competition.date || '',
          neutral: Boolean(competition.neutralSite),
          awayId: String(away.team.id),
          homeId: String(home.team.id),
          awayName: away.team.shortDisplayName || away.team.displayName,
          homeName: home.team.shortDisplayName || home.team.displayName,
          awayScore,
          homeScore,
          homeSpread: Number.isFinite(spread) ? spread : null,
        })
      }
    }
  }
  return [...games.values()].sort((a, b) => String(a.date).localeCompare(String(b.date)))
}

function scoreLeague(name, games) {
  const history = new Map()
  const rows = []
  for (const game of games) {
    const awayPrior = (history.get(game.awayId) ?? []).filter((row) => row.date < game.date)
    const homePrior = (history.get(game.homeId) ?? []).filter((row) => row.date < game.date)
    const methods = methodsFor(awayPrior, homePrior)
    const venue = methods[0]
    const agreement = methodConvergence(methods)
    const actualMargin = game.homeScore - game.awayScore
    const actualTotal = game.homeScore + game.awayScore
    const actual = actualSide(actualMargin)
    let sim = null
    const awayFor = values(awayPrior, 'away', 'pointsFor')
    const homeAgainst = values(homePrior, 'home', 'pointsAgainst')
    const homeFor = values(homePrior, 'home', 'pointsFor')
    const awayAgainst = values(awayPrior, 'away', 'pointsAgainst')
    if (awayFor.length && homeAgainst.length && homeFor.length && awayAgainst.length) {
      sim = simulateMatch({
        awayFor,
        homeAgainst,
        homeFor,
        awayAgainst,
        random: mulberry32(seedFor(game.id)),
        draws: 2000,
      })
    }
    if (Number.isFinite(venue.margin)) {
      const marketMargin = Number.isFinite(game.homeSpread) ? -game.homeSpread : null
      const modelSide = sideOf(venue.margin)
      const simSide = sim?.ok
        ? (sim.homeWinRate > sim.awayWinRate ? 'home' : sim.awayWinRate > sim.homeWinRate ? 'away' : 'tie')
        : 'missing'
      rows.push({
        game,
        venue,
        agreement,
        actual,
        actualMargin,
        actualTotal,
        modelSide,
        simSide,
        simThin: Boolean(sim?.thin),
        simOk: Boolean(sim?.ok),
        marginError: Math.abs(venue.margin - actualMargin),
        totalError: Number.isFinite(venue.total) ? Math.abs(venue.total - actualTotal) : null,
        marketMargin,
        coverPick: Number.isFinite(marketMargin) && sideOf(venue.margin - marketMargin) !== 'tie'
          ? sideOf(venue.margin - marketMargin)
          : null,
        coverActual: Number.isFinite(marketMargin) ? actualSide(actualMargin - marketMargin) : null,
      })
    }
    const stamp = (teamId, venueName, pointsFor, pointsAgainst) => {
      const list = history.get(teamId) ?? []
      list.push({ date: game.date, venue: game.neutral ? 'neutral' : venueName, pointsFor, pointsAgainst })
      history.set(teamId, list)
    }
    stamp(game.awayId, 'away', game.awayScore, game.homeScore)
    stamp(game.homeId, 'home', game.homeScore, game.awayScore)
  }
  return summarize(name, games.length, rows)
}

function rate(hits, decided) {
  if (!decided) return null
  return hits / decided
}

function summarize(name, scheduled, rows) {
  const decided = rows.filter((row) => row.actual === 'home' || row.actual === 'away')
  const sideHits = decided.filter((row) => row.modelSide === row.actual).length
  const unanimous = decided.filter((row) => row.agreement.side === 'home' || row.agreement.side === 'away')
  const unanimousHits = unanimous.filter((row) => row.agreement.side === row.actual).length
  const simDecided = decided.filter((row) => row.simOk && !row.simThin && (row.simSide === 'home' || row.simSide === 'away'))
  const simHits = simDecided.filter((row) => row.simSide === row.actual).length
  const homeWins = decided.filter((row) => row.actual === 'home').length
  const covers = rows.filter((row) => row.coverPick && (row.coverActual === 'home' || row.coverActual === 'away'))
  const coverHits = covers.filter((row) => row.coverPick === row.coverActual).length
  const marginError = rows.reduce((sum, row) => sum + row.marginError, 0) / (rows.length || 1)
  const totalRows = rows.filter((row) => Number.isFinite(row.totalError))
  const totalError = totalRows.reduce((sum, row) => sum + row.totalError, 0) / (totalRows.length || 1)
  return {
    name,
    scheduled,
    scored: rows.length,
    sideHits,
    sideDecided: decided.length,
    sideRate: rate(sideHits, decided.length),
    unanimousHits,
    unanimousDecided: unanimous.length,
    unanimousRate: rate(unanimousHits, unanimous.length),
    simHits,
    simDecided: simDecided.length,
    simRate: rate(simHits, simDecided.length),
    homeRate: rate(homeWins, decided.length),
    coverHits,
    coverDecided: covers.length,
    coverRate: rate(coverHits, covers.length),
    marginError,
    totalError,
  }
}

function pct(value) {
  if (value == null) return 'missing'
  return `${(value * 100).toFixed(1)}%`
}

function num(value) {
  return Number.isFinite(value) ? value.toFixed(1) : 'missing'
}

function report(results) {
  const lines = [
    '# Walk-forward backtest',
    '',
    `Run at ${new Date().toISOString()} UTC. Each game uses only that team's completed games from earlier in the same season. The game being scored is not in its own sample.`,
    '',
    'This is a record of the venue-matched mean, the four-model vote, and the 2,000-draw sim. It is not a priced edge. A straight-up hit means the side with the higher number won. A cover means the venue-matched margin and the actual margin sat on the same side of the ESPN spread. Pushes are left out of the rates.',
    '',
    '| League | Games scored | Venue side | Unanimous side | Stable sim side | Always home | Venue cover | Margin error | Total error |',
    '| --- | --- | --- | --- | --- | --- | --- | --- | --- |',
  ]
  for (const row of results) {
    lines.push(`| ${row.name} | ${row.scored} of ${row.scheduled} | ${pct(row.sideRate)} (${row.sideHits}/${row.sideDecided}) | ${pct(row.unanimousRate)} (${row.unanimousHits}/${row.unanimousDecided}) | ${pct(row.simRate)} (${row.simHits}/${row.simDecided}) | ${pct(row.homeRate)} | ${pct(row.coverRate)} (${row.coverHits}/${row.coverDecided}) | ${num(row.marginError)} | ${num(row.totalError)} |`)
  }
  lines.push('')
  lines.push('Games with no prior venue sample are not scored. The stable sim side skips a game when any venue list has fewer than 3 games. Always home is the rate at which the home team won the decided games, shown so the model rates have a simple comparison.')
  lines.push('')
  lines.push('The cover column is missing when the completed-game payload did not include an ESPN spread. That is a missing price, not a cover rate of zero.')
  lines.push('')
  return lines.join('\n')
}

async function main() {
  const results = []
  for (const league of LEAGUES) {
    process.stderr.write(`loading ${league.name}\n`)
    const games = await loadLeague(league)
    process.stderr.write(`${league.name}: ${games.length} completed\n`)
    results.push(scoreLeague(league.name, games))
  }
  const markdown = `${report(results)}\n`
  await writeFile('docs/projections/BACKTEST.md', markdown)
  process.stdout.write(markdown)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
