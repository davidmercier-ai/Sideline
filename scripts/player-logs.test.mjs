import assert from 'node:assert/strict'
import { playerNameFromLeg, playerStat, rowsFromGamelog } from './player-logs.mjs'

const parsed = rowsFromGamelog({
  labels: ['MIN', 'PTS', 'REB'],
  names: ['minutes', 'points', 'totalRebounds'],
  seasonTypes: [{
    displayName: '2026-27 Regular Season',
    displayTeam: 'LAL',
    categories: [{
      type: 'event',
      events: [
        { eventId: '1', stats: ['30', '36', '8'] },
        { eventId: '2', stats: ['28', '22', '4'] },
      ],
    }],
  }],
  events: {
    1: { gameDate: '2026-10-22', atVs: 'vs' },
    2: { gameDate: '2026-10-25', atVs: '@' },
  },
}, 'points')

assert.equal(parsed.team, 'LAL')
assert.equal(parsed.rows.length, 2)
assert.equal(parsed.rows[0].venue, 'home')
assert.equal(parsed.rows[0].value, 36)
assert.equal(parsed.rows[1].venue, 'away')

const td = rowsFromGamelog({
  labels: [],
  names: ['receivingTouchdowns', 'rushingTouchdowns'],
  seasonTypes: [{
    displayName: '2026 Regular Season',
    displayTeam: 'BUF',
    categories: [{
      type: 'event',
      events: [{ eventId: '9', stats: ['1', '0'] }],
    }],
  }],
  events: { 9: { gameDate: '2026-10-01', atVs: 'vs' } },
}, 'anytimeTd')
assert.equal(td.rows[0].value, 1)
assert.equal(playerStat('Any Time Touchdown Scorer', 'Josh Allen').stat, 'anytimeTd')
assert.equal(playerStat('Aaron Rodgers Passing Yards O/U', 'Over').stat, 'passYds')
assert.equal(playerNameFromLeg({ market: 'Aaron Rodgers Passing Yards O/U', selection: 'Over' }), 'Aaron Rodgers')
assert.equal(playerNameFromLeg({ market: 'Dak Prescott Passing Yards', selection: '271+' }), 'Dak Prescott')
assert.equal(playerNameFromLeg({ market: 'Any Time Touchdown Scorer', selection: 'Josh Allen' }), 'Josh Allen')
assert.equal(rowsFromGamelog({ labels: [], names: [], seasonTypes: [] }, 'points').rows.length, 0)

console.log('player logs ok')
