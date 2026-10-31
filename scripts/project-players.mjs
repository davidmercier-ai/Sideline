/**
 * Build the player baseline from the props already saved in book-access.json.
 * The log is the player's own regular season. A book line is attached only
 * when that file already has one. A missing player stays missing.
 *
 * Run: node scripts/project-players.mjs
 */

import { readFile, writeFile } from 'node:fs/promises'
import { comparePlayerReads, playerReads } from './projection-math.mjs'
import { fetchPlayerLog, looseName, playerNameFromLeg, playerStat, teamShortNames } from './player-logs.mjs'

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

function leagueOf(label) {
  const text = String(label ?? '')
  if (/nfl/i.test(text)) return 'nfl'
  if (/nba/i.test(text)) return 'nba'
  return null
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

async function main() {
  const book = JSON.parse(await readFile('docs/projections/book-access.json', 'utf8'))
  const props = [...(book.draftKings || []), ...(book.fanDuel?.props || [])]
  const wanted = new Map()
  for (const row of props) {
    const league = leagueOf(row.label)
    const spec = playerStat(row.market, row.selection)
    if (!league || !spec) continue
    const name = playerNameFromLeg(row)
    if (!name || /defense|d\/st|no touchdown/i.test(name)) continue
    const key = `${league}|${looseName(name)}`
    if (!wanted.has(key)) wanted.set(key, { name, league })
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
      const team = teams.get(log.team) || ''
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
    const spec = playerStat(row.market, row.selection)
    const league = leagueOf(row.label)
    if (!spec || !league) continue
    if (!spec.binary && String(row.selection).toLowerCase() !== 'over' && String(row.side).toLowerCase() !== 'over') continue
    const name = playerNameFromLeg(row)
    const key = `${looseName(name)}|${spec.stat}|${row.event}|${row.line}`
    if (seen.has(key)) continue
    seen.add(key)
    const record = byName[looseName(name)]
    if (!record?.stats?.[spec.stat]) {
      comparisons.push({ name, event: row.event, market: row.market, stance: null, label: 'Player log missing.' })
      continue
    }
    const venue = venueFor(row.event, record.team)
    const reads = playerReads(record.stats[spec.stat], venue)
    const comparison = comparePlayerReads(reads, spec.binary ? 0.5 : row.line, {
      binary: spec.binary,
      direction: 'over',
    })
    comparisons.push({
      name: record.name,
      team: record.team,
      event: row.event,
      market: row.market,
      line: spec.binary ? null : row.line,
      stance: comparison.stance,
      label: comparison.label,
    })
  }

  const count = (stance) => comparisons.filter((row) => row.stance === stance).length
  const payload = {
    retrievedAt: new Date().toISOString(),
    source: 'docs/projections/book-access.json',
    players: Object.keys(byName).length,
    failed,
    byName,
    comparisons,
  }
  await writeFile('docs/projections/player-baseline.json', JSON.stringify(payload))
  const sample = (stance) => comparisons.filter((row) => row.stance === stance).slice(0, 8)
  const lineFor = (row) => {
    const read = row.label.split('.')[0]
    return `- ${row.name}${row.team ? ` (${row.team})` : ''}: ${row.market}${row.line == null ? '' : ` ${row.line}`}. ${read}.`
  }
  const lines = [
    '# Player baseline',
    '',
    `Retrieved ${payload.retrievedAt} UTC. Regular-season ESPN gamelogs for the NFL and NBA names on the saved FanDuel and DraftKings prop boards.`,
    '',
    'The four reads are the player venue mean, overall mean, venue median, and last three games. Opponent allowance is not applied. A yes/no stat, such as an anytime touchdown, compares each read with one half of the games. A counting stat uses the same 1-unit band as a team total. The stance needs the venue read and at least three reads on that side. It is not a win probability and it is not a priced edge.',
    '',
    'Stats in this pass: NFL passing, rushing, and receiving yards, receptions, and anytime touchdowns; NBA points, rebounds, assists, and threes. Other player stats stay open.',
    '',
    `| Players with a log | ${payload.players} |`,
    `| Lookups with no log | ${failed} |`,
    `| Prop rows compared | ${comparisons.length} |`,
    `| With the log | ${count('with')} |`,
    `| Against the log | ${count('against')} |`,
    `| Even or mixed | ${count('even')} |`,
    `| Unrated | ${comparisons.filter((row) => !row.stance).length} |`,
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

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
