/**
 * Walk-forward record of the player board rule.
 * Each scored game uses only that player's earlier games.
 * The number is the current DraftKings line, not the line posted before the game.
 *
 * Run: node scripts/backtest-players.mjs
 */

import { readFile, writeFile } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'
import { playerReads } from './projection-math.mjs'
import { looseName } from './player-logs.mjs'
import { propBoardCall } from './project-players.mjs'

const STATS = [
  ['points', 'Points', /points/i],
  ['reb', 'Rebounds', /rebounds/i],
  ['ast', 'Assists', /assists/i],
  ['passYds', 'Passing yards', /passing yards/i],
  ['rushYds', 'Rushing yards', /rushing yards/i],
  ['recYds', 'Receiving yards', /receiving yards/i],
]

export function statFromMarket(market) {
  return STATS.find(([, , pattern]) => pattern.test(market))?.[0] ?? null
}

export function lineBeforeGame(lines, gameDate) {
  const gameTime = Date.parse(gameDate)
  if (!Number.isFinite(gameTime)) return null
  const prior = (lines ?? []).filter((row) => Date.parse(row.retrievedAt) < gameTime && Number.isFinite(row.line))
  if (prior.length === 0) return null
  prior.sort((a, b) => Date.parse(a.retrievedAt) - Date.parse(b.retrievedAt))
  return prior[prior.length - 1].line
}

export function walkForwardSaved(rows, lines) {
  const ordered = [...(rows ?? [])]
    .filter((row) => Number.isFinite(row?.value))
    .sort((a, b) => String(a.date).localeCompare(String(b.date)))
  const tally = {
    over: { hits: 0, decided: 0 },
    under: { hits: 0, decided: 0 },
  }
  for (let index = 0; index < ordered.length; index += 1) {
    const game = ordered[index]
    if (game.venue !== 'home' && game.venue !== 'away') continue
    const line = lineBeforeGame(lines, game.date)
    if (!Number.isFinite(line)) continue
    const call = propBoardCall(playerReads(ordered.slice(0, index), game.venue), line)
    if (call !== 'over' && call !== 'under') continue
    if (game.value === line) continue
    const hit = call === 'over' ? game.value > line : game.value < line
    tally[call].decided += 1
    if (hit) tally[call].hits += 1
  }
  return tally
}

export function mergePropLines(existing, incoming) {
  const lines = [...(existing?.lines ?? [])]
  const seen = new Set(lines.map((row) => `${row.retrievedAt}|${looseName(row.player)}|${row.stat}|${row.line}|${row.event}`))
  for (const row of incoming) {
    const key = `${row.retrievedAt}|${looseName(row.player)}|${row.stat}|${row.line}|${row.event}`
    if (seen.has(key) || !Number.isFinite(row.line) || !row.retrievedAt) continue
    seen.add(key)
    lines.push({
      retrievedAt: row.retrievedAt,
      player: row.player,
      stat: row.stat,
      line: row.line,
      event: row.event ?? '',
    })
  }
  return { lines }
}

export function walkForwardProp(rows, line) {
  const ordered = [...(rows ?? [])]
    .filter((row) => Number.isFinite(row?.value))
    .sort((a, b) => String(a.date).localeCompare(String(b.date)))
  const tally = {
    over: { hits: 0, decided: 0 },
    under: { hits: 0, decided: 0 },
  }
  for (let index = 0; index < ordered.length; index += 1) {
    const game = ordered[index]
    if (game.venue !== 'home' && game.venue !== 'away') continue
    const call = propBoardCall(playerReads(ordered.slice(0, index), game.venue), line)
    if (call !== 'over' && call !== 'under') continue
    if (game.value === line) continue
    const hit = call === 'over' ? game.value > line : game.value < line
    tally[call].decided += 1
    if (hit) tally[call].hits += 1
  }
  return tally
}

function add(target, source) {
  target.hits += source.hits
  target.decided += source.decided
}

function rate(hits, decided) {
  if (!decided) return null
  return hits / decided
}

function pct(value) {
  if (value == null) return 'missing'
  return `${(value * 100).toFixed(1)}%`
}

function record(hits, decided) {
  if (!decided) return '0/0'
  return `${pct(rate(hits, decided))} (${hits}/${decided})`
}

export function scoreProps(baseline, saved) {
  const byName = baseline?.byName ?? {}
  const byPlayer = new Map()
  for (const row of saved?.lines ?? []) {
    const key = `${looseName(row.player)}|${row.stat}`
    const list = byPlayer.get(key) ?? []
    list.push(row)
    byPlayer.set(key, list)
  }
  const seen = new Set()
  const byStat = new Map(STATS.map(([stat, label]) => [stat, {
    label,
    over: { hits: 0, decided: 0 },
    under: { hits: 0, decided: 0 },
    props: 0,
  }]))
  let skipped = 0
  for (const row of baseline?.comparisons ?? []) {
    const stat = statFromMarket(row.market)
    const bucket = byStat.get(stat)
    if (!bucket) {
      skipped += 1
      continue
    }
    const key = `${looseName(row.name)}|${stat}`
    if (seen.has(key)) continue
    seen.add(key)
    const log = byName[looseName(row.name)]?.stats?.[stat]
    const lines = byPlayer.get(key)
    if (!log || !lines) {
      skipped += 1
      continue
    }
    const tally = walkForwardSaved(log, lines)
    add(bucket.over, tally.over)
    add(bucket.under, tally.under)
    bucket.props += 1
  }
  return { byStat: [...byStat.values()], skipped, saved: saved?.lines?.length ?? 0 }
}

export function reportProps(scored, retrievedAt) {
  const lines = [
    '# Player walk-forward',
    '',
    `Run at ${retrievedAt} UTC. Each scored game uses only that player's earlier games and a line saved before that game. A line retrieved after the game stays out. ${scored.saved} lines are on file.`,
    '',
    'A counted row needs all four reads at least 1 unit past that saved line and a venue sample of at least 3. A hit means the game landed on that side. A push is left out. A rate with no rows is 0/0. This is not a priced edge.',
    '',
    '| Stat | Props | Overs | Unders |',
    '| --- | --- | --- | --- |',
  ]
  const total = {
    props: 0,
    over: { hits: 0, decided: 0 },
    under: { hits: 0, decided: 0 },
  }
  for (const row of scored.byStat) {
    lines.push(`| ${row.label} | ${row.props} | ${record(row.over.hits, row.over.decided)} | ${record(row.under.hits, row.under.decided)} |`)
    total.props += row.props
    add(total.over, row.over)
    add(total.under, row.under)
  }
  lines.push(`| All six | ${total.props} | ${record(total.over.hits, total.over.decided)} | ${record(total.under.hits, total.under.decided)} |`)
  lines.push('')
  lines.push(`Props skipped because the log or the stat was missing: ${scored.skipped}.`)
  lines.push('')
  return lines.join('\n')
}

async function main() {
  const baseline = JSON.parse(await readFile('docs/projections/player-baseline.json', 'utf8'))
  let existing = { lines: [] }
  try {
    existing = JSON.parse(await readFile('docs/projections/prop-lines.json', 'utf8'))
  } catch {
    existing = { lines: [] }
  }
  const incoming = (baseline.comparisons ?? []).map((row) => ({
    retrievedAt: baseline.retrievedAt,
    player: row.name,
    stat: statFromMarket(row.market),
    line: row.line,
    event: row.event,
  })).filter((row) => row.stat)
  const saved = mergePropLines(existing, incoming)
  await writeFile('docs/projections/prop-lines.json', `${JSON.stringify(saved)}\n`)
  const scored = scoreProps(baseline, saved)
  const retrievedAt = new Date().toISOString()
  const markdown = `${reportProps(scored, retrievedAt)}\n`
  await writeFile('docs/projections/PLAYER-BACKTEST.md', markdown)
  process.stdout.write(markdown)
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  main().catch((error) => {
    console.error(error)
    process.exit(1)
  })
}
