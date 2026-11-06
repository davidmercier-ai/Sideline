import assert from 'node:assert/strict'
import { indexDraftKingsProps, indexDraftKingsTeamTotals, propsForNames } from './book-prices.mjs'
import { spreadFromPickcenter } from './backtest-slate.mjs'

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

assert.equal(spreadFromPickcenter({ pickcenter: [{ provider: { name: 'Draft Kings' }, spread: -1.5 }] }), -1.5)
assert.equal(spreadFromPickcenter({ pickcenter: [{ provider: { name: 'Other' }, spread: 3 }] }), 3)
assert.equal(spreadFromPickcenter({}), null)

console.log('book feeds ok')
