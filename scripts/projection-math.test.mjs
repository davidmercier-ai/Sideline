import assert from 'node:assert/strict'
import {
  difference,
  grossPassingYards,
  homeMargin,
  marketHomeMargin,
  projectRate,
  projectedOutcome,
  reconcileTotal,
  sackYardsLost,
  summarize,
  totalDirection,
} from './projection-math.mjs'

const yards = summarize([100, 120, 120, 80, 150])
assert.equal(yards.n, 5)
assert.equal(yards.mean, 114)
assert.equal(yards.median, 120)
assert.deepEqual(yards.modes, [120])
assert.equal(yards.high, 150)
assert.equal(yards.low, 80)

const unique = summarize([10, 20, 30])
assert.deepEqual(unique.modes, [])
assert.equal(unique.modeNote, 'no repeated value')

const empty = summarize([])
assert.equal(empty.missing, true)
assert.equal(empty.median, null)

const paired = projectRate([20, 30], [10, 20])
assert.equal(paired.value, 20)
assert.equal(paired.basis, 'venue-matched means')
assert.equal(paired.incomplete, false)

const incomplete = projectRate([], [14, 16])
assert.equal(incomplete.value, 15)
assert.equal(incomplete.incomplete, true)

assert.equal(sackYardsLost('2-11'), 11)
assert.equal(grossPassingYards(323, 11), 334)
assert.equal(reconcileTotal(86, 323, 409).ok, true)
assert.equal(reconcileTotal(10, 20, 40).ok, false)

assert.equal(homeMargin(29, 26), 3)
assert.equal(marketHomeMargin(-3), 3)
assert.equal(difference(2, 3), -1)
assert.equal(totalDirection(1.2), 'baseline is above the posted total')
assert.equal(totalDirection(-0.4), 'baseline is below the posted total')
assert.equal(projectedOutcome('Bills', 'Ravens', 24.5, 22), 'Bills')
assert.equal(projectedOutcome('Bills', 'Ravens', 21, 21), 'projected tie')

const gameTotals = [300, 400, 500]
const rushMedians = summarize([100, 110, 90]).median
const passMedians = summarize([200, 210, 190]).median
assert.notEqual(summarize(gameTotals).median, rushMedians + passMedians)

console.log('projection math ok')
