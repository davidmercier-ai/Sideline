import assert from 'node:assert/strict'
import { researchLevel, thinPublicLeague } from './research-protocol.mjs'

assert.equal(researchLevel({ action: 'Pass' }).name, 'screen')
assert.equal(researchLevel({ action: 'Lean' }).name, 'screen')
assert.equal(researchLevel({ action: 'Bet' }).name, 'log')
assert.equal(researchLevel({ action: 'Bet now' }).name, 'log')
assert.equal(researchLevel({ action: 'Pass', named: true }).name, 'personnel')
assert.equal(researchLevel({ action: 'Pass', placed: true }).name, 'personnel')
assert.equal(researchLevel({ action: 'Bet', live: true }).name, 'screen')
assert.equal(researchLevel({ action: 'Pass', live: true, placed: true }).name, 'personnel')
assert.equal(researchLevel({ action: 'Bet', thinPublic: true }).name, 'local')
assert.equal(researchLevel({ action: 'Pass', thinPublic: true }).name, 'screen')
assert.equal(researchLevel({ action: 'Pass', thinPublic: true, named: true }).name, 'local')
assert.equal(researchLevel({ action: 'Bet' }).level < researchLevel({ action: 'Pass', named: true }).level, true)

assert.equal(thinPublicLeague('FCS 2026-11-07'), true)
assert.equal(thinPublicLeague('J1'), true)
assert.equal(thinPublicLeague('FBS 2026-11-07', 'football/college-football'), false)
assert.equal(thinPublicLeague('NFL', 'football/nfl'), false)

console.log('research protocol ok')
