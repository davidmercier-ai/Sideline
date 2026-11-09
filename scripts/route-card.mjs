/**
 * Sunday receiver card. Charted throw against FTN personnel.
 * Coverage stays missing. This does not read a book price.
 *
 * node scripts/route-card.mjs
 */

import { createWriteStream } from 'node:fs'
import { createReadStream } from 'node:fs'
import { mkdir, stat, writeFile } from 'node:fs/promises'
import { createInterface } from 'node:readline'
import { pipeline } from 'node:stream/promises'
import { personnelMatch } from './route-match.mjs'

const PBP_URL = 'https://github.com/nflverse/nflverse-data/releases/download/pbp/play_by_play_2026.csv'
const FTN_URL = 'https://github.com/nflverse/nflverse-data/releases/download/ftn_charting/ftn_charting_2026.csv'
const ESPN = 'https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard?dates=20261108'
const headers = { Accept: 'application/json', 'User-Agent': 'SidelineProjection/0.1' }

async function ensure(url, path) {
  try {
    const info = await stat(path)
    if (info.size > 1000) return
  } catch {
    // download
  }
  const response = await fetch(url, { headers })
  if (!response.ok) throw new Error(`${response.status} ${url}`)
  await pipeline(response.body, createWriteStream(path))
}

function parseCsvLine(line) {
  const out = []
  let cur = ''
  let quoted = false
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i]
    if (quoted) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          cur += '"'
          i += 1
        } else quoted = false
      } else cur += ch
    } else if (ch === '"') quoted = true
    else if (ch === ',') {
      out.push(cur)
      cur = ''
    } else cur += ch
  }
  out.push(cur)
  return out
}

async function indexFtn(path) {
  const index = new Map()
  const rl = createInterface({ input: createReadStream(path), crlfDelay: Infinity })
  let header = null
  let at = null
  for await (const line of rl) {
    const cells = parseCsvLine(line)
    if (!header) {
      header = cells
      at = Object.fromEntries(header.map((name, i) => [name, i]))
      continue
    }
    const box = Number(cells[at.n_defense_box])
    const rushers = Number(cells[at.n_pass_rushers])
    const blitzers = Number(cells[at.n_blitzers])
    if (!box && !rushers) continue
    index.set(`${cells[at.nflverse_game_id]}|${cells[at.nflverse_play_id]}`, { box, rushers, blitzers })
  }
  return index
}

function addBucket(map, key, yards) {
  const bucket = map[key] || { targets: 0, yards: 0 }
  bucket.targets += 1
  bucket.yards += yards
  map[key] = bucket
}

async function aggregate(pbpPath, ftn) {
  const receivers = new Map()
  const defenses = new Map()
  const rl = createInterface({ input: createReadStream(pbpPath), crlfDelay: Infinity })
  let header = null
  let at = null
  let joined = 0
  for await (const line of rl) {
    const cells = parseCsvLine(line)
    if (!header) {
      header = cells
      at = Object.fromEntries(header.map((name, i) => [name, i]))
      continue
    }
    if (cells[at.season_type] !== 'REG') continue
    if (cells[at.pass_attempt] !== '1') continue
    const chart = ftn.get(`${cells[at.game_id]}|${cells[at.play_id]}`)
    if (!chart) continue
    joined += 1
    const defense = cells[at.defteam]
    if (defense) {
      const row = defenses.get(defense) || { light_box: 0, heavy_box: 0, four_rush: 0, extra_rush: 0 }
      if (chart.box >= 4 && chart.box <= 6) row.light_box += 1
      if (chart.box >= 7) row.heavy_box += 1
      if (chart.rushers === 4) row.four_rush += 1
      if (chart.rushers >= 5) row.extra_rush += 1
      defenses.set(defense, row)
    }
    const name = cells[at.receiver_player_name]
    const team = cells[at.posteam]
    if (!name || name === 'NA' || !team) continue
    const yards = Number(cells[at.receiving_yards]) || 0
    const key = `${name}|${team}`
    const receiver = receivers.get(key) || { name, team, targets: 0, yards: 0, shapes: {}, buckets: {} }
    receiver.targets += 1
    receiver.yards += yards
    const shape = `${cells[at.pass_length] || 'missing'} ${cells[at.pass_location] || 'missing'}`.trim()
    addBucket(receiver.shapes, shape, yards)
    if (chart.box >= 4 && chart.box <= 6) addBucket(receiver.buckets, 'light_box', yards)
    if (chart.box >= 7) addBucket(receiver.buckets, 'heavy_box', yards)
    if (chart.rushers === 4) addBucket(receiver.buckets, 'four_rush', yards)
    if (chart.rushers >= 5) addBucket(receiver.buckets, 'extra_rush', yards)
    receivers.set(key, receiver)
  }
  return { receivers, defenses, joined }
}

function topShape(shapes) {
  const rows = Object.entries(shapes || {})
  rows.sort((a, b) => b[1].targets - a[1].targets)
  const [label, bucket] = rows[0] || []
  if (!bucket || bucket.targets < 5) return 'Charted throw sample is under 5 targets.'
  const rate = Math.round((bucket.yards / bucket.targets) * 10) / 10
  return `Charted throw: ${label}, ${bucket.targets} targets, ${rate} yards per target. This is the throw on the play file, not a named route.`
}

function lineFor(receiver, defense, opponent) {
  const match = personnelMatch(receiver, defense)
  return [
    `### ${receiver.name}, ${receiver.team}`,
    '',
    `${receiver.targets} charted targets, ${receiver.yards} yards.`,
    topShape(receiver.shapes),
    `Coverage shell: missing.`,
    `Against ${opponent}: ${match.box.text}`,
    `Against ${opponent}: ${match.rush.text}`,
    match.box.favorable || match.rush.favorable
      ? 'Personnel look: favorable on the split above. This is not a priced edge, and it does not change a Pass into a Bet.'
      : 'Personnel look: no favorable split.',
    '',
  ].join('\n')
}

async function slate() {
  const board = await fetch(ESPN, { headers }).then((response) => response.json())
  return [...(board.events || [])]
    .sort((a, b) => String(a.date).localeCompare(String(b.date)))
    .map((event) => {
      const comp = event.competitions[0]
      const away = comp.competitors.find((side) => side.homeAway === 'away')
      const home = comp.competitors.find((side) => side.homeAway === 'home')
      const when = new Date(event.date).toLocaleString('en-US', {
        timeZone: 'America/New_York',
        weekday: 'short',
        hour: 'numeric',
        minute: '2-digit',
      })
      return {
        when,
        title: `${away.team.shortDisplayName} at ${home.team.shortDisplayName}`,
        away: away.team.abbreviation,
        home: home.team.abbreviation,
      }
    })
}

function teamReceivers(receivers, team) {
  return [...receivers.values()]
    .filter((receiver) => receiver.team === team && receiver.targets >= 15)
    .sort((a, b) => b.targets - a.targets)
    .slice(0, 3)
}

async function main() {
  await mkdir('/tmp/sideline-routes', { recursive: true })
  const pbpPath = '/tmp/sideline-routes/play_by_play_2026.csv'
  const ftnPath = '/tmp/sideline-routes/ftn_charting_2026.csv'
  await ensure(FTN_URL, ftnPath)
  await ensure(PBP_URL, pbpPath)
  const ftn = await indexFtn(ftnPath)
  const { receivers, defenses, joined } = await aggregate(pbpPath, ftn)
  const games = await slate()
  const blocks = [
    '# Receiver routes, Sunday 2026-11-08',
    '',
    `Chart joined ${joined} pass plays. Source: nflverse play-by-play 2026 and FTN charting 2026. The charted throw is length and location. It is not a route name. Coverage is missing because the chart does not name man or zone. A favorable split needs 8 targets on each side, 20 charted defensive plays, a modal look of at least 40 percent, and 1.5 yards per target. This does not enter the four models and does not change a Pass into a Bet.`,
    '',
  ]
  for (const game of games) {
    blocks.push(`## ${game.title}`)
    blocks.push('')
    blocks.push(`${game.when} ET.`)
    blocks.push('')
    const players = [...teamReceivers(receivers, game.away), ...teamReceivers(receivers, game.home)]
    if (!players.length) {
      blocks.push('No receiver has 15 charted targets.')
      blocks.push('')
      continue
    }
    for (const receiver of players) {
      const opponent = receiver.team === game.away ? game.home : game.away
      const defense = defenses.get(opponent)
      blocks.push(lineFor(receiver, defense || {}, opponent))
    }
  }
  const out = 'docs/projections/2026-11-08-routes.md'
  await writeFile(out, `${blocks.join('\n')}\n`)
  process.stderr.write(`wrote ${out} receivers ${receivers.size} defenses ${defenses.size}\n`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
