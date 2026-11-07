/**
 * Walk-forward the shot leader against the first-goal share leader.
 * Shots are the volume. The share is the conversion. Neither is a probability.
 *
 * Run: node scripts/backtest-process.mjs
 */

import { writeFile } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'
import { looseName } from './player-logs.mjs'
import { readFirstScorer } from './first-scorer.mjs'
import { scoreProcessLeaders } from './process-layer.mjs'

const ESPN = 'https://site.api.espn.com'
const LEAGUES = [
  { name: 'EPL', path: 'soccer/eng.1', year: 2026 },
  { name: 'MLS', path: 'soccer/usa.1', year: 2026, regularName: true },
]

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
      results[current] = await worker(items[current])
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, run))
  return results
}

function statValue(player, key) {
  const stat = (player.stats || []).find((item) => item.name === key)
  const value = Number(stat?.value)
  return Number.isFinite(value) ? value : null
}

async function sample(league) {
  const teamsData = await getJson(`${ESPN}/apis/site/v2/sports/${league.path}/teams?limit=100`)
  const teams = (teamsData.sports?.[0]?.leagues?.[0]?.teams || []).map((entry) => entry.team).filter((team) => team?.id)
  const games = new Map()
  for (const team of teams) {
    const schedule = await getJson(`${ESPN}/apis/site/v2/sports/${league.path}/teams/${team.id}/schedule`)
    for (const event of schedule.events || []) {
      const competition = event.competitions?.[0]
      if (!competition?.status?.type?.completed) continue
      if (Number(event.season?.year) !== league.year) continue
      const eventType = Number(event.seasonType?.type ?? event.season?.type?.type ?? event.season?.type)
      const typeName = event.seasonType?.name || event.season?.type?.name || ''
      if (league.regularName && eventType !== 2 && !/^regular season$/i.test(typeName)) continue
      if (games.has(event.id)) continue
      games.set(event.id, { id: String(event.id), date: event.date || competition.date || '' })
    }
  }
  const list = [...games.values()]
  const appearances = []
  await pool(list, 8, async (game) => {
    try {
      const summary = await getJson(`${ESPN}/apis/site/v2/sports/${league.path}/summary?event=${game.id}`)
      const sides = summary.header?.competitions?.[0]?.competitors || []
      const awayId = String(sides.find((side) => side.homeAway === 'away')?.team?.id || '')
      const homeId = String(sides.find((side) => side.homeAway === 'home')?.team?.id || '')
      const scorer = readFirstScorer('firstGoal', summary)
      for (const group of summary.rosters || []) {
        const teamId = String(group.team?.id || '')
        const venue = teamId === homeId ? 'home' : teamId === awayId ? 'away' : 'neutral'
        for (const player of group.roster || []) {
          if (!(player.starter || player.subbedIn) || !player.athlete?.displayName) continue
          const shots = statValue(player, 'totalShots')
          if (shots == null) continue
          appearances.push({
            eventId: game.id,
            date: game.date,
            teamId,
            venue,
            name: player.athlete.displayName,
            shots,
            goals: statValue(player, 'totalGoals') ?? 0,
            first: scorer && looseName(scorer) === looseName(player.athlete.displayName) ? 1 : 0,
          })
        }
      }
    } catch {
      // A missing summary stays out of the sample.
    }
  })
  return { ...league, games: list.length, tally: scoreProcessLeaders(list, appearances) }
}

function record(hits, decided) {
  if (!decided) return '0/0'
  return `${((hits / decided) * 100).toFixed(1)}% (${hits}/${decided})`
}

async function main() {
  const only = process.argv[2]
  const results = []
  for (const league of LEAGUES.filter((item) => !only || item.name.toLowerCase() === only.toLowerCase())) {
    process.stderr.write(`loading ${league.name}\n`)
    const row = await sample(league)
    process.stderr.write(`${league.name}: ${row.games} games\n`)
    results.push(row)
  }
  const lines = [
    '# Process walk-forward',
    '',
    `Run at ${new Date().toISOString()} UTC. Shots are the volume. The first-goal share is the conversion. A player needs 3 prior games at the site. The leader is the highest prior venue mean. A hit means that leader scored the first goal. This is not a probability and it is not a bet.`,
    '',
    'The three layers, volume then quality then conversion, are from the Circles Off YouTube channel.',
    '',
    '| League | Games | Shot leader | Share leader |',
    '| --- | --- | --- | --- |',
  ]
  for (const row of results) {
    lines.push(`| ${row.name} | ${row.games} | ${record(row.tally.shots.hits, row.tally.shots.decided)} | ${record(row.tally.share.hits, row.tally.share.decided)} |`)
  }
  lines.push('')
  const markdown = `${lines.join('\n')}\n`
  await writeFile('docs/projections/PROCESS-BACKTEST.md', markdown)
  process.stdout.write(markdown)
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  main().catch((error) => {
    console.error(error)
    process.exit(1)
  })
}
