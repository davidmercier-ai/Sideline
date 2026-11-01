import assert from 'node:assert/strict'
import { ledger, singleProfit } from './ledger.ts'

assert.equal(singleProfit(1, -110), 100 / 110)
assert.equal(singleProfit(10, 150), 15)
assert.equal(singleProfit(0, -110), 0)
assert.equal(singleProfit(5, 0), 0)

const book = ledger([
  { status: 'placed', stake: 25, american: -113 },
  { status: 'placed', stake: 1, american: -110 },
  { status: 'open', stake: 50, american: -110 },
  { status: 'won', stake: 10, american: 100 },
  { status: 'lost', stake: 5, american: -110 },
  { status: 'push', stake: 8, american: -110 },
])

assert.equal(book.atRisk, 26)
assert.equal(book.potentialGain, Math.round((singleProfit(25, -113) + singleProfit(1, -110)) * 100) / 100)
assert.equal(book.settled, 5)
assert.ok(book.potentialGain > 0)

console.log('board ledger ok')
