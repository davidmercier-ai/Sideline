import assert from 'node:assert/strict'
import { progressLine, readPlayerStat, samePlayer, type BoxScore } from './boxScore.ts'

assert.equal(samePlayer('James Cook', 'James Cook III'), true)
assert.equal(samePlayer('James Cook', 'James Cooks'), false)

const box: BoxScore = {
  players: [
    {
      statistics: [
        {
          name: 'receiving',
          keys: ['receptions', 'receivingYards', 'receivingTouchdowns'],
          athletes: [{ athlete: { displayName: 'Jaylen Warren' }, stats: ['0', '0', '0'] }],
        },
        {
          name: 'rushing',
          keys: ['rushingYards', 'rushingTouchdowns'],
          athletes: [{ athlete: { displayName: 'James Cook III' }, stats: ['4', '0'] }],
        },
        {
          name: 'receiving',
          keys: ['receivingYards', 'receivingTouchdowns'],
          athletes: [{ athlete: { displayName: 'James Cook III' }, stats: ['0', '1'] }],
        },
        {
          name: 'passing',
          keys: ['passingYards'],
          athletes: [{ athlete: { displayName: 'Kirk Cousins' }, stats: ['59'] }],
        },
      ],
    },
  ],
}

assert.equal(readPlayerStat(box, 'Jaylen Warren', 'receivingYards'), 0)
assert.equal(readPlayerStat(box, 'Bucky Irving', 'receivingYards'), 0)
assert.equal(readPlayerStat(box, 'Kirk Cousins', 'passingYards'), 59)
assert.equal(readPlayerStat(box, 'James Cook', 'anytimeTouchdowns'), 1)
assert.equal(readPlayerStat(null, 'Jaylen Warren', 'receivingYards'), null)
assert.equal(progressLine('over', 22.5, 0, 'DraftKings'), 'DraftKings over 22.5 has 0.')
assert.equal(progressLine('under', 18.5, 0, 'FanDuel'), 'FanDuel under 18.5 still holds at 0.')
assert.equal(progressLine('anytime', null, 0, 'DraftKings'), 'DraftKings has no touchdown yet.')

console.log('box score ok')
