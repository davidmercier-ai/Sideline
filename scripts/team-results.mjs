/**
 * Collect each team's spread cover and over/under result.
 * The line is the DraftKings number ESPN still shows for that completed game.
 * A percentage is hits divided by decided games. A push is not decided.
 * The percentage is not a model and not an edge.
 */

import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import { gradeClosingLine, summarizeMarks } from './projection-math.mjs'
import { saveBoard, STORE_DIR } from './board-store.mjs'

const ESPN = 'https://site.api.espn.com'

function asNumber(value) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null
  if (value == null || value === '') return null
  const parsed = Number(String(value).replace(/[^\d.-]/g, ''))
  return Number.isFinite(parsed) ? parsed : null
}

function scoreValue(score) {
  return asNumber(score?.value ?? score?.displayValue ?? score)
}

async function getJson(path) {
  const response = await fetch(`${ESPN}${path}`)
  if (!response.ok) throw new Error(`${response.status} ${path}`)
  return response.json()
}

export function closingLine(summary) {
  const odds = summary?.odds?.length ? summary.odds : summary?.pickcenter ?? []
  const quote = odds.find((row) => String(row?.provider?.name || '').toLowerCase().includes('draft')) || odds[0]
  if (!quote) return { homeSpread: null, total: null, source: null }
  const homeSpread = asNumber(quote.spread)
  const total = asNumber(quote.overUnder)
  return {
    homeSpread: Number.isFinite(homeSpread) ? homeSpread : null,
    total: Number.isFinite(total) ? total : null,
    source: quote.provider?.name || 'espn',
  }
}

export function teamMark(row, line) {
  const graded = gradeClosingLine({
    pointsFor: row.pointsFor,
    pointsAgainst: row.pointsAgainst,
    venue: row.venue,
    homeSpread: line.homeSpread,
    total: line.total,
  })
  return {
    key: `${row.league}:${row.eventId}:${row.teamId}`,
    league: row.league,
    eventId: row.eventId,
    teamId: row.teamId,
    team: row.team,
    date: row.date,
    venue: row.venue,
    opponent: row.opponent,
    pointsFor: row.pointsFor,
    pointsAgainst: row.pointsAgainst,
    margin: graded.margin,
    combined: graded.combined,
    homeSpread: line.homeSpread,
    total: line.total,
    spreadResult: graded.spreadResult,
    totalResult: graded.totalResult,
    source: line.source,
  }
}

async function completedRows(sportPath, teamId, league) {
  const schedule = await getJson(`/apis/site/v2/sports/${sportPath}/teams/${teamId}/schedule`)
  const season = schedule.requestedSeason ?? schedule.season ?? {}
  const seasonYear = season.year ?? null
  const seasonType = season.type ?? null
  const rows = []
  for (const event of schedule.events ?? []) {
    const competition = event.competitions?.[0]
    if (!competition?.status?.type?.completed) continue
    const eventYear = event.season?.year
    if (seasonYear != null && eventYear != null && Number(eventYear) !== Number(seasonYear)) continue
    const eventType = event.seasonType?.type ?? event.season?.type?.type ?? event.season?.type
    if (seasonType != null && eventType != null && Number(eventType) !== Number(seasonType)) continue
    const sides = competition.competitors ?? []
    const me = sides.find((side) => String(side.team?.id) === String(teamId))
    const opp = sides.find((side) => String(side.team?.id) !== String(teamId))
    if (!me || !opp) continue
    const pointsFor = scoreValue(me.score)
    const pointsAgainst = scoreValue(opp.score)
    if (pointsFor == null || pointsAgainst == null) continue
    rows.push({
      league,
      eventId: String(event.id),
      teamId: String(teamId),
      team: me.team?.displayName || me.team?.abbreviation || String(teamId),
      date: event.date || competition.date || '',
      venue: competition.neutralSite ? 'neutral' : me.homeAway,
      opponent: opp.team?.abbreviation || opp.team?.displayName || '',
      pointsFor,
      pointsAgainst,
    })
  }
  return rows
}

export async function collectTeamResults(specs, { previous = [] } = {}) {
  const kept = new Map(previous.map((row) => [row.key, row]))
  const pending = []
  for (const spec of specs) {
    const rows = await completedRows(spec.sportPath, spec.teamId, spec.league)
    for (const row of rows) {
      if (!kept.has(row.key)) pending.push(row)
    }
  }
  const byEvent = new Map()
  for (const row of pending) {
    if (!byEvent.has(row.eventId)) byEvent.set(row.eventId, { sportPath: specs.find((spec) => spec.league === row.league)?.sportPath, rows: [] })
    byEvent.get(row.eventId).rows.push(row)
  }
  const events = [...byEvent.entries()]
  for (let index = 0; index < events.length; index += 4) {
    await Promise.all(events.slice(index, index + 4).map(async ([eventId, group]) => {
      let line = { homeSpread: null, total: null, source: null }
      try {
        const summary = await getJson(`/apis/site/v2/sports/${group.sportPath}/summary?event=${eventId}`)
        line = closingLine(summary)
      } catch {
        line = { homeSpread: null, total: null, source: null }
      }
      for (const row of group.rows) {
        const mark = teamMark(row, line)
        kept.set(mark.key, mark)
      }
    }))
  }
  return [...kept.values()]
}

export async function teamsOnBoard(sportPath, league, date) {
  const board = await getJson(`/apis/site/v2/sports/${sportPath}/scoreboard?dates=${date}`)
  const teams = []
  const seen = new Set()
  for (const event of board.events ?? []) {
    for (const side of event.competitions?.[0]?.competitors ?? []) {
      const teamId = side.team?.id
      if (!teamId || seen.has(String(teamId))) continue
      seen.add(String(teamId))
      teams.push({ sportPath, league, teamId: String(teamId), team: side.team?.displayName || side.team?.abbreviation })
    }
  }
  return teams
}

async function readPrevious(dir) {
  try {
    const saved = JSON.parse(await readFile(join(dir, 'team-results.json'), 'utf8'))
    return saved.rows ?? []
  } catch {
    return []
  }
}

export async function saveTeamResults(rows, dir = STORE_DIR) {
  const teams = summarizeMarks(rows).sort((left, right) => String(left.team).localeCompare(String(right.team)))
  const record = {
    id: 'team-results',
    title: 'Team spread covers and over unders',
    sportPath: null,
    retrievedAt: new Date().toISOString(),
    games: teams,
  }
  await saveBoard(record, dir)
  await mkdir(dir, { recursive: true })
  await writeFile(join(dir, 'team-results.json'), `${JSON.stringify({ ...record, rows }, null, 2)}\n`)
  return { teams: teams.length, rows: rows.length }
}

async function main() {
  const date = process.argv[2] || '20261101'
  const boards = [
    ['football/nfl', 'nfl'],
    ['basketball/nba', 'nba'],
    ['hockey/nhl', 'nhl'],
    ['soccer/usa.1', 'mls'],
  ]
  const specs = []
  for (const [sportPath, league] of boards) {
    try {
      specs.push(...(await teamsOnBoard(sportPath, league, date)))
    } catch (error) {
      console.error(league, error.message)
    }
  }
  const previous = await readPrevious(STORE_DIR)
  const rows = await collectTeamResults(specs, { previous })
  const saved = await saveTeamResults(rows)
  console.log(`team results ${saved.teams} teams, ${saved.rows} games`)
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error(error)
    process.exit(1)
  })
}
