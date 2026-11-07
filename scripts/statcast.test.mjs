import assert from 'node:assert/strict'
import {
  batterNames,
  findStatcast,
  joinStatcast,
  matchBatters,
  parseCsv,
  statcastProfile,
} from './statcast.mjs'

const expected = parseCsv([
  '"last_name, first_name",player_id,year,pa,bip,ba,est_ba',
  '"Judge, Aaron",592450,2026,600,400,0.300,0.280',
  '"Crow-Armstrong, Pete",691718,2026,726,444,0.280,0.264',
].join('\n'))
const quality = parseCsv([
  '"last_name, first_name",player_id,year,pa,exit_velocity_avg,barrel_batted_rate,hard_hit_percent,xba',
  '"Judge, Aaron",592450,2026,600,95.1,20.0,55.0,.280',
].join('\n'))
const rows = joinStatcast(expected, quality)
assert.equal(rows.length, 2)
const judge = findStatcast(rows, 'Aaron Judge')
assert.equal(judge.pa, 600)
assert.equal(judge.exitVelocity, 95.1)
assert.equal(judge.barrelRate, 20)
assert.equal(judge.xba, 0.28)
assert.equal(Number(judge.baMinusXba.toFixed(3)), 0.02)
assert.equal(findStatcast(rows, 'Pete Crow-Armstrong').exitVelocity, null)
assert.equal(matchBatters(rows, ['Someone Else', 'Aaron Judge']).length, 1)
assert.equal(statcastProfile({ 'last_name, first_name': 'Solo, One', player_id: '1' }).name, 'One Solo')
assert.deepEqual(batterNames({
  rosters: [{ roster: [{ athlete: { displayName: 'Aaron Judge' } }] }],
  boxscore: { players: [{ statistics: [{ athletes: [{ athlete: { displayName: 'Juan Soto' } }] }] }] },
}).sort(), ['Aaron Judge', 'Juan Soto'].sort())

console.log('statcast ok')
