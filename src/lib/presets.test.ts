import assert from 'node:assert/strict'
import {
  BUILTIN_PRESETS,
  allowsBook,
  defaultFeatures,
  featuresEqual,
  matchingPreset,
  parsePresetStore,
  presetNameError,
  removeCustomPreset,
  toggleFeature,
  upsertCustomPreset,
} from './presets.ts'

const props = BUILTIN_PRESETS[0]
assert.equal(props.name, 'Props')
assert.ok(featuresEqual(defaultFeatures(), props.features))
assert.equal(allowsBook(props.features, 'DraftKings'), true)
assert.equal(allowsBook(props.features, 'FanDuel'), true)
assert.equal(props.features.cards, false)

const cards = BUILTIN_PRESETS.find((preset) => preset.id === 'cards')
assert.ok(cards)
assert.equal(cards.features.props, false)
assert.equal(cards.features.cards, true)
assert.equal(allowsBook(BUILTIN_PRESETS.find((preset) => preset.id === 'draftkings')!.features, 'FanDuel'), false)

const flipped = toggleFeature(defaultFeatures(), 'exposure')
assert.equal(flipped.exposure, false)
assert.equal(defaultFeatures().exposure, true)
assert.equal(matchingPreset(flipped, []), null)
assert.equal(matchingPreset(defaultFeatures(), [])?.id, 'props')

assert.equal(presetNameError('  '), 'empty')
assert.equal(presetNameError('props'), 'builtin')
assert.equal(presetNameError('Sunday night'), null)

const saved = upsertCustomPreset([], 'Sunday night', flipped)
assert.equal(saved.length, 1)
assert.equal(saved[0].builtin, false)
assert.ok(featuresEqual(saved[0].features, flipped))
assert.equal(matchingPreset(flipped, saved)?.name, 'Sunday night')

const replaced = upsertCustomPreset(saved, 'sunday night', defaultFeatures())
assert.equal(replaced.length, 1)
assert.equal(replaced[0].features.exposure, true)
assert.equal(removeCustomPreset(replaced, replaced[0].id).length, 0)
assert.equal(removeCustomPreset(replaced, 'props').length, 1)

const parsed = parsePresetStore(
  JSON.stringify({
    features: { draftkings: false, cards: true, extra: true },
    custom: [
      { id: 'custom-1', name: 'Props', features: flipped },
      { id: 'custom-2', name: 'Late', features: { fanduel: false } },
      { id: '', name: 'Nope', features: flipped },
    ],
  }),
)
assert.equal(parsed.features.draftkings, false)
assert.equal(parsed.features.cards, true)
assert.equal(parsed.features.props, true)
assert.equal(parsed.custom.length, 1)
assert.equal(parsed.custom[0].name, 'Late')
assert.equal(parsed.custom[0].features.fanduel, false)
assert.equal(parsed.custom[0].features.draftkings, true)
assert.deepEqual(parsePresetStore('not json'), { features: defaultFeatures(), custom: [] })

console.log('presets ok')
