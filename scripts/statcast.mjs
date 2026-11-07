/**
 * Baseball Savant Statcast for the current season.
 * Plate appearances and batted balls are the volume.
 * Exit velocity, barrel rate, and hard-hit rate are the quality.
 * Batting average is the conversion. xBA is the contact quality stated as a batting average.
 * A gap between BA and xBA is not a bet.
 *
 * Run: node scripts/statcast.mjs
 * Run: node scripts/statcast.mjs "Pete Crow-Armstrong"
 */

import { writeFile } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'
import { looseName } from './player-logs.mjs'

const SAVANT = 'https://baseballsavant.mlb.com'
const YEAR = 2026
const MIN_PA = 50

export function parseCsv(text) {
  const rows = []
  let row = []
  let cell = ''
  let quoted = false
  const source = String(text ?? '').replace(/^\uFEFF/, '')
  for (let i = 0; i < source.length; i += 1) {
    const char = source[i]
    if (quoted) {
      if (char === '"') {
        if (source[i + 1] === '"') {
          cell += '"'
          i += 1
        } else quoted = false
      } else cell += char
    } else if (char === '"') quoted = true
    else if (char === ',') {
      row.push(cell)
      cell = ''
    } else if (char === '\n') {
      row.push(cell)
      if (row.some((item) => item !== '')) rows.push(row)
      row = []
      cell = ''
    } else if (char !== '\r') cell += char
  }
  if (cell.length || row.length) {
    row.push(cell)
    if (row.some((item) => item !== '')) rows.push(row)
  }
  const header = rows[0] ?? []
  return rows.slice(1).map((fields) => Object.fromEntries(header.map((key, index) => [key, fields[index] ?? ''])))
}

function num(value) {
  if (value == null || value === '') return null
  const number = Number(String(value).replace('%', ''))
  return Number.isFinite(number) ? number : null
}

export const HIT_EVENTS = new Set(['single', 'double', 'triple', 'home_run'])
export const NON_AB_EVENTS = new Set([
  'walk', 'intent_walk', 'hit_by_pitch', 'sac_bunt', 'sac_fly', 'sac_fly_double_play', 'catcher_interf',
])

export function addPlateAppearance(map, pitch) {
  const event = pitch?.events
  if (!event || !pitch?.batter) return map
  const id = String(pitch.batter)
  const row = map.get(id) ?? {
    id,
    name: savantName({ 'last_name, first_name': pitch.player_name || '' }),
    pa: 0,
    ab: 0,
    hits: 0,
    bip: 0,
    xbaSum: 0,
    evSum: 0,
    evCount: 0,
    barrels: 0,
    hardHit: 0,
  }
  row.pa += 1
  if (!NON_AB_EVENTS.has(event)) row.ab += 1
  if (HIT_EVENTS.has(event)) row.hits += 1
  const xba = Number(pitch.estimated_ba_using_speedangle)
  if (Number.isFinite(xba)) {
    row.bip += 1
    row.xbaSum += xba
    if (String(pitch.launch_speed_angle) === '6') row.barrels += 1
  }
  const speed = Number(pitch.launch_speed)
  if (Number.isFinite(speed)) {
    row.evSum += speed
    row.evCount += 1
    if (speed >= 95) row.hardHit += 1
  }
  map.set(id, row)
  return map
}

export function hitterFromCount(row) {
  const ba = row.ab ? row.hits / row.ab : null
  // Strikeouts add an at-bat and a zero. They are not in the batted-ball sum.
  const xba = row.ab ? row.xbaSum / row.ab : null
  return {
    ...row,
    ba,
    xba,
    baMinusXba: ba != null && xba != null ? ba - xba : null,
    exitVelocity: row.evCount ? row.evSum / row.evCount : null,
    barrelRate: row.bip ? (row.barrels / row.bip) * 100 : null,
    hardHitRate: row.evCount ? (row.hardHit / row.evCount) * 100 : null,
  }
}

/**
 * First window predicts the second window's batting average.
 * The hit rate is the first-window BA. The process is the first-window xBA.
 * Lower absolute error is the better predictor. This is not a bet.
 */
export function compareWindows(early, late, minAb = 80) {
  const later = new Map((late ?? []).map((row) => [row.id, row]))
  const paired = []
  for (const row of early ?? []) {
    const next = later.get(row.id)
    if (!next || row.ab < minAb || next.ab < minAb || row.xba == null || row.ba == null || next.ba == null) continue
    paired.push({
      id: row.id,
      name: row.name,
      earlyBa: row.ba,
      earlyXba: row.xba,
      lateBa: next.ba,
    })
  }
  const mae = (pick) => {
    if (!paired.length) return null
    return paired.reduce((sum, row) => sum + Math.abs(pick(row) - row.lateBa), 0) / paired.length
  }
  const hot = paired.filter((row) => row.earlyBa - row.earlyXba >= 0.02)
  const cold = paired.filter((row) => row.earlyXba - row.earlyBa >= 0.02)
  const fell = hot.filter((row) => row.lateBa < row.earlyBa).length
  const rose = cold.filter((row) => row.lateBa > row.earlyBa).length
  return {
    hitters: paired.length,
    baMae: mae((row) => row.earlyBa),
    xbaMae: mae((row) => row.earlyXba),
    hot: hot.length,
    hotFell: fell,
    cold: cold.length,
    coldRose: rose,
  }
}

export function savantName(row) {
  const combined = row?.['last_name, first_name'] || ''
  const [last, first] = combined.split(',').map((part) => part.trim())
  if (first && last) return `${first} ${last}`
  return combined
}

export function statcastProfile(expected, quality) {
  const row = { ...(expected ?? {}), ...(quality ?? {}) }
  const ba = num(row.ba)
  const xba = num(row.est_ba ?? row.xba)
  return {
    name: savantName(row),
    id: String(row.player_id || ''),
    year: num(row.year),
    pa: num(row.pa),
    bip: num(row.bip),
    ba,
    xba,
    baMinusXba: ba != null && xba != null ? ba - xba : null,
    slg: num(row.slg),
    xslg: num(row.est_slg ?? row.xslg),
    woba: num(row.woba),
    xwoba: num(row.est_woba ?? row.xwoba),
    exitVelocity: num(row.exit_velocity_avg ?? row.avg_hit_speed),
    launchAngle: num(row.launch_angle_avg),
    barrelRate: num(row.barrel_batted_rate ?? row.brl_percent),
    hardHitRate: num(row.hard_hit_percent),
  }
}

export function joinStatcast(expectedRows, qualityRows) {
  const quality = new Map((qualityRows ?? []).map((row) => [String(row.player_id), row]))
  const expected = new Map((expectedRows ?? []).map((row) => [String(row.player_id), row]))
  const ids = new Set([...quality.keys(), ...expected.keys()])
  return [...ids]
    .map((id) => statcastProfile(expected.get(id), quality.get(id)))
    .filter((row) => row.id && row.name)
    .sort((a, b) => (b.pa ?? 0) - (a.pa ?? 0) || a.name.localeCompare(b.name))
}

export function findStatcast(rows, name) {
  const target = looseName(name)
  if (!target) return null
  return (rows ?? []).find((row) => looseName(row.name) === target)
    ?? (rows ?? []).find((row) => looseName(row.name).endsWith(target) || target.endsWith(looseName(row.name)))
    ?? null
}

export function matchBatters(rows, names) {
  const found = []
  const seen = new Set()
  for (const name of names ?? []) {
    const hitter = findStatcast(rows, name)
    if (!hitter || seen.has(hitter.id)) continue
    seen.add(hitter.id)
    found.push(hitter)
  }
  return found.sort((a, b) => (b.pa ?? 0) - (a.pa ?? 0))
}

export function batterNames(summary) {
  const names = new Set()
  const take = (athlete) => {
    const name = athlete?.displayName || athlete?.fullName
    if (name) names.add(name)
  }
  for (const group of summary?.boxscore?.players || []) {
    for (const stat of group.statistics || []) {
      for (const athlete of stat.athletes || []) take(athlete.athlete)
    }
  }
  for (const group of summary?.rosters || []) {
    for (const player of group.roster || group.athletes || []) take(player.athlete || player.person || player)
  }
  const teams = summary?.boxscore?.teams || {}
  for (const side of Object.values(teams)) {
    for (const player of Object.values(side?.players || {})) take(player.person)
  }
  return [...names].sort((a, b) => a.localeCompare(b))
}

function csvUrl(kind, year) {
  if (kind === 'expected') {
    return `${SAVANT}/leaderboard/expected_statistics?type=batter&year=${year}&position=&team=&filterType=pa&min=${MIN_PA}&csv=true`
  }
  const fields = [
    'pa', 'k_percent', 'bb_percent', 'xba', 'xslg', 'woba', 'xwoba',
    'exit_velocity_avg', 'launch_angle_avg', 'sweet_spot_percent', 'barrel_batted_rate', 'hard_hit_percent',
  ].join('%2C')
  return `${SAVANT}/leaderboard/custom?year=${year}&type=batter&filter=&min=${MIN_PA}&selections=${fields}&chart=false&x=pa&y=pa&r=no&chartType=beeswarm&csv=true`
}

async function getText(url) {
  const response = await fetch(url, { headers: { Accept: 'text/csv', 'User-Agent': 'SidelineProjection/0.1' } })
  if (!response.ok) throw new Error(`${response.status} ${url}`)
  return response.text()
}

export async function loadStatcast(year = YEAR) {
  const [expected, quality] = await Promise.all([
    getText(csvUrl('expected', year)),
    getText(csvUrl('quality', year)),
  ])
  const rows = joinStatcast(parseCsv(expected), parseCsv(quality))
  if (!rows.length) throw new Error(`Baseball Savant returned no ${year} hitters`)
  return { year, minPa: MIN_PA, retrievedAt: new Date().toISOString(), hitters: rows }
}

export function statcastLines(hitters) {
  const lines = [
    '**Statcast**',
    '',
    `Baseball Savant ${YEAR}, minimum ${MIN_PA} plate appearances. Plate appearances are the volume. Exit velocity, barrel rate, and hard-hit rate are the quality. Batting average is the conversion. xBA is the contact quality stated as a batting average. A gap between BA and xBA is not a bet.`,
    '',
    '| Hitter | PA | EV | Barrel % | Hard-hit % | BA | xBA |',
    '| --- | --- | --- | --- | --- | --- | --- |',
  ]
  const shown = [...(hitters ?? [])].sort((a, b) => Math.abs(b.baMinusXba ?? 0) - Math.abs(a.baMinusXba ?? 0)).slice(0, 12)
  for (const row of shown) {
    const cell = (value, digits = 1) => (value == null ? 'missing' : value.toFixed(digits))
    lines.push(`| ${row.name} | ${row.pa ?? 'missing'} | ${cell(row.exitVelocity)} | ${cell(row.barrelRate)} | ${cell(row.hardHitRate)} | ${cell(row.ba, 3)} | ${cell(row.xba, 3)} |`)
  }
  if (!shown.length) lines.push('| No matched hitter with a Savant row | | | | | | |')
  lines.push('')
  return lines
}

function report(board) {
  const gap = (row) => row.baMinusXba ?? -Infinity
  const ranked = [...board.hitters].filter((row) => row.baMinusXba != null)
  const over = [...ranked].sort((a, b) => gap(b) - gap(a)).slice(0, 8)
  const under = [...ranked].sort((a, b) => gap(a) - gap(b)).slice(0, 8)
  const line = (row) => `| ${row.name} | ${row.pa} | ${row.exitVelocity?.toFixed(1) ?? 'missing'} | ${row.barrelRate?.toFixed(1) ?? 'missing'} | ${row.hardHitRate?.toFixed(1) ?? 'missing'} | ${row.ba?.toFixed(3) ?? 'missing'} | ${row.xba?.toFixed(3) ?? 'missing'} | ${(row.baMinusXba > 0 ? '+' : '') + row.baMinusXba.toFixed(3)} |`
  return [
    `# Statcast ${board.year}`,
    '',
    `Retrieved ${board.retrievedAt}. Baseball Savant, minimum ${board.minPa} plate appearances. ${board.hitters.length} hitters.`,
    '',
    'Plate appearances and batted balls are the volume. Exit velocity, barrel rate, and hard-hit rate are the quality. Batting average is the conversion. xBA is the contact quality stated as a batting average. A positive BA minus xBA means the results sit above the contact. That gap is not a bet.',
    '',
    '## Results above contact',
    '',
    '| Hitter | PA | EV | Barrel % | Hard-hit % | BA | xBA | BA − xBA |',
    '| --- | --- | --- | --- | --- | --- | --- | --- |',
    ...over.map(line),
    '',
    '## Contact above results',
    '',
    '| Hitter | PA | EV | Barrel % | Hard-hit % | BA | xBA | BA − xBA |',
    '| --- | --- | --- | --- | --- | --- | --- | --- |',
    ...under.map(line),
    '',
  ].join('\n')
}

async function main() {
  const name = process.argv.slice(2).join(' ').trim()
  const board = await loadStatcast(YEAR)
  if (name) {
    const hitter = findStatcast(board.hitters, name)
    process.stdout.write(`${JSON.stringify(hitter, null, 2)}\n`)
    return
  }
  await writeFile('docs/projections/statcast-2026.json', `${JSON.stringify(board)}\n`)
  await writeFile('docs/projections/STATCAST.md', `${report(board)}\n`)
  process.stdout.write(`wrote ${board.hitters.length} hitters\n`)
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  main().catch((error) => {
    console.error(error)
    process.exit(1)
  })
}
