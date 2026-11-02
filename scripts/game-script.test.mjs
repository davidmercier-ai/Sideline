import assert from 'node:assert/strict'
import { gameScript } from './game-script.mjs'

const result = gameScript({
  game: 'Away at Home',
  call: 'Pass',
  personnel: [
    { name: 'Left tackle', team: 'Home', side: 'offense', role: 'LT', status: 'out', source: 'injury list', date: '2026-11-01', matchup: 'Edge' },
    { name: 'Edge', team: 'Away', side: 'defense', role: 'edge', status: 'in', source: 'roster', date: '2026-11-01' },
    { name: 'New tackle', team: 'Away', side: 'defense', role: 'DT', status: 'limited', source: 'coach', date: '2026-11-01', quote: 'not a full workload' },
    { name: 'Receiver', team: 'Home', side: 'offense', role: 'WR', status: 'out', source: 'injury list', date: '2026-11-01' },
  ],
  tendencies: [
    { label: 'Home pass', offense: 245, defense: 302 },
    { label: 'Missing side', offense: 10 },
  ],
  scheme: { offense: { team: 'Away', source: 'preview', date: '2026-11-01', text: 'noted' } },
})

assert.equal(result.changesBet, false)
assert.equal(result.call, 'Pass')
assert.equal(result.branches.every((branch) => branch.changesBet === false), true)
assert.equal(result.scheme.recorded, false)
assert.match(result.scheme.text, /defense scheme is missing/)

const cross = result.branches.find((branch) => branch.name === 'Left tackle out')
assert.match(cross.script, /Edge/)
assert.match(cross.script, /log was built with the absent player/)

const receiver = result.branches.find((branch) => branch.name === 'Receiver out')
assert.match(receiver.script, /replacement is not named/)
assert.match(receiver.script, /other side of that matchup is not named/)

const debut = result.branches.filter((branch) => branch.person === 'New tackle')
assert.equal(debut.length, 2)
assert.match(debut[0].script, /not a full workload/)

const gap = result.tendencies[0]
assert.equal(gap.edge, false)
assert.equal(gap.gap, -57)
assert.match(gap.text, /not an edge/)
assert.match(result.tendencies[1].text, /missing a side/)

const bare = gameScript({ scheme: {} })
assert.match(bare.scheme.text, /not recorded for either side/)
assert.equal(bare.branches.length, 0)

console.log('game script ok')
