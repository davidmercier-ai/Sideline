/**
 * Grade named NFL first-touchdown legs.
 * Rank in the game, four shares, the call record, both books' prices, and the team score when the slate has one.
 * The action stays Pass. A share is not a win probability.
 *
 * Run: node scripts/grade-slip.mjs "Kenyon Sadiq" "Saquon Barkley" "Chuba Hubbard"
 */

import { readFile, writeFile } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'
import { impliedFromAmerican, namesMatch } from './book-prices.mjs'
import { saveBoard } from './board-store.mjs'
import { leaderCall } from './first-scorer.mjs'
import { fieldForGame, loadHistories, upcoming } from './first-scorer-week.mjs'
import { looseName } from './player-logs.mjs'

const NFL = { name: 'NFL', path: 'football/nfl', year: 2026, kind: 'firstTd', regular: true }
const LINES = 'docs/projections/first-scorer-lines.json'

function pct(value) {
  if (!Number.isFinite(value)) return 'missing'
  return `${Math.round(value * 100)}%`
}

export function scoreSide(scoreText, atHome) {
  const parts = String(scoreText || '').split(/[–-]/).map((part) => Number(part.trim()))
  if (parts.length < 2 || parts.some((part) => !Number.isFinite(part))) return null
  const [away, home] = parts
  if (away === home) return 'level'
  const onLower = atHome ? home < away : away < home
  return onLower ? 'lower' : 'higher'
}

export function parlayImplied(prices) {
  if (!prices.length || prices.some((price) => !Number.isFinite(price))) return null
  return prices.reduce((product, price) => product * price, 1)
}

export function latestByBook(lines, player) {
  const byBook = new Map()
  for (const row of lines ?? []) {
    if (looseName(row.player) !== looseName(player)) continue
    const prev = byBook.get(row.book)
    if (!prev || String(row.retrievedAt) > String(prev.retrievedAt)) byBook.set(row.book, row)
  }
  return [...byBook.values()]
}

export function earlierAmerican(lines, player, book, latestAt) {
  const prior = (lines ?? [])
    .filter((row) => (
      looseName(row.player) === looseName(player)
      && row.book === book
      && String(row.retrievedAt) < String(latestAt)
      && row.american
    ))
    .sort((a, b) => String(b.retrievedAt).localeCompare(String(a.retrievedAt)))[0]
  return prior?.american && prior.american !== undefined ? prior.american : null
}

export function slateScore(markdown, away, home) {
  const awayNick = String(away || '').split(' ').at(-1)
  const homeNick = String(home || '').split(' ').at(-1)
  if (!awayNick || !homeNick) return null
  for (const line of String(markdown || '').split('\n')) {
    if (!line.includes(`${awayNick} at ${homeNick}`)) continue
    const cells = line.split('|').map((cell) => cell.trim()).filter(Boolean)
    if (cells.length < 6 || !cells[1].includes(' at ')) continue
    return { score: cells[2], total: cells[3], vote: cells[4], sim: cells[5] }
  }
  return null
}

function gameForEvent(games, event) {
  const [away, home] = String(event || '').split(' @ ')
  return games.find((game) => namesMatch(game.away, away) && namesMatch(game.home, home)) || null
}

function callLabel(call) {
  if (call.strict) return 'Pass, strict shape'
  if (call.called) return 'Pass, called shape'
  if (call.pair) return 'Pass, pair shape'
  return 'Pass'
}

function priceCell(row, prior) {
  if (!row) return 'missing'
  const implied = impliedFromAmerican(row.american)
  const share = implied == null ? '' : ` (${(implied * 100).toFixed(1)}%)`
  const was = prior && prior !== row.american ? `, was ${prior}` : ''
  return `${row.american}${share}${was}`
}

async function main() {
  const names = process.argv.slice(2)
  if (names.length === 0) {
    console.error('Usage: node scripts/grade-slip.mjs "Player Name" ...')
    process.exit(1)
  }
  const saved = JSON.parse(await readFile(LINES, 'utf8'))
  const games = await upcoming(NFL)
  const wantedGames = []
  const seen = new Set()
  for (const name of names) {
    const price = latestByBook(saved.lines, name)[0]
    const game = price ? gameForEvent(games, price.event) : null
    if (!game || seen.has(game.id)) continue
    seen.add(game.id)
    wantedGames.push(game)
  }
  const logs = await loadHistories(NFL, wantedGames)
  const legs = []
  for (const name of names) {
    const prices = latestByBook(saved.lines, name)
    const game = prices[0] ? gameForEvent(games, prices[0].event) : null
    const field = game ? fieldForGame(game, logs) : []
    const rank = field.findIndex((row) => looseName(row.name) === looseName(name))
    const row = rank >= 0 ? field[rank] : null
    const call = row ? leaderCall(row.reads) : null
    let score = null
    if (game) {
      const day = new Date(game.date).toLocaleDateString('en-CA', { timeZone: 'America/New_York' })
      let markdown = ''
      try {
        markdown = await readFile(`docs/projections/${day}-today.md`, 'utf8')
      } catch {
        markdown = ''
      }
      const found = slateScore(markdown, game.away, game.home)
      if (found) score = { ...found, side: row ? scoreSide(found.score, row.atHome) : null }
    }
    legs.push({
      player: row?.name || name,
      event: prices[0]?.event || '',
      away: game?.away || '',
      home: game?.home || '',
      kickoff: game?.date || '',
      site: row ? (row.atHome ? 'home' : 'away') : '',
      side: row?.side || '',
      rank: rank >= 0 ? rank + 1 : null,
      field: field.length,
      reads: row ? row.reads.map((read) => read.value) : [],
      thin: Boolean(row?.thin),
      call: call ? callLabel(call) : 'Pass',
      prices: prices.map((price) => ({
        book: price.book,
        american: price.american,
        prior: earlierAmerican(saved.lines, name, price.book, price.retrievedAt),
        implied: impliedFromAmerican(price.american),
        retrievedAt: price.retrievedAt,
      })),
      score,
    })
  }
  const draftkings = legs.map((leg) => leg.prices.find((price) => price.book === 'DraftKings')?.implied ?? null)
  const product = parlayImplied(draftkings)
  const retrievedAt = new Date().toISOString()
  const day = legs.find((leg) => leg.kickoff)
    ? new Date(legs.find((leg) => leg.kickoff).kickoff).toLocaleDateString('en-CA', { timeZone: 'America/New_York' })
    : new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' })
  const id = `${day}-first-td-slip`
  const lines = [
    `# First touchdown slip, ${day}`,
    '',
    `Graded at ${retrievedAt}. Each leg is a Pass. Pair, called, and strict are records from the walk-forward, and a share is not a win probability.`,
    '',
    '| Player | Game | Site | Rank | Venue | Overall | Median | Last 3 | Record | DraftKings | FanDuel | Team score |',
    '| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |',
  ]
  for (const leg of legs) {
    const reads = leg.reads.length === 4 ? leg.reads.map(pct) : ['missing', 'missing', 'missing', 'missing']
    const dkRow = leg.prices.find((price) => price.book === 'DraftKings')
    const fdRow = leg.prices.find((price) => price.book === 'FanDuel')
    const dk = priceCell(dkRow, dkRow?.prior)
    const fd = priceCell(fdRow, fdRow?.prior)
    const score = leg.score
      ? `${leg.score.score}; sim ${leg.score.sim}; ${leg.score.side === 'lower' ? 'lower projected score' : leg.score.side === 'higher' ? 'higher projected score' : 'level score'}`
      : 'missing'
    const rank = leg.rank ? `${leg.rank} of ${leg.field}` : 'missing'
    lines.push(`| ${leg.player} | ${leg.away} at ${leg.home} | ${leg.site || 'missing'} | ${rank} | ${reads[0]} | ${reads[1]} | ${reads[2]} | ${reads[3]} | ${leg.call} | ${dk} | ${fd} | ${score} |`)
  }
  lines.push('')
  if (product != null) {
    lines.push(`DraftKings prices multiplied: ${(product * 100).toFixed(3)}%.`)
  } else {
    lines.push('DraftKings prices multiplied: missing.')
  }
  let backtest = ''
  try {
    backtest = await readFile('docs/projections/FIRST-SCORER-BACKTEST.md', 'utf8')
  } catch {
    backtest = ''
  }
  const leader = backtest.split('\n').find((line) => /^\| NFL \| +[\d.]/.test(line))
  if (leader) {
    const cells = leader.split('|').map((cell) => cell.trim()).filter(Boolean)
    lines.push(`NFL walk-forward leader: ${cells[1]}. Leader and pair: ${cells[2]}. Leader and called: ${cells[3]}.`)
  }
  lines.push('')
  const markdown = `${lines.join('\n')}\n`
  await writeFile(`docs/projections/${id}.md`, markdown)
  await saveBoard({
    id,
    title: `First touchdown slip ${day}`,
    sportPath: NFL.path,
    retrievedAt,
    games: legs,
  })
  process.stdout.write(markdown)
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  main().catch((error) => {
    console.error(error)
    process.exit(1)
  })
}
