/**
 * Sunday skill box. The rotation is whoever threw, ran, was targeted, or kicked
 * in that team's last completed regular-season game.
 *
 * node scripts/sim-nfl.mjs --date 2026-11-08 --out docs/projections/2026-11-08-nfl-sim.md
 */

import { writeFile } from 'node:fs/promises'
import { nflGamesFromLog, simulateNflBox } from './statline-sim.mjs'

const ESPN = 'https://site.api.espn.com'
const headers = { Accept: 'application/json', 'User-Agent': 'SidelineProjection/0.1' }

async function getJson(url) {
  let last
  for (let attempt = 0; attempt < 4; attempt += 1) {
    try {
      const response = await fetch(url, { headers })
      if (!response.ok) throw new Error(`${response.status} ${url}`)
      return response.json()
    } catch (error) {
      last = error
      await new Promise((resolve) => setTimeout(resolve, 300 * (attempt + 1)))
    }
  }
  throw last
}

function arg(name, fallback) {
  const index = process.argv.indexOf(name)
  return index >= 0 ? process.argv[index + 1] : fallback
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
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, () => run()))
  return results
}

function isRegularDone(event) {
  const competition = event.competitions?.[0]
  if (!competition?.status?.type?.completed) return false
  const year = Number(event.season?.year)
  if (year !== 2026 && year !== 2027) return false
  const type = Number(event.seasonType?.type ?? event.season?.type?.type ?? event.season?.type)
  return type === 2
}

async function lastRotation(teamId) {
  const schedule = await getJson(`${ESPN}/apis/site/v2/sports/football/nfl/teams/${teamId}/schedule`)
  const done = [...(schedule.events || [])].reverse().find(isRegularDone)
  if (!done) return { label: null, players: [] }
  const summary = await getJson(`${ESPN}/apis/site/v2/sports/football/nfl/summary?event=${done.id}`)
  const group = (summary.boxscore?.players || []).find((item) => String(item.team?.id) === String(teamId))
  const players = []
  const seen = new Set()
  for (const stat of group?.statistics || []) {
    if (!/passing|rushing|receiving|kicking/i.test(stat.name || '')) continue
    for (const athlete of stat.athletes || []) {
      const id = athlete.athlete?.id
      const name = athlete.athlete?.displayName
      if (!id || !name || seen.has(String(id))) continue
      seen.add(String(id))
      players.push({ id: String(id), name })
    }
  }
  return { label: done.shortName, players }
}

async function loadPlayer(player, venue, neutral) {
  const data = await getJson(`https://site.web.api.espn.com/apis/common/v3/sports/football/nfl/athletes/${player.id}/gamelog`)
  const games = nflGamesFromLog(data)
  const slice = games.filter((game) => game.venue === venue)
  const useVenue = !neutral && slice.length >= 3
  return {
    name: player.name,
    games: useVenue ? slice : games,
    thin: !neutral && !useVenue,
    played: games.length,
  }
}

function shown(player) {
  return player.att + player.car + player.tgt + player.fgAtt + player.xpAtt > 0
}

function line(player) {
  return `| ${player.name} | ${player.cmp}-${player.att} | ${player.passYds} | ${player.passTd} | ${player.int} | ${player.sacks} | ${player.car} | ${player.rushYds} | ${player.rushTd} | ${player.rec}-${player.tgt} | ${player.recYds} | ${player.recTd} | ${player.fgMade}-${player.fgAtt} | ${player.xpMade}-${player.xpAtt} |`
}

function table(players) {
  const ordered = [...players].filter(shown).sort((a, b) => (
    (b.passYds + b.rushYds + b.recYds + b.fgMade * 3) - (a.passYds + a.rushYds + a.recYds + a.fgMade * 3)
  ))
  const header = '| Player | CMP-ATT | YDS | TD | INT | SACK | CAR | YDS | TD | REC-TGT | YDS | TD | FG | XP |'
  const rule = '| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |'
  return [header, rule, ...ordered.map(line)].join('\n')
}

async function main() {
  const date = arg('--date', '2026-11-08')
  const out = arg('--out', `docs/projections/${date}-nfl-sim.md`)
  const board = await getJson(`${ESPN}/apis/site/v2/sports/football/nfl/scoreboard?dates=${date.replaceAll('-', '')}`)
  const events = [...(board.events || [])].sort((a, b) => String(a.date).localeCompare(String(b.date)))
  const blocks = [
    `# NFL statline sim ${date}`,
    '',
    '2,000 draws. Each draw plays the dropbacks, carries, field goals, and extra points. Attempts, carries, targets, and field-goal tries come from one game that player already played. Completions, yards, touchdowns, and kicks come from that player\'s own 2026 rates. A missing rate is skipped. The opponent does not change a completion rate. No book price is read. The rotation is whoever threw, ran, caught, or kicked in that team\'s last completed regular-season game. Each median column is its own median.',
    '',
  ]
  for (const event of events) {
    const competition = event.competitions[0]
    const away = competition.competitors.find((side) => side.homeAway === 'away')
    const home = competition.competitors.find((side) => side.homeAway === 'home')
    const neutral = Boolean(competition.neutralSite)
    process.stderr.write(`${event.shortName}\n`)
    const [awayRotation, homeRotation] = await Promise.all([
      lastRotation(away.team.id),
      lastRotation(home.team.id),
    ])
    const awayPlayers = (await pool(awayRotation.players, 6, (player) => loadPlayer(player, 'away', neutral))).filter((player) => player.played > 0)
    const homePlayers = (await pool(homeRotation.players, 6, (player) => loadPlayer(player, 'home', neutral))).filter((player) => player.played > 0)
    const box = simulateNflBox({
      home: homePlayers,
      away: awayPlayers,
      draws: 2000,
      seed: Number(date.replaceAll('-', '')) + Number(event.id.slice(-4)),
    })
    const when = new Date(event.date).toLocaleString('en-US', {
      timeZone: 'America/New_York',
      weekday: 'short',
      hour: 'numeric',
      minute: '2-digit',
    })
    const thin = [...awayPlayers, ...homePlayers].filter((player) => player.thin).map((player) => player.name)
    blocks.push(`## ${away.team.shortDisplayName} at ${home.team.shortDisplayName}`)
    blocks.push('')
    blocks.push(`${when} ET.${neutral ? ' Neutral site. The full log is used.' : ''}`)
    blocks.push(`Rotation: ${away.team.abbreviation} ${awayRotation.label || 'missing'}, ${home.team.abbreviation} ${homeRotation.label || 'missing'}.`)
    if (thin.length) blocks.push(`Thin venue log, full season used: ${thin.join(', ')}.`)
    blocks.push(`One draw: ${away.team.abbreviation} ${box.sample.awayScore}, ${home.team.abbreviation} ${box.sample.homeScore}. Median: ${box.awayMedian}-${box.homeMedian}.`)
    blocks.push('')
    blocks.push(...box.sample.plays.slice(0, 8).map((play) => `- ${play}`))
    blocks.push('')
    blocks.push(`### ${away.team.displayName}`)
    blocks.push('')
    blocks.push(table(box.away))
    blocks.push('')
    blocks.push(`### ${home.team.displayName}`)
    blocks.push('')
    blocks.push(table(box.home))
    blocks.push('')
    process.stderr.write(`  ${away.team.abbreviation} ${box.awayMedian} ${home.team.abbreviation} ${box.homeMedian}\n`)
  }
  await writeFile(out, `${blocks.join('\n')}\n`)
  process.stderr.write(`wrote ${out}\n`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
