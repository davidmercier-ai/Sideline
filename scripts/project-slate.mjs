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
  marketHomeMargin,
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
const SEASON = 2026
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

function isRegular(event) {
  const type = event?.seasonType?.type ?? event?.season?.type?.type ?? event?.season?.type
  if (type == null) return { keep: true, known: false }
  return { keep: Number(type) === 2, known: true }
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
  const rows = []
  const skipped = { nonRegular: 0, unknownSeasonType: 0 }
  for (const event of schedule.events ?? []) {
    const competition = event.competitions?.[0]
    const status = competition?.status?.type
    if (!status?.completed) continue
    const seasonYear = event.season?.year ?? schedule.season?.year
    if (seasonYear && Number(seasonYear) !== SEASON) continue
    const regular = isRegular(event)
    if (regular.known && !regular.keep) {
      skipped.nonRegular += 1
      continue
    }
    if (!regular.known) skipped.unknownSeasonType += 1
    const sides = competition.competitors ?? []
    const me = sides.find((side) => String(side.team?.id) === String(teamId))
    const opp = sides.find((side) => String(side.team?.id) !== String(teamId))
    if (!me || !opp) continue
    const pointsFor = scoreValue(me.score)
    const pointsAgainst = scoreValue(opp.score)
    if (pointsFor == null || pointsAgainst == null) continue
    rows.push({
      eventId: event.id,
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
  return { rows, skipped, source: `${ESPN}/apis/site/v2/sports/${sportPath}/teams/${teamId}/schedule` }
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

function projectYards(awayLog, homeLog, forField, againstField) {
  return {
    away: projectRate(values(awayLog, 'away', forField), values(homeLog, 'home', againstField)),
    home: projectRate(values(homeLog, 'home', forField), values(awayLog, 'away', againstField)),
    awayOverall: overallComparison(values(awayLog, 'overall', forField), values(homeLog, 'overall', againstField)),
    homeOverall: overallComparison(values(homeLog, 'overall', forField), values(awayLog, 'overall', againstField)),
  }
}

function marketSection(game, projection) {
  const market = game.market
  const lines = []
  lines.push(`- Book retrieved: ${market.book ?? 'none'}`)
  lines.push('- FanDuel: unavailable in this ESPN payload')
  lines.push('- Novig: unavailable in this ESPN payload')
  lines.push('- Ohio availability: not stated by the feed')
  lines.push('- Public betting splits: unavailable')
  lines.push('- Team total: unavailable')
  if (!market.book) {
    lines.push(`- ${market.note}`)
    return lines
  }
  const sideDiff = difference(projection.margin, market.marketHomeMargin)
  const totalDiff = difference(projection.total, market.total)
  lines.push(`- Spread close: home ${market.spread.homeCloseLine ?? 'missing'} ${market.spread.homeClosePrice ?? 'price missing'}; away ${market.spread.awayCloseLine ?? 'missing'} ${market.spread.awayClosePrice ?? 'price missing'}`)
  lines.push(`- Spread open: home ${market.spread.homeOpenLine ?? 'missing'} ${market.spread.homeOpenPrice ?? 'price missing'}; away ${market.spread.awayOpenLine ?? 'missing'} ${market.spread.awayOpenPrice ?? 'price missing'}`)
  lines.push(`- Market home margin: ${fmt(market.marketHomeMargin)} (positive means the home team is favored)`)
  lines.push(`- Baseline home margin minus market home margin: ${fmt(sideDiff)}`)
  lines.push(`- Moneyline close: ${game.away.abbr || 'away'} ${market.moneyline.awayClose ?? 'missing'}, ${game.home.abbr || 'home'} ${market.moneyline.homeClose ?? 'missing'}`)
  lines.push(`- Moneyline open: ${game.away.abbr || 'away'} ${market.moneyline.awayOpen ?? 'missing'}, ${game.home.abbr || 'home'} ${market.moneyline.homeOpen ?? 'missing'}`)
  lines.push('- Model win probability: not calculated. A projected score is not a probability.')
  lines.push(`- Total close: over ${market.totalPrices.overCloseLine ?? 'missing'} ${market.totalPrices.overClosePrice ?? 'price missing'}; under ${market.totalPrices.underCloseLine ?? 'missing'} ${market.totalPrices.underClosePrice ?? 'price missing'}`)
  lines.push(`- Total open: over ${market.totalPrices.overOpenLine ?? 'missing'} ${market.totalPrices.overOpenPrice ?? 'price missing'}; under ${market.totalPrices.underOpenLine ?? 'missing'} ${market.totalPrices.underOpenPrice ?? 'price missing'}`)
  lines.push(`- Baseline total minus posted total: ${fmt(totalDiff)} (${totalDirection(totalDiff)})`)
  lines.push(`- ${market.teamTotalNote}`)
  return lines
}

function renderGame(game, awayLog, homeLog, football, scoring = projectScoring(awayLog.rows, homeLog.rows, football ? 'points' : 'score')) {
  const lines = []
  lines.push(`### ${game.away.name} at ${game.home.name}`)
  lines.push('')
  lines.push(`- When: ${game.when}`)
  lines.push(`- Site: ${game.neutral ? 'neutral (venue split not applied)' : 'home team listed second'}`)
  lines.push(`- Source: ESPN team schedules and, for football yardage, ESPN box scores. Retrieved ${retrievedAt.toISOString()} (snapshot, not a live feed).`)
  lines.push(`- Sample filter: ${SEASON} completed games. Non-regular games skipped: away ${awayLog.skipped.nonRegular}, home ${homeLog.skipped.nonRegular}. Events with no season type kept and counted: away ${awayLog.skipped.unknownSeasonType}, home ${homeLog.skipped.unknownSeasonType}.`)
  lines.push('')
  lines.push('**Layer A — baseline projection**')
  lines.push('')
  lines.push('Method: venue-matched mean. Visiting production uses the visitor’s away games. Home production uses the home team’s home games. The opponent input is that team’s matching venue allowance. Overall means are shown and are not substituted when both venue samples exist. This is a transparent baseline, not a validated model.')
  lines.push('')
  lines.push(line(`${game.away.name} ${scoring.unit}`, scoring.away))
  lines.push(line(`${game.home.name} ${scoring.unit}`, scoring.home))
  lines.push(`- Combined ${scoring.unit}: ${fmt(scoring.total)}`)
  lines.push(`- Home margin: ${fmt(scoring.margin)} (positive means the home team is projected higher)`)
  lines.push(`- Projected outcome: ${projectedOutcome(game.home.name, game.away.name, scoring.home.value, scoring.away.value)}`)
  lines.push(line(`Overall comparison, ${game.away.name}`, scoring.awayOverall))
  lines.push(line(`Overall comparison, ${game.home.name}`, scoring.homeOverall))
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
  lines.push(`- ${game.away.name} ${scoring.unit} scored, overall: ${fmtSummary(historyBlock(awayLog.rows, 'pointsFor').overall)}`)
  lines.push(`- ${game.away.name} ${scoring.unit} scored, away: ${fmtSummary(historyBlock(awayLog.rows, 'pointsFor').away)}`)
  lines.push(`- ${game.away.name} ${scoring.unit} allowed, overall: ${fmtSummary(historyBlock(awayLog.rows, 'pointsAgainst').overall)}`)
  lines.push(`- ${game.away.name} ${scoring.unit} allowed, away: ${fmtSummary(historyBlock(awayLog.rows, 'pointsAgainst').away)}`)
  lines.push(`- ${game.home.name} ${scoring.unit} scored, overall: ${fmtSummary(historyBlock(homeLog.rows, 'pointsFor').overall)}`)
  lines.push(`- ${game.home.name} ${scoring.unit} scored, home: ${fmtSummary(historyBlock(homeLog.rows, 'pointsFor').home)}`)
  lines.push(`- ${game.home.name} ${scoring.unit} allowed, overall: ${fmtSummary(historyBlock(homeLog.rows, 'pointsAgainst').overall)}`)
  lines.push(`- ${game.home.name} ${scoring.unit} allowed, home: ${fmtSummary(historyBlock(homeLog.rows, 'pointsAgainst').home)}`)
  if (football) {
    for (const [field, name] of YARD_FIELDS) {
      lines.push(`- ${game.away.name} ${name}, overall: ${fmtSummary(historyBlock(awayLog.rows, field).overall)}`)
      lines.push(`- ${game.away.name} ${name}, away: ${fmtSummary(historyBlock(awayLog.rows, field).away)}`)
      lines.push(`- ${game.home.name} ${name}, overall: ${fmtSummary(historyBlock(homeLog.rows, field).overall)}`)
      lines.push(`- ${game.home.name} ${name}, home: ${fmtSummary(historyBlock(homeLog.rows, field).home)}`)
    }
    const missingYards = [...awayLog.rows, ...homeLog.rows].filter((row) => !row.yards || row.yards.missing).length
    if (missingYards) lines.push(`- Games missing a box score: ${missingYards}. Those games stay in the points sample and drop out of the yardage sample.`)
  }
  lines.push('')
  lines.push('**Layer B and Layer C — posted market and the numeric difference**')
  lines.push('')
  lines.push(...marketSection(game, scoring))
  lines.push('')
  lines.push('The margin difference and the total difference are not betting edges. No price was converted into a probability.')
  lines.push('')
  return lines.join('\n')
}

async function section(title, sportPath, games, football) {
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
    const scoring = projectScoring(awayLog.rows, homeLog.rows, football ? 'points' : 'score')
    return {
      scoring,
      markdown: renderGame(game, awayLog, homeLog, football, scoring),
    }
  })
  const table = [
    '| Game | Baseline score | Home margin | Market home margin | Margin difference | Baseline total | Posted total | Total difference |',
    '| --- | --- | --- | --- | --- | --- | --- | --- |',
    ...rendered.map(({ scoring }, index) => {
      const game = games[index]
      return `| ${game.away.name} at ${game.home.name} | ${fmt(scoring.away.value)}–${fmt(scoring.home.value)} | ${fmt(scoring.margin)} | ${fmt(game.market.marketHomeMargin)} | ${fmt(difference(scoring.margin, game.market.marketHomeMargin))} | ${fmt(scoring.total)} | ${fmt(game.market.total)} | ${fmt(difference(scoring.total, game.market.total))} |`
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
  blocks.push('Status of this snapshot: not complete. Player props, FanDuel, Novig, public betting splits, and team totals are requested and were not available here. Distribution fields are reported only from completed games. A blank history stays flagged.')
  blocks.push('')
  blocks.push('## Open gaps in this snapshot')
  blocks.push('')
  blocks.push('- Player-stat projection inventory: open. Not recovered, not treated as canceled.')
  blocks.push('- Player props: requested, not implemented.')
  blocks.push('- FanDuel and Novig: requested, not in the ESPN payload used here.')
  blocks.push('- Team totals: requested, not posted on the ESPN team-odds object.')
  blocks.push('- Model win probability: not calculated, on purpose.')
  blocks.push('- FCS is requested. It is included only when the ESPN group=81 scoreboard returns games.')
  blocks.push('')

  const boards = [
    ['NFL', 'football/nfl', '', true],
    ['FBS Friday, October 30', 'football/college-football', '?dates=20261030&groups=80&limit=200', true],
    ['FBS Saturday, October 31', 'football/college-football', '?dates=20261031&groups=80&limit=300', true],
    ['FCS Friday, October 30', 'football/college-football', '?dates=20261030&groups=81&limit=200', true],
    ['FCS Saturday, October 31', 'football/college-football', '?dates=20261031&groups=81&limit=300', true],
    ['NBA, October 30', 'basketball/nba', '?dates=20261030', false],
    ['NHL, October 30', 'hockey/nhl', '?dates=20261030', false],
    ['Premier League scoreboard', 'soccer/eng.1', '', false],
    ['MLS scoreboard', 'soccer/usa.1', '', false],
    ['MLB scoreboard', 'baseball/mlb', '', false],
  ]

  for (const [title, sportPath, query, football] of boards) {
    process.stderr.write(`loading ${title}\n`)
    const events = await load(sportPath, query)
    if (events.error) {
      blocks.push(`## ${title}`, '', `Blocked: ${events.error}`, '')
      continue
    }
    const games = gamesFromEvents(events, title)
    process.stderr.write(`${title}: ${games.length} upcoming\n`)
    blocks.push(await section(title, sportPath, games, football))
  }

  blocks.push('## Player props')
  blocks.push('')
  blocks.push('Requested and not implemented. The sport-by-sport player-stat inventory is still open. No prop line, price, or player projection is invented in this snapshot.')
  blocks.push('')

  const markdown = `${blocks.join('\n')}\n`
  await writeFile(outputPath, markdown)
  process.stderr.write(`wrote ${outputPath} (${markdown.length} chars)\n`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
