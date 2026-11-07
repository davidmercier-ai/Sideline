import assert from 'node:assert/strict'
import { mulberry32 } from './projection-math.mjs'
import {
  blendRating,
  nbaGamesFromLog,
  nflGamesFromLog,
  simulateNbaBox,
  simulateNbaDraw,
  simulateNflDraw,
  splitMade,
} from './statline-sim.mjs'

assert.equal(blendRating(0.6, null, 90), 0.6)
assert.ok(blendRating(0.6, 90, 70) > 0.6)
assert.ok(blendRating(0.6, 60, 90) < 0.6)
assert.ok(blendRating(0.99, 99, 40) <= 0.9)

assert.deepEqual(splitMade('9-19'), { made: 9, attempted: 19 })
assert.equal(splitMade('20-19'), null)

const curryLog = {
  names: [
    'minutes',
    'fieldGoalsMade-fieldGoalsAttempted',
    'fieldGoalPct',
    'threePointFieldGoalsMade-threePointFieldGoalsAttempted',
    'threePointPct',
    'freeThrowsMade-freeThrowsAttempted',
    'freeThrowPct',
    'totalRebounds',
    'assists',
    'blocks',
    'steals',
    'fouls',
    'turnovers',
    'points',
  ],
  seasonTypes: [
    {
      displayName: '2026-27 Regular Season',
      categories: [
        {
          type: 'event',
          events: [
            { eventId: '1', stats: ['28', '9-19', '47.4', '6-12', '50', '5-5', '100', '5', '4', '0', '1', '1', '2', '29'] },
          ],
        },
      ],
    },
  ],
  events: { 1: { atVs: 'vs', gameDate: '2026-11-01' } },
}
const parsed = nbaGamesFromLog(curryLog)
assert.equal(parsed.length, 1)
assert.equal(parsed[0].fga, 19)
assert.equal(parsed[0].fg3a, 12)
assert.equal(parsed[0].venue, 'home')
assert.equal(parsed[0].pts, 29)

function shooter(name, fga, fgm, extra = {}) {
  const game = {
    minutes: 30,
    fgm,
    fga,
    fg3m: 0,
    fg3a: 0,
    ftm: 0,
    fta: 0,
    reb: 1,
    ast: 1,
    blk: 0,
    stl: 0,
    pf: 1,
    to: 0,
    pts: fgm * 2,
    ...extra,
  }
  return { name, games: [game, game, game] }
}

const home = [shooter('Home Star', 10, 5, { to: 2, ast: 4, reb: 5 })]
const away = [shooter('Away Star', 8, 4, { stl: 2, blk: 1, reb: 5 })]
const draw = simulateNbaDraw(home, away, mulberry32(7))
const homeStar = draw.home[0]
const awayStar = draw.away[0]
assert.equal(homeStar.fga, 10)
assert.equal(awayStar.fga, 8)
assert.equal(homeStar.pts, (homeStar.fgm - homeStar.fg3m) * 2 + homeStar.fg3m * 3 + homeStar.ftm)
assert.equal(awayStar.pts, (awayStar.fgm - awayStar.fg3m) * 2 + awayStar.fg3m * 3 + awayStar.ftm)
assert.ok(homeStar.ast <= homeStar.fgm + awayStar.fgm)
assert.ok(awayStar.stl <= homeStar.to)
assert.equal(draw.plays.length > 0, true)

const again = simulateNbaBox({ home, away, draws: 20, seed: 7 })
const repeat = simulateNbaBox({ home, away, draws: 20, seed: 7 })
assert.equal(again.homeMedian, repeat.homeMedian)
assert.equal(again.sample.home[0].pts, repeat.sample.home[0].pts)
assert.equal(again.sample.plays.length, repeat.sample.plays.length)

const silent = [{ name: 'No Shots', games: [{ minutes: 10, fgm: 0, fga: 0, fg3m: 0, fg3a: 0, ftm: 0, fta: 0, reb: 0, ast: 0, blk: 0, stl: 0, pf: 0, to: 0, pts: 0 }] }]
const quiet = simulateNbaDraw(silent, silent, mulberry32(1))
assert.equal(quiet.home[0].fga, 0)
assert.equal(quiet.home[0].pts, 0)

const threes = Array.from({ length: 3 }, () => ({
  minutes: 30, fgm: 8, fga: 16, fg3m: 4, fg3a: 10, ftm: 0, fta: 0, reb: 1, ast: 0, blk: 0, stl: 0, pf: 1, to: 0, pts: 16,
}))
let hotMakes = 0
let coldMakes = 0
for (let i = 0; i < 40; i += 1) {
  hotMakes += simulateNbaDraw(
    [{ name: 'Hot', games: threes, skills: { three: 99, contestThree: 40 } }],
    [{ name: 'Other', games: threes }],
    mulberry32(i),
  ).home[0].fg3m
  coldMakes += simulateNbaDraw(
    [{ name: 'Cold', games: threes, skills: { three: 40, contestThree: 95 } }],
    [{ name: 'Other', games: threes }],
    mulberry32(i),
  ).home[0].fg3m
}
assert.ok(hotMakes > coldMakes)

const qbGame = { att: 10, cmp: 6, passYds: 60, passTd: 1, int: 1, sacks: 2, car: 2, rushYds: 8, rushTd: 0, tgt: 0, rec: 0, recYds: 0, recTd: 0 }
const wrGame = { att: 0, cmp: 0, passYds: 0, passTd: 0, int: 0, sacks: 0, car: 0, rushYds: 0, rushTd: 0, tgt: 8, rec: 4, recYds: 40, recTd: 1 }
const nfl = simulateNflDraw(
  [{ name: 'QB', games: [qbGame, qbGame] }, { name: 'WR', games: [wrGame, wrGame] }],
  [{ name: 'Other', games: [{ ...qbGame, att: 0, cmp: 0, passYds: 0, passTd: 0, int: 0, sacks: 0, car: 0 }] }],
  mulberry32(3),
)
const qb = nfl.home[0]
const wr = nfl.home[1]
assert.equal(qb.att, 10)
assert.ok(qb.cmp + qb.int <= qb.att)
assert.ok(wr.rec <= wr.tgt)
assert.ok(nfl.plays.some((play) => play.startsWith('QB')))

const blanks = simulateNflDraw(
  [
    { name: 'QB', games: [{ att: 4, cmp: 0, passYds: 0, passTd: 0, int: 0, sacks: 0, car: 0, rushYds: 0, rushTd: 0, tgt: 0, rec: 0, recYds: 0, recTd: 0, fgMade: 0, fgAtt: 0, xpMade: 0, xpAtt: 0 }] },
    { name: 'WR', games: [{ att: 0, cmp: 0, passYds: 0, passTd: 0, int: 0, sacks: 0, car: 0, rushYds: 0, rushTd: 0, tgt: 5, rec: 0, recYds: 0, recTd: 0, fgMade: 0, fgAtt: 0, xpMade: 0, xpAtt: 0 }] },
  ],
  [{ name: 'Other', games: [{ att: 0, cmp: 0, passYds: 0, passTd: 0, int: 0, sacks: 0, car: 0, rushYds: 0, rushTd: 0, tgt: 0, rec: 0, recYds: 0, recTd: 0, fgMade: 0, fgAtt: 0, xpMade: 0, xpAtt: 0 }] }],
  mulberry32(1),
)
assert.equal(blanks.home[0].att, 4)
assert.equal(blanks.home[1].rec, 0)
assert.equal(blanks.home[1].tgt, 4)

const kickerLog = {
  names: ['fieldGoalsMade-fieldGoalAttempts', 'extraPointsMade-extraPointAttempts', 'totalKickingPoints'],
  seasonTypes: [{
    displayName: '2026 Regular Season',
    categories: [{ type: 'event', events: [{ eventId: 'k1', stats: ['1-2', '1-1', '4'] }] }],
  }],
  events: { k1: { atVs: 'vs', gameDate: '2026-11-01' } },
}
const kicks = nflGamesFromLog(kickerLog)
assert.equal(kicks[0].fgAtt, 2)
assert.equal(kicks[0].xpMade, 1)
assert.equal(kicks[0].venue, 'home')

console.log('statline sim ok')
