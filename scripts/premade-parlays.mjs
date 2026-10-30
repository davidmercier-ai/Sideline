/**
 * Priced premade parlays from the FanDuel and DraftKings websites.
 *
 * A premade parlay is a fixed set of legs with one combined American price.
 * FanDuel: Ohio betting-opportunities card (boapi), header x-sportsbook-region: OH.
 * DraftKings: the prepacks widget on sportsbook-nash, site US-OH-SB.
 *
 * Game-line legs are set beside a retrieved slate when that game is already
 * predicted. Player legs stay missing. Nothing here is a priced edge.
 *
 * Run: node scripts/premade-parlays.mjs
 */

import { readFile, writeFile } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'

const FD_KEY = 'FhMFpcPWXMeyZxOx'
const FD_ALL = 'https://boapi.sportsbook.fanduel.com/betting-opportunities/all'
const DK_PREPACKS = 'https://sportsbook-nash.draftkings.com/sites/US-OH-SB/api/sportscontent/prepacks/sportsdata/v2/prepacks'

const FD_BOARDS = [
  ['NFL', '6423', '12282733'],
  ['NCAAF', '6423', '12529073'],
  ['NBA', '7522', '10547864'],
  ['NHL', '7524', '12550521'],
]

const DK_LEAGUES = [
  ['NFL', '88808'],
  ['NBA', '42648'],
  ['NHL', '42133'],
  ['NCAAF', '87637'],
]

const SLATES = [
  'docs/projections/2026-10-30-today.md',
  'docs/projections/2026-10-31-slate.md',
  'docs/projections/2026-11-01-slate.md',
  'docs/projections/2026-11-02-slate.md',
  'docs/projections/2026-11-03-slate.md',
  'docs/projections/2026-11-04-slate.md',
  'docs/projections/2026-11-05-slate.md',
]

const FD_HEADERS = {
  Accept: 'application/json',
  'User-Agent': 'SidelineProjection/0.1',
  Origin: 'https://sportsbook.fanduel.com',
  Referer: 'https://sportsbook.fanduel.com/',
  'x-sportsbook-region': 'OH',
}

async function getJson(url, headers) {
  let lastError
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const response = await fetch(url, { headers })
      if (!response.ok) throw new Error(`${response.status} ${url}`)
      const text = await response.text()
      return text.trim() ? JSON.parse(text) : {}
    } catch (error) {
      lastError = error
      await new Promise((resolve) => setTimeout(resolve, 300 * (attempt + 1)))
    }
  }
  throw lastError
}

export function formatAmerican(value) {
  if (value == null || value === '') return null
  const text = String(value).replaceAll('−', '-').replace(/^\+/, '')
  const number = Number(text)
  if (!Number.isFinite(number)) return String(value).replaceAll('−', '-')
  return number > 0 ? `+${number}` : String(number)
}

function norm(value) {
  return String(value ?? '')
    .toLowerCase()
    .replace(/#\d+\s+/g, '')
    .replace(/&/g, ' and ')
    .replace(/\bst\.?\b/g, 'state')
    .replace(/\bwestern\b/g, 'w')
    .replace(/\beastern\b/g, 'e')
    .replace(/\bcentral\b/g, 'c')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

export function teamMatches(bookSide, ourName) {
  const book = norm(bookSide)
  const ours = norm(ourName)
  if (!book || !ours) return false
  if (book === ours || book.endsWith(` ${ours}`)) return true
  if (!book.startsWith(`${ours} `)) return false
  const rest = book.slice(ours.length).trim()
  return rest !== 'state' && !rest.startsWith('state ')
}

export function loadGames(markdown, file) {
  const start = markdown.indexOf('## Predicted slate')
  if (start < 0) return []
  const rest = markdown.slice(start)
  const end = rest.indexOf('\n## ', 4)
  const section = end < 0 ? rest : rest.slice(0, end)
  const games = []
  for (const line of section.split('\n')) {
    if (!line.startsWith('| ') || line.includes('---') || line.includes('Predicted score')) continue
    const cells = line.split('|').slice(1, -1).map((cell) => cell.trim())
    if (cells.length < 6) continue
    const [time, game, score, total, models, sim] = cells
    const sides = game.split(' at ')
    if (sides.length !== 2) continue
    const [awayScore, homeScore] = score.split('–').map((part) => Number(part))
    games.push({
      file,
      time,
      game,
      away: sides[0],
      home: sides[1],
      awayScore: Number.isFinite(awayScore) ? awayScore : null,
      homeScore: Number.isFinite(homeScore) ? homeScore : null,
      total: Number(total),
      models,
      sim,
    })
  }
  return games
}

function etDate(iso) {
  if (!iso) return null
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(iso))
}

function slateDate(game) {
  return game.file.match(/(\d{4}-\d{2}-\d{2})/)?.[1] ?? null
}

export async function loadStoredSlates() {
  const games = []
  for (const file of SLATES) games.push(...loadGames(await readFile(file, 'utf8'), file))
  return games
}

function findGame(games, eventName, start) {
  if (!eventName) return null
  const parts = eventName.split(/\s+@\s+|\s+at\s+/i)
  if (parts.length !== 2) return null
  let hits = games.filter((game) => teamMatches(parts[0], game.away) && teamMatches(parts[1], game.home))
  if (start) {
    const day = etDate(start)
    hits = hits.filter((game) => slateDate(game) === day)
  }
  return hits.length === 1 ? hits[0] : null
}

function sideOf(game, teamText) {
  if (!game || !teamText) return null
  if (teamMatches(teamText, game.home)) return 'home'
  if (teamMatches(teamText, game.away)) return 'away'
  return null
}

function isListedTotal(marketName, marketType) {
  const name = String(marketName ?? '')
  const type = String(marketType ?? '')
  return /moneyline|spread|handicap|total/i.test(name) || /MONEY_LINE|TOTAL|HANDICAP|MATCH_/.test(type)
}

function isPlayerMarket(marketType, marketName) {
  const type = String(marketType ?? '')
  const name = String(marketName ?? '')
  if (isListedTotal(name, type) && !/player/i.test(name)) return false
  return /PLAYER|TOUCHDOWN_SCORER|SCORER|TO_SCORE|ANY_TIME/i.test(type)
    || /touchdown|anytime|to score|player|yards|reception|rebound|assist|\bpoints\b|shots|threes|triple double/i.test(name)
}

function isGameTotal(marketName, marketType) {
  const name = String(marketName ?? '')
  const type = String(marketType ?? '')
  if (/team total|both teams|alternate/i.test(name)) return false
  return type === 'TOTAL_POINTS_(OVER/UNDER)' || /^total( points)?$/i.test(name.trim())
}

function isTeamTotal(marketName) {
  const name = String(marketName ?? '')
  return /team total (points|goals)/i.test(name) && !/both teams/i.test(name)
}

function isMoneyline(marketName, marketType) {
  const name = String(marketName ?? '')
  const type = String(marketType ?? '')
  if (/1st|first period|first quarter|period|quarter/i.test(name)) return false
  return type === 'MONEY_LINE' || /^moneyline$/i.test(name.trim())
}

function teamFromMarket(marketName) {
  const match = String(marketName ?? '').match(/^(.+?):\s*Team Total/i)
  return match ? match[1] : null
}

function bookNumber(leg) {
  if (leg.line != null && leg.line !== '') {
    const number = Number(leg.line)
    if (Number.isFinite(number)) return number
  }
  const match = String(leg.selection ?? '').match(/(\d+(?:\.\d+)?)/)
  return match ? Number(match[1]) : null
}

function overUnder(leg) {
  const text = `${leg.selection ?? ''} ${leg.outcome ?? ''}`
  if (/\bover\b/i.test(text)) return 'over'
  if (/\bunder\b/i.test(text)) return 'under'
  return null
}

function modelVote(game, teamText) {
  const models = String(game.models ?? '')
  const unanimous = models.match(/^(.+), (\d+)[–-]0$/)
  const legSide = sideOf(game, teamText)
  if (unanimous) {
    const voteSide = sideOf(game, unanimous[1])
    if (!legSide || !voteSide) return { stance: 'even', weight: 0, label: 'side did not match' }
    if (legSide === voteSide) return { stance: 'with', weight: 2, label: `unanimous ${unanimous[1]}` }
    return { stance: 'against', weight: -2, label: `unanimous the other way, ${unanimous[1]}` }
  }
  const split = models.match(/^split, (\d+)[–-](\d+)(?: (.+))?$/)
  if (split && split[3]) {
    const voteSide = sideOf(game, split[3])
    if (!legSide || !voteSide) return { stance: 'even', weight: 0, label: 'side did not match' }
    if (legSide === voteSide) return { stance: 'with', weight: 1, label: `split leader ${split[3]}` }
    return { stance: 'against', weight: -1, label: `split, other side, leader ${split[3]}` }
  }
  if (split) return { stance: 'even', weight: 0, label: 'split even' }
  return { stance: 'even', weight: 0, label: 'vote missing' }
}

function numberStance(direction, ourNumber, bookLine) {
  if (!Number.isFinite(ourNumber) || !Number.isFinite(bookLine) || !direction) {
    return { stance: 'even', weight: 0, label: 'number missing' }
  }
  const gap = Math.round((ourNumber - bookLine) * 10) / 10
  const above = gap >= 1
  const below = gap <= -1
  const withNumber = direction === 'over' ? above : below
  const againstNumber = direction === 'over' ? below : above
  if (withNumber) return { stance: 'with', weight: 1, label: `venue-matched ${ourNumber} is ${direction} ${bookLine}` }
  if (againstNumber) return { stance: 'against', weight: -1, label: `venue-matched ${ourNumber} is not ${direction} ${bookLine}` }
  return { stance: 'even', weight: 0, label: `venue-matched ${ourNumber} is level with ${bookLine}` }
}

export function rateLeg(games, leg) {
  const line = bookNumber(leg)
  if (isPlayerMarket(leg.marketType, leg.market)) {
    const name = norm(leg.selection)
    return {
      status: 'unrated',
      kind: 'player',
      stance: null,
      weight: 0,
      label: 'Player projection missing.',
      signature: `player|${name}|${line ?? ''}`,
      game: null,
    }
  }
  const game = findGame(games, leg.event, leg.start)
  if (!game) {
    return {
      status: 'unrated',
      kind: 'missing-game',
      stance: null,
      weight: 0,
      label: 'Game is not on a retrieved slate.',
      signature: null,
      game: null,
    }
  }
  if (isMoneyline(leg.market, leg.marketType)) {
    const vote = modelVote(game, leg.selection)
    const side = sideOf(game, leg.selection)
    return {
      status: side ? 'rated' : 'unrated',
      kind: 'moneyline',
      stance: side ? vote.stance : null,
      weight: side ? vote.weight : 0,
      label: `${game.game}. ${vote.label}. Models: ${game.models}. Sim: ${game.sim}.`,
      signature: side ? `${norm(game.game)}|ml|${side}` : null,
      game: game.game,
    }
  }
  if (isGameTotal(leg.market, leg.marketType)) {
    const direction = overUnder(leg)
    const vote = numberStance(direction, game.total, line)
    return {
      status: direction && line != null ? 'rated' : 'unrated',
      kind: 'total',
      stance: direction && line != null ? vote.stance : null,
      weight: direction && line != null ? vote.weight : 0,
      label: `${game.game}. ${vote.label}.`,
      signature: direction && line != null ? `${norm(game.game)}|total|${direction}|${line}` : null,
      game: game.game,
    }
  }
  if (isTeamTotal(leg.market)) {
    const team = teamFromMarket(leg.market) || leg.selection
    const side = sideOf(game, team)
    const score = side === 'home' ? game.homeScore : side === 'away' ? game.awayScore : null
    const direction = overUnder(leg)
    const vote = numberStance(direction, score, line)
    return {
      status: side && direction && line != null ? 'rated' : 'unrated',
      kind: 'team-total',
      stance: side && direction && line != null ? vote.stance : null,
      weight: side && direction && line != null ? vote.weight : 0,
      label: `${game.game}. ${vote.label}.`,
      signature: side && direction && line != null ? `${norm(game.game)}|team|${side}|${direction}|${line}` : null,
      game: game.game,
    }
  }
  return {
    status: 'unrated',
    kind: 'other',
    stance: null,
    weight: 0,
    label: `${game.game} is on a retrieved slate. No projection is attached to this market.`,
    signature: `${norm(game.game)}|other|${norm(leg.market)}|${norm(leg.selection)}|${line ?? ''}`,
    game: game.game,
  }
}

export function compareLeg(games, leg) {
  if (isPlayerMarket(leg.marketType, leg.market)) {
    return 'Player projection missing.'
  }
  const game = findGame(games, leg.event, leg.start)
  if (!game) return 'Game is not on a retrieved slate.'
  if (isMoneyline(leg.market, leg.marketType)) {
    const side = sideOf(game, leg.selection)
    if (!side) return `${game.game} is on ${game.file}. The moneyline side did not match a team on that card.`
    return `${game.game}. Models: ${game.models}. Sim: ${game.sim}. Venue-matched score ${game.awayScore}–${game.homeScore}.`
  }
  if (isGameTotal(leg.market, leg.marketType)) {
    return `${game.game}. Venue-matched total ${game.total}. Book number ${leg.line ?? 'missing'}.`
  }
  if (isTeamTotal(leg.market)) {
    const team = teamFromMarket(leg.market) || leg.selection
    const side = sideOf(game, team)
    const score = side === 'home' ? game.homeScore : side === 'away' ? game.awayScore : null
    if (score == null) {
      return `${game.game} is on ${game.file}. Team total side did not match. Venue-matched score ${game.awayScore}–${game.homeScore}.`
    }
    return `${game.game}. Venue-matched ${side} score ${score}. Book team total ${leg.line ?? 'missing'}.`
  }
  return `${game.game} is on a retrieved slate. No projection is attached to this market.`
}

function lookupMarket(attachments, selection) {
  const markets = attachments?.markets ?? {}
  return markets[selection.marketId]
    ?? Object.values(markets).find((market) => market.marketId === selection.marketId)
    ?? null
}

function lookupEvent(attachments, eventId) {
  const events = attachments?.events ?? {}
  return events[eventId]
    ?? events[String(eventId)]
    ?? Object.values(events).find((event) => String(event.eventId) === String(eventId))
    ?? null
}

function readFanDuelOpportunity(opportunity, attachments, league, source) {
  const legs = (opportunity.selections ?? []).map((selection) => {
    const market = lookupMarket(attachments, selection)
    const runner = market?.runners?.find((item) => item.selectionId === selection.selectionId)
    const event = lookupEvent(attachments, selection.eventId || market?.eventId)
    const handicap = runner?.handicap
    const line = handicap == null || Number(handicap) === 0 ? null : handicap
    return {
      event: event?.name ?? null,
      market: market?.marketName ?? null,
      marketType: market?.marketType ?? null,
      selection: runner?.runnerName ?? selection.preferredRunnerName ?? null,
      line,
      start: event?.openDate ?? market?.marketTime ?? null,
    }
  })
  const eventNames = [...new Set(legs.map((leg) => leg.event).filter(Boolean))]
  return {
    book: 'FanDuel',
    id: opportunity.bettingOpportunityId,
    league,
    type: opportunity.type ?? null,
    source,
    event: eventNames.length === 1 ? eventNames[0] : null,
    events: eventNames,
    narrative: opportunity.narrative ?? null,
    american: formatAmerican(opportunity.americanOdds),
    totalBets: opportunity.totalBets ?? null,
    legs,
  }
}

function readDraftKingsPack(pack, events, league) {
  const eventById = new Map(events.map((event) => [String(event.id), event]))
  const legs = (pack.selections ?? []).map((selection) => {
    const event = eventById.get(String(selection.eventId))
    return {
      event: event?.eventName ?? null,
      market: selection.marketName ?? null,
      marketType: null,
      selection: selection.selectionBetSlipLine ?? null,
      line: selection.points ?? null,
      outcome: selection.outcomeType ?? null,
      start: event?.startDate ?? null,
    }
  })
  const eventNames = [...new Set(legs.map((leg) => leg.event).filter(Boolean))]
  return {
    book: 'DraftKings',
    id: pack.id,
    league,
    type: pack.type ?? null,
    template: pack.templateType ?? null,
    event: eventNames.length === 1 ? eventNames[0] : null,
    events: eventNames,
    american: formatAmerican(pack.displayOdds?.american ?? pack.americanOdds),
    suspended: Boolean(pack.isSuspended),
    legs,
  }
}

function legText(leg) {
  if (!leg.market && !leg.selection) return 'leg not attached'
  const market = leg.market ?? 'market missing'
  const selection = leg.selection ?? 'selection missing'
  const line = leg.line == null || leg.line === '' ? '' : String(leg.line)
  const shown = line && !selection.includes(line) ? `${selection} ${line}` : selection
  return `${shown} (${market})`
}

function formatStart(iso) {
  if (!iso) return null
  return new Date(iso).toLocaleString('en-US', {
    timeZone: 'America/New_York',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function parlayLine(parlay) {
  const where = parlay.event ?? (parlay.events.length ? parlay.events.join('; ') : 'event missing')
  const kind = [parlay.type, parlay.template, parlay.source].filter(Boolean).join(' ')
  const narrative = parlay.narrative ? ` ${parlay.narrative}` : ''
  return `- **${parlay.american ?? 'price missing'}** ${kind}. ${where}.${narrative} ${parlay.legs.map(legText).join(' + ')}`
}

function sameGameNotes(parlay, games) {
  const when = formatStart(parlay.legs.find((leg) => leg.start)?.start)
  const lines = [`- **${parlay.american ?? 'price missing'}** ${parlay.event ?? 'event missing'}${when ? `, ${when} ET` : ''}`]
  if (parlay.narrative) lines.push(`  - ${parlay.narrative}`)
  for (const leg of parlay.legs) {
    lines.push(`  - ${legText(leg)}. ${compareLeg(games, leg)}`)
  }
  return lines.join('\n')
}

function storeFanDuel(byId, opportunity, attachments, league, source) {
  const row = readFanDuelOpportunity(opportunity, attachments, league, source)
  if (!row.id) return false
  const existing = byId.get(row.id)
  if (existing) {
    const resolved = (item) => item.legs.filter((leg) => leg.market && leg.selection).length
    if (resolved(row) > resolved(existing)) {
      row.source = existing.source.includes(source) ? existing.source : `${existing.source}+${source}`
      byId.set(row.id, row)
    } else if (!existing.source.includes(source)) {
      existing.source = `${existing.source}+${source}`
    }
    return false
  }
  byId.set(row.id, row)
  return true
}

export async function fetchFanDuel() {
  const byId = new Map()
  for (const [league, eventTypeId, competitionIds] of FD_BOARDS) {
    let leagueRows = 0
    for (const source of ['ORGANIC', 'MANUAL']) {
      for (const type of [null, 'SGP']) {
        const params = new URLSearchParams({
          cardVersion: '1',
          _ak: FD_KEY,
          eventTypeId,
          competitionIds,
          source,
        })
        if (type) params.set('type', type)
        const url = `${FD_ALL}?${params}`
        process.stderr.write(`fanduel ${league} ${source} ${type ?? 'all'}\n`)
        const payload = await getJson(url, FD_HEADERS)
        const rows = payload.popularBettingOpportunities ?? []
        if (type === 'SGP' && source === 'ORGANIC' && rows.length === 0 && league !== 'NCAAF') {
          throw new Error(`FanDuel returned no same-game parlays for ${league}`)
        }
        for (const opportunity of rows) {
          if (storeFanDuel(byId, opportunity, payload.attachments, league, source)) leagueRows += 1
        }
      }
    }
    const nextUrl = `https://boapi.sportsbook.fanduel.com/betting-opportunities/next-to-start?cardVersion=1&_ak=${FD_KEY}&eventTypeId=${eventTypeId}&competitionIds=${competitionIds}`
    process.stderr.write(`fanduel ${league} next-to-start\n`)
    const nextPayload = await getJson(nextUrl, FD_HEADERS)
    for (const opportunity of nextPayload.popularBettingOpportunities ?? []) {
      if (storeFanDuel(byId, opportunity, nextPayload.attachments, league, 'next')) leagueRows += 1
    }
    if (leagueRows === 0) throw new Error(`FanDuel returned no premade parlays for ${league}`)
  }

  const jobs = []
  for (const [page, league] of [['nfl', 'NFL'], ['ncaaf', 'NCAAF'], ['nba', 'NBA'], ['nhl', 'NHL']]) {
    const payload = await getJson(`${'https://sbapi.oh.sportsbook.fanduel.com/api/content-managed-page'}?page=CUSTOM&customPageId=${page}&_ak=${FD_KEY}`, FD_HEADERS)
    for (const event of Object.values(payload.attachments?.events ?? {})) {
      if (!String(event.name ?? '').includes(' @ ')) continue
      jobs.push({ id: event.eventId, league })
    }
  }
  process.stderr.write(`fanduel event cards ${jobs.length}\n`)
  let cursor = 0
  async function eventWorker() {
    while (cursor < jobs.length) {
      const job = jobs[cursor]
      cursor += 1
      const payload = await getJson(`https://boapi.sportsbook.fanduel.com/popular/events/${job.id}?cardVersion=1&_ak=${FD_KEY}`, FD_HEADERS)
      for (const opportunity of payload.popularBettingOpportunities ?? []) {
        storeFanDuel(byId, opportunity, payload.attachments, job.league, 'event')
      }
    }
  }
  await Promise.all(Array.from({ length: 8 }, () => eventWorker()))
  const home = await getJson(`https://boapi.sportsbook.fanduel.com/popular/home?cardVersion=1&_ak=${FD_KEY}`, FD_HEADERS)
  for (const opportunity of home.popularBettingOpportunities ?? []) {
    storeFanDuel(byId, opportunity, home.attachments, 'Home', 'home')
  }
  if (byId.size === 0) throw new Error('FanDuel returned no premade parlays')
  return [...byId.values()]
}

async function fetchDraftKings() {
  const { collectDraftKings } = await import('./dk-prebuilt.mjs')
  const collected = await collectDraftKings()
  if (collected.rows.length === 0) throw new Error('DraftKings returned no premade parlays')
  return collected
}

function countBy(rows, field) {
  const counts = new Map()
  for (const row of rows) {
    const key = `${row.league} ${row[field] ?? ''}`.trim()
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }
  return [...counts.entries()].sort((a, b) => a[0].localeCompare(b[0]))
}

function checkMatching() {
  if (!teamMatches('Georgia Bulldogs', '#3 Georgia')) throw new Error('Georgia Bulldogs should match Georgia')
  if (teamMatches('Ohio State', 'Ohio')) throw new Error('Ohio State should not match Ohio')
  if (!teamMatches('PIT Steelers', 'Steelers')) throw new Error('Steelers nickname should match')
  if (!teamMatches('Western Michigan', 'W Michigan')) throw new Error('Western Michigan should match W Michigan')
  if (isPlayerMarket(null, 'PIT Steelers: Team Total Points')) throw new Error('team points are not a player prop')
  if (isTeamTotal('PIT Steelers: Team Total Touchdowns')) throw new Error('team touchdowns are not a score total')
  if (!isTeamTotal('PIT Steelers: Team Total Points')) throw new Error('team points should compare to the score')
}

async function main() {
  checkMatching()
  const retrievedAt = new Date().toISOString()
  const retrievedET = new Date(retrievedAt).toLocaleString('en-US', {
    timeZone: 'America/New_York',
    dateStyle: 'medium',
    timeStyle: 'short',
  })
  const [fanDuel, collected] = await Promise.all([fetchFanDuel(), fetchDraftKings()])
  const draftKings = collected.rows
  if (fanDuel.length === 0 || draftKings.length === 0) {
    throw new Error('FanDuel and DraftKings both have to return parlays')
  }
  if (draftKings.filter((row) => row.league === 'NFL').length <= 49) {
    throw new Error('DraftKings NFL stayed on the Under +200 tab')
  }
  const games = []
  for (const file of SLATES) {
    const markdown = await readFile(file, 'utf8')
    games.push(...loadGames(markdown, file))
  }
  for (const row of fanDuel) {
    for (const leg of row.legs) leg.slate = compareLeg(games, leg)
  }

  const snapshot = { retrievedAt, fanDuel, draftKings, leagueStats: collected.leagueStats }
  await writeFile('docs/projections/premade-parlays.json', JSON.stringify(snapshot))

  const sameGame = fanDuel.filter((row) => row.type === 'SGP' && row.event)
  const other = fanDuel.filter((row) => !(row.type === 'SGP' && row.event))
  const lines = [
    '# Premade parlays',
    '',
    `Retrieved ${retrievedAt} UTC (${retrievedET} ET). Both books were read on this pass. These are the books' combined prices. They are not a model and they are not a priced edge.`,
    '',
    'A premade parlay is a fixed set of legs with one combined American price.',
    '',
    '## Access',
    '',
    'FanDuel Ohio. Header `x-sportsbook-region: OH`. The league card is `https://boapi.sportsbook.fanduel.com/betting-opportunities/all`. The event card is `https://boapi.sportsbook.fanduel.com/popular/events/{eventId}`. The league card returns at most 50 rows, so each Ohio NFL, college, NBA, and NHL game is also read.',
    '',
    'DraftKings Ohio. `https://sportsbook-nash.draftkings.com/sites/US-OH-SB/api/sportscontent/prepacks/sportsdata/v2/prepacks`. A league request with no odds range is the Under +200 tab. This pass reads the Away, Home, and Mixed tabs on every league the Ohio nav tags PrePack.',
    '',
    '## Counts',
    '',
    '| Book | Board | Rows |',
    '| --- | --- | --- |',
    ...countBy(fanDuel, 'type').map(([key, count]) => `| FanDuel | ${key} | ${count} |`),
    ...collected.leagueStats.map((stat) => `| DraftKings | ${stat.name} | ${stat.parlays} |`),
    '',
    `FanDuel rows: ${fanDuel.length}. DraftKings rows: ${draftKings.length}.`,
    '',
    '## How to read a leg',
    '',
    'The combined price belongs to the whole parlay. A player leg has no projection, so that leg stays missing. A moneyline, game total, or team total is set next to the venue-matched score only when that game is already on a retrieved slate from October 30 through November 5. The four models are not refit to the parlay. A point gap is not a priced edge. A sim percentage is the share of the draws.',
    '',
    '## FanDuel same-game parlays',
    '',
    ...sameGame.flatMap((parlay) => [sameGameNotes(parlay, games), '']),
    '## FanDuel other priced parlays',
    '',
    ...other.map(parlayLine),
    '',
    'DraftKings cards are in the counts above and in the spreadsheet. The markdown does not repeat every DraftKings leg.',
    '',
    'The rows are in `docs/projections/premade-parlays.json`, `docs/projections/sideline-both-books-2026-10-30.xlsx`, and `docs/projections/sideline-both-books-2026-10-30.csv`.',
    '',
  ]
  await writeFile('docs/projections/PREMADE-PARLAYS.md', `${lines.join('\n')}\n`)
  process.stdout.write(`fanduel ${fanDuel.length}\ndraftkings ${draftKings.length}\n`)
}

const entry = process.argv[1]
if (entry && import.meta.url === pathToFileURL(entry).href) {
  main().catch((error) => {
    console.error(error)
    process.exit(1)
  })
}
