import assert from 'node:assert/strict'
import {
  currentSeason,
  firstBasketScorer,
  firstGoalScorer,
  firstTouchdownScorer,
  gamesFromGamelog,
  leaderCall,
  nameBeforeYards,
  rankFirstScorers,
  rowsForPlayer,
  scoreGameLeaders,
  walkForwardFirst,
} from './first-scorer.mjs'

assert.equal(nameBeforeYards('Bhayshul Tuten 1 Yd Rush (Cam Little Kick)'), 'Bhayshul Tuten')
assert.equal(firstTouchdownScorer({
  scoringPlays: [
    { type: { text: 'Field Goal Good' }, text: 'Cam Little 32 Yd Field Goal' },
    { type: { text: 'Rushing Touchdown' }, text: 'Bhayshul Tuten 1 Yd Rush (Cam Little Kick)' },
  ],
}), 'Bhayshul Tuten')

assert.equal(firstBasketScorer({
  plays: [
    { scoringPlay: true, scoreValue: 1, type: { text: 'Free Throw' }, text: 'Anthony Davis makes free throw 1 of 2' },
    { scoringPlay: true, scoreValue: 3, type: { text: 'Jump Shot' }, text: 'Kingston Flemings makes 25-foot three point jumper' },
  ],
}), 'Kingston Flemings')

assert.equal(firstGoalScorer({
  plays: [{
    scoringPlay: true,
    type: { text: 'Goal' },
    text: 'Justin Brazeau Goal (1)',
    participants: [{ type: 'scorer', athlete: { displayName: 'Justin Brazeau' } }],
  }],
}), 'Justin Brazeau')

assert.equal(firstGoalScorer({
  keyEvents: [{
    scoringPlay: true,
    type: { text: 'Own Goal' },
    text: 'Own Goal',
    participants: [{ athlete: { displayName: 'Wrong Player' } }],
  }, {
    scoringPlay: true,
    type: { text: 'Goal' },
    participants: [{ athlete: { displayName: 'Yann Gboho' } }],
  }],
}), null)

const games = gamesFromGamelog({
  seasonTypes: [{
    displayName: '2026 Regular Season',
    categories: [{ type: 'event', events: [{ eventId: '9' }, { eventId: '10' }] }],
  }],
  events: {
    9: { gameDate: '2026-10-01', atVs: 'vs' },
    10: { gameDate: '2026-10-08', atVs: '@' },
  },
})
const rows = rowsForPlayer(games, new Map([
  ['9', { ok: true, scorer: 'Yann Gboho' }],
  ['10', { ok: true, scorer: null }],
]), 'Yann Gboho')
assert.equal(rows.length, 2)
assert.equal(rows[0].value, 1)
assert.equal(rows[0].venue, 'home')
assert.equal(rows[1].value, 0)
assert.equal(rows[1].venue, 'away')
assert.equal(currentSeason({
  seasonTypes: [{ displayName: '2026-27 English Premier League' }],
}).displayName, '2026-27 English Premier League')
assert.equal(currentSeason({
  seasonTypes: [{
    displayName: 'Regular Season',
    categories: [{ type: 'event', events: [{ eventId: '1' }] }],
  }],
  events: { 1: { gameDate: '2026-05-17T20:00:00.000Z' } },
}).displayName, 'Regular Season')
assert.equal(currentSeason({
  seasonTypes: [{
    displayName: 'Regular Season',
    categories: [{ type: 'event', events: [{ eventId: '1' }] }],
  }],
  events: { 1: { gameDate: '2024-05-17T20:00:00.000Z' } },
}), null)

const history = [1, 1, 1, 0].map((value, index) => ({
  date: `2026-10-${10 + index}`,
  venue: 'home',
  value,
}))
const forward = walkForwardFirst(history)
assert.equal(forward.base.decided, 3)
assert.equal(forward.base.hits, 2)
assert.equal(forward.strict.decided, 1)
assert.equal(forward.strict.hits, 0)
assert.equal(forward.pair.decided, 1)
assert.equal(forward.pair.hits, 0)

const reads = [
  { value: 0.5, missing: false, thin: false },
  { value: 0.25, missing: false, thin: false },
  { value: 0.5, missing: false, thin: false },
  { value: 0, missing: false, thin: false },
]
assert.equal(leaderCall(reads).pair, true)
assert.equal(leaderCall(reads).called, false)
assert.equal(leaderCall([{ value: 0.67, thin: true }, { value: 1, thin: false }, { value: 1, thin: false }, { value: 1, thin: false }]).pair, false)
const ranked = rankFirstScorers([
  { name: 'low', thin: false, reads: [{ value: 0.2 }, { value: 0.2 }, { value: 0 }, { value: 0 }] },
  { name: 'high', thin: false, reads: [{ value: 0.6 }, { value: 0.2 }, { value: 0 }, { value: 0 }] },
])
assert.equal(ranked[0].name, 'high')
const tied = rankFirstScorers([
  { name: 'Zed', thin: false, reads: [{ value: 0.5 }, { value: 0.2 }, { value: 0 }, { value: 0 }] },
  { name: 'Amy', thin: false, reads: [{ value: 0.5 }, { value: 0.2 }, { value: 0 }, { value: 0 }] },
])
assert.equal(tied[0].name, 'Amy')

const leaders = scoreGameLeaders([
  { id: 'g1', date: '2026-09-01' },
  { id: 'g2', date: '2026-09-08' },
  { id: 'g3', date: '2026-09-15' },
  { id: 'g4', date: '2026-09-22' },
], [
  { eventId: 'g1', date: '2026-09-01', venue: 'home', teamId: 'a', name: 'Alpha', value: 1 },
  { eventId: 'g1', date: '2026-09-01', venue: 'away', teamId: 'b', name: 'Beta', value: 0 },
  { eventId: 'g2', date: '2026-09-08', venue: 'home', teamId: 'a', name: 'Alpha', value: 0 },
  { eventId: 'g2', date: '2026-09-08', venue: 'away', teamId: 'b', name: 'Beta', value: 1 },
  { eventId: 'g3', date: '2026-09-15', venue: 'home', teamId: 'a', name: 'Alpha', value: 1 },
  { eventId: 'g3', date: '2026-09-15', venue: 'away', teamId: 'b', name: 'Beta', value: 0 },
  { eventId: 'g4', date: '2026-09-22', venue: 'home', teamId: 'a', name: 'Alpha', value: 0 },
  { eventId: 'g4', date: '2026-09-22', venue: 'away', teamId: 'b', name: 'Beta', value: 0 },
])
assert.equal(leaders.leader.decided, 3)
assert.equal(leaders.leader.hits, 1)
assert.equal(leaders.pair.decided, 1)
assert.equal(leaders.pair.hits, 0)
assert.equal(leaders.strict.decided, 1)

console.log('first scorer ok')
