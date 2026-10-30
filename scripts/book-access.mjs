/**
 * Working public access to FanDuel Ohio and DraftKings.
 *
 * FanDuel: Ohio content page. Game lines, plus the player markets that page attaches.
 * DraftKings: sportsbook-nash content feed. Game lines and the main prop over/unders.
 * Neither of these feeds sends a priced premade parlay. Those are in scripts/premade-parlays.mjs.
 *
 * Run: node scripts/book-access.mjs
 */

import { writeFile } from 'node:fs/promises'

const FD = 'https://sbapi.oh.sportsbook.fanduel.com/api/content-managed-page'
const FD_KEY = 'FhMFpcPWXMeyZxOx'
const DK = 'https://sportsbook-nash.draftkings.com/api/sportscontent/prepack/v1/leagues'

const DK_PROPS = [
  ['NFL', '88808', '492', null, 'Game lines'],
  ['NFL', '88808', '1000', '9524', 'Pass yards'],
  ['NFL', '88808', '1001', '9514', 'Rush yards'],
  ['NFL', '88808', '1342', '14114', 'Receiving yards'],
  ['NFL', '88808', '1342', '14115', 'Receptions'],
  ['NFL', '88808', '1003', '12438', 'Touchdown scorer'],
  ['NBA', '42648', '487', null, 'Game lines'],
  ['NBA', '42648', '1215', '12488', 'Points'],
  ['NBA', '42648', '1216', '12492', 'Rebounds'],
  ['NBA', '42648', '1217', '12495', 'Assists'],
  ['NHL', '42133', null, null, 'Game lines'],
]

const FD_PROP_TYPES = new Set([
  'ANY_TIME_TOUCHDOWN_SCORER',
  'PLAYER_X_ALT_RECEIVING_YARDS_HIGH',
  'PLAYER_X_ALT_PASSING_YARDS_HIGH',
  'PLAYER_X_ALT_RUSHING_YARDS_HIGH',
])

async function getJson(url) {
  let lastError
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const response = await fetch(url, {
        headers: { Accept: 'application/json', 'User-Agent': 'SidelineProjection/0.1' },
      })
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

function american(value) {
  if (value == null || value === '') return null
  return String(value).replaceAll('−', '-').replaceAll('+', '+')
}

function dkUrl(leagueId, categoryId, subcategoryId) {
  if (!categoryId) return `${DK}/${leagueId}`
  if (!subcategoryId) return `${DK}/${leagueId}/categories/${categoryId}`
  return `${DK}/${leagueId}/categories/${categoryId}/subcategories/${subcategoryId}`
}

function readDraftKings(payload, label) {
  const events = new Map((payload.events ?? []).map((event) => [event.id, event.name]))
  const rows = []
  for (const market of payload.markets ?? []) {
    const selections = (payload.selections ?? []).filter((selection) => selection.marketId === market.id)
    for (const selection of selections) {
      rows.push({
        book: 'DraftKings',
        label,
        event: events.get(market.eventId) ?? market.eventId,
        market: market.name,
        selection: selection.label,
        line: selection.points ?? null,
        side: selection.outcomeType ?? null,
        american: american(selection.displayOdds?.american),
      })
    }
  }
  return rows
}

function readFanDuel(payload) {
  const events = payload.attachments?.events ?? {}
  const lines = []
  const props = []
  for (const market of Object.values(payload.attachments?.markets ?? {})) {
    if (market.marketStatus && market.marketStatus !== 'OPEN') continue
    const event = events[String(market.eventId)]
    const eventName = event?.name ?? String(market.eventId)
    const runners = market.runners ?? []
    if (FD_PROP_TYPES.has(market.marketType)) {
      for (const runner of runners) {
        props.push({
          book: 'FanDuel',
          label: market.marketType,
          event: eventName,
          market: market.marketName,
          selection: runner.runnerName,
          line: runner.handicap ?? null,
          side: null,
          american: american(runner.winRunnerOdds?.americanDisplayOdds?.americanOdds),
        })
      }
      continue
    }
    if (!['MATCH_HANDICAP_(2-WAY)', 'TOTAL_POINTS_(OVER/UNDER)', 'MONEY_LINE'].includes(market.marketType)) continue
    if (!String(eventName).includes(' @ ')) continue
    for (const runner of runners) {
      lines.push({
        book: 'FanDuel',
        label: market.marketType,
        event: eventName,
        market: market.marketName,
        selection: runner.runnerName,
        line: runner.handicap ?? null,
        side: null,
        american: american(runner.winRunnerOdds?.americanDisplayOdds?.americanOdds),
      })
    }
  }
  return { lines, props }
}

function countBy(rows, field) {
  const counts = new Map()
  for (const row of rows) counts.set(row[field], (counts.get(row[field]) ?? 0) + 1)
  return [...counts.entries()].sort((a, b) => b[1] - a[1])
}

function sample(rows, eventIncludes) {
  return rows.find((row) => String(row.event).includes(eventIncludes) && row.side === 'Over')
    ?? rows.find((row) => String(row.event).includes(eventIncludes))
    ?? rows[0]
}

async function main() {
  const retrievedAt = new Date().toISOString()
  const draftKings = []
  for (const [league, leagueId, categoryId, subcategoryId, label] of DK_PROPS) {
    const url = dkUrl(leagueId, categoryId, subcategoryId)
    process.stderr.write(`draftkings ${league} ${label}\n`)
    const payload = await getJson(url)
    const rows = readDraftKings(payload, `${league} ${label}`)
    if (rows.length === 0) throw new Error(`DraftKings returned no rows for ${league} ${label}`)
    draftKings.push(...rows)
  }

  const fanDuel = { lines: [], props: [] }
  for (const page of ['nfl', 'nba', 'nhl']) {
    process.stderr.write(`fanduel ${page}\n`)
    const payload = await getJson(`${FD}?page=CUSTOM&customPageId=${page}&_ak=${FD_KEY}`)
    const parsed = readFanDuel(payload)
    fanDuel.lines.push(...parsed.lines.map((row) => ({ ...row, label: `${page} ${row.label}` })))
    fanDuel.props.push(...parsed.props.map((row) => ({ ...row, label: `${page} ${row.label}` })))
  }
  if (fanDuel.lines.length === 0) throw new Error('FanDuel returned no game lines')

  const snapshot = { retrievedAt, draftKings, fanDuel }
  await writeFile('docs/projections/book-access.json', JSON.stringify(snapshot))

  const dkPass = draftKings.find((row) => row.label === 'NFL Pass yards' && row.side === 'Over' && row.market.includes('Rodgers'))
  const fdTd = fanDuel.props.find((row) => row.selection?.includes('Swift'))
  const lines = [
    '# FanDuel and DraftKings access',
    '',
    `Retrieved ${retrievedAt} UTC. These are the book numbers. They are not a model and they are not a priced edge.`,
    '',
    '## DraftKings',
    '',
    'Feed: `https://sportsbook-nash.draftkings.com/api/sportscontent/prepack/v1/leagues/{league}/categories/{category}/subcategories/{subcategory}`',
    '',
    'League ids: NFL `88808`, NBA `42648`, NHL `42133`.',
    '',
    '| Board | Rows |',
    '| --- | --- |',
    ...countBy(draftKings, 'label').map(([label, count]) => `| ${label} | ${count} |`),
    '',
    dkPass ? `Sample: ${dkPass.event}, ${dkPass.market}, ${dkPass.selection} ${dkPass.line} ${dkPass.american}.` : 'Pass-yards sample missing.',
    '',
    '## FanDuel Ohio',
    '',
    'Feed: `https://sbapi.oh.sportsbook.fanduel.com/api/content-managed-page?page=CUSTOM&customPageId={nfl|nba|nhl}&_ak=FhMFpcPWXMeyZxOx`',
    '',
    `| Game-line prices | ${fanDuel.lines.length} |`,
    `| Player-market prices on that page | ${fanDuel.props.length} |`,
    '',
    fdTd ? `Sample: ${fdTd.event}, ${fdTd.market}, ${fdTd.selection} ${fdTd.american}.` : 'Anytime-touchdown sample missing.',
    '',
    'The Ohio NBA page did not attach player points, rebounds, or assists. DraftKings did. Premade parlays are not in these line and prop feeds. They are in `docs/projections/PREMADE-PARLAYS.md`.',
    '',
    'The rows are in `docs/projections/book-access.json`.',
    '',
  ]
  await writeFile('docs/projections/BOOK-ACCESS.md', lines.join('\n'))
  process.stdout.write(lines.join('\n'))
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
