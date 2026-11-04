import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { gameScript } from './game-script.mjs'
import {
  personnelFromReports,
  saveReport,
  scoutedSim,
  scriptFromReports,
} from './scouting-reports.mjs'

const stored = JSON.parse(await readFile(new URL('../docs/projections/scouting/reports.json', import.meta.url), 'utf8'))
assert.equal(stored.reports.length, 16)
for (const report of stored.reports) {
  assert.ok(report.source)
  assert.match(report.date, /^\d{4}-\d{2}-\d{2}$/)
  assert.ok(report.said)
  assert.equal(Object.hasOwn(report, 'snapShare'), false)
}

const simmons = stored.reports.find((report) => report.id === 'mnf-2026-11-02-jeffery-simmons')
assert.match(simmons.said, /carry a load/)
assert.equal(simmons.dropGames.length, 0)

const monday = scriptFromReports(stored.reports, {
  game: 'Bears at Seahawks',
  call: 'Pass. Seattle -3 and 46.5 sit inside the four reads',
})
assert.equal(monday.personnel.some((fact) => fact.name === 'Kenshin Yasuda'), false)
assert.equal(monday.personnel.some((fact) => fact.name === 'Charles Cross' && fact.status === 'out'), true)
const script = gameScript(monday)
assert.equal(script.changesBet, false)
assert.equal(script.branches.every((branch) => branch.changesBet === false), true)
const cross = script.branches.find((branch) => branch.name === 'Charles Cross out')
assert.match(cross.script, /replacement is not named/)
assert.match(cross.script, /other side of that matchup is not named/)
assert.equal(/Sweat/.test(cross.script), false)
const nelson = script.branches.filter((branch) => branch.person === 'Quenton Nelson')
assert.equal(nelson.length, 2)
assert.match(nelson[0].script, /First game in a Seahawks uniform/)

const bench = personnelFromReports(stored.reports.filter((report) => report.game === 'J1 2026-11-01'))
assert.equal(bench.personnel.some((fact) => fact.name === 'Kenshin Yasuda'), false)
assert.equal(bench.personnel.some((fact) => fact.name === 'Erison'), false)
assert.equal(bench.personnel.find((fact) => fact.name === 'Daiya Tono').status, 'in')

let store = { reports: [] }
const first = saveReport(store, {
  id: 'note-1',
  source: 'club site',
  date: '2026-11-01',
  said: 'He starts.',
  subject: 'Starter',
  status: 'in',
  snapShare: 0.4,
})
assert.equal(first.ok, true)
assert.equal(first.store.reports.length, 1)
assert.equal(Object.hasOwn(first.store.reports[0], 'snapShare'), false)
store = first.store
const replaced = saveReport(store, {
  id: 'note-1',
  source: 'club site',
  date: '2026-11-01',
  said: 'He starts on the left.',
  subject: 'Starter',
  status: 'in',
})
assert.equal(replaced.store.reports.length, 1)
assert.match(replaced.store.reports[0].said, /left/)
const rejected = saveReport(replaced.store, { id: 'note-2', source: 'paper', date: '2026-11-01' })
assert.equal(rejected.ok, false)
assert.equal(rejected.store.reports.length, 1)
const badDrop = saveReport(replaced.store, {
  id: 'note-3',
  source: 'paper',
  date: '2026-11-01',
  said: 'He sat.',
  dropGames: [{ team: 'Bears' }],
})
assert.equal(badDrop.ok, false)

const awayFor = [
  { team: 'Seahawks', date: '2026-09-10T00:00:00Z', value: 0 },
  { team: 'Seahawks', date: '2026-09-17', value: 10 },
  { team: 'Seahawks', date: '2026-09-24', value: 10 },
]
const flat = [10, 10, 10]
const homeFor = [
  { team: 'Bears', date: '2026-09-10', value: 21 },
  { team: 'Bears', date: '2026-09-17', value: 21 },
  { team: 'Bears', date: '2026-09-24', value: 21 },
]
const drop = {
  id: 'drop-one',
  source: 'ESPN gamelog',
  date: '2026-11-01',
  said: 'The September 10 game is not this role.',
  subject: 'Back',
  dropGames: [{ team: 'Seahawks', date: '2026-09-10' }],
  snapShare: 0.2,
}
const result = scoutedSim({
  awayFor,
  homeAgainst: flat,
  homeFor,
  awayAgainst: flat,
  reports: [drop],
  seed: 7,
  draws: 1,
})
assert.equal(result.base.label, 'base')
assert.equal(result.scouted.label, 'scouted')
assert.equal(result.base.ok, true)
assert.equal(result.scouted.ok, true)
assert.equal(result.counts.base.awayFor, 3)
assert.equal(result.counts.scouted.awayFor, 2)
assert.equal(result.dropped.length, 1)
assert.equal(result.dropped[0].date, '2026-09-10')
assert.equal(result.dropped[0].value, 0)
assert.equal(result.base.awayMedian, 5)
assert.equal(result.scouted.awayMedian, 10)

const reading = scoutedSim({
  awayFor,
  homeAgainst: flat,
  homeFor,
  awayAgainst: flat,
  reports: [{
    id: 'wilson',
    source: 'our log',
    date: '2026-11-01',
    said: 'Week 1 was two carries.',
    subject: 'Emanuel Wilson',
  }],
  seed: 20261030,
  draws: 20,
})
assert.equal(reading.dropped.length, 0)
assert.equal(reading.counts.scouted.awayFor, 3)

const unsourced = scoutedSim({
  awayFor,
  homeAgainst: flat,
  homeFor,
  awayAgainst: flat,
  reports: [{ id: 'bare', said: 'Skip that game.', dropGames: [{ team: 'Seahawks', date: '2026-09-10' }] }],
  seed: 1,
  draws: 10,
})
assert.equal(unsourced.dropped.length, 0)
assert.match(unsourced.problems[0], /without a source/)

const emptied = scoutedSim({
  awayFor: [{ team: 'Seahawks', date: '2026-09-10', value: 7 }],
  homeAgainst: flat,
  homeFor,
  awayAgainst: flat,
  reports: [drop],
  seed: 1,
  draws: 10,
})
assert.equal(emptied.base.ok, true)
assert.equal(emptied.scouted.ok, false)
assert.equal(emptied.counts.scouted.awayFor, 0)

const plain = scoutedSim({
  awayFor: [10, 20],
  homeAgainst: [10, 20],
  homeFor: [30, 40],
  awayAgainst: [30, 40],
  reports: [drop],
  seed: 7,
  draws: 15,
})
assert.equal(plain.dropped.length, 0)
assert.equal(plain.counts.base.awayFor, plain.counts.scouted.awayFor)

console.log('scouting reports ok')
