/**
 * Build a snapshot projection report from ESPN game logs.
 *
 * Layer A is the venue-matched mean of the team's own production and the
 * opponent's allowance. It does not read sportsbook prices.
 * Layer B is the DraftKings quote ESPN returned on this run.
 * Layer C subtracts the quote from the baseline. That difference is not an edge.
 *
 * Run: node scripts/project-slate.mjs [output.md]
 */

import { writeFile } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'
import { loadBooks } from './book-prices.mjs'
import { coversLeagueFor, espnPredictor, loadCoversConsensus, matchCovers } from './public-consensus.mjs'
import {
  asNumber,
  difference,
  grossPassingYards,
  homeMargin,
  inputSynergy,
  marketHomeMargin,
  medianPair,
  methodConvergence,
  mulberry32,
  noVigPair,
  overallComparison,
  projectRate,
  quotePosition,
  simulateMatch,
  projectedOutcome,
  reconcileTotal,
  round1,
  sackYardsLost,
  summarize,
  totalDirection,
} from './projection-math.mjs'

const ESPN = 'https://site.api.espn.com'
const retrievedAt = new Date()

const cache = new Map()

async function getJson(path) {
  if (cache.has(path)) return cache.get(path)
  const url = path.startsWith('http') ? path : `${ESPN}${path}`
  let lastError
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const response = await fetch(url, {
        headers: { Accept: 'application/json', 'User-Agent': 'SidelineProjection/0.1' },
      })
      if (!response.ok) throw new Error(`${response.status} ${path}`)
      const text = await response.text()
      const data = text.trim() ? JSON.parse(text) : {}
      cache.set(path, data)
      return data
    } catch (error) {
      lastError = error
      await new Promise((resolve) => setTimeout(resolve, 250 * (attempt + 1)))
    }
  }
  throw lastError
}

async function pool(items, limit, worker) {
  const results = new Array(items.length)
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

function scoreValue(score) {
  return asNumber(score?.value ?? score?.displayValue ?? score)
}

function teamName(team) {
  return team?.shortDisplayName || team?.displayName || team?.name || team?.abbreviation || 'Team'
}

function rankOf(competitor) {
  const rank = competitor?.curatedRank?.current
  if (rank == null || rank === 99 || rank === '99' || rank === 0) return null
  return rank
}

function label(competitor) {
  const rank = rankOf(competitor)
  const name = teamName(competitor?.team)
  return rank ? `#${rank} ${name}` : name
}

function statMap(statistics) {
  const map = new Map()
  for (const stat of statistics ?? []) {
    if (stat?.name) map.set(stat.name, stat)
  }
  return map
}

function yardLine(map, name) {
  const stat = map.get(name)
  if (!stat) return null
  // ESPN often sets value to "-" and puts the yards in displayValue.
  return asNumber(stat.value) ?? asNumber(stat.displayValue)
}

async function scoreboard(sportPath, query = '') {
  const data = await getJson(`/apis/site/v2/sports/${sportPath}/scoreboard${query}`)
  return data.events ?? []
}

function readMarket(competition) {
  const odd = competition?.odds?.[0]
  if (!odd) {
    return {
      book: null,
      note: 'no sportsbook quote in the ESPN scoreboard payload',
    }
  }
  const book = odd.provider?.displayName || odd.provider?.name || 'unknown book'
  const homeSpread = asNumber(odd.spread)
  const total = asNumber(odd.overUnder)
  const spreadHome = odd.pointSpread?.home ?? {}
  const spreadAway = odd.pointSpread?.away ?? {}
  const over = odd.total?.over ?? {}
  const under = odd.total?.under ?? {}
  return {
    book,
    booksPresent: [book],
    homeSpread,
    marketHomeMargin: marketHomeMargin(homeSpread),
    total,
    details: odd.details ?? null,
    spread: {
      homeCloseLine: spreadHome.close?.line ?? null,
      homeClosePrice: spreadHome.close?.odds ?? null,
      homeOpenLine: spreadHome.open?.line ?? null,
      homeOpenPrice: spreadHome.open?.odds ?? null,
      awayCloseLine: spreadAway.close?.line ?? null,
      awayClosePrice: spreadAway.close?.odds ?? null,
      awayOpenLine: spreadAway.open?.line ?? null,
      awayOpenPrice: spreadAway.open?.odds ?? null,
    },
    moneyline: {
      homeClose: odd.moneyline?.home?.close?.odds ?? null,
      homeOpen: odd.moneyline?.home?.open?.odds ?? null,
      awayClose: odd.moneyline?.away?.close?.odds ?? null,
      awayOpen: odd.moneyline?.away?.open?.odds ?? null,
    },
    totalPrices: {
      overCloseLine: over.close?.line ?? null,
      overClosePrice: over.close?.odds ?? null,
      overOpenLine: over.open?.line ?? null,
      overOpenPrice: over.open?.odds ?? null,
      underCloseLine: under.close?.line ?? null,
      underClosePrice: under.close?.odds ?? null,
      underOpenLine: under.open?.line ?? null,
      underOpenPrice: under.open?.odds ?? null,
    },
    teamTotal: null,
    teamTotalNote: 'ESPN team-odds object has favorite/underdog only. No team total was posted.',
  }
}

function gamesFromEvents(events, sport) {
  const games = []
  for (const event of events) {
    const competition = event.competitions?.[0]
    if (!competition) continue
    const status = competition.status?.type ?? event.status?.type ?? {}
    if (status.state === 'post' || status.completed) continue
    const competitors = competition.competitors ?? []
    const away = competitors.find((side) => side.homeAway === 'away')
    const home = competitors.find((side) => side.homeAway === 'home')
    if (!away?.team?.id || !home?.team?.id) continue
    games.push({
      id: event.id,
      sport,
      when: status.shortDetail || status.detail || event.date,
      date: event.date,
      neutral: Boolean(competition.neutralSite),
      away: {
        id: String(away.team.id),
        name: label(away),
        full: away.team.displayName || away.team.name || label(away),
        short: away.team.shortDisplayName || away.team.name || label(away),
        abbr: away.team.abbreviation || '',
      },
      home: {
        id: String(home.team.id),
        name: label(home),
        full: home.team.displayName || home.team.name || label(home),
        short: home.team.shortDisplayName || home.team.name || label(home),
        abbr: home.team.abbreviation || '',
      },
      market: readMarket(competition),
    })
  }
  return games
}

export async function teamLog(sportPath, teamId, football) {
  const schedule = await getJson(`/apis/site/v2/sports/${sportPath}/teams/${teamId}/schedule`)
  const season = schedule.requestedSeason ?? schedule.season ?? {}
  const seasonYear = season.year ?? null
  const seasonType = season.type ?? null
  const seasonLabel = season.displayName || season.name || (seasonYear ? String(seasonYear) : 'unspecified season')
  const rows = []
  const skipped = { otherSeason: 0, otherType: 0 }
  for (const event of schedule.events ?? []) {
    const competition = event.competitions?.[0]
    const status = competition?.status?.type
    if (!status?.completed) continue
    const eventYear = event.season?.year
    if (seasonYear != null && eventYear != null && Number(eventYear) !== Number(seasonYear)) {
      skipped.otherSeason += 1
      continue
    }
    const eventType = event.seasonType?.type ?? event.season?.type?.type ?? event.season?.type
    if (seasonType != null && eventType != null && Number(eventType) !== Number(seasonType)) {
      skipped.otherType += 1
      continue
    }
    const sides = competition.competitors ?? []
    const me = sides.find((side) => String(side.team?.id) === String(teamId))
    const opp = sides.find((side) => String(side.team?.id) !== String(teamId))
    if (!me || !opp) continue
    const pointsFor = scoreValue(me.score)
    const pointsAgainst = scoreValue(opp.score)
    if (pointsFor == null || pointsAgainst == null) continue
    rows.push({
      eventId: event.id,
      date: event.date || competition.date || '',
      venue: competition.neutralSite ? 'neutral' : me.homeAway,
      pointsFor,
      pointsAgainst,
      yards: null,
    })
  }
  if (football) {
    await pool(rows, 4, async (row) => {
      try {
        const summary = await getJson(`/apis/site/v2/sports/${sportPath}/summary?event=${row.eventId}`)
        const teams = summary.boxscore?.teams ?? []
        const mine = teams.find((side) => String(side.team?.id) === String(teamId))
        const theirs = teams.find((side) => String(side.team?.id) !== String(teamId))
        if (!mine || !theirs) {
          row.yards = { missing: 'box score teams missing' }
          return
        }
        row.yards = yardsFromBox(mine, theirs)
      } catch (error) {
        row.yards = { missing: error instanceof Error ? error.message : 'box score request failed' }
      }
    })
  }
  return {
    rows,
    skipped,
    seasonLabel,
    source: `${ESPN}/apis/site/v2/sports/${sportPath}/teams/${teamId}/schedule`,
  }
}

function yardsFromBox(mine, theirs) {
  const my = statMap(mine.statistics)
  const opp = statMap(theirs.statistics)
  const netFor = yardLine(my, 'netPassingYards')
  const netAgainst = yardLine(opp, 'netPassingYards')
  const sackFor = sackYardsLost(my.get('sacksYardsLost')?.displayValue)
  const sackAgainst = sackYardsLost(opp.get('sacksYardsLost')?.displayValue)
  const rushFor = yardLine(my, 'rushingYards')
  const rushAgainst = yardLine(opp, 'rushingYards')
  const totalFor = yardLine(my, 'totalYards')
  const totalAgainst = yardLine(opp, 'totalYards')
  return {
    rushFor,
    rushAgainst,
    netPassFor: netFor,
    netPassAgainst: netAgainst,
    sackLostFor: sackFor,
    sackLostAgainst: sackAgainst,
    grossPassFor: grossPassingYards(netFor, sackFor),
    grossPassAgainst: grossPassingYards(netAgainst, sackAgainst),
    totalFor,
    totalAgainst,
    reconcileFor: reconcileTotal(rushFor, netFor, totalFor),
    reconcileAgainst: reconcileTotal(rushAgainst, netAgainst, totalAgainst),
  }
}

function values(rows, venue, field) {
  return rows
    .filter((row) => (venue === 'overall' ? true : row.venue === venue))
    .map((row) => {
      if (field === 'pointsFor' || field === 'pointsAgainst') return row[field]
      return row.yards?.[field] ?? null
    })
    .filter((value) => Number.isFinite(value))
}

function historyBlock(rows, field) {
  return {
    overall: summarize(values(rows, 'overall', field)),
    home: summarize(values(rows, 'home', field)),
    away: summarize(values(rows, 'away', field)),
  }
}

const YARD_FIELDS = [
  ['rushFor', 'rushing yards gained'],
  ['rushAgainst', 'rushing yards allowed'],
  ['grossPassFor', 'gross passing yards gained'],
  ['grossPassAgainst', 'gross passing yards allowed'],
  ['netPassFor', 'net passing yards gained'],
  ['netPassAgainst', 'net passing yards allowed'],
  ['sackLostFor', 'sack yards lost'],
  ['totalFor', 'total offensive yards gained'],
  ['totalAgainst', 'total offensive yards allowed'],
]

function fmt(value) {
  if (!Number.isFinite(value)) return 'missing'
  return String(round1(value))
}

export function modelCall(game, convergence) {
  const { home, away, tie } = convergence.counts
  if (convergence.side === 'home') return `${game.home.name}, ${home}–0`
  if (convergence.side === 'away') return `${game.away.name}, ${away}–0`
  if (convergence.side === 'tie') return `tie, ${tie}–0`
  const ranked = [
    [home, game.home.name],
    [away, game.away.name],
    [tie, null],
  ].filter(([count]) => count > 0).sort((left, right) => right[0] - left[0])
  if (ranked.length < 2) return 'split'
  if (ranked[0][0] === ranked[1][0]) return `split, ${ranked[0][0]}–${ranked[1][0]}`
  return `split, ${ranked[0][0]}–${ranked[1][0]} ${ranked[0][1] ?? 'tie'}`
}

export function simCall(game, sim) {
  if (!sim?.ok) return 'not run'
  const awayRate = sim.awayWinRate
  const homeRate = sim.homeWinRate
  let leader = 'even'
  let rate = homeRate
  if (homeRate > awayRate) {
    leader = game.home.name
    rate = homeRate
  } else if (awayRate > homeRate) {
    leader = game.away.name
    rate = awayRate
  }
  const thin = sim.thin ? ', thin' : ''
  return `${fmt(sim.awayMedian)}–${fmt(sim.homeMedian)}, ${leader} ${fmt(rate * 100)}%${thin}`
}

function historyLines(name, rows, field, label) {
  const block = historyBlock(rows, field)
  return [
    `- ${name} ${label}, overall: ${fmtSummary(block.overall)}`,
    `- ${name} ${label}, home: ${fmtSummary(block.home)}`,
    `- ${name} ${label}, away: ${fmtSummary(block.away)}`,
  ]
}

function fmtSummary(summary) {
  if (summary.missing) return 'missing game-level history (n=0)'
  const mode = summary.modes?.length ? summary.modes.map((value) => round1(value)).join(' or ') : summary.modeNote
  return `n=${summary.n}, mean ${fmt(summary.mean)}, median ${fmt(summary.median)}, mode ${mode}, high ${fmt(summary.high)}, low ${fmt(summary.low)}`
}

function line(name, projection) {
  const flag = [
    projection.incomplete ? 'incomplete input' : null,
    projection.thin ? 'thin sample (n<3)' : null,
  ].filter(Boolean)
  return `- ${name}: ${fmt(projection.value)} (${projection.basis}; for n=${projection.nFor}, against n=${projection.nAgainst}${flag.length ? `; ${flag.join('; ')}` : ''})`
}

function projectScoring(awayLog, homeLog, scoring) {
  const awayVenue = projectRate(
    values(awayLog, 'away', 'pointsFor'),
    values(homeLog, 'home', 'pointsAgainst'),
  )
  const homeVenue = projectRate(
    values(homeLog, 'home', 'pointsFor'),
    values(awayLog, 'away', 'pointsAgainst'),
  )
  const awayOverall = overallComparison(
    values(awayLog, 'overall', 'pointsFor'),
    values(homeLog, 'overall', 'pointsAgainst'),
  )
  const homeOverall = overallComparison(
    values(homeLog, 'overall', 'pointsFor'),
    values(awayLog, 'overall', 'pointsAgainst'),
  )
  return {
    away: awayVenue,
    home: homeVenue,
    awayOverall,
    homeOverall,
    total: Number.isFinite(awayVenue.value) && Number.isFinite(homeVenue.value) ? awayVenue.value + homeVenue.value : null,
    margin: homeMargin(homeVenue.value, awayVenue.value),
    unit: scoring,
  }
}

function lastRows(rows, count = 3) {
  return [...rows].sort((a, b) => String(a.date).localeCompare(String(b.date))).slice(-count)
}

function packMethod(name, away, home) {
  return {
    name,
    away,
    home,
    total: Number.isFinite(away.value) && Number.isFinite(home.value) ? away.value + home.value : null,
    margin: homeMargin(home.value, away.value),
  }
}

function scoringMethods(awayRows, homeRows) {
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

function teamSynergy(ownRows, ownVenue, allowanceRows, allowanceVenue) {
  return inputSynergy(
    summarize(values(ownRows, ownVenue, 'pointsFor')).mean,
    summarize(values(ownRows, 'overall', 'pointsFor')).mean,
    summarize(values(allowanceRows, allowanceVenue, 'pointsAgainst')).mean,
    summarize(values(allowanceRows, 'overall', 'pointsAgainst')).mean,
  )
}

function synergyText(result) {
  if (result.status === 'missing-input') return 'missing-input'
  if (result.status === 'flat') return 'flat (both inputs are within 0.05 of that team’s overall rate)'
  const own = fmt(result.own)
  const allowance = fmt(result.allowance)
  if (result.status === 'reinforce') return `reinforce (own venue vs overall ${own}; opponent allowance vs overall ${allowance})`
  return `diverge (own venue vs overall ${own}; opponent allowance vs overall ${allowance})`
}

function seedFor(id) {
  return [...String(id)].reduce((sum, char) => ((sum * 33) + char.charCodeAt(0)) >>> 0, 20261030)
}

function gameSimulation(game, awayRows, homeRows) {
  const input = {
    awayFor: values(awayRows, 'away', 'pointsFor'),
    homeAgainst: values(homeRows, 'home', 'pointsAgainst'),
    homeFor: values(homeRows, 'home', 'pointsFor'),
    awayAgainst: values(awayRows, 'away', 'pointsAgainst'),
    random: mulberry32(seedFor(game.id)),
    draws: 2000,
  }
  const base = simulateMatch(input)
  if (!base.ok) return base
  const fanduelMargin = Number.isFinite(game.extra?.fanduel?.homeSpread) ? -game.extra.fanduel.homeSpread : null
  const fanduelTotal = Number.isFinite(game.extra?.fanduel?.total) ? game.extra.fanduel.total : null
  const sameSeed = () => mulberry32(seedFor(game.id))
  const dk = simulateMatch({ ...input, random: sameSeed(), homeMarginLine: game.market.marketHomeMargin, totalLine: game.market.total })
  const fd = simulateMatch({ ...input, random: sameSeed(), homeMarginLine: fanduelMargin, totalLine: fanduelTotal })
  const fdPrice = noVigPair(game.extra?.fanduel?.awayMoneyline, game.extra?.fanduel?.homeMoneyline)
  const dkPrice = noVigPair(game.market.moneyline?.awayClose, game.market.moneyline?.homeClose)
  const gaps = []
  if (fdPrice) gaps.push(Math.abs(base.homeWinRate - fdPrice.home))
  if (dkPrice) gaps.push(Math.abs(base.homeWinRate - dkPrice.home))
  const pricedGap = gaps.length ? Math.min(...gaps) : null
  let edge = 'Priced edge: not supported. The sim frequency is not a validated win probability.'
  if (!base.thin && pricedGap != null && pricedGap >= 0.08) {
    edge = `Price gap: the sim home-win frequency differs from the nearer no-vig price by ${fmt(pricedGap * 100)} percentage points. Recorded as a gap. Not labeled an edge, because this resampling model has not been validated.`
  }
  return {
    ...base,
    fdCover: fd.coverRate,
    fdCoverPush: fd.coverPushRate,
    dkCover: dk.coverRate,
    dkCoverPush: dk.coverPushRate,
    fdOver: fd.overRate,
    dkOver: dk.overRate,
    edge,
  }
}

export function projectYards(awayLog, homeLog, forField, againstField) {
  return {
    away: projectRate(values(awayLog, 'away', forField), values(homeLog, 'home', againstField)),
    home: projectRate(values(homeLog, 'home', forField), values(awayLog, 'away', againstField)),
    awayOverall: overallComparison(values(awayLog, 'overall', forField), values(homeLog, 'overall', againstField)),
    homeOverall: overallComparison(values(homeLog, 'overall', forField), values(awayLog, 'overall', againstField)),
  }
}

function bookFlag(isDraftKings, hasLine, hasPrice) {
  if (!isDraftKings) return 'unavailable'
  if (!hasLine) return 'unavailable'
  if (!hasPrice) return 'unverified'
  return 'verified-retrieved'
}

function priceCell(line, price) {
  if (line == null && price == null) return 'unavailable'
  return `${line ?? 'line missing'} ${price ?? 'price missing'}`
}

function spreadCell(homeSpread, price) {
  if (!Number.isFinite(homeSpread) && price == null) return 'unavailable'
  const line = Number.isFinite(homeSpread) ? homeSpread : 'line missing'
  return `${line} ${price ?? 'price missing'}`
}

function totalCell(total, overPrice, underPrice) {
  if (!Number.isFinite(total) && overPrice == null && underPrice == null) return 'unavailable'
  return `o${total ?? '?'} ${overPrice ?? 'price missing'} / u${total ?? '?'} ${underPrice ?? 'price missing'}`
}

function teamTotalCell(total) {
  if (!total || !Number.isFinite(total.line)) return 'unavailable'
  return `${total.line} over ${total.over ?? 'price missing'} / under ${total.under ?? 'price missing'}`
}

function americanRank(price) {
  const n = Number(String(price ?? '').replace('+', ''))
  return Number.isFinite(n) && n !== 0 ? n : null
}

function betterBook(fanduelPrice, draftKingsPrice) {
  const left = americanRank(fanduelPrice)
  const right = americanRank(draftKingsPrice)
  if (left == null || right == null) return 'unavailable'
  if (left === right) return 'same price'
  return left > right ? 'FanDuel' : 'DraftKings'
}

function marketSection(game) {
  const market = game.market
  const fanduel = game.extra?.fanduel
  const draftKings = /draft\s*kings/i.test(market.book ?? '')
  const dkSideLatest = market.spread?.homeCloseLine ?? (market.homeSpread != null ? String(market.homeSpread) : null)
  const lines = []
  lines.push('**2. Sportsbook lines and prices — FanDuel and DraftKings**')
  lines.push('')
  lines.push(`Retrieved ${retrievedAt.toISOString()} UTC. Snapshot, not a live feed. This pass uses FanDuel and DraftKings only.`)
  lines.push('DraftKings open and latest come from the ESPN quote. The DraftKings site returned access denied. FanDuel latest comes from the Ohio board. FanDuel did not send an opening price.')
  lines.push('Prices and timestamps stay in this section. They are not inputs to the projection above.')
  lines.push('')
  lines.push('| Market | FanDuel open | FanDuel latest | DraftKings open | DraftKings latest | Flag |')
  lines.push('| --- | --- | --- | --- | --- | --- |')
  const dkSide = bookFlag(draftKings, dkSideLatest != null, market.spread?.homeClosePrice != null)
  const fdSide = fanduel && Number.isFinite(fanduel.homeSpread) ? 'verified-retrieved' : 'unavailable'
  lines.push(`| Side | unavailable | ${spreadCell(fanduel?.homeSpread, fanduel?.homeSpreadPrice)} | ${priceCell(market.spread?.homeOpenLine, market.spread?.homeOpenPrice)} | ${priceCell(dkSideLatest, market.spread?.homeClosePrice)} | FD ${fdSide}; DK ${dkSide} |`)
  const fdMl = fanduel?.awayMoneyline && fanduel?.homeMoneyline ? 'verified-retrieved' : 'unavailable'
  const dkMl = bookFlag(draftKings, market.moneyline?.homeClose != null && market.moneyline?.awayClose != null, true)
  lines.push(`| Moneyline | unavailable | ${fanduel ? `${fanduel.awayMoneyline ?? 'unavailable'} / ${fanduel.homeMoneyline ?? 'unavailable'}` : 'unavailable'} | ${game.away.abbr || 'away'} ${market.moneyline?.awayOpen ?? 'unavailable'} / ${game.home.abbr || 'home'} ${market.moneyline?.homeOpen ?? 'unavailable'} | ${game.away.abbr || 'away'} ${market.moneyline?.awayClose ?? 'unavailable'} / ${game.home.abbr || 'home'} ${market.moneyline?.homeClose ?? 'unavailable'} | FD ${fdMl}; DK ${dkMl} |`)
  const fdTotal = fanduel && Number.isFinite(fanduel.total) ? 'verified-retrieved' : 'unavailable'
  const dkTotal = bookFlag(draftKings, market.total != null, market.totalPrices?.overClosePrice != null)
  lines.push(`| O/U | unavailable | ${totalCell(fanduel?.total, fanduel?.overPrice, fanduel?.underPrice)} | ${priceCell(market.totalPrices?.overOpenLine, market.totalPrices?.overOpenPrice)} / ${priceCell(market.totalPrices?.underOpenLine, market.totalPrices?.underOpenPrice)} | ${priceCell(market.totalPrices?.overCloseLine, market.totalPrices?.overClosePrice)} / ${priceCell(market.totalPrices?.underCloseLine, market.totalPrices?.underClosePrice)} | FD ${fdTotal}; DK ${dkTotal} |`)
  lines.push('| Team total, away | unavailable | unavailable | unavailable | unavailable | FD unavailable; DK unavailable |')
  lines.push('| Team total, home | unavailable | unavailable | unavailable | unavailable | FD unavailable; DK unavailable |')
  const sameSide = Number.isFinite(fanduel?.homeSpread) && Number.isFinite(market.homeSpread) && fanduel.homeSpread === market.homeSpread
  if (sameSide) {
    lines.push(`- Home-side price, same number ${fanduel.homeSpread}: better book is ${betterBook(fanduel.homeSpreadPrice, market.spread?.homeClosePrice)}.`)
  } else if (Number.isFinite(fanduel?.homeSpread) && Number.isFinite(market.homeSpread)) {
    lines.push(`- Home spread numbers differ: FanDuel ${fanduel.homeSpread}, DraftKings ${market.homeSpread}. Prices are not ranked across different numbers.`)
  }
  const sameTotal = Number.isFinite(fanduel?.total) && Number.isFinite(market.total) && fanduel.total === market.total
  if (sameTotal) {
    lines.push(`- Over price, same total ${fanduel.total}: better book is ${betterBook(fanduel.overPrice, market.totalPrices?.overClosePrice)}.`)
  } else if (Number.isFinite(fanduel?.total) && Number.isFinite(market.total)) {
    lines.push(`- Totals differ: FanDuel ${fanduel.total}, DraftKings ${market.total}. Prices are not ranked across different numbers.`)
  }
  if (fanduel && (Number.isFinite(fanduel.homeSpread) || Number.isFinite(fanduel.awaySpread))) {
    lines.push(`- FanDuel spread, both sides: home ${spreadCell(fanduel.homeSpread, fanduel.homeSpreadPrice)}; away ${spreadCell(fanduel.awaySpread, fanduel.awaySpreadPrice)}.`)
  }
  if (draftKings && (market.spread?.homeCloseLine != null || market.spread?.awayCloseLine != null)) {
    lines.push(`- DraftKings spread, both sides: home ${priceCell(market.spread?.homeCloseLine, market.spread?.homeClosePrice)}; away ${priceCell(market.spread?.awayCloseLine, market.spread?.awayClosePrice)}.`)
  }
  if (!draftKings) lines.push(`- DraftKings: ${market.note ?? 'no DraftKings quote in the ESPN payload'}`)
  if (!fanduel) lines.push('- FanDuel: no matching Ohio board game.')
  return lines
}

function lineValue(book, position, quote, values) {
  if (position === 'missing-input') return `${book}: missing-input`
  const nums = values.filter((value) => Number.isFinite(value))
  const low = Math.min(...nums)
  const high = Math.max(...nums)
  if (position === 'inside-method-range') {
    return `${book}: no line value — ${fmt(quote)} sits inside the method range ${fmt(low)} to ${fmt(high)}`
  }
  const direction = quote > high ? 'above every method' : 'below every method'
  return `${book}: line-value candidate — ${fmt(quote)} is ${direction} (${fmt(low)} to ${fmt(high)}). This is a point gap, not a priced edge.`
}

function bookMargins(game) {
  const fanduel = game.extra?.fanduel
  return [
    ['DraftKings', game.market.marketHomeMargin, game.market.total],
    ['FanDuel', Number.isFinite(fanduel?.homeSpread) ? -fanduel.homeSpread : null, fanduel?.total ?? null],
  ]
}

function comparisonSection(game, scoring, methods) {
  const market = game.market
  const margins = methods.map((method) => method.margin)
  const totals = methods.map((method) => method.total)
  const quotes = bookMargins(game)
  const priced = noVigPair(market.moneyline?.awayClose, market.moneyline?.homeClose)
  const lines = []
  lines.push('**3. Comparison — value, edge, and refinement**')
  lines.push('')
  const fanduelMargin = Number.isFinite(game.extra?.fanduel?.homeSpread) ? -game.extra.fanduel.homeSpread : null
  const fanduelTotal = game.extra?.fanduel?.total ?? null
  lines.push('Each method is subtracted from FanDuel and from DraftKings on its own. The methods are not averaged first. Prices are not written back into the projection.')
  lines.push('')
  lines.push('| Method | Home margin | Minus FanDuel | Minus DraftKings | Combined | Minus FanDuel total | Minus DraftKings total |')
  lines.push('| --- | --- | --- | --- | --- | --- | --- |')
  for (const method of methods) {
    lines.push(`| ${method.name} | ${fmt(method.margin)} | ${fmt(difference(method.margin, fanduelMargin))} | ${fmt(difference(method.margin, market.marketHomeMargin))} | ${fmt(method.total)} | ${fmt(difference(method.total, fanduelTotal))} | ${fmt(difference(method.total, market.total))} |`)
  }
  for (const [name, margin, total] of quotes) {
    lines.push(`| ${name} latest | ${fmt(margin)} | — | ${fmt(total)} | — |`)
  }
  lines.push('')
  lines.push(`- Venue-mean side gap versus FanDuel: ${fmt(difference(scoring.margin, fanduelMargin))}. Versus DraftKings: ${fmt(difference(scoring.margin, market.marketHomeMargin))}.`)
  lines.push(`- Venue-mean total gap versus FanDuel: ${fmt(difference(scoring.total, fanduelTotal))} (${totalDirection(difference(scoring.total, fanduelTotal))}). Versus DraftKings: ${fmt(difference(scoring.total, market.total))} (${totalDirection(difference(scoring.total, market.total))}).`)
  for (const [name, margin, total] of quotes) {
    lines.push(`- ${name} side: ${lineValue(name, quotePosition(margin, margins), margin, margins)}`)
    lines.push(`- ${name} total: ${lineValue(name, quotePosition(total, totals), total, totals)}`)
  }
  lines.push('- Team totals: unavailable at FanDuel and DraftKings on the feeds used here.')
  const homeMargins = quotes.map(([, margin]) => margin).filter((value) => Number.isFinite(value))
  if (homeMargins.length === 2) {
    lines.push(`- FanDuel versus DraftKings home margin: ${fmt(homeMargins[1] - homeMargins[0])} (FanDuel minus DraftKings).`)
  } else {
    lines.push('- FanDuel versus DraftKings: one of the two home spreads is missing.')
  }
  const fdPriced = noVigPair(game.extra?.fanduel?.awayMoneyline, game.extra?.fanduel?.homeMoneyline)
  if (priced) {
    lines.push(`- DraftKings no-vig price, from the moneyline only: ${game.away.name} ${fmt(priced.away * 100)}%, ${game.home.name} ${fmt(priced.home * 100)}%, hold ${fmt(priced.hold * 100)} percentage points.`)
  } else {
    lines.push('- DraftKings no-vig price: missing-input.')
  }
  if (fdPriced) {
    lines.push(`- FanDuel no-vig price, from the moneyline only: ${game.away.name} ${fmt(fdPriced.away * 100)}%, ${game.home.name} ${fmt(fdPriced.home * 100)}%, hold ${fmt(fdPriced.hold * 100)} percentage points.`)
  } else {
    lines.push('- FanDuel no-vig price: missing-input.')
  }
  lines.push('- Our win probability: not calculated. A projected score is not a probability.')
  lines.push('- Priced edge: not supported. A point gap against FanDuel or DraftKings is line value only. An edge still needs a validated win probability.')
  lines.push('- System refinement: compare the two books only when the number matches; do not fit the baseline to either posted number; treat a quote inside the method range as no separation from the market.')
  lines.push('- Outside-pick consensus: recorded in the public-consensus section. Not used as a tie-break.')
  return lines
}

function consensusSection(game) {
  const lines = []
  lines.push('**4. Public consensus — handicappers, sports media, and public models**')
  lines.push('')
  lines.push('This view is not one of the four models and it is not a sportsbook price. It is not averaged, and it is not used as a tie-break.')
  lines.push('')
  const covers = game.covers
  if (!covers) {
    lines.push('- Covers handicapper consensus: unavailable. No matching row on the Covers overall board.')
  } else {
    const total = covers.awayPicks + covers.homePicks
    const leader = covers.homePct > covers.awayPct ? game.home.name : covers.awayPct > covers.homePct ? game.away.name : 'even'
    const figure = covers.numberKind === 'moneyline' ? 'moneyline' : 'spread'
    lines.push(`- Covers handicappers: ${game.away.name} ${covers.awayPct}% (${covers.awayPicks} picks) ${covers.awayNumber}, ${game.home.name} ${covers.homePct}% (${covers.homePicks} picks) ${covers.homeNumber}. ${total} picks. Consensus side: ${leader}. The number beside each side is the ${figure} Covers posted with that pick.`)
  }
  const predictor = game.predictor
  if (!predictor) {
    lines.push('- ESPN Matchup Predictor: unavailable.')
  } else {
    lines.push(`- ESPN Matchup Predictor, a public model: ${game.away.name} ${fmt(predictor.awayWin)}%, ${game.home.name} ${fmt(predictor.homeWin)}%. This is a win chance, not a spread pick.`)
  }
  lines.push('- A source that did not send a machine-readable pick stays missing. No pick is invented.')
  return lines
}

function propsSection(game) {
  const props = game.extra?.props ?? []
  const shown = props.slice(0, 8)
  const lines = [
    '**Props**',
    '',
    'Separate from the team card. This pass looks for FanDuel and DraftKings props only. Neither game-line feed included a verified player prop.',
    '',
    '| Prop | Independent projection | FanDuel | DraftKings | Flag |',
    '| --- | --- | --- | --- | --- |',
  ]
  if (shown.length === 0) {
    lines.push(`| Player props for ${game.away.name} at ${game.home.name} | inventory open | unavailable | unavailable | inventory-open; missing-input; unavailable |`)
  }
  lines.push('')
  return lines
}

function renderGame(game, awayLog, homeLog, football, scoring = projectScoring(awayLog.rows, homeLog.rows, football ? 'points' : 'score')) {
  const lines = []
  lines.push(`### ${game.away.name} at ${game.home.name}`)
  lines.push('')
  lines.push(`- When: ${game.when}`)
  lines.push(`- Site: ${game.neutral ? 'neutral (venue split not applied)' : 'home team listed second'}`)
  lines.push('')
  lines.push('**1. Independent projection**')
  lines.push('')
  lines.push(`Statistical source: ESPN team schedules for ${awayLog.seasonLabel} and ${homeLog.seasonLabel}.${football ? ' Football yardage adds ESPN box scores.' : ''} No sportsbook price, open line, or quote timestamp enters this calculation.`)
  lines.push(`Sample filter: current season on each team schedule. Other seasons skipped: away ${awayLog.skipped.otherSeason}, home ${homeLog.skipped.otherSeason}. Other season types skipped: away ${awayLog.skipped.otherType}, home ${homeLog.skipped.otherType}.`)
  lines.push('Method: venue-matched mean. Visiting production uses the visitor’s away games. Home production uses the home team’s home games. The opponent input is that team’s matching venue allowance. Overall means are shown beside that and are not substituted when both venue samples exist. This is a transparent baseline, not a validated model.')
  lines.push('')
  lines.push(line(`${game.away.name} ${scoring.unit}`, scoring.away))
  lines.push(line(`${game.home.name} ${scoring.unit}`, scoring.home))
  lines.push(`- Combined ${scoring.unit}: ${fmt(scoring.total)}`)
  lines.push(`- Home margin: ${fmt(scoring.margin)} (positive means the home team is projected higher)`)
  lines.push(`- Projected outcome: ${projectedOutcome(game.home.name, game.away.name, scoring.home.value, scoring.away.value)}`)
  lines.push(line(`Overall comparison, ${game.away.name}`, scoring.awayOverall))
  lines.push(line(`Overall comparison, ${game.home.name}`, scoring.homeOverall))
  const methods = scoringMethods(awayLog.rows, homeLog.rows)
  const convergence = methodConvergence(methods)
  lines.push('')
  lines.push('Four independent reads of the same logs. They are listed separately and are not averaged into a single projection.')
  lines.push('')
  lines.push('| Method | Away | Home | Home margin | Combined |')
  lines.push('| --- | --- | --- | --- | --- |')
  for (const method of methods) {
    lines.push(`| ${method.name} | ${fmt(method.away.value)} | ${fmt(method.home.value)} | ${fmt(method.margin)} | ${fmt(method.total)} |`)
  }
  lines.push('')
  lines.push(`- Convergence: ${convergence.known} methods available; home ${convergence.counts.home}, away ${convergence.counts.away}, tie ${convergence.counts.tie}. Result: ${convergence.side}.`)
  lines.push(`- Margin range across methods: ${fmt(convergence.marginRange)}. Combined range across methods: ${fmt(convergence.totalRange)}.`)
  lines.push('- Convergence is agreement among these methods. It is not outside consensus.')
  lines.push(`- Synergy, visitor scoring inputs: ${synergyText(teamSynergy(awayLog.rows, 'away', homeLog.rows, 'home'))}.`)
  lines.push(`- Synergy, home scoring inputs: ${synergyText(teamSynergy(homeLog.rows, 'home', awayLog.rows, 'away'))}.`)
  lines.push('- Synergy means the team’s own venue rate and the opponent’s venue allowance sit on the same side of their overall rates. A diverging pair is left visible. The two rates are not collapsed.')
  lines.push('- Outside consensus: recorded in its own section. These four methods are not that consensus, and they are not averaged.')
  const sim = gameSimulation(game, awayLog.rows, homeLog.rows)
  lines.push('')
  lines.push('**Simulation**')
  lines.push('')
  lines.push('Each draw takes one completed venue game from the team and one from the opponent, then averages those two results. Two thousand draws. The seed is fixed, so the same logs reproduce the same sim. The sim does not use a sportsbook price.')
  if (!sim.ok) {
    lines.push(`- Sim: not run. ${sim.reason}.`)
  } else {
    lines.push(`- Sim median score: ${game.away.name} ${fmt(sim.awayMedian)}, ${game.home.name} ${fmt(sim.homeMedian)}.`)
    lines.push(`- Sim frequencies: ${game.home.name} wins ${fmt(sim.homeWinRate * 100)}%, ${game.away.name} wins ${fmt(sim.awayWinRate * 100)}%, ties ${fmt(sim.tieRate * 100)}%.`)
    lines.push(sim.thin ? '- Sim sample: thin. At least one venue slice has fewer than 3 games, so this frequency is not a stable probability.' : '- Sim sample: each venue slice has at least 3 games.')
    if (sim.fdCover != null) lines.push(`- Sim home-cover rate versus FanDuel: ${fmt(sim.fdCover * 100)}% (pushes ${fmt(sim.fdCoverPush * 100)}%).`)
    if (sim.dkCover != null) lines.push(`- Sim home-cover rate versus DraftKings: ${fmt(sim.dkCover * 100)}% (pushes ${fmt(sim.dkCoverPush * 100)}%).`)
    if (sim.fdOver != null) lines.push(`- Sim over rate versus FanDuel total: ${fmt(sim.fdOver * 100)}%.`)
    if (sim.dkOver != null) lines.push(`- Sim over rate versus DraftKings total: ${fmt(sim.dkOver * 100)}%.`)
    lines.push(`- ${sim.edge}`)
  }
  if (football) {
    const specs = [
      ['rushFor', 'rushAgainst', 'rushing yards'],
      ['grossPassFor', 'grossPassAgainst', 'gross passing yards (net passing yards + sack yards lost)'],
      ['netPassFor', 'netPassAgainst', 'net passing yards'],
      ['sackLostFor', 'sackLostAgainst', 'sack yards lost'],
      ['totalFor', 'totalAgainst', 'total offensive yards (box-score total, not a sum of medians)'],
    ]
    for (const [forField, againstField, name] of specs) {
      const projected = projectYards(awayLog.rows, homeLog.rows, forField, againstField)
      const combined = Number.isFinite(projected.away.value) && Number.isFinite(projected.home.value)
        ? projected.away.value + projected.home.value
        : null
      lines.push(line(`${game.away.name} ${name}`, projected.away))
      lines.push(line(`${game.home.name} ${name}`, projected.home))
      lines.push(`- Combined ${name}: ${fmt(combined)}`)
      lines.push(line(`Overall comparison, ${game.away.name} ${name}`, projected.awayOverall))
      lines.push(line(`Overall comparison, ${game.home.name} ${name}`, projected.homeOverall))
    }
    const checks = [...awayLog.rows, ...homeLog.rows]
      .map((row) => row.yards?.reconcileFor)
      .filter(Boolean)
    const failed = checks.filter((item) => !item.ok)
    lines.push(`- Total-offense identity: rush + net pass checked on ${checks.length} team-games; ${failed.length} did not match the box-score total within 1 yard.`)
  } else {
    lines.push('- Yardage: not applicable to this sport.')
  }
  lines.push('')
  lines.push('**Historical for / against**')
  lines.push('')
  for (const [teamName, rows] of [[game.away.name, awayLog.rows], [game.home.name, homeLog.rows]]) {
    lines.push(...historyLines(teamName, rows, 'pointsFor', `${scoring.unit} for`))
    lines.push(...historyLines(teamName, rows, 'pointsAgainst', `${scoring.unit} against`))
  }
  if (football) {
    for (const [field, name] of YARD_FIELDS) {
      lines.push(...historyLines(game.away.name, awayLog.rows, field, name))
      lines.push(...historyLines(game.home.name, homeLog.rows, field, name))
    }
    const missingYards = [...awayLog.rows, ...homeLog.rows].filter((row) => !row.yards || row.yards.missing).length
    if (missingYards) lines.push(`- Games missing a box score: ${missingYards}. Those games stay in the points sample and drop out of the yardage sample.`)
  }
  lines.push('')
  lines.push(...marketSection(game))
  lines.push('')
  lines.push(...comparisonSection(game, scoring, methods))
  lines.push('')
  lines.push(...consensusSection(game))
  lines.push('')
  lines.push(...propsSection(game))
  return lines.join('\n')
}

async function section(title, sportPath, games, football, unit) {
  const header = [`## ${title}`, '', `Games on this retrieved board: ${games.length}.`, '']
  if (games.length === 0) {
    header.push('No upcoming games were in the retrieved scoreboard. Nothing was projected for this section.')
    header.push('')
    return { markdown: header.join('\n'), predictions: [] }
  }
  await pool(games, 4, async (game) => {
    game.predictor = await espnPredictor(sportPath, game.id)
  })
  const teamIds = [...new Set(games.flatMap((game) => [game.away.id, game.home.id]))]
  const logs = new Map()
  await pool(teamIds, 3, async (teamId) => {
    logs.set(teamId, await teamLog(sportPath, teamId, football))
  })
  const rendered = games.map((game) => {
    const awayLog = logs.get(game.away.id)
    const homeLog = logs.get(game.home.id)
    const scoring = projectScoring(awayLog.rows, homeLog.rows, unit)
    const methods = scoringMethods(awayLog.rows, homeLog.rows)
    const convergence = methodConvergence(methods)
    const margins = methods.map((method) => method.margin)
    const totals = methods.map((method) => method.total)
    const spots = Object.fromEntries(bookMargins(game).map(([name, margin, total]) => [name, {
      side: quotePosition(margin, margins),
      total: quotePosition(total, totals),
    }]))
    const sim = gameSimulation(game, awayLog.rows, homeLog.rows)
    return {
      scoring,
      convergence,
      spots,
      prediction: {
        date: game.date ?? '',
        when: game.when ?? 'Scheduled',
        away: game.away.name,
        home: game.home.name,
        score: `${fmt(scoring.away.value)}–${fmt(scoring.home.value)}`,
        total: fmt(scoring.total),
        models: modelCall(game, convergence),
        sim: simCall(game, sim),
      },
      markdown: renderGame(game, awayLog, homeLog, football, scoring),
    }
  })
  const table = [
    'Comparison summary. Prices and timestamps are in each game’s market section, not here.',
    '',
    '| Game | Baseline score | Home margin | Market home margin | Margin difference | Baseline total | Posted total | Total difference |',
    '| --- | --- | --- | --- | --- | --- | --- | --- |',
    ...rendered.map(({ scoring }, index) => {
      const game = games[index]
      return `| ${game.away.name} at ${game.home.name} | ${fmt(scoring.away.value)}–${fmt(scoring.home.value)} | ${fmt(scoring.margin)} | ${fmt(game.market.marketHomeMargin)} | ${fmt(difference(scoring.margin, game.market.marketHomeMargin))} | ${fmt(scoring.total)} | ${fmt(game.market.total)} | ${fmt(difference(scoring.total, game.market.total))} |`
    }),
    '',
    'Agreement among the four statistical methods. This is not outside consensus, and it is not a blend.',
    '',
    '| Game | Home votes | Away votes | Tie votes | Agreement | Margin range | Total range |',
    '| --- | --- | --- | --- | --- | --- | --- |',
    ...rendered.map(({ convergence }, index) => {
      const game = games[index]
      return `| ${game.away.name} at ${game.home.name} | ${convergence.counts.home} | ${convergence.counts.away} | ${convergence.counts.tie} | ${convergence.side} | ${fmt(convergence.marginRange)} | ${fmt(convergence.totalRange)} |`
    }),
    '',
    'Line value against FanDuel and DraftKings. A candidate means that book sits outside every method. That is a point gap, not a priced edge.',
    '',
    '| Game | FanDuel side | DraftKings side | FanDuel total | DraftKings total |',
    '| --- | --- | --- | --- | --- |',
    ...rendered.map(({ spots }, index) => {
      const game = games[index]
      return `| ${game.away.name} at ${game.home.name} | ${spots.FanDuel.side} | ${spots.DraftKings.side} | ${spots.FanDuel.total} | ${spots.DraftKings.total} |`
    }),
    '',
    'Public consensus. Handicapper picks are the Covers count. The ESPN figure is a public-model win chance. Neither is one of the four models, and neither is a book price.',
    '',
    '| Game | Covers consensus | Covers picks | ESPN Matchup Predictor |',
    '| --- | --- | --- | --- |',
    ...games.map((game) => {
      const covers = game.covers
      const predictor = game.predictor
      const coversText = covers
        ? `${covers.homePct > covers.awayPct ? game.home.name : game.away.name} ${Math.max(covers.awayPct, covers.homePct)}%`
        : 'unavailable'
      const picksText = covers ? `${covers.awayPicks + covers.homePicks}` : 'unavailable'
      const modelText = predictor ? `${game.away.name} ${fmt(predictor.awayWin)} / ${game.home.name} ${fmt(predictor.homeWin)}` : 'unavailable'
      return `| ${game.away.name} at ${game.home.name} | ${coversText} | ${picksText} | ${modelText} |`
    }),
    '',
  ]
  return {
    markdown: [...header, ...table, ...rendered.map((item) => item.markdown)].join('\n'),
    predictions: rendered.map((item) => item.prediction),
  }
}

function predictedSlate(rows) {
  if (!rows.length) return ''
  const sorted = [...rows].sort((left, right) => String(left.date).localeCompare(String(right.date)) || left.away.localeCompare(right.away))
  return [
    '## Predicted slate',
    '',
    'This is the prediction. The score is the venue-matched mean. The four models are not averaged. The sim is a separate 2,000-draw read. A sim percentage is the share of the draws. Thin means a venue slice has fewer than 3 games. Book prices are in each game’s market section.',
    '',
    '| Time | Game | Predicted score | Total | Models | Sim |',
    '| --- | --- | --- | --- | --- | --- |',
    ...sorted.map((row) => `| ${row.when} | ${row.away} at ${row.home} | ${row.score} | ${row.total} | ${row.models} | ${row.sim} |`),
    '',
  ].join('\n')
}

async function load(sportPath, query) {
  try {
    return await scoreboard(sportPath, query)
  } catch (error) {
    return { error: error instanceof Error ? error.message : String(error) }
  }
}

function dateET(iso) {
  if (!iso) return null
  const parsed = new Date(iso)
  if (Number.isNaN(parsed.getTime())) return null
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York' }).format(parsed)
}

async function main() {
  const args = process.argv.slice(2)
  let slateDate = null
  let only = null
  const positional = []
  for (let i = 0; i < args.length; i += 1) {
    if (args[i] === '--date') {
      slateDate = args[i + 1]
      i += 1
      continue
    }
    if (args[i] === '--only') {
      only = args[i + 1]
      i += 1
      continue
    }
    positional.push(args[i])
  }
  const outputPath = positional[0] ?? (slateDate ? `docs/projections/${slateDate}-today.md` : 'docs/projections/2026-10-30-slate.md')
  const blocks = []
  blocks.push(slateDate ? `# Slate for ${slateDate}` : '# Slate projection snapshot')
  blocks.push('')
  blocks.push(`Retrieved ${retrievedAt.toISOString()} (UTC). This is one retrieved snapshot, not a live feed.`)
  if (slateDate) blocks.push(`Included games start on ${slateDate} in America/New_York. Other dates on the source boards are left out.`)
  blocks.push('')
  blocks.push('The commandments in docs/projections/COMMANDMENTS.md govern this slate. The predicted slate is the first table. That score is the venue-matched mean. Each game then has three views: an independent projection, sportsbook lines and prices, and a comparison. Sides, moneyline, O/U, team totals, and props are on every sport, not only football. An edge is stated only when a validated probability and verified prices support it. This snapshot does not meet that bar.')
  blocks.push('')
  blocks.push('Status: not complete. This pass compares projections with FanDuel and DraftKings only. DraftKings open and latest come from ESPN. FanDuel latest comes from the Ohio board for NFL, college football, NBA, and NHL. Player props and team totals were not on those two feeds.')
  blocks.push('')
  blocks.push('## Open gaps in this snapshot')
  blocks.push('')
  blocks.push('- Player-stat projection inventory: open. Not recovered, not treated as canceled.')
  blocks.push('- Player props: FanDuel and DraftKings game-line feeds did not include a verified player prop. The inventory stays open.')
  blocks.push('- FanDuel opening prices: not on the Ohio board.')
  blocks.push('- DraftKings direct site: access denied. Open and latest prices are the ESPN quote.')
  blocks.push('- FanDuel soccer: no public Ohio board for Premier League or MLS, so those games have DraftKings only.')
  blocks.push('- Team totals: unavailable at both FanDuel and DraftKings on these feeds.')
  blocks.push('- Model win probability: not calculated. A score is not turned into a probability.')
  blocks.push('- Priced edge: not labeled. A resampling sim is reported separately from the four base models, and a gap versus the no-vig price is not called an edge.')
  blocks.push('- Public consensus: Covers handicapper picks and the ESPN Matchup Predictor when those sources send a row. A missing row stays missing. This is not blended into the four models or the book prices.')
  blocks.push('')

  const books = await loadBooks(['nfl', 'ncaaf', 'nba', 'nhl', 'epl', 'mls'], retrievedAt.toISOString(), { novig: false })
  blocks.push(`Price sources loaded at ${retrievedAt.toISOString()} UTC. FanDuel Ohio games indexed: ${['nfl', 'ncaaf', 'nba', 'nhl'].map((sport) => `${sport} ${books.books[sport]?.fanduel.size ?? 0}`).join(', ')}. DraftKings is read per game from ESPN.`)
  const priceErrors = Object.values(books.books).flatMap((entry) => entry.errors)
  if (priceErrors.length) blocks.push(`Price source notes: ${priceErrors.join(' | ')}`)
  blocks.push('')

  const covers = await loadCoversConsensus()
  blocks.push(`Public consensus loaded at ${retrievedAt.toISOString()} UTC. Covers handicapper rows: ${covers.picks.length}.${covers.errors.length ? ` Notes: ${covers.errors.join(' | ')}` : ''}`)
  blocks.push('')

  const sportBlocks = []
  const predictions = []
  const dated = slateDate ? slateDate.replaceAll('-', '') : null
  const boards = dated
    ? [
        ['NFL', 'football/nfl', `?dates=${dated}`, true, 'points', 'nfl'],
        [`FBS ${slateDate}`, 'football/college-football', `?dates=${dated}&groups=80&limit=300`, true, 'points', 'ncaaf'],
        [`FCS ${slateDate}`, 'football/college-football', `?dates=${dated}&groups=81&limit=300`, true, 'points', 'ncaaf'],
        [`NBA ${slateDate}`, 'basketball/nba', `?dates=${dated}`, false, 'points', 'nba'],
        [`NHL ${slateDate}`, 'hockey/nhl', `?dates=${dated}`, false, 'goals', 'nhl'],
        ['Premier League scoreboard', 'soccer/eng.1', '', false, 'goals', 'epl'],
        ['MLS scoreboard', 'soccer/usa.1', '', false, 'goals', 'mls'],
        ['MLB scoreboard', 'baseball/mlb', '', false, 'runs', null],
      ]
    : [
        ['NFL', 'football/nfl', '', true, 'points', 'nfl'],
        ['FBS Friday, October 30', 'football/college-football', '?dates=20261030&groups=80&limit=200', true, 'points', 'ncaaf'],
        ['FBS Saturday, October 31', 'football/college-football', '?dates=20261031&groups=80&limit=300', true, 'points', 'ncaaf'],
        ['FCS Friday, October 30', 'football/college-football', '?dates=20261030&groups=81&limit=200', true, 'points', 'ncaaf'],
        ['FCS Saturday, October 31', 'football/college-football', '?dates=20261031&groups=81&limit=300', true, 'points', 'ncaaf'],
        ['NBA, October 30', 'basketball/nba', '?dates=20261030', false, 'points', 'nba'],
        ['NHL, October 30', 'hockey/nhl', '?dates=20261030', false, 'goals', 'nhl'],
        ['Premier League scoreboard', 'soccer/eng.1', '', false, 'goals', 'epl'],
        ['MLS scoreboard', 'soccer/usa.1', '', false, 'goals', 'mls'],
        ['MLB scoreboard', 'baseball/mlb', '', false, 'runs', null],
      ]

  const selected = only ? boards.filter(([title]) => title.toLowerCase().includes(only.toLowerCase())) : boards
  if (only && selected.length === 0) throw new Error(`No board title matches ${only}`)

  for (const [title, sportPath, query, football, unit, sportKey] of selected) {
    process.stderr.write(`loading ${title}\n`)
    const events = await load(sportPath, query)
    if (events.error) {
      sportBlocks.push(`## ${title}\n\nBlocked: ${events.error}\n`)
      continue
    }
    const games = gamesFromEvents(events, title).filter((game) => !slateDate || dateET(game.date) === slateDate)
    if (sportKey) {
      for (const game of games) {
        game.extra = books.match(sportKey, [game.away.full, game.away.short, game.away.name], [game.home.full, game.home.short, game.home.name])
      }
    }
    for (const game of games) game.covers = matchCovers(game, covers.picks, coversLeagueFor(sportKey))
    process.stderr.write(`${title}: ${games.length} upcoming\n`)
    const result = await section(title, sportPath, games, football, unit)
    sportBlocks.push(result.markdown)
    predictions.push(...result.predictions)
  }

  const predicted = predictedSlate(predictions)
  if (predicted) blocks.push(predicted)
  blocks.push(...sportBlocks)

  blocks.push('## Player props')
  blocks.push('')
  blocks.push('This section is separate from the team cards. Every game above also has its own props block.')
  blocks.push('')
  blocks.push('| Check | Status | Flag |')
  blocks.push('| --- | --- | --- |')
  blocks.push('| Exact player-stat inventory | Not recovered | inventory-open |')
  blocks.push('| Independent player projection | Not calculated | missing-input |')
  blocks.push('| FanDuel player props | Not on the Ohio game-line board | unavailable |')
  blocks.push('| DraftKings player props | Not on the ESPN quote | unavailable |')
  blocks.push('| Verification | No prop line was checked against a book | unverified |')
  blocks.push('')
  blocks.push('No prop number is invented. Unrecovered player stats stay open.')
  blocks.push('')

  const markdown = `${blocks.join('\n')}\n`
  await writeFile(outputPath, markdown)
  process.stderr.write(`wrote ${outputPath} (${markdown.length} chars)\n`)
}

const entry = process.argv[1]
if (entry && import.meta.url === pathToFileURL(entry).href) {
  main().catch((error) => {
    console.error(error)
    process.exit(1)
  })
}
