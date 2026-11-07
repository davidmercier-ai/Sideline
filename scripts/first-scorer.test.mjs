import assert from 'node:assert/strict'
import {
  currentSeason,
  firstBasketScorer,
  firstGoalScorer,
  firstTouchdownScorer,
  gamesFromGamelog,
  nameBeforeYards,
  rowsForPlayer,
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

console.log('first scorer ok')
