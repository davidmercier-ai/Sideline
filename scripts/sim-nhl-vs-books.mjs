/**
 * Set the Saturday NHL sim boxes next to FanDuel and DraftKings.
 * The one game is the box already shown. The median is the middle of 2,000 draws.
 *
 * node scripts/sim-nhl-vs-books.mjs
 */

import { readFile, writeFile } from 'node:fs/promises'
import { loadBooks, loadDraftKingsPropLines, loadFanDuelPropLines } from './book-prices.mjs'
import { looseName } from './player-logs.mjs'

const DK = 'https://sportsbook-nash.draftkings.com/sites/US-OH-SB/api/sportscontent/v1/leagues/42133/categories/496/subcategories/4525'

function cells(line) {
  return line.split('|').slice(1, -1).map((part) => part.trim())
}

function parsePlayers(section) {
  const players = []
  for (const line of section.split('\n')) {
    if (!line.startsWith('| ') || line.includes('---') || line.includes('Player') || line.includes('Goalie')) continue
    const c = cells(line)
    if (c.length < 8) continue
    players.push({
      name: c[0],
      goals: Number(c[4]),
      assists: Number(c[5]),
      points: Number(c[6]),
      shots: Number(c[7]),
    })
  }
  return players
}

function parseGoalies(section) {
  const goalies = []
  for (const line of section.split('\n')) {
    if (!line.startsWith('| ') || line.includes('---') || line.includes('Goalie')) continue
    const c = cells(line)
    if (c.length !== 4) continue
    goalies.push({
      name: c[0],
      saves: Number(c[1]),
      shotsAgainst: Number(c[2]),
      goalsAgainst: Number(c[3]),
    })
  }
  return goalies
}

function parseOneGoalies(section) {
  const goalies = []
  for (const line of section.split('\n')) {
    const match = line.match(/^(.+?) is .+?\. (\d+) saves on (\d+) shots, (\d+) goals? against/)
    if (!match) continue
    goalies.push({
      name: match[1],
      saves: Number(match[2]),
      shotsAgainst: Number(match[3]),
      goalsAgainst: Number(match[4]),
    })
  }
  return goalies
}

function parseSlate(markdown) {
  const games = []
  for (const chunk of markdown.split(/^## /m).slice(1)) {
    const title = chunk.split('\n')[0].trim()
    const [awayName, homeName] = title.split(' at ')
    const one = chunk.match(/One game: [A-Z]+ (\d+), [A-Z]+ (\d+)/)
    if (!one) continue
    const median = chunk.match(/Median of 2,000 games: (\d+)-(\d+)/)
    const medianAt = chunk.indexOf('### Median of 2,000 games')
    const oneText = medianAt >= 0 ? chunk.slice(0, medianAt) : chunk
    const medianText = medianAt >= 0 ? chunk.slice(medianAt) : ''
    games.push({
      title,
      awayName,
      homeName,
      oneAway: Number(one[1]),
      oneHome: Number(one[2]),
      medAway: Number(median?.[1]),
      medHome: Number(median?.[2]),
      onePlayers: parsePlayers(oneText),
      medianPlayers: parsePlayers(medianText),
      oneGoalies: parseOneGoalies(oneText),
      medianGoalies: parseGoalies(medianText),
    })
  }
  return games
}

function sameGame(prop, game) {
  const away = looseName(prop.away)
  const home = looseName(prop.home)
  return (looseName(game.awayName).includes(away.slice(0, 6)) && looseName(game.homeName).includes(home.slice(0, 6)))
    || (away.includes(looseName(game.awayName).slice(0, 5)) && home.includes(looseName(game.homeName).slice(0, 5)))
}

function cleanPlayer(name) {
  return String(name || '')
    .replace(/\s+total goals$/i, '')
    .replace(/\s+shots on goal$/i, '')
    .trim()
}

function nearerEven(rows) {
  const scored = rows.map((row) => {
    const over = Number(String(row.over ?? '').replace('+', ''))
    return { row, dist: Number.isFinite(over) ? Math.abs(over + 110) : 999 }
  })
  scored.sort((a, b) => a.dist - b.dist)
  return scored[0]?.row || null
}

function findProp(rows, game, player, stats) {
  const key = looseName(cleanPlayer(player))
  const hits = rows.filter((prop) => stats.includes(prop.stat) && looseName(cleanPlayer(prop.player)) === key && sameGame(prop, game))
  return nearerEven(hits)
}

function sideGap(value, line) {
  if (!Number.isFinite(value) || !Number.isFinite(line)) return null
  const gap = Math.round((value - line) * 10) / 10
  if (gap >= 1) return { side: 'over', gap }
  if (gap <= -1) return { side: 'under', gap }
  return { side: 'inside', gap }
}

async function dkGames() {
  const payload = await fetch(DK, { headers: { Accept: 'application/json', 'User-Agent': 'SidelineProjection/0.1' } }).then((res) => res.json())
  const events = new Map((payload.events || []).map((event) => [event.id, event.name]))
  const out = []
  for (const market of payload.markets || []) {
    const name = events.get(market.eventId) || ''
    const parts = name.split(' @ ')
    if (parts.length !== 2) continue
    const sels = (payload.selections || []).filter((sel) => sel.marketId === market.id && sel.main !== false)
    if (/puck line/i.test(market.name)) {
      const home = sels.find((sel) => sel.outcomeType === 'Home')
      out.push({
        away: parts[0],
        home: parts[1],
        kind: 'spread',
        homeSpread: Number(home?.points),
        homePrice: home?.displayOdds?.american,
      })
    }
    if (/^total$/i.test(market.name)) {
      const over = sels.find((sel) => sel.outcomeType === 'Over')
      const under = sels.find((sel) => sel.outcomeType === 'Under')
      out.push({
        away: parts[0],
        home: parts[1],
        kind: 'total',
        line: Number(over?.points ?? under?.points),
        over: over?.displayOdds?.american,
        under: under?.displayOdds?.american,
      })
    }
  }
  return out
}

const STATS = [
  ['shots', ['shots on goal', 'shots']],
  ['points', ['points']],
  ['assists', ['assists']],
  ['goals', ['goals']],
]

const markdown = await readFile('docs/projections/2026-11-07-nhl-sim.md', 'utf8')
const games = parseSlate(markdown)
const [books, dkProps, fdProps, dkBoard] = await Promise.all([
  loadBooks(['nhl'], new Date().toISOString(), { novig: false }),
  loadDraftKingsPropLines('nhl'),
  loadFanDuelPropLines('nhl'),
  dkGames(),
])

const blocks = [
  '# NHL sim against the books, 2026-11-07',
  '',
  `Prices retrieved ${new Date().toISOString()} UTC. The one game is the box already shown. The median is the middle of 2,000 draws. A gap of 1 or more is listed. A player gap is not a bet. A goal gap is not a priced edge.`,
  '',
  'Shots, points, and assists are the DraftKings over/unders. FanDuel posts shots and goals. Saves are the DraftKings goalie number. The two games already in progress are not in this file.',
  '',
  '## Games',
  '',
]
for (const game of games) {
  const quote = books.match('nhl', [game.awayName], [game.homeName]).fanduel
  const dkSpread = dkBoard.find((row) => row.kind === 'spread' && sameGame(row, game))
  const dkTotal = dkBoard.find((row) => row.kind === 'total' && sameGame(row, game))
  const oneTotal = game.oneAway + game.oneHome
  const medTotal = game.medAway + game.medHome
  const oneMargin = game.oneHome - game.oneAway
  const medMargin = game.medHome - game.medAway
  blocks.push(`### ${game.title}`)
  blocks.push('')
  blocks.push(`One game ${game.oneAway}-${game.oneHome} (total ${oneTotal}, home margin ${oneMargin}). Median ${game.medAway}-${game.medHome} (total ${medTotal}, home margin ${medMargin}).`)
  const coverText = (book, homeSpread, price) => {
    if (!Number.isFinite(homeSpread)) return `${book} puck line missing.`
    const cover = Math.round((medMargin + homeSpread) * 10) / 10
    const side = cover >= 1 ? `${game.homeName} ${homeSpread}` : cover <= -1 ? `${game.awayName} ${-homeSpread}` : 'inside 1'
    return `${book} home ${homeSpread} ${price}. Median cover margin ${cover}. Side: ${side}.`
  }
  if (quote) {
    const totalGap = sideGap(medTotal, quote.total)
    blocks.push(`FanDuel total ${quote.total} over ${quote.overPrice} / under ${quote.underPrice}. Median total is ${totalGap ? `${totalGap.gap} ${totalGap.side}` : 'missing'}.`)
    blocks.push(coverText('FanDuel', quote.homeSpread, quote.homeSpreadPrice))
  } else blocks.push('FanDuel game line missing.')
  if (dkTotal) {
    const totalGap = sideGap(medTotal, dkTotal.line)
    blocks.push(`DraftKings total ${dkTotal.line} over ${dkTotal.over} / under ${dkTotal.under}. Median total is ${totalGap ? `${totalGap.gap} ${totalGap.side}` : 'missing'}.`)
  } else blocks.push('DraftKings total missing.')
  if (dkSpread) blocks.push(coverText('DraftKings', dkSpread.homeSpread, dkSpread.homePrice))
  else blocks.push('DraftKings puck line missing.')
  blocks.push('')
  const rows = []
  for (const median of game.medianPlayers) {
    const one = game.onePlayers.find((player) => looseName(player.name) === looseName(median.name))
    for (const [field, stats] of STATS) {
      const dk = findProp(dkProps, game, median.name, stats)
      const fd = findProp(fdProps, game, median.name, stats)
      const line = dk?.line ?? fd?.line
      const call = sideGap(median[field], line)
      if (!call || call.side === 'inside') continue
      const oneCall = one ? sideGap(one[field], line) : null
      rows.push({
        name: median.name,
        stat: field,
        one: one?.[field],
        median: median[field],
        line,
        side: call.side,
        gap: call.gap,
        dk: dk ? `${dk.line} o${dk.over}/u${dk.under}` : 'missing',
        fd: fd ? `${fd.line} o${fd.over}/u${fd.under}` : 'missing',
        agree: oneCall ? oneCall.side === call.side : null,
      })
    }
  }
  for (const median of game.medianGoalies) {
    const one = game.oneGoalies.find((goalie) => looseName(goalie.name) === looseName(median.name))
    const dk = findProp(dkProps, game, median.name, ['saves'])
    const call = sideGap(median.saves, dk?.line)
    if (!dk || !call || call.side === 'inside') continue
    const oneCall = one ? sideGap(one.saves, dk.line) : null
    rows.push({
      name: median.name,
      stat: 'saves',
      one: one?.saves,
      median: median.saves,
      line: dk.line,
      side: call.side,
      gap: call.gap,
      dk: `${dk.line} o${dk.over}/u${dk.under}`,
      fd: 'missing',
      agree: oneCall ? oneCall.side === call.side : null,
    })
  }
  rows.sort((a, b) => Math.abs(b.gap) - Math.abs(a.gap))
  if (!rows.length) {
    blocks.push('No player median sits 1 past a posted shots, points, assists, goals, or saves number.')
    blocks.push('')
    continue
  }
  blocks.push('| Player | Stat | One game | Median | DraftKings | FanDuel | Median side |')
  blocks.push('| --- | --- | --- | --- | --- | --- | --- |')
  for (const row of rows) {
    const note = row.agree === false ? ' (one game other side)' : ''
    blocks.push(`| ${row.name} | ${row.stat} | ${row.one ?? '—'} | ${row.median} | ${row.dk} | ${row.fd} | ${row.side} ${row.gap}${note} |`)
  }
  blocks.push('')
}

const out = 'docs/projections/2026-11-07-nhl-sim-prices.md'
await writeFile(out, `${blocks.join('\n')}\n`)
process.stderr.write(`wrote ${out} games ${games.length} dk ${dkProps.length} fd ${fdProps.length}\n`)
