/**
 * Append the current NFL first-touchdown prices.
 * DraftKings is the First TD Scorer market. FanDuel is the 1st Touchdown Scorer market.
 * A saved price is the book's number at retrieval time. It is not a bet.
 *
 * Run: node scripts/save-first-scorer-lines.mjs
 */

import { readFile, writeFile } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'
import { loadDraftKingsFirstScorers, loadFanDuelFirstScorers, mergeFirstScorerLines } from './book-prices.mjs'

const FILE = 'docs/projections/first-scorer-lines.json'

export function rowsFromProps(props, retrievedAt) {
  return (props ?? []).map((prop) => ({
    retrievedAt,
    player: prop.player,
    stat: prop.stat,
    book: prop.book,
    american: prop.american,
    event: `${prop.away} @ ${prop.home}`,
    selectionId: prop.selectionId ?? null,
    marketId: prop.marketId ?? null,
  }))
}

async function main() {
  const retrievedAt = new Date().toISOString()
  const [draftkings, fanduel] = await Promise.all([
    loadDraftKingsFirstScorers('nfl'),
    loadFanDuelFirstScorers('nfl'),
  ])
  let existing = { lines: [] }
  try {
    existing = JSON.parse(await readFile(FILE, 'utf8'))
  } catch {
    existing = { lines: [] }
  }
  const saved = mergeFirstScorerLines(existing, rowsFromProps([...draftkings, ...fanduel], retrievedAt))
  await writeFile(FILE, `${JSON.stringify(saved)}\n`)
  process.stdout.write(`${retrievedAt} DraftKings ${draftkings.length}, FanDuel ${fanduel.length}, stored ${saved.lines.length}\n`)
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  main().catch((error) => {
    console.error(error)
    process.exit(1)
  })
}
