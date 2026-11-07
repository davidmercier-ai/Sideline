/**
 * First scorer from the order of ESPN scoring plays.
 * First touchdown, first basket (first field goal, free throws do not count),
 * and first goal. An own goal does not credit a scorer.
 *
 * The four reads are the player's own log: venue share, overall share,
 * venue median, and last 3. Opponent allowance is not applied.
 * A share of games is not a win probability.
 *
 * Run: node scripts/first-scorer.mjs "Player Name" nfl|nba|nhl|epl
 */

import { pathToFileURL } from 'node:url'
import { comparePlayerReads, playerReads } from './projection-math.mjs'
import { fetchAthleteGamelog, looseName, sportPath } from './player-logs.mjs'

const ESPN = 'https://site.api.espn.com'

function seasonHasCurrentYear(data, season) {
  for (const category of season?.categories || []) {
    for (const event of category.events || []) {
      const date = String(data?.events?.[event.eventId]?.gameDate || '')
      if (/^2026|^2027/.test(date)) return true
    }
  }
  return false
}

export function currentSeason(data) {
  const seasons = data?.seasonTypes || []
  const named = seasons.find((item) => /2026|2027/.test(item.displayName || '') && /Regular/i.test(item.displayName || ''))
    || seasons.find((item) => /2026|2027/.test(item.displayName || '') && !/preseason|playoff|postseason/i.test(item.displayName || ''))
  if (named) return named
  return seasons.find((item) => /Regular/i.test(item.displayName || '') && seasonHasCurrentYear(data, item)) || null
}

export function gamesFromGamelog(data) {
  const season = currentSeason(data)
  const rows = []
  const seen = new Set()
  for (const category of season?.categories || []) {
    if (category.type !== 'event') continue
    for (const event of category.events || []) {
      if (!event.eventId || seen.has(event.eventId)) continue
      seen.add(event.eventId)
      const meta = data.events?.[event.eventId] || {}
      const at = meta.atVs
      rows.push({
        eventId: String(event.eventId),
        date: String(meta.gameDate || event.eventId),
        venue: at === '@' ? 'away' : at === 'vs' ? 'home' : 'neutral',
      })
    }
  }
  return rows
}

export function nameBeforeYards(text) {
  const match = String(text || '').match(/^(.+?) \d+ Yd\b/)
  return match ? match[1].trim() : null
}

export function firstTouchdownScorer(summary) {
  const play = (summary?.scoringPlays || []).find((item) => /touchdown/i.test(item.type?.text || ''))
  if (!play) return null
  const named = (play.athletes || []).find((item) => item.athlete?.displayName)
  return named?.athlete?.displayName || nameBeforeYards(play.text)
}

export function firstBasketScorer(summary) {
  const play = (summary?.plays || []).find((item) => (
    item.scoringPlay
    && Number(item.scoreValue) >= 2
    && !/free throw/i.test(item.type?.text || '')
  ))
  if (!play) return null
  const named = (play.participants || []).find((item) => item.athlete?.displayName)
  if (named) return named.athlete.displayName
  const match = String(play.text || '').match(/^(.+?) makes\b/)
  return match ? match[1].trim() : null
}

export function firstGoalScorer(summary) {
  const play = (summary?.plays || []).find((item) => item.scoringPlay && /^goal$/i.test(item.type?.text || ''))
  if (play) {
    const scorer = (play.participants || []).find((item) => /scorer/i.test(item.type || '') && item.athlete?.displayName)
    if (scorer) return scorer.athlete.displayName
    const match = String(play.text || '').match(/^(.+?) Goal\b/)
    return match ? match[1].trim() : null
  }
  const goal = (summary?.keyEvents || []).find((item) => item.scoringPlay && /goal/i.test(item.type?.text || ''))
  if (!goal || /own goal/i.test(`${goal.type?.text || ''} ${goal.text || ''}`)) return null
  return goal.participants?.[0]?.athlete?.displayName || null
}

const READ = {
  firstTd: firstTouchdownScorer,
  firstBasket: firstBasketScorer,
  firstGoal: firstGoalScorer,
}

export function readFirstScorer(kind, summary) {
  const read = READ[kind]
  return read ? read(summary) : null
}

export function leaderCall(reads) {
  const yes = (reads ?? []).map((read) => (
    Boolean(read) && !read.missing && Number.isFinite(read.value) && read.value >= 0.5
  ))
  const thin = (reads ?? []).some((read) => read?.thin)
  const count = yes.filter(Boolean).length
  return {
    pair: !thin && Boolean(yes[0]) && count >= 2,
    called: !thin && Boolean(yes[0]) && count >= 3,
    strict: !thin && yes.length >= 4 && yes.every(Boolean),
  }
}

export function rankFirstScorers(candidates) {
  return [...(candidates ?? [])].sort((a, b) => (
    Number(a.thin) - Number(b.thin)
    || b.reads[0].value - a.reads[0].value
    || (b.reads[1].value ?? -1) - (a.reads[1].value ?? -1)
    || (b.reads[3].value ?? -1) - (a.reads[3].value ?? -1)
    || String(a.name).localeCompare(String(b.name))
  ))
}

export function scoreGameLeaders(games, appearances) {
  const byPlayer = new Map()
  for (const row of appearances ?? []) {
    const key = `${looseName(row.name)}|${row.teamId}`
    const list = byPlayer.get(key) ?? []
    list.push(row)
    byPlayer.set(key, list)
  }
  const tally = {
    leader: { hits: 0, decided: 0 },
    pair: { hits: 0, decided: 0 },
    called: { hits: 0, decided: 0 },
    strict: { hits: 0, decided: 0 },
  }
  const ordered = [...(games ?? [])].sort((a, b) => String(a.date).localeCompare(String(b.date)))
  for (const game of ordered) {
    const candidates = []
    for (const rows of byPlayer.values()) {
      const current = rows.find((row) => row.eventId === game.id)
      if (!current || (current.venue !== 'home' && current.venue !== 'away')) continue
      const prior = rows.filter((row) => String(row.date) < String(game.date))
      const reads = playerReads(prior, current.venue)
      if (!reads[0] || reads[0].missing || !Number.isFinite(reads[0].value)) continue
      candidates.push({
        name: current.name,
        value: current.value,
        reads,
        thin: reads.some((read) => read.thin),
      })
    }
    if (!candidates.length) continue
    const leader = rankFirstScorers(candidates)[0]
    const call = leaderCall(leader.reads)
    tally.leader.decided += 1
    if (leader.value === 1) tally.leader.hits += 1
    for (const key of ['pair', 'called', 'strict']) {
      if (!call[key]) continue
      tally[key].decided += 1
      if (leader.value === 1) tally[key].hits += 1
    }
  }
  return tally
}

export function walkForwardFirst(rows) {
  const ordered = [...(rows ?? [])]
    .filter((row) => Number.isFinite(row?.value))
    .sort((a, b) => String(a.date).localeCompare(String(b.date)))
  const tally = {
    strict: { hits: 0, decided: 0 },
    called: { hits: 0, decided: 0 },
    pair: { hits: 0, decided: 0 },
    base: { hits: 0, decided: 0 },
  }
  for (let index = 0; index < ordered.length; index += 1) {
    const game = ordered[index]
    if (game.venue !== 'home' && game.venue !== 'away') continue
    const reads = playerReads(ordered.slice(0, index), game.venue)
    if (reads.some((read) => read.missing || !Number.isFinite(read.value))) continue
    tally.base.decided += 1
    if (game.value === 1) tally.base.hits += 1
    const call = leaderCall(reads)
    for (const key of ['pair', 'called', 'strict']) {
      if (!call[key]) continue
      tally[key].decided += 1
      if (game.value === 1) tally[key].hits += 1
    }
  }
  return tally
}

export function rowsForPlayer(games, scorers, playerName) {
  const target = looseName(playerName)
  const rows = []
  for (const game of games) {
    const found = scorers.get(String(game.eventId))
    if (!found || found.ok === false) continue
    rows.push({
      date: game.date,
      venue: game.venue,
      value: found.scorer && looseName(found.scorer) === target ? 1 : 0,
    })
  }
  return rows
}

async function getJson(url) {
  const response = await fetch(url, { headers: { Accept: 'application/json', 'User-Agent': 'SidelineProjection/0.1' } })
  if (!response.ok) throw new Error(`${response.status} ${url}`)
  return response.json()
}

async function pool(items, limit, worker) {
  const results = []
  let index = 0
  async function run() {
    while (index < items.length) {
      const current = index
      index += 1
      results[current] = await worker(items[current], current)
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, run))
  return results
}

export async function scorersForGames(league, games, kind) {
  const path = sportPath(league)
  const pairs = await pool(games, 6, async (game) => {
    try {
      const summary = await getJson(`${ESPN}/apis/site/v2/sports/${path}/summary?event=${game.eventId}`)
      return [game.eventId, { ok: true, scorer: readFirstScorer(kind, summary) }]
    } catch {
      return [game.eventId, { ok: false, scorer: null }]
    }
  })
  return new Map(pairs)
}

export async function firstScorerReads(name, league, kind) {
  const athlete = await fetchAthleteGamelog(name, league)
  if (!athlete || athlete.error) return { name, league, kind, error: athlete?.error || 'no ESPN player' }
  const games = gamesFromGamelog(athlete.data)
  const scorers = await scorersForGames(league, games, kind)
  const rows = rowsForPlayer(games, scorers, athlete.name)
  const show = (venue) => playerReads(rows, venue).map((read) => ({
    name: read.name,
    value: read.value,
    n: read.n,
    thin: read.thin,
    missing: read.missing,
  }))
  return {
    name: athlete.name,
    league,
    kind,
    games: rows.length,
    scored: rows.filter((row) => row.value === 1).length,
    home: show('home'),
    away: show('away'),
    homeCheck: comparePlayerReads(playerReads(rows, 'home'), 0.5, { binary: true }).label,
    awayCheck: comparePlayerReads(playerReads(rows, 'away'), 0.5, { binary: true }).label,
  }
}

async function main() {
  const name = process.argv[2]
  const league = process.argv[3]
  const kind = process.argv[4] || { nfl: 'firstTd', nba: 'firstBasket', nhl: 'firstGoal', epl: 'firstGoal' }[league]
  if (!name || !league || !kind) {
    console.error('Usage: node scripts/first-scorer.mjs "Player Name" nfl|nba|nhl|epl [firstTd|firstBasket|firstGoal]')
    process.exit(1)
  }
  const result = await firstScorerReads(name, league, kind)
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`)
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  main().catch((error) => {
    console.error(error)
    process.exit(1)
  })
}
