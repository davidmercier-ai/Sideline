/**
 * Walk-forward backtest. Each game is scored from logs that finished before it.
 * The result is a record, not a priced edge.
 *
 * Run: node scripts/backtest-slate.mjs
 */

import { readFile, writeFile } from 'node:fs/promises'
import { loadDraftKingsTeamTotals } from './book-prices.mjs'
import { loadCoversConsensus } from './public-consensus.mjs'
import { pathToFileURL } from 'node:url'
import {
  alertSignals,
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
  { name: 'NCAAB', path: 'basketball/mens-college-basketball', year: 2027, type: 2 },
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

function totalSide(actualTotal, postedTotal) {
  if (!Number.isFinite(actualTotal) || !Number.isFinite(postedTotal)) return 'missing'
  if (actualTotal > postedTotal + 0.05) return 'over'
  if (actualTotal < postedTotal - 0.05) return 'under'
  return 'push'
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
          homeSpread: null,
          total: null,
        })
      }
    }
  }
  const missingQuote = [...games.values()].filter((game) => !Number.isFinite(game.homeSpread) || !Number.isFinite(game.total))
  await pool(missingQuote, 6, async (game) => {
    try {
      const summary = await getJson(`${ESPN}/apis/site/v2/sports/${league.path}/summary?event=${game.id}`)
      const quote = quoteFromPickcenter(summary)
      if (!Number.isFinite(game.homeSpread) && Number.isFinite(quote.spread)) game.homeSpread = quote.spread
      if (!Number.isFinite(game.total) && Number.isFinite(quote.total)) game.total = quote.total
      const [sport, slug] = league.path.split('/')
      try {
        const predictor = await getJson(`https://sports.core.api.espn.com/v2/sports/${sport}/leagues/${slug}/events/${game.id}/competitions/${game.id}/predictor`)
        game.predictorSide = predictorSide(predictor)
      } catch {
        game.predictorSide = null
      }
    } catch {
      game.homeSpread = Number.isFinite(game.homeSpread) ? game.homeSpread : null
      game.total = Number.isFinite(game.total) ? game.total : null
    }
  })
  return [...games.values()].sort((a, b) => String(a.date).localeCompare(String(b.date)))
}

export function quoteFromPickcenter(data) {
  const listed = data?.pickcenter ?? []
  const draftKings = listed.find((item) => /draft\s*kings/i.test(item?.provider?.name ?? ''))
  if (!draftKings) return { spread: null, total: null }
  const spread = Number(draftKings.spread)
  const total = Number(draftKings.overUnder ?? draftKings.total)
  return {
    spread: Number.isFinite(spread) ? spread : null,
    total: Number.isFinite(total) ? total : null,
  }
}

function meanOf(values) {
  if (!values.length) return null
  return values.reduce((sum, value) => sum + value, 0) / values.length
}

export function allowanceRead(awayRows, homeRows) {
  const awayAllowed = values(homeRows, 'home', 'pointsAgainst')
  const homeAllowed = values(awayRows, 'away', 'pointsAgainst')
  const awayScore = meanOf(awayAllowed)
  const homeScore = meanOf(homeAllowed)
  if (!Number.isFinite(awayScore) || !Number.isFinite(homeScore)) {
    return { margin: null, total: null, thin: true }
  }
  return {
    margin: homeScore - awayScore,
    total: homeScore + awayScore,
    thin: awayAllowed.length < 3 || homeAllowed.length < 3,
  }
}

export function spreadFromPickcenter(data) {
  return quoteFromPickcenter(data).spread
}

export function roomFor(leagueName) {
  return leagueName === 'NHL' ? 0.25 : 1
}

export function boardSideCall({ margins, marketMargin, room, thin }) {
  if (thin || !Number.isFinite(marketMargin) || !Number.isFinite(room)) return null
  if (!Array.isArray(margins) || margins.length < 4 || margins.some((value) => !Number.isFinite(value))) return null
  const sides = margins.map((margin) => sideOf(margin))
  if (sides.some((side) => side === 'tie' || side === 'unavailable')) return null
  if (new Set(sides).size !== 1) return null
  const side = sides[0]
  const gaps = margins.map((margin) => (side === 'home' ? margin - marketMargin : marketMargin - margin))
  if (!gaps.every((gap) => gap >= room)) return null
  return side
}

export function boardTotalCall({ totals, postedTotal, room, thin }) {
  if (thin || !Number.isFinite(postedTotal) || !Number.isFinite(room)) return null
  if (!Array.isArray(totals) || totals.length < 4 || totals.some((value) => !Number.isFinite(value))) return null
  if (totals.every((total) => postedTotal - total >= room)) return 'under'
  if (totals.every((total) => total - postedTotal >= room)) return 'over'
  return null
}

export function closestReadGap(margins, side, marketMargin) {
  if ((side !== 'home' && side !== 'away') || !Number.isFinite(marketMargin)) return null
  const gaps = (margins ?? [])
    .filter((value) => Number.isFinite(value))
    .map((margin) => (side === 'home' ? margin - marketMargin : marketMargin - margin))
  if (gaps.length === 0) return null
  return Math.min(...gaps)
}

export const GAP_BUCKETS = [
  { id: 'short', label: 'Short of the number', test: (gap) => gap < 0 },
  { id: 'under1', label: '0 to 1', test: (gap) => gap >= 0 && gap < 1 },
  { id: 'to5', label: '1 to 5', test: (gap) => gap >= 1 && gap < 5 },
  { id: 'to10', label: '5 to 10', test: (gap) => gap >= 5 && gap < 10 },
  { id: 'over10', label: '10 or more', test: (gap) => gap >= 10 },
]

export const HOLDOUT_AFTER = '2026-11-07T00:07:16.237Z'

export function predictorSide(data) {
  const read = (team) => {
    const stat = (team?.statistics ?? []).find((item) => item?.name === 'gameProjection')
    const value = Number(stat?.value)
    return Number.isFinite(value) ? value : null
  }
  const home = read(data?.homeTeam)
  const away = read(data?.awayTeam)
  if (home == null && away == null) return null
  const homeWin = home ?? (100 - away)
  const awayWin = away ?? (100 - home)
  if (Math.abs(homeWin - awayWin) < 0.05) return 'tie'
  return homeWin > awayWin ? 'home' : 'away'
}

export function spreadSizeBucket(homeSpread) {
  const size = Math.abs(homeSpread)
  if (!Number.isFinite(size) || size === 0) return null
  if (size < 3) return 'under3'
  if (size < 7) return 'to7'
  if (size < 12) return 'to12'
  return 'over12'
}

export function favoriteSide(homeSpread) {
  if (!Number.isFinite(homeSpread) || homeSpread === 0) return null
  return homeSpread < 0 ? 'home' : 'away'
}

export function coverRole(homeSpread, coverPick) {
  if (!Number.isFinite(homeSpread) || homeSpread === 0) return null
  if (coverPick !== 'home' && coverPick !== 'away') return null
  const favorite = homeSpread < 0 ? 'home' : 'away'
  return coverPick === favorite ? 'favorite' : 'dog'
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
      const thin = [awayFor, homeAgainst, homeFor, awayAgainst].some((list) => list.length < 3)
      const room = roomFor(name)
      const margins = methods.map((method) => method.margin)
      const totals = methods.map((method) => method.total)
      const boardSide = boardSideCall({ margins, marketMargin, room, thin })
      const boardTotal = boardTotalCall({ totals, postedTotal: game.total, room, thin })
      const allowance = allowanceRead(awayPrior, homePrior)
      const signals = alertSignals(methods, marketMargin, thin)
      const coverPick = Number.isFinite(marketMargin) && sideOf(venue.margin - marketMargin) !== 'tie'
        ? sideOf(venue.margin - marketMargin)
        : null
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
        coverPick,
        coverActual: Number.isFinite(marketMargin) ? actualSide(actualMargin - marketMargin) : null,
        coverRole: coverRole(game.homeSpread, coverPick),
        boardSide,
        boardTotal,
        totalActual: totalSide(actualTotal, game.total),
        closestGap: closestReadGap(margins, agreement.side, marketMargin),
        allowanceSide: !allowance.thin && sideOf(allowance.margin) !== 'tie' && sideOf(allowance.margin) !== 'unavailable'
          ? sideOf(allowance.margin)
          : null,
        scarSide: signals.scar,
        onNumberSide: signals.onNumber,
        predictorSide: game.predictorSide ?? null,
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
  const favoriteCovers = covers.filter((row) => row.coverRole === 'favorite')
  const dogCovers = covers.filter((row) => row.coverRole === 'dog')
  const favoriteHits = favoriteCovers.filter((row) => row.coverPick === row.coverActual).length
  const dogHits = dogCovers.filter((row) => row.coverPick === row.coverActual).length
  const priced = rows.filter((row) => {
    const spread = row.game.homeSpread
    return Number.isFinite(spread) && spread !== 0 && (row.coverActual === 'home' || row.coverActual === 'away')
  })
  const dogBaseHits = priced.filter((row) => row.coverActual === (row.game.homeSpread < 0 ? 'away' : 'home')).length
  const boardSides = rows.filter((row) => row.boardSide && (row.coverActual === 'home' || row.coverActual === 'away'))
  const boardSideHits = boardSides.filter((row) => row.boardSide === row.coverActual).length
  const boardTotals = rows.filter((row) => row.boardTotal && (row.totalActual === 'over' || row.totalActual === 'under'))
  const boardTotalHits = boardTotals.filter((row) => row.boardTotal === row.totalActual).length
  const short = unanimous.filter((row) => Number.isFinite(row.closestGap) && row.closestGap < 0)
  const shortFavorite = short.filter((row) => coverRole(row.game.homeSpread, row.agreement.side) === 'favorite')
  const shortDog = short.filter((row) => coverRole(row.game.homeSpread, row.agreement.side) === 'dog')
  const shortFavoriteHits = shortFavorite.filter((row) => row.agreement.side === row.actual).length
  const shortDogHits = shortDog.filter((row) => row.agreement.side === row.actual).length
  const straightFavorites = decided.filter((row) => favoriteSide(row.game.homeSpread))
  const straightFavoriteHits = straightFavorites.filter((row) => row.actual === favoriteSide(row.game.homeSpread)).length
  const picked = (rows, field) => {
    const sample = rows.filter((row) => (row[field] === 'home' || row[field] === 'away') && (row.actual === 'home' || row.actual === 'away'))
    const hits = sample.filter((row) => row[field] === row.actual).length
    return { hits, decided: sample.length, rate: rate(hits, sample.length) }
  }
  const scar = picked(rows, 'scarSide')
  const onNumber = picked(rows, 'onNumberSide')
  const predictor = picked(rows, 'predictorSide')
  const shortHome = shortFavorite.filter((row) => favoriteSide(row.game.homeSpread) === 'home')
  const shortRoad = shortFavorite.filter((row) => favoriteSide(row.game.homeSpread) === 'away')
  const shortHomeHits = shortHome.filter((row) => row.agreement.side === row.actual).length
  const shortRoadHits = shortRoad.filter((row) => row.agreement.side === row.actual).length
  const sizeOf = (id) => shortFavorite.filter((row) => spreadSizeBucket(row.game.homeSpread) === id)
  const sizeHit = (sample) => sample.filter((row) => row.agreement.side === row.actual).length
  const afterHoldout = (row) => Date.parse(row.game.date) > Date.parse(HOLDOUT_AFTER)
  const holdoutShort = shortFavorite.filter(afterHoldout)
  const holdoutShortHits = holdoutShort.filter((row) => row.agreement.side === row.actual).length
  const holdoutFavorites = straightFavorites.filter(afterHoldout)
  const holdoutFavoriteHits = holdoutFavorites.filter((row) => row.actual === favoriteSide(row.game.homeSpread)).length
  const allowanceDecided = decided.filter((row) => row.allowanceSide === 'home' || row.allowanceSide === 'away')
  const allowanceHits = allowanceDecided.filter((row) => row.allowanceSide === row.actual).length
  const unanimousPriced = unanimous.filter((row) => Number.isFinite(row.closestGap))
  const gapBuckets = GAP_BUCKETS.map((bucket) => {
    const games = unanimousPriced.filter((row) => bucket.test(row.closestGap))
    const hits = games.filter((row) => row.agreement.side === row.actual).length
    return { id: bucket.id, label: bucket.label, hits, decided: games.length, rate: rate(hits, games.length) }
  })
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
    favoriteHits,
    favoriteDecided: favoriteCovers.length,
    favoriteRate: rate(favoriteHits, favoriteCovers.length),
    dogHits,
    dogDecided: dogCovers.length,
    dogRate: rate(dogHits, dogCovers.length),
    dogBaseHits,
    dogBaseDecided: priced.length,
    dogBaseRate: rate(dogBaseHits, priced.length),
    boardSideHits,
    boardSideDecided: boardSides.length,
    boardSideRate: rate(boardSideHits, boardSides.length),
    boardTotalHits,
    boardTotalDecided: boardTotals.length,
    boardTotalRate: rate(boardTotalHits, boardTotals.length),
    gapBuckets,
    unanimousPriced: unanimousPriced.length,
    shortFavoriteHits,
    shortFavoriteDecided: shortFavorite.length,
    shortFavoriteRate: rate(shortFavoriteHits, shortFavorite.length),
    shortDogHits,
    shortDogDecided: shortDog.length,
    shortDogRate: rate(shortDogHits, shortDog.length),
    straightFavoriteHits,
    straightFavoriteDecided: straightFavorites.length,
    straightFavoriteRate: rate(straightFavoriteHits, straightFavorites.length),
    scarHits: scar.hits,
    scarDecided: scar.decided,
    scarRate: scar.rate,
    onNumberHits: onNumber.hits,
    onNumberDecided: onNumber.decided,
    onNumberRate: onNumber.rate,
    predictorHits: predictor.hits,
    predictorDecided: predictor.decided,
    predictorRate: predictor.rate,
    shortHomeHits,
    shortHomeDecided: shortHome.length,
    shortHomeRate: rate(shortHomeHits, shortHome.length),
    shortRoadHits,
    shortRoadDecided: shortRoad.length,
    shortRoadRate: rate(shortRoadHits, shortRoad.length),
    shortUnder3Hits: sizeHit(sizeOf('under3')),
    shortUnder3Decided: sizeOf('under3').length,
    shortUnder3Rate: rate(sizeHit(sizeOf('under3')), sizeOf('under3').length),
    shortTo7Hits: sizeHit(sizeOf('to7')),
    shortTo7Decided: sizeOf('to7').length,
    shortTo7Rate: rate(sizeHit(sizeOf('to7')), sizeOf('to7').length),
    shortTo12Hits: sizeHit(sizeOf('to12')),
    shortTo12Decided: sizeOf('to12').length,
    shortTo12Rate: rate(sizeHit(sizeOf('to12')), sizeOf('to12').length),
    shortOver12Hits: sizeHit(sizeOf('over12')),
    shortOver12Decided: sizeOf('over12').length,
    shortOver12Rate: rate(sizeHit(sizeOf('over12')), sizeOf('over12').length),
    holdoutShortHits,
    holdoutShortDecided: holdoutShort.length,
    holdoutShortRate: rate(holdoutShortHits, holdoutShort.length),
    holdoutFavoriteHits,
    holdoutFavoriteDecided: holdoutFavorites.length,
    holdoutFavoriteRate: rate(holdoutFavoriteHits, holdoutFavorites.length),
    homeHits: homeWins,
    homeDecided: decided.length,
    allowanceHits,
    allowanceDecided: allowanceDecided.length,
    allowanceRate: rate(allowanceHits, allowanceDecided.length),
    marginError,
    totalError,
  }
}

function pct(value) {
  if (value == null) return 'missing'
  return `${(value * 100).toFixed(1)}%`
}

function record(rateValue, hits, decided) {
  if (!decided) return '0/0'
  return `${pct(rateValue)} (${hits}/${decided})`
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
    'This is a record of the venue-matched mean, the four-model vote, and the 2,000-draw sim. It is not a priced edge. A straight-up hit means the side with the higher number won. A cover means the venue-matched margin and the actual margin sat on the same side of the DraftKings spread. Pushes are left out of the rates.',
    '',
    '| League | Games scored | Venue side | Unanimous side | Stable sim side | Always home | Venue cover | Margin error | Total error |',
    '| --- | --- | --- | --- | --- | --- | --- | --- | --- |',
  ]
  for (const row of results) {
    lines.push(`| ${row.name} | ${row.scored} of ${row.scheduled} | ${pct(row.sideRate)} (${row.sideHits}/${row.sideDecided}) | ${pct(row.unanimousRate)} (${row.unanimousHits}/${row.unanimousDecided}) | ${pct(row.simRate)} (${row.simHits}/${row.simDecided}) | ${pct(row.homeRate)} | ${pct(row.coverRate)} (${row.coverHits}/${row.coverDecided}) | ${num(row.marginError)} | ${num(row.totalError)} |`)
  }
  lines.push('')
  const college = results.find((row) => row.name === 'NCAAB')
  const collegeNote = college && college.sideRate != null && college.homeRate != null && college.sideRate < college.homeRate
    ? ' Its venue side is below always home, so a college side stays a lean.'
    : ' A team with fewer than three completed games stays a lean.'
  lines.push(`Games with no prior venue sample are not scored. The stable sim side skips a game when any venue list has fewer than 3 games. Always home is the rate at which the home team won the decided games, shown so the model rates have a simple comparison. NCAAB uses the 2026-27 season only.${collegeNote}`)
  lines.push('')
  lines.push('The cover column uses the DraftKings number on the completed-game summary. That is not a line saved before tip. Pregame spreads are stored apart and are not used in this column until one is older than the game. A game with no DraftKings spread stays out of the cover rate.')
  lines.push('')
  lines.push('## Board rule')
  lines.push('')
  lines.push('A board side needs four finite reads on the same side of the spread, each at least the room past that number, and every venue list at 3 games or more. The room is 1 point in the NFL and NBA and 0.25 goals in the NHL. A board total is the same test against the posted total. A hit means the game finished on that side. A push is left out. This is a record of the filter, not a priced edge.')
  lines.push('')
  lines.push('| League | Board sides | Side covers | Board totals | Total hits |')
  lines.push('| --- | --- | --- | --- | --- |')
  for (const row of results) {
    lines.push(`| ${row.name} | ${row.boardSideDecided} | ${record(row.boardSideRate, row.boardSideHits, row.boardSideDecided)} | ${row.boardTotalDecided} | ${record(row.boardTotalRate, row.boardTotalHits, row.boardTotalDecided)} |`)
  }
  lines.push('')
  lines.push('## Favorite and dog covers')
  lines.push('')
  lines.push('The venue-mean cover, split by whether that pick was the favorite or the dog. A negative home spread means the home team was favored. A pick\'em is left out. Dog covered, any pick is how often the dog covered with no model involved, so the dog-pick column has a baseline.')
  lines.push('')
  lines.push('| League | Favorite picks | Dog picks | Dog covered, any pick |')
  lines.push('| --- | --- | --- | --- |')
  for (const row of results) {
    lines.push(`| ${row.name} | ${record(row.favoriteRate, row.favoriteHits, row.favoriteDecided)} | ${record(row.dogRate, row.dogHits, row.dogDecided)} | ${record(row.dogBaseRate, row.dogBaseHits, row.dogBaseDecided)} |`)
  }
  lines.push('')
  lines.push('## Short of the number, favorite and dog')
  lines.push('')
  lines.push('Unanimous sides whose closest read is short of the spread, split by favorite and dog. Every favorite is the straight-up win rate of the favorite in the same walk-forward, with no model involved. A pick\'em is left out. This side is not a bet.')
  lines.push('')
  lines.push('| League | Short, favorite | Every favorite | Short, dog |')
  lines.push('| --- | --- | --- | --- |')
  for (const row of results) {
    lines.push(`| ${row.name} | ${record(row.shortFavoriteRate, row.shortFavoriteHits, row.shortFavoriteDecided)} | ${record(row.straightFavoriteRate, row.straightFavoriteHits, row.straightFavoriteDecided)} | ${record(row.shortDogRate, row.shortDogHits, row.shortDogDecided)} |`)
  }
  lines.push('')
  for (const row of results) {
    if (!row.shortFavoriteDecided || !row.straightFavoriteDecided) continue
    const ahead = row.shortFavoriteRate - row.straightFavoriteRate > 0.05
    const later = row.holdoutShortDecided > 0
    lines.push(!ahead
      ? `${row.name}: the short-of-the-number favorites are within 5 points of every favorite. The cut is finished. It is not a bet.`
      : later
        ? `${row.name}: the later sample still beats every favorite by more than 5 points. The gap stays on the record. It is not a bet.`
        : `${row.name}: the short-of-the-number favorites beat every favorite by more than 5 points. The later sample has no games yet, so open stays a note. It is not a bet.`)
  }
  lines.push('')
  lines.push('## Where the short favorites sit')
  lines.push('')
  lines.push('The short-of-the-number favorites, split by home or road and by the size of the spread. The unit is points in football and basketball and goals in hockey.')
  lines.push('')
  lines.push('| League | Home favorite | Road favorite | Spread under 3 | 3 to 7 | 7 to 12 | 12 or more |')
  lines.push('| --- | --- | --- | --- | --- | --- | --- |')
  for (const row of results) {
    lines.push(`| ${row.name} | ${record(row.shortHomeRate, row.shortHomeHits, row.shortHomeDecided)} | ${record(row.shortRoadRate, row.shortRoadHits, row.shortRoadDecided)} | ${record(row.shortUnder3Rate, row.shortUnder3Hits, row.shortUnder3Decided)} | ${record(row.shortTo7Rate, row.shortTo7Hits, row.shortTo7Decided)} | ${record(row.shortTo12Rate, row.shortTo12Hits, row.shortTo12Decided)} | ${record(row.shortOver12Rate, row.shortOver12Hits, row.shortOver12Decided)} |`)
  }
  lines.push('')
  lines.push(`Games after ${HOLDOUT_AFTER} are the confirming sample. The games that produced the gap are not in it. Until that sample has a count, open stays a note.`)
  lines.push('')
  lines.push('| League | Short favorites after the freeze | Every favorite after the freeze |')
  lines.push('| --- | --- | --- |')
  for (const row of results) {
    lines.push(`| ${row.name} | ${record(row.holdoutShortRate, row.holdoutShortHits, row.holdoutShortDecided)} | ${record(row.holdoutFavoriteRate, row.holdoutFavoriteHits, row.holdoutFavoriteDecided)} |`)
  }
  lines.push('')
  lines.push('## Scar and on the number')
  lines.push('')
  lines.push('A scar is the venue reads on one side and the last available read on the other. On the number is a unanimous side whose closest read lands on the spread. Each is compared with every favorite in that league. A slice that does not beat every favorite is not a bet.')
  lines.push('')
  lines.push('| League | Scar | On the number | Every favorite |')
  lines.push('| --- | --- | --- | --- |')
  for (const row of results) {
    lines.push(`| ${row.name} | ${record(row.scarRate, row.scarHits, row.scarDecided)} | ${record(row.onNumberRate, row.onNumberHits, row.onNumberDecided)} | ${record(row.straightFavoriteRate, row.straightFavoriteHits, row.straightFavoriteDecided)} |`)
  }
  lines.push('')
  lines.push('## Public models')
  lines.push('')
  lines.push('The ESPN Matchup Predictor is read from the completed-game predictor, when that source still has a win chance. The side is whoever the predictor scored higher. Covers is the current board only, so a Covers row counts only when a saved pick is older than the game. Neither is blended into the four reads.')
  lines.push('')
  lines.push('| League | ESPN predictor |')
  lines.push('| --- | --- |')
  for (const row of results) {
    lines.push(`| ${row.name} | ${record(row.predictorRate, row.predictorHits, row.predictorDecided)} |`)
  }
  lines.push('')
  lines.push('## Opponent allowance')
  lines.push('')
  lines.push('One read, kept out of the four and out of the alert. The away score is the home team’s home points allowed. The home score is the away team’s road points allowed. A side is counted only when both lists have at least 3 games. A hit is a straight-up win. This is not a priced edge.')
  lines.push('')
  lines.push('| League | Allowance side |')
  lines.push('| --- | --- |')
  for (const row of results) {
    lines.push(`| ${row.name} | ${record(row.allowanceRate, row.allowanceHits, row.allowanceDecided)} |`)
  }
  lines.push('')
  lines.push('## Unanimous side by gap to the spread')
  lines.push('')
  lines.push('The unanimous side is every decided game where the finite reads picked the same winner. The gap is the closest of those reads to the spread, on that side. A negative gap means the closest read sat on the other side of the number. A hit is a straight-up win. The cuts are the league’s scoring unit: points in the NFL and NBA, goals in the NHL. A game with no spread stays out. This is not a priced edge.')
  lines.push('')
  lines.push(`| League | ${GAP_BUCKETS.map((bucket) => bucket.label).join(' | ')} |`)
  lines.push(`| --- | ${GAP_BUCKETS.map(() => '---').join(' | ')} |`)
  for (const row of results) {
    const cells = row.gapBuckets.map((bucket) => record(bucket.rate, bucket.hits, bucket.decided))
    lines.push(`| ${row.name} | ${cells.join(' | ')} |`)
  }
  lines.push('')
  return lines.join('\n')
}

async function readJson(path) {
  try {
    return JSON.parse(await readFile(path, 'utf8'))
  } catch {
    return null
  }
}

function mergeRows(existing, incoming, keyFn) {
  const lines = [...(existing ?? [])]
  const seen = new Set(lines.map(keyFn))
  for (const row of incoming) {
    const key = keyFn(row)
    if (seen.has(key)) continue
    seen.add(key)
    lines.push(row)
  }
  return lines
}

async function savePregameLines(retrievedAt) {
  const spreads = []
  const boards = [
    ['football/nfl', 'NFL'],
    ['basketball/nba', 'NBA'],
    ['hockey/nhl', 'NHL'],
    ['basketball/mens-college-basketball', 'NCAAB'],
  ]
  for (const [path, league] of boards) {
    const board = await getJson(`${ESPN}/apis/site/v2/sports/${path}/scoreboard?limit=400`)
    const upcoming = (board.events ?? []).filter((event) => !event.competitions?.[0]?.status?.type?.completed)
    await pool(upcoming, 6, async (event) => {
      try {
        const summary = await getJson(`${ESPN}/apis/site/v2/sports/${path}/summary?event=${event.id}`)
        const spread = quoteFromPickcenter(summary).spread
        if (!Number.isFinite(spread)) return
        const sides = event.competitions?.[0]?.competitors ?? []
        const away = sides.find((side) => side.homeAway === 'away')
        const home = sides.find((side) => side.homeAway === 'home')
        spreads.push({
          retrievedAt,
          league,
          eventId: String(event.id),
          date: event.date,
          away: away?.team?.shortDisplayName || away?.team?.displayName || '',
          home: home?.team?.shortDisplayName || home?.team?.displayName || '',
          homeSpread: spread,
        })
      } catch {
        // A missing upcoming quote stays out of the file.
      }
    })
  }
  const teamTotals = []
  for (const sport of ['nfl', 'ncaaf', 'nba', 'nhl']) {
    try {
      const index = await loadDraftKingsTeamTotals(sport)
      for (const row of index.values()) {
        teamTotals.push({
          retrievedAt,
          sport,
          away: row.away,
          home: row.home,
          awayLine: row.awayTotal?.line ?? null,
          homeLine: row.homeTotal?.line ?? null,
        })
      }
    } catch {
      // A league with no team-total feed adds no rows.
    }
  }
  let covers = []
  try {
    const loaded = await loadCoversConsensus()
    covers = loaded.picks.map((pick) => ({
      retrievedAt,
      league: pick.league,
      away: pick.awayName,
      home: pick.homeName,
      awayPicks: pick.awayPicks,
      homePicks: pick.homePicks,
      dateText: pick.dateText,
    }))
  } catch {
    covers = []
  }
  const spreadFile = await readJson('docs/projections/spread-lines.json')
  const totalFile = await readJson('docs/projections/team-total-lines.json')
  const coversFile = await readJson('docs/projections/consensus-lines.json')
  const spreadLines = mergeRows(spreadFile?.lines, spreads, (row) => `${row.eventId}|${row.retrievedAt}`)
  const totalLines = mergeRows(totalFile?.lines, teamTotals, (row) => `${row.sport}|${row.away}|${row.home}|${row.awayLine}|${row.homeLine}|${row.retrievedAt}`)
  const coverLines = mergeRows(coversFile?.lines, covers, (row) => `${row.league}|${row.away}|${row.home}|${row.retrievedAt}`)
  await writeFile('docs/projections/spread-lines.json', `${JSON.stringify({ lines: spreadLines })}\n`)
  await writeFile('docs/projections/team-total-lines.json', `${JSON.stringify({ lines: totalLines })}\n`)
  await writeFile('docs/projections/consensus-lines.json', `${JSON.stringify({ lines: coverLines })}\n`)
  return { spreads: spreadLines.length, teamTotals: totalLines.length, covers: coverLines.length }
}

function savedNote(saved) {
  return [
    '## Lines saved before tip',
    '',
    `Pregame DraftKings spreads on file: ${saved.spreads}. Team totals on file: ${saved.teamTotals}. Covers picks on file: ${saved.covers}. A row counts only when its retrieval time is before the game. The completed games in this run are older than these retrievals, so the pregame cover record, the team-total record, and the Covers record are 0/0. They stay out of the alert until a count exists. The prop file is separate and stays 0/0 until a saved prop line is older than a completed game.`,
    '',
    'FanDuel tags the main passing, rushing, and receiving total as HIGH. That line is the two-sided over/under. Markets tagged ALT are left out.',
    '',
  ].join('\n')
}

async function main() {
  const results = []
  for (const league of LEAGUES) {
    process.stderr.write(`loading ${league.name}\n`)
    const games = await loadLeague(league)
    process.stderr.write(`${league.name}: ${games.length} completed\n`)
    results.push(scoreLeague(league.name, games))
  }
  const retrievedAt = new Date().toISOString()
  const saved = await savePregameLines(retrievedAt)
  const markdown = `${report(results)}\n${savedNote(saved)}\n`
  const summary = {}
  for (const row of results) {
    summary[row.name] = {
      marginError: Number.isFinite(row.marginError) ? Number(row.marginError.toFixed(1)) : null,
      totalError: Number.isFinite(row.totalError) ? Number(row.totalError.toFixed(1)) : null,
      dogHits: row.dogHits,
      dogDecided: row.dogDecided,
      dogBaseHits: row.dogBaseHits,
      dogBaseDecided: row.dogBaseDecided,
      straightFavoriteHits: row.straightFavoriteHits,
      straightFavoriteDecided: row.straightFavoriteDecided,
      shortFavoriteHits: row.shortFavoriteHits,
      shortFavoriteDecided: row.shortFavoriteDecided,
      simHits: row.simHits,
      simDecided: row.simDecided,
      homeHits: row.homeHits,
      homeDecided: row.homeDecided,
      sideHits: row.sideHits,
      sideDecided: row.sideDecided,
      scarHits: row.scarHits,
      scarDecided: row.scarDecided,
      scarRate: row.scarRate,
      onNumberHits: row.onNumberHits,
      onNumberDecided: row.onNumberDecided,
      onNumberRate: row.onNumberRate,
      straightFavoriteRate: row.straightFavoriteRate,
      cut: row.holdoutShortDecided > 0 && row.shortFavoriteRate - row.straightFavoriteRate > 0.05 ? 'open' : (row.shortFavoriteRate - row.straightFavoriteRate > 0.05 ? 'note' : 'finished'),
    }
  }
  await writeFile('docs/projections/BACKTEST.md', markdown)
  await writeFile('docs/projections/backtest-summary.json', `${JSON.stringify(summary, null, 2)}\n`)
  process.stdout.write(markdown)
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  main().catch((error) => {
    console.error(error)
    process.exit(1)
  })
}
