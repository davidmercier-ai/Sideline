import assert from 'node:assert/strict'
import { indexDraftKingsProps, indexDraftKingsTeamTotals, propsForNames } from './book-prices.mjs'
import { boardSideCall, boardTotalCall, coverRole, quoteFromPickcenter, spreadFromPickcenter } from './backtest-slate.mjs'
import { propBoardCall } from './project-players.mjs'
import { playerReads } from './projection-math.mjs'

const totals = indexDraftKingsTeamTotals({
  events: [{ id: '1', name: 'OKC Thunder @ MEM Grizzlies' }],
  markets: [
    { id: 'm1', eventId: '1', name: 'MEM Grizzlies: Team Total Points' },
    { id: 'm2', eventId: '1', name: 'OKC Thunder: Team Total Points' },
  ],
  selections: [
    { marketId: 'm1', label: 'Over', outcomeType: 'Over', points: 110.5, displayOdds: { american: '−105' } },
    { marketId: 'm1', label: 'Under', outcomeType: 'Under', points: 110.5, displayOdds: { american: '−115' } },
    { marketId: 'm2', label: 'Over', outcomeType: 'Over', points: 113.5, displayOdds: { american: '−112' } },
    { marketId: 'm2', label: 'Under', outcomeType: 'Under', points: 113.5, displayOdds: { american: '−108' } },
  ],
})
const grizzlies = [...totals.values()][0]
assert.equal(grizzlies.homeTotal.line, 110.5)
assert.equal(grizzlies.homeTotal.over, '-105')
assert.equal(grizzlies.awayTotal.line, 113.5)

const props = indexDraftKingsProps({
  events: [{ id: '2', name: 'PHI 76ers @ CLE Cavaliers' }],
  markets: [{ id: 'p1', eventId: '2', name: 'Tyrese Maxey Points O/U' }],
  selections: [
    { marketId: 'p1', label: 'Over', outcomeType: 'Over', points: 25.5, displayOdds: { american: '−112' } },
    { marketId: 'p1', label: 'Under', outcomeType: 'Under', points: 25.5, displayOdds: { american: '−114' } },
  ],
}, 'points')
assert.equal(props.length, 1)
assert.equal(props[0].player, 'Tyrese Maxey')
assert.equal(props[0].line, 25.5)
assert.equal(propsForNames(props, ['76ers'], ['Cavaliers']).length, 1)
assert.equal(propsForNames(props, ['Lakers'], ['Celtics']).length, 0)

assert.equal(spreadFromPickcenter({ pickcenter: [{ provider: { name: 'Draft Kings' }, spread: -1.5, overUnder: 41.5 }] }), -1.5)
assert.deepEqual(quoteFromPickcenter({ pickcenter: [{ provider: { name: 'Draft Kings' }, spread: -1.5, overUnder: 41.5 }] }), { spread: -1.5, total: 41.5 })
assert.equal(spreadFromPickcenter({ pickcenter: [{ provider: { name: 'Other' }, spread: 3 }] }), 3)
assert.equal(spreadFromPickcenter({}), null)

const cleared = [6, 5, 4.5, 7]
assert.equal(boardSideCall({ margins: cleared, marketMargin: 3, room: 1, thin: false }), 'home')
assert.equal(boardSideCall({ margins: [2.2, 5, 4, 7], marketMargin: 3, room: 1, thin: false }), null)
assert.equal(boardSideCall({ margins: cleared, marketMargin: 3, room: 1, thin: true }), null)
assert.equal(boardTotalCall({ totals: [210, 212, 214, 211], postedTotal: 220, room: 1, thin: false }), 'under')
assert.equal(boardTotalCall({ totals: [210, 219.5, 214, 211], postedTotal: 220, room: 1, thin: false }), null)
assert.equal(coverRole(-1.5, 'home'), 'favorite')
assert.equal(coverRole(-1.5, 'away'), 'dog')
assert.equal(coverRole(1.5, 'home'), 'dog')
assert.equal(coverRole(0, 'home'), null)

const games = [
  { date: '2026-10-22', venue: 'home', value: 30 },
  { date: '2026-10-24', venue: 'home', value: 28 },
  { date: '2026-10-26', venue: 'home', value: 26 },
  { date: '2026-10-28', venue: 'away', value: 24 },
]
assert.equal(propBoardCall(playerReads(games, 'home'), 20), 'over')
assert.equal(propBoardCall(playerReads(games, 'home'), 27), null)
assert.equal(propBoardCall(playerReads(games.slice(0, 2), 'home'), 10), null)

console.log('book feeds ok')
