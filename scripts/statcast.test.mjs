import assert from 'node:assert/strict'
import {
  addPlateAppearance,
  batterNames,
  compareWindows,
  findStatcast,
  hitterFromCount,
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

const counts = new Map()
addPlateAppearance(counts, { batter: '1', player_name: 'Judge, Aaron', events: 'single', estimated_ba_using_speedangle: '0.4', launch_speed: '100', launch_speed_angle: '6' })
addPlateAppearance(counts, { batter: '1', player_name: 'Judge, Aaron', events: 'field_out', estimated_ba_using_speedangle: '0.1', launch_speed: '80', launch_speed_angle: '2' })
addPlateAppearance(counts, { batter: '1', player_name: 'Judge, Aaron', events: 'walk' })
addPlateAppearance(counts, { batter: '1', player_name: 'Judge, Aaron', events: 'strikeout' })
const counted = hitterFromCount(counts.get('1'))
assert.equal(counted.pa, 4)
assert.equal(counted.ab, 3)
assert.equal(counted.hits, 1)
assert.equal(counted.ba, 1 / 3)
assert.equal(Number(counted.xba.toFixed(3)), 0.167)
assert.equal(counted.barrels, 1)
const windows = compareWindows(
  [{ id: '1', name: 'Hot', ab: 100, ba: 0.300, xba: 0.250 }, { id: '2', name: 'Cold', ab: 100, ba: 0.220, xba: 0.270 }],
  [{ id: '1', name: 'Hot', ab: 100, ba: 0.250 }, { id: '2', name: 'Cold', ab: 100, ba: 0.260 }],
)
assert.equal(windows.hitters, 2)
assert.equal(windows.hot, 1)
assert.equal(windows.hotFell, 1)
assert.equal(windows.cold, 1)
assert.equal(windows.coldRose, 1)
assert.ok(windows.xbaMae < windows.baMae)

console.log('statcast ok')
