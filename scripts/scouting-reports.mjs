/**
 * Scouting reports. Their own store.
 *
 * A report keeps a source, a date, and only what the source said.
 * The game script may read a status off that report.
 * A scouted sim may drop a venue game only when a report names that
 * team and that date. The result stays labeled apart from the base sim.
 * The four models and the base sim stay on the full log.
 * A snap share is not a field. One is never applied.
 *
 * Run: node scripts/scouting-reports.mjs docs/projections/scouting/reports.json
 */

import { readFile } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'
import { mulberry32, simulateMatch } from './projection-math.mjs'

const WORK = new Set(['out', 'debut', 'limited', 'questionable', 'in'])
const DAY = /^\d{4}-\d{2}-\d{2}$/

export function teamKey(value) {
  return String(value ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

export function dayKey(value) {
  const match = String(value ?? '').match(/^(\d{4}-\d{2}-\d{2})/)
  return match ? match[1] : null
}

export function saveReport(store, report) {
  const problems = []
  const id = typeof report?.id === 'string' ? report.id.trim() : ''
  const source = typeof report?.source === 'string' ? report.source.trim() : ''
  const date = typeof report?.date === 'string' ? report.date.trim() : ''
  const said = typeof report?.said === 'string' ? report.said.trim() : ''
  if (!id) problems.push('missing id')
  if (!source) problems.push('missing source')
  if (!DAY.test(date)) problems.push('missing date')
  if (!said) problems.push('missing what the source said')
  if (report?.status != null && !WORK.has(report.status)) problems.push(`${report.subject || id} has an unknown status`)
  const drops = cleanDrops(report?.dropGames)
  problems.push(...drops.problems)
  const reports = Array.isArray(store?.reports) ? store.reports.slice() : []
  if (problems.length) return { ok: false, store: { reports }, problems }

  const clean = {
    id,
    game: textOrNull(report.game),
    subject: textOrNull(report.subject),
    team: textOrNull(report.team),
    role: textOrNull(report.role),
    status: report.status ?? null,
    source,
    date,
    said,
    quote: textOrNull(report.quote),
    replacement: textOrNull(report.replacement),
    matchup: textOrNull(report.matchup),
    dropGames: drops.dropGames,
  }
  const index = reports.findIndex((row) => row.id === id)
  if (index >= 0) reports[index] = clean
  else reports.push(clean)
  return { ok: true, store: { reports }, problems: [] }
}

export function personnelFromReports(reports) {
  const personnel = []
  const problems = []
  for (const report of reports ?? []) {
    if (!report?.status) continue
    const name = report.subject || 'unnamed'
    if (!WORK.has(report.status)) {
      problems.push(`${name} has an unknown status`)
      continue
    }
    if (!report.source || !DAY.test(report.date ?? '') || !report.subject) {
      problems.push(`${name} is missing a source, a date, or a subject`)
      continue
    }
    personnel.push({
      name: report.subject,
      team: report.team ?? null,
      role: report.role ?? null,
      status: report.status,
      source: report.source,
      date: report.date,
      quote: report.quote || report.said || null,
      replacement: report.replacement ?? null,
      matchup: report.matchup ?? null,
    })
  }
  return { personnel, problems }
}

export function scriptFromReports(reports, base = {}) {
  const picked = base.game
    ? (reports ?? []).filter((report) => report.game === base.game)
    : (reports ?? [])
  const { personnel, problems } = personnelFromReports(picked)
  return {
    game: base.game ?? null,
    call: base.call ?? null,
    scheme: base.scheme ?? {},
    tendencies: base.tendencies ?? [],
    personnel,
    problems,
  }
}

/**
 * Run the base sim on the full lists, then a second sim that drops only
 * the dated games a sourced report names. Share of draws is not a win probability.
 */
export function scoutedSim({
  awayFor = [],
  homeAgainst = [],
  homeFor = [],
  awayAgainst = [],
  reports = [],
  seed,
  draws = 2000,
  homeMarginLine,
  totalLine,
} = {}) {
  const problems = []
  if (!Number.isFinite(seed)) problems.push('missing seed')
  const named = namedDrops(reports, problems)
  const lists = {
    awayFor: asRows(awayFor),
    homeAgainst: asRows(homeAgainst),
    homeFor: asRows(homeFor),
    awayAgainst: asRows(awayAgainst),
  }
  const dropped = []
  const kept = {}
  for (const [name, rows] of Object.entries(lists)) {
    kept[name] = []
    for (const row of rows) {
      if (matchesDrop(row, named)) dropped.push({ list: name, team: row.team, date: dayKey(row.date), value: row.value })
      else kept[name].push(row)
    }
  }
  const baseInput = {
    awayFor: values(lists.awayFor),
    homeAgainst: values(lists.homeAgainst),
    homeFor: values(lists.homeFor),
    awayAgainst: values(lists.awayAgainst),
    draws,
    homeMarginLine,
    totalLine,
  }
  const scoutInput = {
    awayFor: values(kept.awayFor),
    homeAgainst: values(kept.homeAgainst),
    homeFor: values(kept.homeFor),
    awayAgainst: values(kept.awayAgainst),
    draws,
    homeMarginLine,
    totalLine,
  }
  const base = Number.isFinite(seed)
    ? { ...simulateMatch({ ...baseInput, random: mulberry32(seed) }), label: 'base' }
    : { ok: false, reason: 'missing seed', label: 'base' }
  const scouted = Number.isFinite(seed)
    ? { ...simulateMatch({ ...scoutInput, random: mulberry32(seed) }), label: 'scouted' }
    : { ok: false, reason: 'missing seed', label: 'scouted' }
  return {
    base,
    scouted,
    dropped,
    problems,
    counts: {
      base: countRows(lists),
      scouted: countRows(kept),
    },
  }
}

export function formatReports(store) {
  const reports = store?.reports ?? []
  if (reports.length === 0) return 'No scouting reports.'
  return reports
    .map((report) => {
      const who = report.subject || report.team || 'unnamed'
      const game = report.game ? ` (${report.game})` : ''
      return `${who}${game}. ${report.date}. ${report.source}. ${report.said}`
    })
    .join('\n')
}

function cleanDrops(dropGames) {
  if (dropGames == null) return { dropGames: [], problems: [] }
  if (!Array.isArray(dropGames)) return { dropGames: [], problems: ['drop games are not a list'] }
  const clean = []
  for (const drop of dropGames) {
    const team = typeof drop?.team === 'string' ? drop.team.trim() : ''
    if (!team || !DAY.test(drop?.date ?? '')) {
      return { dropGames: [], problems: ['a dropped game needs a team and a YYYY-MM-DD date'] }
    }
    clean.push({ team, date: drop.date })
  }
  return { dropGames: clean, problems: [] }
}

function namedDrops(reports, problems) {
  const named = []
  for (const report of reports ?? []) {
    const drops = report?.dropGames
    if (!Array.isArray(drops) || drops.length === 0) continue
    if (!report.source || !DAY.test(report.date ?? '')) {
      problems.push(`${report.subject || report.id || 'unnamed'} names a game without a source and a date`)
      continue
    }
    for (const drop of drops) {
      if (!drop?.team || !DAY.test(drop.date ?? '')) continue
      named.push({ team: teamKey(drop.team), date: drop.date })
    }
  }
  return named
}

function matchesDrop(row, named) {
  const date = dayKey(row.date)
  const team = teamKey(row.team)
  if (!date || !team) return false
  return named.some((drop) => drop.date === date && drop.team === team)
}

function asRows(list) {
  return (list ?? []).map((item) => {
    if (item != null && typeof item === 'object') {
      return { date: item.date ?? null, team: item.team ?? null, value: Number(item.value) }
    }
    return { date: null, team: null, value: Number(item) }
  })
}

function values(rows) {
  return rows.map((row) => row.value)
}

function countRows(lists) {
  return {
    awayFor: lists.awayFor.length,
    homeAgainst: lists.homeAgainst.length,
    homeFor: lists.homeFor.length,
    awayAgainst: lists.awayAgainst.length,
  }
}

function textOrNull(value) {
  if (typeof value !== 'string') return null
  const text = value.trim()
  return text || null
}

async function main() {
  const file = process.argv[2]
  if (!file) throw new Error('Pass a scouting report JSON file')
  const store = JSON.parse(await readFile(file, 'utf8'))
  process.stdout.write(`${formatReports(store)}\n`)
}

const entry = process.argv[1]
if (entry && import.meta.url === pathToFileURL(entry).href) {
  main().catch((error) => {
    console.error(error)
    process.exit(1)
  })
}
