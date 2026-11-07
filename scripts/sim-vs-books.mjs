/**
 * Set the Saturday NBA sim boxes next to FanDuel and DraftKings.
 * The one game is the box already shown. The median is the middle of 2,000 draws.
 *
 * node scripts/sim-vs-books.mjs
 */

import { readFile, writeFile } from 'node:fs/promises'
import { loadBooks, loadDraftKingsPropLines, loadFanDuelPropLines } from './book-prices.mjs'
import { looseName } from './player-logs.mjs'

const DK = 'https://sportsbook-nash.draftkings.com/sites/US-OH-SB/api/sportscontent/v1/leagues/42648/categories/487'

function cells(line) {
  return line.split('|').slice(1, -1).map((part) => part.trim())
}

function parseBox(section) {
  const players = []
  for (const line of section.split('\n')) {
    if (!line.startsWith('| ') || line.includes('Player') || line.includes('---')) continue
    const c = cells(line)
    if (c.length < 14) continue
    players.push({
      name: c[0],
      min: Number(c[3]),
      pts: Number(c[13]),
      reb: Number(c[7]),
      ast: Number(c[8]),
    })
  }
  return players
}

function parseSlate(markdown) {
  const games = []
  for (const chunk of markdown.split(/^## /m).slice(1)) {
    const title = chunk.split('\n')[0].trim()
    const [awayName, homeName] = title.split(' at ')
    const one = chunk.match(/One game: [A-Z]+ (\d+), [A-Z]+ (\d+)/)
    const median = chunk.match(/Median of 2,000 games: (\d+)-(\d+)/)
    const oneParts = chunk.split('### Median of 2,000 games')[0].split(/^### /m).slice(1)
    const medianParts = chunk.split('### Median of 2,000 games')[1] || ''
    const onePlayers = oneParts.flatMap((part) => parseBox(part))
    const medianPlayers = parseBox(medianParts)
    games.push({
      title,
      awayName,
      homeName,
      oneAway: Number(one?.[1]),
      oneHome: Number(one?.[2]),
      medAway: Number(median?.[1]),
      medHome: Number(median?.[2]),
      onePlayers,
      medianPlayers,
    })
  }
  return games
}

function sameGame(prop, game) {
  const away = looseName(prop.away)
  const home = looseName(prop.home)
  return looseName(game.awayName).includes(away.slice(0, 6)) && looseName(game.homeName).includes(home.slice(0, 6))
    || (away.includes(looseName(game.awayName).slice(0, 5)) && home.includes(looseName(game.homeName).slice(0, 5)))
}

function findProp(rows, game, player, stat) {
  const key = looseName(player)
  return rows.find((prop) => prop.stat === stat && looseName(prop.player) === key && sameGame(prop, game))
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
    if (/spread/i.test(market.name)) {
      const home = sels.find((sel) => sel.outcomeType === 'Home')
      out.push({
        away: parts[0],
        home: parts[1],
        kind: 'spread',
        homeSpread: Number(home?.points),
        homePrice: home?.displayOdds?.american,
      })
    }
    if (/total/i.test(market.name)) {
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

const markdown = await readFile('docs/projections/2026-11-07-nba-sim.md', 'utf8')
const games = parseSlate(markdown)
const [books, dkProps, fdProps, dkBoard] = await Promise.all([
  loadBooks(['nba'], new Date().toISOString(), { novig: false }),
  loadDraftKingsPropLines('nba'),
  loadFanDuelPropLines('nba'),
  dkGames(),
])

const STATS = [
  ['pts', 'points'],
  ['reb', 'rebounds'],
  ['ast', 'assists'],
]

const blocks = [
  '# Sim against the books, 2026-11-07',
  '',
  `Prices retrieved ${new Date().toISOString()} UTC. The one game is the box already shown. The median is the middle of 2,000 draws. A gap of 1 or more is listed. A player gap is not a bet. A point gap is not a priced edge.`,
  '',
  '## Games',
  '',
]
for (const game of games) {
  const quote = books.match('nba', [game.awayName], [game.homeName]).fanduel
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
    if (!Number.isFinite(homeSpread)) return `${book} spread missing.`
    const cover = Math.round((medMargin + homeSpread) * 10) / 10
    const side = cover >= 1 ? `${game.homeName} ${homeSpread}` : cover <= -1 ? `${game.awayName} ${-homeSpread}` : 'inside 1'
    return `${book} home ${homeSpread} ${price}. Median cover margin ${cover}. Side: ${side}.`
  }
  if (quote) {
    const totalGap = sideGap(medTotal, quote.total)
    blocks.push(`FanDuel total ${quote.total} over ${quote.overPrice} / under ${quote.underPrice}. Median total is ${totalGap ? `${totalGap.gap} ${totalGap.side}` : 'missing'}.`)
    blocks.push(coverText('FanDuel', quote.homeSpread, quote.homeSpreadPrice))
  }
  if (dkTotal) {
    const totalGap = sideGap(medTotal, dkTotal.line)
    blocks.push(`DraftKings total ${dkTotal.line} over ${dkTotal.over} / under ${dkTotal.under}. Median total is ${totalGap ? `${totalGap.gap} ${totalGap.side}` : 'missing'}.`)
  }
  if (dkSpread) blocks.push(coverText('DraftKings', dkSpread.homeSpread, dkSpread.homePrice))
  blocks.push('')
  const rows = []
  for (const median of game.medianPlayers) {
    const one = game.onePlayers.find((player) => looseName(player.name) === looseName(median.name))
    for (const [field, stat] of STATS) {
      const dk = findProp(dkProps, game, median.name, stat)
      const fd = findProp(fdProps, game, median.name, stat)
      const line = dk?.line ?? fd?.line
      const call = sideGap(median[field], line)
      if (!call || call.side === 'inside') continue
      const oneCall = one ? sideGap(one[field], line) : null
      rows.push({
        name: median.name,
        stat,
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
  rows.sort((a, b) => Math.abs(b.gap) - Math.abs(a.gap))
  if (!rows.length) {
    blocks.push('No player median sits 1 past a posted points, rebounds, or assists number.')
    blocks.push('')
    continue
  }
  blocks.push('| Player | Stat | One game | Median | DraftKings | FanDuel | Median side |')
  blocks.push('| --- | --- | --- | --- | --- | --- | --- |')
  for (const row of rows) {
    const note = row.agree === false ? ' (one game other side)' : ''
    blocks.push(`| ${row.name} | ${row.stat} | ${row.one} | ${row.median} | ${row.dk} | ${row.fd} | ${row.side} ${row.gap}${note} |`)
  }
  blocks.push('')
}

const out = 'docs/projections/2026-11-07-nba-sim-prices.md'
await writeFile(out, `${blocks.join('\n')}\n`)
process.stderr.write(`wrote ${out}\n`)
process.stdout.write(blocks.slice(0, 80).join('\n'))
