import assert from 'node:assert/strict'
import { BOOSTS, GAME_BETS } from './gameBets.ts'

assert.equal(BOOSTS.length, 3)
assert.equal(BOOSTS.filter((slip) => slip.book === 'FanDuel').length, 2)
assert.equal(BOOSTS.filter((slip) => slip.book === 'DraftKings').length, 1)
assert.equal(BOOSTS.every((slip) => slip.href.startsWith('https://')), true)
assert.equal(BOOSTS.some((slip) => slip.href.includes('marketId[0]=')), true)
assert.equal(
  BOOSTS.some((slip) => slip.href === 'https://sportsbook.draftkings.com/event/34936984?outcomes=0OU87027687U23050_3%2B0OU87027691U23350_3%2B0OU87027692O22850_1'),
  true,
)

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
