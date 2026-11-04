import assert from 'node:assert/strict'
import { GAME_BETS } from './gameBets.ts'

assert.equal(GAME_BETS.length, 8)
const ids = new Set(GAME_BETS.map((bet) => bet.id))
assert.equal(ids.size, 8)

const spread = GAME_BETS.find((bet) => bet.id === 'fd-grizzlies-spread')
assert.ok(spread)
assert.equal(spread.href.includes('marketId=739.195203761'), true)
assert.equal(spread.href.includes('selectionId=237491'), true)

const moneyline = GAME_BETS.find((bet) => bet.id === 'dk-grizzlies-ml')
assert.ok(moneyline)
assert.equal(moneyline.href.includes('0ML87027692_1'), true)
assert.equal(moneyline.href.includes('0HC'), false)

for (const bet of GAME_BETS) {
  assert.ok(bet.href.startsWith('https://'))
  assert.equal(bet.href.includes('marketId[0]'), false)
  assert.equal(bet.american < 0, true)
}

console.log('game bets ok')
