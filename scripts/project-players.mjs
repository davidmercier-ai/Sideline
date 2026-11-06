/**
 * Build the player baseline from the DraftKings prop lines attached on the slate.
 * The log is the player's own regular season. A missing player stays missing.
 *
 * Run: node scripts/project-players.mjs
 */

import { writeFile } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'
import { loadDraftKingsPropLines } from './book-prices.mjs'
import { comparePlayerReads, playerReads } from './projection-math.mjs'
import { fetchPlayerLog, looseName, teamShortNames } from './player-logs.mjs'

const FEED_STAT = {
  points: 'points',
  rebounds: 'reb',
  assists: 'ast',
  'passing yards': 'passYds',
  'rushing yards': 'rushYds',
  'receiving yards': 'recYds',
}

export function propBoardCall(reads, line) {
  const venue = reads?.[0]
  if (!venue || venue.missing || venue.thin || !Number.isFinite(line)) return null
  if (!Array.isArray(reads) || reads.length < 4) return null
  if (reads.some((read) => read.missing || read.thin || !Number.isFinite(read.value))) return null
  if (reads.every((read) => read.value - line >= 1)) return 'over'
  if (reads.every((read) => line - read.value >= 1)) return 'under'
  return null
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
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, () => run()))
  return results
}

function venueFor(event, team) {
  if (!event || !team) return null
  const parts = String(event).split('@')
  if (parts.length !== 2) return null
  const away = parts[0]
  const home = parts[1]
  const token = team.toLowerCase()
  if (home.toLowerCase().includes(token)) return 'home'
  if (away.toLowerCase().includes(token)) return 'away'
  return null
}

async function attachedProps() {
  const rows = []
  for (const league of ['nba', 'nfl']) {
    const props = await loadDraftKingsPropLines(league)
    for (const prop of props) {
      const stat = FEED_STAT[prop.stat]
      if (!stat || !prop.player || !Number.isFinite(prop.line)) continue
      rows.push({
        ...prop,
        league,
        stat,
        event: `${prop.away} @ ${prop.home}`,
        market: `${prop.player} ${prop.stat}`,
      })
    }
  }
  return rows
}

async function main() {
  const props = await attachedProps()
  const wanted = new Map()
  for (const row of props) {
    const key = `${row.league}|${looseName(row.player)}`
    if (!wanted.has(key)) wanted.set(key, { name: row.player, league: row.league })
  }
  const jobs = [...wanted.values()]
  process.stderr.write(`players ${jobs.length}\n`)
  const [nflTeams, nbaTeams] = await Promise.all([teamShortNames('nfl'), teamShortNames('nba')])
  const byName = {}
  let failed = 0
  await pool(jobs, 8, async (job) => {
    try {
      const log = await fetchPlayerLog(job.name, job.league)
      if (!log || log.error || !log.games) {
        failed += 1
        process.stderr.write(`miss ${job.name}\n`)
        return
      }
      const teams = job.league === 'nba' ? nbaTeams : nflTeams
      const team = String(log.team || '').split('/').map((abbr) => teams.get(abbr.trim())).filter(Boolean).join('/')
      byName[looseName(log.name)] = {
        name: log.name,
        team,
        abbr: log.team,
        league: job.league,
        season: log.season,
        stats: log.stats,
      }
      process.stderr.write(`${log.name} ${log.team} n=${log.games}\n`)
    } catch (error) {
      failed += 1
      process.stderr.write(`fail ${job.name} ${error.message}\n`)
    }
  })

  const comparisons = []
  const seen = new Set()
  for (const row of props) {
    const key = `${looseName(row.player)}|${row.stat}|${row.event}|${row.line}`
    if (seen.has(key)) continue
    seen.add(key)
    const record = byName[looseName(row.player)]
    if (!record?.stats?.[row.stat]) {
      comparisons.push({ name: row.player, event: row.event, market: row.market, line: row.line, stance: null, board: null, label: 'Player log missing.' })
      continue
    }
    const venue = venueFor(row.event, record.team)
    const reads = playerReads(record.stats[row.stat], venue)
    const comparison = comparePlayerReads(reads, row.line, { direction: 'over' })
    comparisons.push({
      name: record.name,
      team: record.team,
      event: row.event,
      market: row.market,
      line: row.line,
      stance: comparison.stance,
      board: propBoardCall(reads, row.line),
      label: comparison.label,
    })
  }

  const count = (stance) => comparisons.filter((row) => row.stance === stance).length
  const payload = {
    retrievedAt: new Date().toISOString(),
    source: 'DraftKings NBA points, rebounds, and assists, and NFL passing, rushing, and receiving yards',
    players: Object.keys(byName).length,
    failed,
    byName,
    comparisons,
  }
  await writeFile('docs/projections/player-baseline.json', JSON.stringify(payload))
  const sample = (stance) => comparisons.filter((row) => row.stance === stance).slice(0, 8)
  const lineFor = (row) => `- ${row.name}${row.team ? ` (${row.team})` : ''}: ${row.market}${row.line == null ? '' : ` ${row.line}`}. ${row.label}`
  const lines = [
    '# Player baseline',
    '',
    `Retrieved ${payload.retrievedAt} UTC. Regular-season ESPN gamelogs for the names on the current DraftKings prop lines.`,
    '',
    'The four reads are the player venue mean, overall mean, venue median, and last three games. Opponent allowance is not applied. A counting stat uses the same 1-unit band as a team total. The stance needs the venue read and at least three reads on that side. A board row needs all four reads at least 1 unit past the line and a venue sample of at least 3 games. That row is a record, not a bet. It is not a win probability and it is not a priced edge.',
    '',
    'Stats in this pass: NBA points, rebounds, and assists; NFL passing, rushing, and receiving yards. Other player stats stay open.',
    '',
    `| Players with a log | ${payload.players} |`,
    `| Lookups with no log | ${failed} |`,
    `| Prop rows compared | ${comparisons.length} |`,
    `| With the log | ${count('with')} |`,
    `| Against the log | ${count('against')} |`,
    `| Even or mixed | ${count('even')} |`,
    `| Unrated | ${comparisons.filter((row) => !row.stance).length} |`,
    `| Board over | ${comparisons.filter((row) => row.board === 'over').length} |`,
    `| Board under | ${comparisons.filter((row) => row.board === 'under').length} |`,
    '',
    '## Board over',
    '',
    ...comparisons.filter((row) => row.board === 'over').slice(0, 8).map(lineFor),
    '',
    '## Board under',
    '',
    ...comparisons.filter((row) => row.board === 'under').slice(0, 8).map(lineFor),
    '',
    '## With the log',
    '',
    ...sample('with').map(lineFor),
    '',
    '## Against the log',
    '',
    ...sample('against').map(lineFor),
    '',
    'The full rows are in `docs/projections/player-baseline.json`.',
    '',
  ]
  await writeFile('docs/projections/PLAYER-BASELINE.md', `${lines.join('\n')}\n`)
  process.stdout.write(`players ${payload.players}\nfailed ${failed}\ncompared ${comparisons.length}\nwith ${count('with')}\nagainst ${count('against')}\n`)
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  main().catch((error) => {
    console.error(error)
    process.exit(1)
  })
}
