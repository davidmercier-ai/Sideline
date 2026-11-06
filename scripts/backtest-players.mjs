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

export function scoreProps(baseline) {
  const byName = baseline?.byName ?? {}
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
    if (!bucket || !Number.isFinite(row.line)) {
      skipped += 1
      continue
    }
    const key = `${looseName(row.name)}|${stat}|${row.line}`
    if (seen.has(key)) continue
    seen.add(key)
    const log = byName[looseName(row.name)]?.stats?.[stat]
    if (!log) {
      skipped += 1
      continue
    }
    const tally = walkForwardProp(log, row.line)
    add(bucket.over, tally.over)
    add(bucket.under, tally.under)
    bucket.props += 1
  }
  return { byStat: [...byStat.values()], skipped }
}

export function reportProps(scored, retrievedAt) {
  const lines = [
    '# Player walk-forward',
    '',
    `Run at ${retrievedAt} UTC. Each scored game uses only that player's earlier games. The number is the current DraftKings line, not the line posted before that game. The current line was set with this season already played, so this is a record against today's number.`,
    '',
    'A counted row needs all four reads at least 1 unit past that number and a venue sample of at least 3. A hit means the game landed on that side. A push is left out. A rate with no rows is left blank as 0/0. This is not a priced edge.',
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
  const scored = scoreProps(baseline)
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
