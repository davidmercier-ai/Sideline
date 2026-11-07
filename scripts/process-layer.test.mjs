import assert from 'node:assert/strict'
import {
  conversionWindow,
  homeSpreadFromClose,
  isMainTotal,
  preferMainTotal,
  scoreProcessLeaders,
  simBucket,
  simCalibration,
} from './process-layer.mjs'

assert.equal(isMainTotal({ over: '-110', under: '-110' }), true)
assert.equal(isMainTotal({ over: '-800', under: '+475' }), false)
assert.equal(preferMainTotal([
  { line: 9.5, over: '-800', under: '+475' },
  { line: 24.5, over: '-115', under: '-105' },
]).line, 24.5)
assert.equal(preferMainTotal([{ line: 9.5, over: '-800', under: '+475' }]), null)
assert.equal(homeSpreadFromClose('+0.5'), 0.5)
assert.equal(homeSpreadFromClose('-2.5'), -2.5)
assert.equal(simBucket(0.849), 'over80')
assert.equal(simBucket(0.62), 'to70')
const calibrated = simCalibration([
  { simHomeRate: 0.84, actual: 'home' },
  { simHomeRate: 0.81, actual: 'away' },
  { simHomeRate: 0.55, actual: 'home' },
])
assert.equal(calibrated.find((bucket) => bucket.id === 'over80').decided, 2)
assert.equal(calibrated.find((bucket) => bucket.id === 'over80').hits, 1)
const window = conversionWindow([1, 0, 0, 0], [1, 2, 1, 0])
assert.equal(window.firstLast3, 0)
assert.equal(window.scoredLast3, 1)
assert.match(window.label, /Last 3 first goals 0%/)
assert.match(window.label, /Last 3 goals 1.0 per game/)

const leaders = scoreProcessLeaders([
  { id: 'g1', date: '2026-09-01' },
  { id: 'g2', date: '2026-09-08' },
  { id: 'g3', date: '2026-09-15' },
  { id: 'g4', date: '2026-09-22' },
], [
  { eventId: 'g1', date: '2026-09-01', teamId: 'a', name: 'Volume', venue: 'away', shots: 5, first: 0, goals: 1 },
  { eventId: 'g1', date: '2026-09-01', teamId: 'b', name: 'Share', venue: 'home', shots: 1, first: 1, goals: 1 },
  { eventId: 'g2', date: '2026-09-08', teamId: 'a', name: 'Volume', venue: 'away', shots: 4, first: 0, goals: 0 },
  { eventId: 'g2', date: '2026-09-08', teamId: 'b', name: 'Share', venue: 'home', shots: 1, first: 1, goals: 1 },
  { eventId: 'g3', date: '2026-09-15', teamId: 'a', name: 'Volume', venue: 'away', shots: 6, first: 1, goals: 1 },
  { eventId: 'g3', date: '2026-09-15', teamId: 'b', name: 'Share', venue: 'home', shots: 0, first: 0, goals: 0 },
  { eventId: 'g4', date: '2026-09-22', teamId: 'a', name: 'Volume', venue: 'away', shots: 5, first: 1, goals: 1 },
  { eventId: 'g4', date: '2026-09-22', teamId: 'b', name: 'Share', venue: 'home', shots: 1, first: 0, goals: 0 },
])
assert.equal(leaders.shots.decided >= 1, true)
assert.equal(leaders.share.decided >= 1, true)

console.log('process layer ok')
