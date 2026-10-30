/**
 * Latest prices from FanDuel Ohio and Novig's public catalog.
 * DraftKings still comes from the ESPN quote. Direct DraftKings denied this run.
 *
 * FanDuel Ohio is the working public board for nfl, ncaaf, nba, and nhl.
 * Each spread has two runners. Keep the away handicap and the away price
 * with the home handicap and the home price. One side is only half the number.
 */

const FANDUEL = 'https://sbapi.oh.sportsbook.fanduel.com/api/content-managed-page'
const FANDUEL_KEY = 'FhMFpcPWXMeyZxOx'
const NOVIG = 'https://api.novig.com/v3/public/catalog'

const FANDUEL_PAGES = {
  nfl: 'nfl',
  ncaaf: 'ncaaf',
  nba: 'nba',
  nhl: 'nhl',
}

const NOVIG_LEAGUES = {
  nfl: 'NFL',
  ncaaf: 'NCAAF',
  nba: 'NBA',
  nhl: 'NHL',
  epl: 'EPL',
  mls: 'MLS',
}

const PROP_TYPES = {
  nfl: ['PASSING_YARDS', 'RUSHING_YARDS', 'RECEIVING_YARDS'],
  ncaaf: ['PASSING_YARDS', 'RUSHING_YARDS', 'RECEIVING_YARDS'],
  nba: ['POINTS', 'REBOUNDS', 'ASSISTS'],
  nhl: ['GOALS', 'SAVES'],
  epl: [],
  mls: [],
}

export function normName(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function namesMatch(left, right) {
  const a = normName(left)
  const b = normName(right)
  if (!a || !b || a.length < 3 || b.length < 3) return false
  return a.includes(b) || b.includes(a)
}

export function americanFromProb(probability) {
  const p = Number(probability)
  if (!Number.isFinite(p) || p <= 0 || p >= 1) return null
  if (p >= 0.5) return Math.round((-100 * p) / (1 - p))
  return Math.round((100 * (1 - p)) / p)
}

export function formatAmerican(odds) {
  const n = Number(odds)
  if (!Number.isFinite(n) || n === 0) return null
  return n > 0 ? `+${n}` : String(n)
}

async function getJson(url) {
  const response = await fetch(url, { headers: { Accept: 'application/json', 'User-Agent': 'SidelineProjection/0.1' } })
  if (!response.ok) throw new Error(`${response.status} ${url}`)
  const text = await response.text()
  return text.trim() ? JSON.parse(text) : {}
}

async function novigPages(path, query) {
  const items = []
  let after = null
  for (let page = 0; page < 12; page += 1) {
    const url = new URL(`${NOVIG}${path}`)
    for (const [key, value] of new URLSearchParams(query)) url.searchParams.set(key, value)
    url.searchParams.set('limit', '500')
    if (after) url.searchParams.set('after', after)
    let data = null
    for (let attempt = 0; attempt < 4; attempt += 1) {
      try {
        data = await getJson(url)
        break
      } catch {
        await new Promise((resolve) => setTimeout(resolve, 400 * (attempt + 1)))
      }
    }
    if (!data) break
    items.push(...(data.items ?? []))
    after = data.next
    if (!after) break
  }
  return items
}

function pairKey(away, home) {
  return `${normName(away)}|${normName(home)}`
}

function fanduelQuotes(payload, retrievedAt) {
  const events = payload?.attachments?.events ?? {}
  const markets = Object.values(payload?.attachments?.markets ?? {})
  const byEvent = new Map()
  for (const market of markets) {
    if (market.marketStatus !== 'OPEN') continue
    const list = byEvent.get(String(market.eventId)) ?? []
    list.push(market)
    byEvent.set(String(market.eventId), list)
  }
  const index = new Map()
  for (const [eventId, eventMarkets] of byEvent) {
    const event = events[eventId]
    const name = event?.name || ''
    const parts = name.split(' @ ')
    if (parts.length !== 2) continue
    const price = (runner) => formatAmerican(runner?.winRunnerOdds?.americanDisplayOdds?.americanOdds)
    const spread = eventMarkets.find((market) => market.marketType === 'MATCH_HANDICAP_(2-WAY)')
    const total = eventMarkets.find((market) => market.marketType === 'TOTAL_POINTS_(OVER/UNDER)')
    const money = eventMarkets.find((market) => market.marketType === 'MONEY_LINE')
    if (!spread && !total && !money) continue
    const homeRunner = spread?.runners?.find((runner) => namesMatch(runner.runnerName, parts[1]))
    const awayRunner = spread?.runners?.find((runner) => namesMatch(runner.runnerName, parts[0]))
    const over = total?.runners?.find((runner) => /over/i.test(runner.runnerName))
    const under = total?.runners?.find((runner) => /under/i.test(runner.runnerName))
    const awayMl = money?.runners?.find((runner) => namesMatch(runner.runnerName, parts[0]))
    const homeMl = money?.runners?.find((runner) => namesMatch(runner.runnerName, parts[1]))
    index.set(pairKey(parts[0], parts[1]), {
      book: 'FanDuel',
      jurisdiction: 'Ohio',
      retrievedAt,
      away: parts[0],
      home: parts[1],
      homeSpread: homeRunner ? Number(homeRunner.handicap) : null,
      homeSpreadPrice: price(homeRunner),
      awaySpread: awayRunner ? Number(awayRunner.handicap) : null,
      awaySpreadPrice: price(awayRunner),
      total: over ? Number(over.handicap) : null,
      overPrice: price(over),
      underPrice: price(under),
      awayMoneyline: price(awayMl),
      homeMoneyline: price(homeMl),
      open: null,
    })
  }
  return index
}

function balanced(market) {
  const bids = (market.outcomes ?? [])
    .map((outcome) => Number(outcome.bid?.price))
    .filter((price) => price > 0 && price < 1)
  if (bids.length < 2) return null
  return Math.abs(bids[0] - 0.5) + Math.abs(bids[1] - 0.5)
}

function pickMain(markets) {
  let best = null
  let bestScore = Infinity
  for (const market of markets) {
    const score = balanced(market)
    if (score == null || score >= bestScore) continue
    best = market
    bestScore = score
  }
  // Reject one-sided alternate numbers. 0.35 is about a -140/+140 market.
  if (bestScore > 0.35) return null
  return best
}

function outcomePrice(market, pattern) {
  const outcome = (market?.outcomes ?? []).find((item) => pattern.test(item.name))
  return formatAmerican(americanFromProb(outcome?.bid?.price))
}

function novigQuotes(events, markets, retrievedAt) {
  const eventById = new Map(events.map((event) => [event.eventId, event]))
  const grouped = new Map()
  for (const market of markets) {
    const key = `${market.eventId}|${market.marketType}`
    const list = grouped.get(key) ?? []
    list.push(market)
    grouped.set(key, list)
  }
  const index = new Map()
  for (const event of events) {
    const description = event.description || ''
    const parts = description.split(' @ ')
    if (parts.length !== 2) continue
    const spread = pickMain(grouped.get(`${event.eventId}|SPREAD`) ?? [])
    const total = pickMain(grouped.get(`${event.eventId}|TOTAL`) ?? [])
    const money = (grouped.get(`${event.eventId}|MONEY`) ?? [])[0] ?? null
    const teamTotals = grouped.get(`${event.eventId}|TEAM_TOTAL`) ?? []
    const favored = spread?.outcomes?.find((outcome) => /-\d/.test(outcome.name))
    const favoredTeam = favored ? favored.name.replace(/\s*[+-]\d.*$/, '') : ''
    const favoredIsHome = favoredTeam ? namesMatch(favoredTeam, parts[1]) : false
    const magnitude = Math.abs(Number(spread?.strike))
    const homeSpread = Number.isFinite(magnitude) && magnitude > 0 ? (favoredIsHome ? -magnitude : magnitude) : null
    const teamTotal = (name) => {
      const mine = teamTotals.filter((market) => namesMatch(market.description, name))
      const main = pickMain(mine)
      return main
        ? { line: Number(main.strike), over: outcomePrice(main, /^over/i), under: outcomePrice(main, /^under/i) }
        : null
    }
    index.set(pairKey(parts[0], parts[1]), {
      book: 'Novig',
      retrievedAt,
      eventId: event.eventId,
      away: parts[0],
      home: parts[1],
      homeSpread: Number.isFinite(homeSpread) ? homeSpread : null,
      homeSpreadPrice: favoredIsHome ? outcomePrice(spread, /-\d/) : outcomePrice(spread, /\+\d/),
      awaySpreadPrice: favoredIsHome ? outcomePrice(spread, /\+\d/) : outcomePrice(spread, /-\d/),
      total: Number(total?.strike),
      overPrice: outcomePrice(total, /^over/i),
      underPrice: outcomePrice(total, /^under/i),
      awayMoneyline: money?.outcomes?.find((outcome) => namesMatch(outcome.name, parts[0]))
        ? formatAmerican(americanFromProb(money.outcomes.find((outcome) => namesMatch(outcome.name, parts[0]))?.bid?.price))
        : null,
      homeMoneyline: money?.outcomes?.find((outcome) => namesMatch(outcome.name, parts[1]))
        ? formatAmerican(americanFromProb(money.outcomes.find((outcome) => namesMatch(outcome.name, parts[1]))?.bid?.price))
        : null,
      awayTeamTotal: teamTotal(parts[0]),
      homeTeamTotal: teamTotal(parts[1]),
      note: 'Novig American prices are converted from the public bid probability. Opening prices are not in this catalog.',
    })
  }
  return { index, eventById, markets }
}

function findQuote(index, awayNames, homeNames) {
  if (!index) return null
  for (const [key, quote] of index) {
    const [away, home] = key.split('|')
    const awayOk = awayNames.some((name) => namesMatch(name, away))
    const homeOk = homeNames.some((name) => namesMatch(name, home))
    if (awayOk && homeOk) return quote
  }
  return null
}

export async function loadBooks(sportKeys, retrievedAt, options = {}) {
  const books = {}
  await Promise.all(sportKeys.map(async (sport) => {
    const entry = { fanduel: new Map(), novig: new Map(), novigMarkets: [], retrievedAt, errors: [] }
    const page = FANDUEL_PAGES[sport]
    if (page) {
      try {
        const payload = await getJson(`${FANDUEL}?page=CUSTOM&customPageId=${page}&_ak=${FANDUEL_KEY}`)
        entry.fanduel = fanduelQuotes(payload, retrievedAt)
      } catch (error) {
        entry.errors.push(`FanDuel ${sport}: ${error instanceof Error ? error.message : error}`)
      }
    } else {
      entry.errors.push(`FanDuel ${sport}: no public Ohio board for this league`)
    }
    books[sport] = entry
  }))
  if (options.novig === false) return { retrievedAt, books, match(sport, awayNames, homeNames) {
    const entry = books[sport]
    if (!entry) return { fanduel: null, novig: null, props: [] }
    return { fanduel: findQuote(entry.fanduel, awayNames, homeNames), novig: null, props: [] }
  } }
  for (const sport of sportKeys) {
    const entry = books[sport]
    const league = NOVIG_LEAGUES[sport]
    if (!league) continue
    const events = await novigPages('/events', `league=${encodeURIComponent(league)}`)
    if (events.length === 0) entry.errors.push(`Novig ${sport}: event catalog came back empty`)
    const types = ['SPREAD', 'MONEY', 'TOTAL', 'TEAM_TOTAL', ...(PROP_TYPES[sport] ?? [])]
    const markets = []
    for (const type of types) {
      markets.push(...await novigPages('/markets', `league=${encodeURIComponent(league)}&marketType=${type}`))
    }
    const built = novigQuotes(events, markets.filter((market) => ['SPREAD', 'MONEY', 'TOTAL', 'TEAM_TOTAL'].includes(market.marketType)), retrievedAt)
    entry.novig = built.index
    entry.novigMarkets = markets
    entry.novigEvents = built.eventById
    if (events.length > 0 && entry.novig.size === 0) {
      entry.errors.push(`Novig ${sport}: ${events.length} events did not match an away @ home name`)
    }
  }
  return {
    retrievedAt,
    books,
    match(sport, awayNames, homeNames) {
      const entry = books[sport]
      if (!entry) return { fanduel: null, novig: null, props: [] }
      const fanduel = findQuote(entry.fanduel, awayNames, homeNames)
      const novig = findQuote(entry.novig, awayNames, homeNames)
      const props = novig ? propsForEvent(entry.novigMarkets, novig.eventId) : []
      return { fanduel, novig, props }
    },
  }
}

function propsForEvent(markets, eventId) {
  const mine = markets.filter((market) => market.eventId === eventId && !['SPREAD', 'MONEY', 'TOTAL', 'TEAM_TOTAL'].includes(market.marketType))
  const groups = new Map()
  for (const market of mine) {
    const player = market.description?.replace(/\s+-?\d+(\.\d+)?\s+\S+$/, '') || market.marketType
    const key = `${market.marketType}|${player}`
    const list = groups.get(key) ?? []
    list.push(market)
    groups.set(key, list)
  }
  const props = []
  for (const [key, list] of groups) {
    const main = pickMain(list)
    if (!main) continue
    const [type, player] = key.split('|')
    props.push({
      player,
      type,
      line: main.strike,
      over: outcomePrice(main, /^over/i),
      under: outcomePrice(main, /^under/i),
    })
  }
  props.sort((a, b) => a.type.localeCompare(b.type) || a.player.localeCompare(b.player))
  return props
}
