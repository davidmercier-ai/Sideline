/**
 * Rate and rank the saved FanDuel and DraftKings parlays.
 *
 * A rated leg is a moneyline, game total, or team total on a slate already
 * predicted. The score counts agreement with the model vote and the
 * venue-matched number. It is not a win probability and it is not a priced edge.
 * A price is ranked only when both books post the same legs and the same numbers.
 *
 * Run: node scripts/rank-parlays.mjs
 */

import { readFile, writeFile } from 'node:fs/promises'
import { loadStoredSlates, rateLeg } from './premade-parlays.mjs'

function americanNumber(price) {
  if (price == null || price === '') return null
  const number = Number(String(price).replace('+', '').replaceAll('−', '-'))
  return Number.isFinite(number) ? number : null
}

function legText(leg) {
  if (!leg.market && !leg.selection) return 'leg not attached'
  const selection = leg.selection ?? 'selection missing'
  const market = leg.market ?? 'market missing'
  const line = leg.line == null || leg.line === '' ? '' : String(leg.line)
  const shown = line && !selection.includes(line) ? `${selection} ${line}` : selection
  return `${shown} (${market})`
}

function rateParlay(games, parlay, players = null) {
  const legs = parlay.legs.map((leg) => ({ ...leg, rate: rateLeg(games, leg, players) }))
  const rated = legs.filter((leg) => leg.rate.status === 'rated')
  const withCount = rated.filter((leg) => leg.rate.stance === 'with').length
  const againstCount = rated.filter((leg) => leg.rate.stance === 'against').length
  const evenCount = rated.filter((leg) => leg.rate.stance === 'even').length
  const score = rated.reduce((sum, leg) => sum + leg.rate.weight, 0)
  let rate = 'unrated'
  if (rated.length > 0 && againstCount === 0 && evenCount === 0) rate = 'with the projection'
  else if (rated.length > 0 && withCount === 0 && evenCount === 0) rate = 'against the projection'
  else if (rated.length > 0) rate = 'mixed'
  const signatures = legs.map((leg) => leg.rate.signature).filter(Boolean).sort()
  const sameCard = signatures.length === legs.length && signatures.length > 0 ? signatures.join(' || ') : null
  return {
    book: parlay.book,
    league: parlay.league,
    type: parlay.type,
    american: parlay.american,
    americanNumber: americanNumber(parlay.american),
    event: parlay.event ?? (parlay.events ?? []).join('; '),
    rate,
    score,
    withCount,
    againstCount,
    evenCount,
    ratedCount: rated.length,
    unratedCount: legs.length - rated.length,
    sameCard,
    legs: legs.map((leg) => `${legText(leg)}. ${leg.rate.label}`).join(' + '),
  }
}

function byAgreement(left, right) {
  if (left.againstCount !== right.againstCount) return left.againstCount - right.againstCount
  if (left.evenCount !== right.evenCount) return left.evenCount - right.evenCount
  if (left.score !== right.score) return right.score - left.score
  if (left.ratedCount !== right.ratedCount) return right.ratedCount - left.ratedCount
  return String(left.event).localeCompare(String(right.event))
}

function pricePairs(rated) {
  const groups = new Map()
  for (const row of rated) {
    if (!row.sameCard) continue
    if (!groups.has(row.sameCard)) groups.set(row.sameCard, [])
    groups.get(row.sameCard).push(row)
  }
  const pairs = []
  for (const rows of groups.values()) {
    const books = new Map()
    for (const row of rows) {
      const current = books.get(row.book)
      if (!current || (row.americanNumber ?? -Infinity) > (current.americanNumber ?? -Infinity)) books.set(row.book, row)
    }
    if (!books.has('FanDuel') || !books.has('DraftKings')) continue
    const fanDuel = books.get('FanDuel')
    const draftKings = books.get('DraftKings')
    if (fanDuel.americanNumber == null || draftKings.americanNumber == null) continue
    if (fanDuel.americanNumber === draftKings.americanNumber) continue
    const higher = fanDuel.americanNumber > draftKings.americanNumber ? 'FanDuel' : 'DraftKings'
    pairs.push({
      event: fanDuel.event || draftKings.event,
      legs: fanDuel.legs,
      fanDuel: fanDuel.american,
      draftKings: draftKings.american,
      higher,
      gap: Math.abs(fanDuel.americanNumber - draftKings.americanNumber),
    })
  }
  pairs.sort((left, right) => right.gap - left.gap || String(left.event).localeCompare(String(right.event)))
  return pairs.map((pair, index) => ({ rank: index + 1, ...pair }))
}

function checkRates(games) {
  const steelers = rateLeg(games, {
    event: 'CLE Browns @ PIT Steelers',
    market: 'Moneyline',
    selection: 'PIT Steelers',
    start: '2026-11-01T18:00:00Z',
  })
  const browns = rateLeg(games, {
    event: 'CLE Browns @ PIT Steelers',
    market: 'Moneyline',
    selection: 'CLE Browns',
    start: '2026-11-01T18:00:00Z',
  })
  const player = rateLeg(games, {
    event: 'Baltimore Ravens @ Buffalo Bills',
    market: 'Any Time Touchdown Scorer',
    selection: 'Josh Allen',
    start: '2026-11-01T17:00:00Z',
  })
  const teamTotal = rateLeg(games, {
    event: 'CLE Browns @ PIT Steelers',
    market: 'PIT Steelers: Team Total Points',
    selection: 'Over 21.5',
    line: 21.5,
    start: '2026-11-01T18:00:00Z',
  })
  if (steelers.weight !== 2 || steelers.stance !== 'with') throw new Error(`Steelers moneyline rated ${steelers.weight} ${steelers.stance}`)
  if (browns.weight !== -2 || browns.stance !== 'against') throw new Error(`Browns moneyline rated ${browns.weight} ${browns.stance}`)
  if (player.status !== 'unrated' || player.kind !== 'player') throw new Error('Player leg was rated')
  const ratedPlayer = rateLeg(games, {
    event: 'Baltimore Ravens @ Buffalo Bills',
    market: 'Josh Allen Passing Yards O/U',
    selection: 'Over',
    line: 200,
    start: '2026-11-01T17:00:00Z',
  }, {
    byName: {
      joshallen: {
        name: 'Josh Allen',
        team: 'Bills',
        stats: {
          passYds: [
            { date: '2026-10-01', venue: 'home', value: 260 },
            { date: '2026-10-08', venue: 'home', value: 240 },
            { date: '2026-10-15', venue: 'away', value: 250 },
            { date: '2026-10-22', venue: 'away', value: 255 },
          ],
        },
      },
    },
  })
  if (ratedPlayer.stance !== 'with' || ratedPlayer.weight !== 1) throw new Error(`Josh Allen yards rated ${ratedPlayer.stance} ${ratedPlayer.label}`)
  if (teamTotal.weight !== 1 || teamTotal.stance !== 'with') throw new Error(`Steelers team total rated ${teamTotal.weight} ${teamTotal.label}`)
}

function csvCell(value) {
  const text = value == null ? '' : String(value)
  if (/[",\n]/.test(text)) return `"${text.replaceAll('"', '""')}"`
  return text
}

function writeCsv(path, columns, rows) {
  const lines = [columns.join(',')]
  for (const row of rows) lines.push(columns.map((column) => csvCell(row[column])).join(','))
  return writeFile(path, `${lines.join('\n')}\n`)
}

async function loadPlayers() {
  try {
    const baseline = JSON.parse(await readFile('docs/projections/player-baseline.json', 'utf8'))
    return baseline.byName ? { byName: baseline.byName } : null
  } catch {
    return null
  }
}

async function main() {
  const snapshot = JSON.parse(await readFile('docs/projections/premade-parlays.json', 'utf8'))
  const games = await loadStoredSlates()
  checkRates(games)
  const players = await loadPlayers()
  const parlays = [...snapshot.draftKings, ...snapshot.fanDuel].map((parlay) => rateParlay(games, parlay, players))
  const rated = parlays.filter((parlay) => parlay.rate !== 'unrated').sort(byAgreement)
  rated.forEach((parlay, index) => {
    parlay.rank = index + 1
  })
  const pairs = pricePairs(parlays)
  const counts = {
    parlays: parlays.length,
    fanDuel: parlays.filter((parlay) => parlay.book === 'FanDuel').length,
    draftKings: parlays.filter((parlay) => parlay.book === 'DraftKings').length,
    withProjection: rated.filter((parlay) => parlay.rate === 'with the projection').length,
    mixed: rated.filter((parlay) => parlay.rate === 'mixed').length,
    against: rated.filter((parlay) => parlay.rate === 'against the projection').length,
    unrated: parlays.length - rated.length,
  }
  const retrievedAt = snapshot.retrievedAt
  const retrievedET = new Date(retrievedAt).toLocaleString('en-US', {
    timeZone: 'America/New_York',
    dateStyle: 'medium',
    timeStyle: 'short',
  })
  const payload = { retrievedAt, counts, rated, pairs }
  await writeFile('docs/projections/parlay-rank.json', JSON.stringify(payload))
  await writeCsv(
    'docs/projections/sideline-parlay-rank-2026-10-30.csv',
    ['rank', 'rate', 'score', 'book', 'league', 'american', 'event', 'withCount', 'againstCount', 'evenCount', 'ratedCount', 'unratedCount', 'legs'],
    rated,
  )

  const top = rated.filter((parlay) => parlay.rate === 'with the projection').slice(0, 15)
  const lines = [
    '# Parlay rank',
    '',
    `Rated from the parlays retrieved ${retrievedAt} UTC (${retrievedET} ET). Both books are in this rank.`,
    '',
    'The score counts legs that sit with the model vote, the venue-matched number, or a saved player log. A unanimous moneyline is 2. A split leader is 1. A total, team total, or player prop is 1 when the venue read and at least three reads are at least 1 unit on the same side of the book number. An anytime touchdown uses half the games instead of a 1-unit band. A gap smaller than 1 unit is even and scores 0. The other way subtracts. A player with no saved log stays unrated. The score is not a win probability and it is not a priced edge.',
    '',
    'Order: no leg against the projection, then no even leg, then the higher score. A price is ranked only when FanDuel and DraftKings post the same legs and the same numbers. The higher American odds is the better price.',
    '',
    `| Parlays | ${counts.parlays} |`,
    `| FanDuel | ${counts.fanDuel} |`,
    `| DraftKings | ${counts.draftKings} |`,
    `| With the projection | ${counts.withProjection} |`,
    `| Mixed | ${counts.mixed} |`,
    `| Against the projection | ${counts.against} |`,
    `| Unrated | ${counts.unrated} |`,
    '',
    '## With the projection',
    '',
    ...top.map((parlay) => `- **${parlay.rank}. ${parlay.book} ${parlay.american}** ${parlay.event}. Score ${parlay.score}. ${parlay.legs}`),
    '',
    '## Same card, both books',
    '',
    pairs.length ? `${pairs.length} cards share legs and numbers.` : 'No card is posted by both books with the same legs and the same numbers.',
    '',
    ...pairs.slice(0, 15).map((pair) => `- **${pair.rank}. ${pair.higher}** has the higher price. FanDuel ${pair.fanDuel}, DraftKings ${pair.draftKings}. ${pair.event}. ${pair.legs}`),
    '',
    'The full rank is in `docs/projections/sideline-parlay-rank-2026-10-30.csv` and `docs/projections/sideline-parlay-rank-2026-10-30.xlsx`.',
    '',
  ]
  await writeFile('docs/projections/PARLAY-RANK.md', `${lines.join('\n')}\n`)
  process.stdout.write(`rated ${rated.length}\nwith ${counts.withProjection}\nmixed ${counts.mixed}\nagainst ${counts.against}\nunrated ${counts.unrated}\npairs ${pairs.length}\n`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
