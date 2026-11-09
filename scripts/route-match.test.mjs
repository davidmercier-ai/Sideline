import assert from 'node:assert/strict'
import { personnelMatch } from './route-match.mjs'

const receiver = {
  buckets: {
    light_box: { targets: 12, yards: 144 },
    heavy_box: { targets: 10, yards: 70 },
    four_rush: { targets: 9, yards: 45 },
    extra_rush: { targets: 11, yards: 99 },
  },
}

const favorable = personnelMatch(receiver, {
  light_box: 80,
  heavy_box: 40,
  four_rush: 30,
  extra_rush: 70,
})

assert.equal(favorable.coverage, 'missing')
assert.equal(favorable.changesBet, false)
assert.equal(favorable.box.favorable, true)
assert.equal(favorable.box.modal, 'light box')
assert.equal(favorable.rush.favorable, true)
assert.equal(favorable.rush.modal, 'extra rushers')

const thin = personnelMatch(receiver, { light_box: 5, heavy_box: 4, four_rush: 3, extra_rush: 2 })
assert.equal(thin.box.favorable, false)
assert.equal(thin.box.thin, true)
assert.match(thin.box.text, /Thin sample/)

const flat = personnelMatch(
  {
    buckets: {
      light_box: { targets: 10, yards: 80 },
      heavy_box: { targets: 10, yards: 78 },
      four_rush: { targets: 8, yards: 40 },
      extra_rush: { targets: 8, yards: 40 },
    },
  },
  { light_box: 60, heavy_box: 20, four_rush: 50, extra_rush: 10 },
)
assert.equal(flat.box.favorable, false)
assert.equal(flat.rush.favorable, false)
assert.match(flat.box.text, /light box is 75%/)

console.log('route match ok')
