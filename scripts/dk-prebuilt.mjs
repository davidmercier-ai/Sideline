/**
 * DraftKings Ohio prebuilt parlays, including the price tabs past the default.
 *
 * The league widget without an odds range returns the Under +200 tab. Each
 * event also has Away, Home, and Mixed tabs. This walks every league the Ohio
 * nav tags PrePack, then those tabs. A short tab is split by the odds bands
 * the same response lists.
 *
 * Run: node scripts/dk-prebuilt.mjs
 */

import { writeFile } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'
import { compareLeg, formatAmerican, loadStoredSlates } from './premade-parlays.mjs'

const OH = 'https://sportsbook-nash.draftkings.com/sites/US-OH-SB/api/sportscontent'
const PREPACKS = `${OH}/prepacks/sportsdata/v2/prepacks`
const NAV = `${OH}/navigation/dkusoh/v2/nav`
const OR_PREPACKS = 'https://sportsbook-nash.draftkings.com/sites/US-OR-SB/api/sportscontent/prepacks/sportsdata/v2/prepacks'

const HEADERS = {
  Accept: 'application/json',
  'User-Agent': 'SidelineProjection/0.1',
  Origin: 'https://sportsbook.draftkings.com',
  Referer: 'https://sportsbook.draftkings.com/',
}

async function getJson(url) {
  let lastError
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const response = await fetch(url, { headers: HEADERS })
      if (response.status === 400 || response.status === 404) return null
      if (!response.ok) throw new Error(`${response.status} ${url}`)
      const text = await response.text()
      return text.trim() ? JSON.parse(text) : null
    } catch (error) {
      lastError = error
      await new Promise((resolve) => setTimeout(resolve, 300 * (attempt + 1)))
    }
  }
  throw lastError
}

function query(params) {
  const search = new URLSearchParams({ includeFilters: 'true', locale: 'en-us' })
  for (const [key, value] of Object.entries(params)) {
    if (value != null && value !== '') search.set(key, String(value))
  }
  return search
}

async function fetchPacks(params) {
  const payload = await getJson(`${PREPACKS}?${query(params)}`)
  return {
    packs: payload?.data?.prePacks ?? [],
    filters: payload?.data?.filters ?? [],
    events: payload?.data?.events ?? [],
  }
}

function oddsFilters(filters) {
  return filters.filter((filter) => (filter.minAmericanOdds != null || filter.maxAmericanOdds != null) && filter.count > 0)
}

function roleFilters(filters) {
  return filters.filter((filter) => filter.venueRole && filter.count > 0)
}

function expectedCount(filters) {
  const odds = oddsFilters(filters).reduce((sum, filter) => sum + filter.count, 0)
  if (odds > 0) return odds
  return roleFilters(filters).reduce((sum, filter) => sum + filter.count, 0)
}

async function pool(items, limit, worker) {
  const results = new Array(items.length)
  let next = 0
  async function run() {
    while (next < items.length) {
      const index = next
      next += 1
      results[index] = await worker(items[index], index)
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, () => run()))
  return results
}

function addPacks(store, packs) {
  for (const pack of packs) {
    if (pack?.id) store.set(pack.id, pack)
  }
}

async function packsForEvent(eventId) {
  const first = await fetchPacks({ eventId })
  const store = new Map()
  addPacks(store, first.packs)
  const filters = first.filters
  const roles = roleFilters(filters)
  for (const role of roles) {
    const have = [...store.values()].filter((pack) => pack.venueRole === role.venueRole).length
    if (have >= role.count) continue
    const rolePacks = await fetchPacks({ eventId, venueRole: role.venueRole })
    addPacks(store, rolePacks.packs)
    const after = [...store.values()].filter((pack) => pack.venueRole === role.venueRole).length
    if (after >= role.count) continue
    for (const band of oddsFilters(filters)) {
      const bandPacks = await fetchPacks({
        eventId,
        venueRole: role.venueRole,
        minAmericanOdds: band.minAmericanOdds,
        maxAmericanOdds: band.maxAmericanOdds,
      })
      addPacks(store, bandPacks.packs)
    }
  }
  if (store.size < expectedCount(filters) && roles.length === 0) {
    for (const band of oddsFilters(filters)) {
      const bandPacks = await fetchPacks({
        eventId,
        minAmericanOdds: band.minAmericanOdds,
        maxAmericanOdds: band.maxAmericanOdds,
      })
      addPacks(store, bandPacks.packs)
    }
  }
  const liveFilters = filters.filter((filter) => filter.inGameCount > 0)
  if (liveFilters.length > 0) {
    for (const role of roles) {
      const live = await fetchPacks({ eventId, venueRole: role.venueRole, inGameState: 'live' })
      addPacks(store, live.packs)
    }
  }
  return {
    packs: [...store.values()],
    filters,
    events: first.events,
    expected: expectedCount(filters),
  }
}

function readPack(pack, events, league) {
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
    league: league.name,
    leagueId: league.id,
    type: pack.type ?? null,
    template: pack.templateType ?? null,
    venueRole: pack.venueRole ?? null,
    event: eventNames.length === 1 ? eventNames[0] : null,
    events: eventNames,
    american: formatAmerican(pack.displayOdds?.american ?? pack.americanOdds),
    americanNumber: Number(pack.americanOdds),
    suspended: Boolean(pack.isSuspended),
    live: Boolean(pack.isLive),
    legs,
  }
}

function bandLabel(price) {
  if (!Number.isFinite(price)) return 'price missing'
  if (price < 200) return 'Under +200'
  if (price < 1000) return '+200 to +1000'
  if (price < 2500) return '+1000 to +2500'
  if (price < 5000) return '+2500 to +5000'
  if (price < 10000) return '+5000 to +10000'
  return 'Over +10000'
}

export async function collectDraftKings() {
  const retrievedAt = new Date().toISOString()
  const retrievedET = new Date(retrievedAt).toLocaleString('en-US', {
    timeZone: 'America/New_York',
    dateStyle: 'medium',
    timeStyle: 'short',
  })
  const nav = await getJson(`${NAV}/sports`)
  const leagues = (nav?.leagues ?? []).filter((league) => (league.tags ?? []).some((tag) => tag === 'PrePack' || tag === 'LivePrePack'))
  if (leagues.length === 0) throw new Error('DraftKings nav did not tag any PrePack league')

  const games = await loadStoredSlates()
  const rows = []
  const gaps = []
  const leagueStats = []

  for (const league of leagues) {
    const leagueNav = await getJson(`${NAV}/leagues/${league.id}`)
    const events = leagueNav?.events ?? []
    process.stderr.write(`${league.name} events ${events.length}\n`)
    const pulled = await pool(events, 8, (event) => packsForEvent(event.id))
    const seen = new Map()
    let expected = 0
    let eventGaps = 0
    for (let index = 0; index < events.length; index += 1) {
      const result = pulled[index]
      expected += result.expected
      if (result.packs.length < result.expected) {
        eventGaps += 1
        gaps.push(`${league.name} ${events[index].name}: received ${result.packs.length}, filters listed ${result.expected}`)
      }
      const eventMap = new Map(result.events.map((event) => [String(event.id), event]))
      const navEvent = events[index]
      if (!eventMap.has(String(navEvent.id))) {
        eventMap.set(String(navEvent.id), {
          id: navEvent.id,
          eventName: navEvent.name,
          startDate: navEvent.startDate ?? navEvent.startEventDate ?? null,
        })
      }
      for (const pack of result.packs) {
        if (seen.has(pack.id)) continue
        const row = readPack(pack, [...eventMap.values()], league)
        for (const leg of row.legs) leg.slate = compareLeg(games, leg)
        seen.set(pack.id, row)
      }
    }
    rows.push(...seen.values())
    leagueStats.push({ name: league.name, id: league.id, events: events.length, parlays: seen.size, expected, eventGaps })
    process.stderr.write(`${league.name} parlays ${seen.size} expected ${expected}\n`)
  }

  const steelers = rows.filter((row) => row.event === 'CLE Browns @ PIT Steelers')
  if (steelers.length < 29) throw new Error(`Steelers prepacks came back ${steelers.length}, the event filters list 29`)
  const nfl = rows.filter((row) => row.league === 'NFL')
  if (nfl.length <= 49) throw new Error('NFL prepacks did not get past the Under +200 tab')

  const oregon = await getJson(`${OR_PREPACKS}?${query({ eventId: '34118052', venueRole: 'Away' })}`)
  const oregonAway = oregon?.data?.prePacks?.length ?? null
  const ohioAway = steelers.filter((row) => row.venueRole === 'Away').length

  return { retrievedAt, retrievedET, rows, leagueStats, gaps, oregonAway, ohioAway, steelers: steelers.length }

}

async function main() {
  const collected = await collectDraftKings()
  const { retrievedAt, retrievedET, rows, leagueStats, gaps, oregonAway, ohioAway, steelers } = collected
  const snapshot = {
    retrievedAt,
    site: 'US-OH-SB',
    draftKings: rows,
    fanDuel: [],
    leagueStats,
    gaps,
    oregonAway,
    ohioAway,
  }
  await writeFile('docs/projections/dk-prebuilt-parlays.json', JSON.stringify(snapshot))

  const bands = new Map()
  for (const row of rows) {
    const key = `${row.league} ${bandLabel(row.americanNumber)}`
    bands.set(key, (bands.get(key) ?? 0) + 1)
  }
  const longOnes = rows
    .filter((row) => row.league === 'NFL' && row.americanNumber >= 200)
    .sort((a, b) => a.americanNumber - b.americanNumber)
    .slice(0, 8)

  const lines = [
    '# DraftKings prebuilt parlays',
    '',
    `Retrieved ${retrievedAt} UTC (${retrievedET} ET) from the Ohio site. These are DraftKings' combined prices. A priced edge is unlabeled.`,
    '',
    'The sportsbook loads `https://sportsbook-nash.draftkings.com/sites/US-OH-SB/api/sportscontent/prepacks/sportsdata/v2/prepacks`. A league request with no odds range is the Under +200 tab. The earlier pull of NFL, NBA, NHL, and college football was that tab only: 49 cards. Each event also has Away, Home, and Mixed tabs, and the filters name the longer price bands. This pass reads those tabs.',
    '',
    'Leagues are the ones the Ohio nav tags `PrePack` or `LivePrePack`.',
    '',
    '| League | Events on the nav | Parlays received | Filters listed | Events short of the filter count |',
    '| --- | --- | --- | --- | --- |',
    ...leagueStats.map((stat) => `| ${stat.name} | ${stat.events} | ${stat.parlays} | ${stat.expected} | ${stat.eventGaps} |`),
    '',
    `DraftKings rows: ${rows.length}.`,
    '',
    '## Price bands',
    '',
    '| Band | Rows |',
    '| --- | --- |',
    ...[...bands.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([band, count]) => `| ${band} | ${count} |`),
    '',
    `Browns at Steelers: ${steelers} prebuilt cards. The event filters list 29. Away tab on Ohio: ${ohioAway}. The same Away request on the Oregon host returned ${oregonAway ?? 'no row'}.`,
    '',
    '## Longer NFL prices',
    '',
    'These sit past the Under +200 tab. Player legs have no projection. A slate note is the venue-matched score only when that game is already on a retrieved slate.',
    '',
    ...longOnes.map((row) => `- **${row.american}** ${row.event}. ${row.legs.map((leg) => `${leg.selection ?? 'leg not attached'} (${leg.market ?? 'market missing'})`).join(' + ')}`),
    '',
    gaps.length ? '## Tabs that returned fewer cards than the filter count' : 'Every event tab matched its filter count.',
    '',
    ...gaps.map((gap) => `- ${gap}`),
    '',
    'The rows are in `docs/projections/dk-prebuilt-parlays.json`, `docs/projections/sideline-dk-prebuilt-2026-10-30.xlsx`, and `docs/projections/sideline-dk-prebuilt-2026-10-30.csv`.',
    '',
  ]
  await writeFile('docs/projections/DK-PREBUILT.md', `${lines.join('\n')}\n`)
  process.stdout.write(`draftkings ${rows.length}\ngaps ${gaps.length}\n`)
}

const entry = process.argv[1]
if (entry && import.meta.url === pathToFileURL(entry).href) {
  main().catch((error) => {
    console.error(error)
    process.exit(1)
  })
}
