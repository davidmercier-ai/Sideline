/**
 * Game script. A separate view from the four models.
 *
 * A fact needs a source and a date. A missing scheme stays missing.
 * An absence, a debut, or a quoted workload opens a branch.
 * A branch says what would confirm it and what would kill it.
 * Nothing here enters the four models, the sim, or the book prices,
 * and nothing here changes a Pass into a Bet.
 *
 * Run: node scripts/game-script.mjs path/to/game.json
 */

import { readFile } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'

const WORK = new Set(['out', 'debut', 'limited', 'questionable', 'in'])

export function gameScript(input) {
  const personnel = Array.isArray(input?.personnel) ? input.personnel : []
  const tendencies = Array.isArray(input?.tendencies) ? input.tendencies : []
  const scheme = input?.scheme && typeof input.scheme === 'object' ? input.scheme : {}
  const problems = []
  for (const fact of personnel) {
    if (!fact?.source || !fact?.date) problems.push(`${fact?.name || 'unnamed'} is missing a source or a date`)
    if (!WORK.has(fact?.status)) problems.push(`${fact?.name || 'unnamed'} has an unknown status`)
  }

  const branches = []
  for (const fact of personnel) {
    if (fact.status === 'in') continue
    branches.push(...branchesFor(fact, personnel))
  }

  return {
    game: input?.game ?? null,
    call: input?.call ?? null,
    changesBet: false,
    scheme: schemeReport(scheme),
    tendencies: tendencies.map(describeTendency),
    branches,
    problems,
  }
}

function branchesFor(fact, personnel) {
  const base = {
    person: fact.name,
    team: fact.team,
    role: fact.role,
    status: fact.status,
    source: fact.source,
    date: fact.date,
    quote: fact.quote ?? null,
    changesBet: false,
  }
  if (fact.status === 'limited' || fact.status === 'debut') {
    const workload = fact.quote
      ? `Quoted workload: ${fact.quote}`
      : 'No workload was quoted.'
    const limitedConfirm = fact.status === 'debut'
      ? `${fact.name} plays.`
      : `${fact.name} plays and the snap count stays under the old job.`
    return [
      {
        ...base,
        name: `${fact.name} ${fact.status}`,
        script: `${fact.team} ${fact.role} ${fact.name} is a ${fact.status}. ${workload} The snaps in the old log are not this week's snaps.`,
        confirm: limitedConfirm,
        kill: `${fact.name} is inactive, or the snap count matches the old job.`,
      },
      {
        ...base,
        name: `${fact.name} full`,
        script: `${fact.name} plays the old job anyway. There is still no game in this team's log with that workload.`,
        confirm: `${fact.name} plays a full snap count.`,
        kill: `${fact.name} is inactive or limited.`,
      },
    ]
  }
  if (fact.status === 'out') {
    const next = namedReplacement(fact, personnel)
    const spot = otherSpot(fact, personnel)
    return [{
      ...base,
      name: `${fact.name} out`,
      script: [
        `${fact.team} ${fact.role} ${fact.name} is out.`,
        next ? `${next.name} is the named player still in at ${next.role}.` : 'The replacement is not named.',
        spot ? `${spot.team} ${spot.role} ${spot.name} is the named player on the other side (${spot.status}).` : 'The other side of that matchup is not named.',
        'The log was built with the absent player in it.',
      ].join(' '),
      confirm: `${fact.name} is inactive.`,
      kill: `${fact.name} plays.`,
    }]
  }
  return [{
    ...base,
    name: `${fact.name} ${fact.status}`,
    script: `${fact.name} is ${fact.status}. That is not an absence and not a debut.`,
    confirm: `The status stays ${fact.status}.`,
    kill: 'The status changes to out or in.',
  }]
}

function namedReplacement(fact, personnel) {
  if (!fact.replacement) return null
  return personnel.find((other) => other.name === fact.replacement) || { name: fact.replacement, role: fact.role }
}

function otherSpot(fact, personnel) {
  if (!fact.matchup) return null
  return personnel.find((other) => other.name === fact.matchup) || { name: fact.matchup, team: 'other side', role: 'unnamed', status: 'not on this list' }
}

function schemeReport(scheme) {
  const offense = scheme.offense ?? null
  const defense = scheme.defense ?? null
  if (!offense && !defense) {
    return { recorded: false, text: 'Scheme is not recorded for either side.' }
  }
  if (!offense || !defense) {
    const have = offense ? 'offense' : 'defense'
    const miss = offense ? 'defense' : 'offense'
    return { recorded: false, text: `Scheme is recorded for the ${have} only. The ${miss} scheme is missing.` }
  }
  return {
    recorded: true,
    text: `${offense.team} offense, ${offense.source} ${offense.date}: ${offense.text} ${defense.team} defense, ${defense.source} ${defense.date}: ${defense.text}`,
  }
}

function describeTendency(row) {
  const gap = Number.isFinite(row.offense) && Number.isFinite(row.defense) ? row.offense - row.defense : null
  return {
    label: row.label,
    offense: row.offense ?? null,
    defense: row.defense ?? null,
    gap,
    edge: false,
    text: gap == null
      ? `${row.label} is missing a side.`
      : `${row.label}: offense ${row.offense}, defense allowance ${row.defense}, gap ${round(gap)}. This is a description, not an edge.`,
  }
}

function round(value) {
  return Math.round(value * 10) / 10
}

export function formatScript(result) {
  const lines = []
  lines.push(result.game ? `Game: ${result.game}` : 'Game: missing')
  lines.push(`Call: ${result.call ?? 'missing'}. The script does not change it.`)
  lines.push(result.scheme.text)
  for (const row of result.tendencies) lines.push(row.text)
  if (result.branches.length === 0) lines.push('No personnel branch.')
  for (const branch of result.branches) {
    lines.push(`Branch: ${branch.name}. ${branch.script} Confirm: ${branch.confirm} Kill: ${branch.kill}`)
  }
  for (const problem of result.problems) lines.push(`Problem: ${problem}`)
  return lines.join('\n')
}

async function main() {
  const file = process.argv[2]
  if (!file) throw new Error('Pass a game script JSON file')
  const input = JSON.parse(await readFile(file, 'utf8'))
  const result = gameScript(input)
  process.stdout.write(`${formatScript(result)}\n`)
}

const entry = process.argv[1]
if (entry && import.meta.url === pathToFileURL(entry).href) {
  main().catch((error) => {
    console.error(error)
    process.exit(1)
  })
}
