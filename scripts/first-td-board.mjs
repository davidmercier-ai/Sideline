/**
 * Sunday first-touchdown board.
 * One leader per game, with the four shares, the saved price, and the team score.
 * Every row is a Pass. A share is not a win probability.
 *
 * Run: node scripts/first-td-board.mjs
 */

import { readFile, writeFile } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'
import { impliedFromAmerican } from './book-prices.mjs'
import { saveBoard } from './board-store.mjs'
import { leaderCall } from './first-scorer.mjs'
import { fieldForGame, loadHistories, upcoming } from './first-scorer-week.mjs'
import { leaderPrices, recordLabel, scoreSide, slateScore } from './grade-slip.mjs'

const NFL = { name: 'NFL', path: 'football/nfl', year: 2026, kind: 'firstTd', regular: true }
const LINES = 'docs/projections/first-scorer-lines.json'

function pct(value) {
  if (!Number.isFinite(value)) return 'missing'
  return `${Math.round(value * 100)}%`
}

function when(date) {
  return new Date(date).toLocaleString('en-US', {
    timeZone: 'America/New_York',
    weekday: 'short',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function priceCell(row) {
  if (!row) return 'missing'
  const implied = impliedFromAmerican(row.american)
  const share = implied == null ? '' : ` (${(implied * 100).toFixed(1)}%)`
  const prior = row.prior && row.prior !== row.american ? `, was ${row.prior}` : ''
  return `${row.american}${share}${prior}`
}

function leaderLine(markdown) {
  return markdown.split('\n').find((line) => /^\| NFL \| +[\d.]/.test(line)) || ''
}

export function boardRows(games, logs, lines, slates) {
  return [...games]
    .sort((a, b) => String(a.date).localeCompare(String(b.date)))
    .map((game) => {
      const leader = fieldForGame(game, logs)[0] || null
      const day = new Date(game.date).toLocaleDateString('en-CA', { timeZone: 'America/New_York' })
      const score = slateScore(slates.get(day) || '', game.away, game.home)
      const side = leader && score ? scoreSide(score.score, leader.atHome) : null
      const prices = leader ? leaderPrices(lines, game, leader.name) : []
      return {
        when: when(game.date),
        kickoff: game.date,
        away: game.away,
        home: game.home,
        started: Boolean(game.started),
        leader: leader?.name || '',
        site: leader ? (leader.atHome ? 'home' : 'away') : '',
        side: leader?.side || '',
        reads: leader ? leader.reads.map((read) => read.value) : [],
        thin: Boolean(leader?.thin),
        record: recordLabel(leader ? leaderCall(leader.reads) : null),
        prices: prices.map((price) => ({
          book: price.book,
          american: price.american,
          prior: price.prior,
          implied: impliedFromAmerican(price.american),
        })),
        score: score ? { ...score, side } : null,
      }
    })
}

function markdownFor(rows, retrievedAt, backtest) {
  const leader = leaderLine(backtest)
  const cells = leader.split('|').map((cell) => cell.trim()).filter(Boolean)
  const lines = [
    '# NFL first touchdown',
    '',
    `Retrieved at ${retrievedAt}. Each leader is a Pass. The four shares are the player's own regular-season games. A share is not a win probability.`,
    '',
  ]
  if (cells.length >= 4) {
    lines.push(`Walk-forward leader: ${cells[1]}. Leader and pair: ${cells[2]}. Leader and called: ${cells[3]}.`)
    lines.push('')
  }
  lines.push('| When | Game | Leader | Site | Venue | Overall | Median | Last 3 | Record | DraftKings | FanDuel | Team score |')
  lines.push('| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |')
  for (const row of rows) {
    const reads = row.reads.length === 4 ? row.reads.map(pct) : ['missing', 'missing', 'missing', 'missing']
    const dk = priceCell(row.prices.find((price) => price.book === 'DraftKings'))
    const fd = priceCell(row.prices.find((price) => price.book === 'FanDuel'))
    const score = row.score
      ? `${row.score.score}; ${row.score.side === 'lower' ? 'lower projected score' : row.score.side === 'higher' ? 'higher projected score' : 'level score'}`
      : 'missing'
    const name = row.leader || 'no prior first scorer'
    lines.push(`| ${row.when}${row.started ? ' started' : ''} | ${row.away} at ${row.home} | ${name} | ${row.site || 'missing'} | ${reads[0]} | ${reads[1]} | ${reads[2]} | ${reads[3]} | ${row.record} | ${dk} | ${fd} | ${score} |`)
  }
  lines.push('')
  return `${lines.join('\n')}\n`
}

async function main() {
  const saved = JSON.parse(await readFile(LINES, 'utf8'))
  const games = await upcoming(NFL)
  const logs = await loadHistories(NFL, games)
  const days = [...new Set(games.map((game) => new Date(game.date).toLocaleDateString('en-CA', { timeZone: 'America/New_York' })))]
  const slates = new Map()
  for (const day of days) {
    try {
      slates.set(day, await readFile(`docs/projections/${day}-today.md`, 'utf8'))
    } catch {
      slates.set(day, '')
    }
  }
  let backtest = ''
  try {
    backtest = await readFile('docs/projections/FIRST-SCORER-BACKTEST.md', 'utf8')
  } catch {
    backtest = ''
  }
  const retrievedAt = new Date().toISOString()
  const rows = boardRows(games, logs, saved.lines, slates)
  const day = days[0] || new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' })
  const id = `${day}-first-td`
  const markdown = markdownFor(rows, retrievedAt, backtest)
  await writeFile(`docs/projections/${id}.md`, markdown)
  await saveBoard({
    id,
    title: `NFL first touchdown ${day}`,
    sportPath: NFL.path,
    retrievedAt,
    games: rows,
  })
  process.stdout.write(markdown)
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  main().catch((error) => {
    console.error(error)
    process.exit(1)
  })
}
