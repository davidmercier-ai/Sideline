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
import {
  asNumber,
  difference,
  grossPassingYards,
  homeMargin,
  inputSynergy,
  marketHomeMargin,
  medianPair,
  methodConvergence,
  overallComparison,
  projectRate,
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
      away: { id: String(away.team.id), name: label(away), abbr: away.team.abbreviation || '' },
      home: { id: String(home.team.id), name: label(home), abbr: home.team.abbreviation || '' },
      market: readMarket(competition),
    })
  }
  return games
}

async function teamLog(sportPath, teamId, football) {
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

function projectYards(awayLog, homeLog, forField, againstField) {
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

function marketSection(game) {
  const market = game.market
  const draftKings = /draft\s*kings/i.test(market.book ?? '')
  const retrieved = `${retrievedAt.toISOString()} UTC`
  const lines = []
  lines.push('**2. Sportsbook lines and prices**')
  lines.push('')
  lines.push(`Retrieved ${retrieved}. This is one snapshot, not a live feed. Ohio availability is not stated by the feed. Public betting splits: unavailable.`)
  lines.push('Prices and timestamps stay in this section. They are not inputs to the projection above.')
  lines.push('')
  lines.push('| Market | FanDuel open | FanDuel latest | DraftKings open | DraftKings latest | Novig open | Novig latest | Flag |')
  lines.push('| --- | --- | --- | --- | --- | --- | --- | --- |')
  const sideFlag = bookFlag(
    draftKings,
    market.spread?.homeCloseLine != null || market.homeSpread != null,
    market.spread?.homeClosePrice != null,
  )
  lines.push(`| Side | unavailable | unavailable | ${priceCell(market.spread?.homeOpenLine, market.spread?.homeOpenPrice)} | ${priceCell(market.spread?.homeCloseLine ?? (market.homeSpread != null ? String(market.homeSpread) : null), market.spread?.homeClosePrice)} | unavailable | unavailable | ${sideFlag} |`)
  const mlFlag = bookFlag(draftKings, market.moneyline?.homeClose != null || market.moneyline?.awayClose != null, market.moneyline?.homeClose != null && market.moneyline?.awayClose != null)
  lines.push(`| Moneyline | unavailable | unavailable | ${game.away.abbr || 'away'} ${market.moneyline?.awayOpen ?? 'unavailable'} / ${game.home.abbr || 'home'} ${market.moneyline?.homeOpen ?? 'unavailable'} | ${game.away.abbr || 'away'} ${market.moneyline?.awayClose ?? 'unavailable'} / ${game.home.abbr || 'home'} ${market.moneyline?.homeClose ?? 'unavailable'} | unavailable | unavailable | ${mlFlag} |`)
  const totalFlag = bookFlag(draftKings, market.total != null, market.totalPrices?.overClosePrice != null)
  lines.push(`| O/U | unavailable | unavailable | ${priceCell(market.totalPrices?.overOpenLine, market.totalPrices?.overOpenPrice)} / ${priceCell(market.totalPrices?.underOpenLine, market.totalPrices?.underOpenPrice)} | ${priceCell(market.totalPrices?.overCloseLine, market.totalPrices?.overClosePrice)} / ${priceCell(market.totalPrices?.underCloseLine, market.totalPrices?.underClosePrice)} | unavailable | unavailable | ${totalFlag} |`)
  lines.push('| Team total, away | unavailable | unavailable | unavailable | unavailable | unavailable | unavailable | unavailable |')
  lines.push('| Team total, home | unavailable | unavailable | unavailable | unavailable | unavailable | unavailable | unavailable |')
  if (!draftKings) {
    lines.push('')
    lines.push(`- DraftKings flag detail: ${market.note ?? 'no DraftKings quote in this payload'}`)
  }
  lines.push(`- ${market.teamTotalNote ?? 'Team totals were not posted.'}`)
  return lines
}

function comparisonSection(game, scoring) {
  const market = game.market
  const sideDiff = difference(scoring.margin, market.marketHomeMargin)
  const totalDiff = difference(scoring.total, market.total)
  const lines = []
  lines.push('**3. Comparison**')
  lines.push('')
  lines.push('This view only subtracts a verified quote from the independent baseline. It does not feed prices back into the projection.')
  lines.push('')
  lines.push('| View | Home margin | Game total | Away team total | Home team total |')
  lines.push('| --- | --- | --- | --- | --- |')
  lines.push(`| Independent baseline | ${fmt(scoring.margin)} | ${fmt(scoring.total)} | ${fmt(scoring.away.value)} | ${fmt(scoring.home.value)} |`)
  lines.push(`| DraftKings latest | ${fmt(market.marketHomeMargin)} | ${fmt(market.total)} | unavailable | unavailable |`)
  lines.push('| FanDuel latest | unavailable | unavailable | unavailable | unavailable |')
  lines.push('| Novig latest | unavailable | unavailable | unavailable | unavailable |')
  lines.push(`| Difference versus DraftKings | ${fmt(sideDiff)} | ${fmt(totalDiff)} | missing-input | missing-input |`)
  lines.push('')
  lines.push(`- Side variance versus DraftKings: ${fmt(sideDiff)} (baseline home margin minus market home margin).`)
  lines.push(`- Total variance versus DraftKings: ${fmt(totalDiff)} (${totalDirection(totalDiff)}).`)
  lines.push('- Cross-book variance: unavailable. Only DraftKings returned a quote, so FanDuel and Novig cannot be compared.')
  lines.push('- Outside-pick consensus: not used.')
  lines.push('- Edge: not supported. No validated win probability was calculated, and a single retrieved quote is not validation. The difference stays a difference.')
  return lines
}

function propsSection(game) {
  return [
    '**Props**',
    '',
    'Separate from the team card. Flags: `verified-retrieved`, `unavailable`, `unverified`, `missing-input`, `inventory-open`.',
    '',
    '| Prop | Independent projection | FanDuel | DraftKings | Novig | Flag |',
    '| --- | --- | --- | --- | --- | --- |',
    `| Player props for ${game.away.name} at ${game.home.name} | inventory open | unavailable | unavailable | unavailable | inventory-open; missing-input; unverified; no line invented |`,
    '',
  ]
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
  lines.push('- Outside consensus: unavailable. No outside-pick source was retrieved. These methods are not averaged and then called consensus.')
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
  lines.push(...comparisonSection(game, scoring))
  lines.push('')
  lines.push(...propsSection(game))
  return lines.join('\n')
}

async function section(title, sportPath, games, football, unit) {
  const header = [`## ${title}`, '', `Games on this retrieved board: ${games.length}.`, '']
  if (games.length === 0) {
    header.push('No upcoming games were in the retrieved scoreboard. Nothing was projected for this section.')
    header.push('')
    return header.join('\n')
  }
  const teamIds = [...new Set(games.flatMap((game) => [game.away.id, game.home.id]))]
  const logs = new Map()
  await pool(teamIds, 3, async (teamId) => {
    logs.set(teamId, await teamLog(sportPath, teamId, football))
  })
  const rendered = games.map((game) => {
    const awayLog = logs.get(game.away.id)
    const homeLog = logs.get(game.home.id)
    const scoring = projectScoring(awayLog.rows, homeLog.rows, unit)
    const convergence = methodConvergence(scoringMethods(awayLog.rows, homeLog.rows))
    return {
      scoring,
      convergence,
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
  ]
  return [...header, ...table, ...rendered.map((item) => item.markdown)].join('\n')
}

async function load(sportPath, query) {
  try {
    return await scoreboard(sportPath, query)
  } catch (error) {
    return { error: error instanceof Error ? error.message : String(error) }
  }
}

async function main() {
  const outputPath = process.argv[2] ?? 'docs/projections/2026-10-30-slate.md'
  const blocks = []
  blocks.push('# Slate projection snapshot')
  blocks.push('')
  blocks.push(`Retrieved ${retrievedAt.toISOString()} (UTC). This is one retrieved snapshot, not a live feed.`)
  blocks.push('')
  blocks.push('Each game has three views: an independent projection, sportsbook lines and prices, and a comparison. Sides, moneyline, O/U, team totals, and props are on every sport, not only football. An edge is stated only when a validated probability and verified prices support it. This snapshot does not meet that bar.')
  blocks.push('')
  blocks.push('Status: not complete. The player-stat inventory is still open. FanDuel, Novig, public betting splits, and team totals were not in the ESPN payload. Distribution fields come only from completed games.')
  blocks.push('')
  blocks.push('## Open gaps in this snapshot')
  blocks.push('')
  blocks.push('- Player-stat projection inventory: open. Not recovered, not treated as canceled.')
  blocks.push('- Player props: present on every game as a flagged section. No prop number is filled in.')
  blocks.push('- FanDuel and Novig: requested books. Flagged unavailable on every market row.')
  blocks.push('- Team totals: requested. Flagged unavailable.')
  blocks.push('- Model win probability: not calculated. A score is not turned into a probability.')
  blocks.push('- Edge: not supported on any game in this snapshot.')
  blocks.push('')

  const boards = [
    ['NFL', 'football/nfl', '', true, 'points'],
    ['FBS Friday, October 30', 'football/college-football', '?dates=20261030&groups=80&limit=200', true, 'points'],
    ['FBS Saturday, October 31', 'football/college-football', '?dates=20261031&groups=80&limit=300', true, 'points'],
    ['FCS Friday, October 30', 'football/college-football', '?dates=20261030&groups=81&limit=200', true, 'points'],
    ['FCS Saturday, October 31', 'football/college-football', '?dates=20261031&groups=81&limit=300', true, 'points'],
    ['NBA, October 30', 'basketball/nba', '?dates=20261030', false, 'points'],
    ['NHL, October 30', 'hockey/nhl', '?dates=20261030', false, 'goals'],
    ['Premier League scoreboard', 'soccer/eng.1', '', false, 'goals'],
    ['MLS scoreboard', 'soccer/usa.1', '', false, 'goals'],
    ['MLB scoreboard', 'baseball/mlb', '', false, 'runs'],
  ]

  for (const [title, sportPath, query, football, unit] of boards) {
    process.stderr.write(`loading ${title}\n`)
    const events = await load(sportPath, query)
    if (events.error) {
      blocks.push(`## ${title}`, '', `Blocked: ${events.error}`, '')
      continue
    }
    const games = gamesFromEvents(events, title)
    process.stderr.write(`${title}: ${games.length} upcoming\n`)
    blocks.push(await section(title, sportPath, games, football, unit))
  }

  blocks.push('## Player props')
  blocks.push('')
  blocks.push('This section is separate from the team cards. Every game above also has its own props block.')
  blocks.push('')
  blocks.push('| Check | Status | Flag |')
  blocks.push('| --- | --- | --- |')
  blocks.push('| Exact player-stat inventory | Not recovered | inventory-open |')
  blocks.push('| Independent player projection | Not calculated | missing-input |')
  blocks.push('| FanDuel player props | Not in the retrieved payload | unavailable |')
  blocks.push('| DraftKings player props | Not in the retrieved payload | unavailable |')
  blocks.push('| Novig player props | Not in the retrieved payload | unavailable |')
  blocks.push('| Verification | No prop line was checked against a book | unverified |')
  blocks.push('')
  blocks.push('No prop number is invented. Unrecovered player stats stay open.')
  blocks.push('')

  const markdown = `${blocks.join('\n')}\n`
  await writeFile(outputPath, markdown)
  process.stderr.write(`wrote ${outputPath} (${markdown.length} chars)\n`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
