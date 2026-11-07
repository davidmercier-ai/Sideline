/**
 * Walk-forward Statcast. The first half of 2026 predicts the second half.
 * Batting average is the hit rate. xBA is the contact. Lower error wins.
 * A gap is not a bet.
 *
 * Run: node scripts/backtest-statcast.mjs
 */

import { createWriteStream } from 'node:fs'
import { createReadStream } from 'node:fs'
import { writeFile } from 'node:fs/promises'
import { Readable } from 'node:stream'
import { createInterface } from 'node:readline'
import { pathToFileURL } from 'node:url'
import { addPlateAppearance, compareWindows, hitterFromCount, parseCsv } from './statcast.mjs'

const SPLIT = '2026-07-01'
const SEASON = ['2026-03-25', '2026-11-08']

function searchUrl(after, before) {
  const params = new URLSearchParams({
    all: 'true',
    type: 'details',
    player_type: 'batter',
    hfGT: 'R|',
    min_pitches: '0',
    min_results: '0',
    min_pas: '0',
  })
  return `https://baseballsavant.mlb.com/statcast_search/csv?${params}&hfSea=${encodeURIComponent('2026|')}&game_date_gt=${after}&game_date_lt=${before}`
}

async function download(url, file) {
  const response = await fetch(url, { headers: { Accept: 'text/csv', 'User-Agent': 'SidelineProjection/0.1' } })
  if (!response.ok) throw new Error(`${response.status} ${url}`)
  await new Promise((resolve, reject) => {
    const out = createWriteStream(file)
    Readable.fromWeb(response.body).pipe(out)
    out.on('finish', resolve)
    out.on('error', reject)
  })
}

async function aggregate(file, counts) {
  const lines = createInterface({ input: createReadStream(file), crlfDelay: Infinity })
  let header = null
  let pitches = 0
  for await (const line of lines) {
    if (!header) {
      header = line
      continue
    }
    if (!line) continue
    pitches += 1
    const [row] = parseCsv(`${header}\n${line}`)
    addPlateAppearance(counts, row)
  }
  return pitches
}

async function pull(after, before, counts, depth = 0) {
  const file = `/tmp/statcast-${after}-${before}.csv`
  await download(searchUrl(after, before), file)
  const pitches = await aggregate(file, new Map())
  if (pitches >= 25000 && depth < 5) {
    const start = new Date(`${after}T00:00:00Z`)
    const end = new Date(`${before}T00:00:00Z`)
    const mid = new Date((start.getTime() + end.getTime()) / 2).toISOString().slice(0, 10)
    if (mid !== after && mid !== before) {
      process.stderr.write(`split ${after} ${before}\n`)
      await pull(after, mid, counts, depth + 1)
      await pull(mid, before, counts, depth + 1)
      return
    }
  }
  await aggregate(file, counts)
  process.stderr.write(`${after} to ${before}: ${pitches}\n`)
}

function pct(hits, decided) {
  if (!decided) return '0/0'
  return `${((hits / decided) * 100).toFixed(1)}% (${hits}/${decided})`
}

function slices(start, end) {
  const out = []
  let cursor = start
  while (cursor < end) {
    const next = new Date(`${cursor}T00:00:00Z`)
    next.setUTCDate(next.getUTCDate() + 3)
    const bound = next.toISOString().slice(0, 10)
    out.push([cursor, bound < end ? bound : end])
    cursor = bound < end ? bound : end
  }
  return out
}

async function main() {
  const early = new Map()
  const late = new Map()
  for (const [after, before] of slices(SEASON[0], SEASON[1])) {
    const counts = before <= SPLIT ? early : after >= SPLIT ? late : null
    if (counts) {
      await pull(after, before, counts)
      continue
    }
    await pull(after, SPLIT, early)
    await pull(SPLIT, before, late)
  }
  const hitters = {
    early: [...early.values()].map(hitterFromCount),
    late: [...late.values()].map(hitterFromCount),
  }
  process.stderr.write(`early ${hitters.early.length}, late ${hitters.late.length}\n`)
  const result = compareWindows(hitters.early, hitters.late, 80)
  const lines = [
    '# Statcast walk-forward',
    '',
    `Run at ${new Date().toISOString()} UTC. Regular-season pitches before July 1, 2026 predict batting average from July 1 through November 7. A hitter needs 80 at-bats in each half. xBA puts the Statcast estimated batting average on each batted ball over all at-bats, so a strikeout counts as zero. Batting average is the hit rate. Lower absolute error is the better predictor. This is not a bet.`,
    '',
    `| Hitters | First-half BA error | First-half xBA error | Hot hitters who fell | Cold hitters who rose |`,
    `| --- | --- | --- | --- | --- |`,
    `| ${result.hitters} | ${result.baMae == null ? 'missing' : result.baMae.toFixed(3)} | ${result.xbaMae == null ? 'missing' : result.xbaMae.toFixed(3)} | ${pct(result.hotFell, result.hot)} | ${pct(result.coldRose, result.cold)} |`,
    '',
    'A hot hitter beat his contact by at least .020 in the first half. A cold hitter sat at least .020 under it. Fell means the second-half average was lower. Rose means it was higher.',
    '',
  ]
  const markdown = `${lines.join('\n')}\n`
  await writeFile('docs/projections/STATCAST-BACKTEST.md', markdown)
  process.stdout.write(markdown)
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  main().catch((error) => {
    console.error(error)
    process.exit(1)
  })
}
