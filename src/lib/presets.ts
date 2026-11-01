import type { BookName } from './tickets'

export const FEATURE_IDS = ['draftkings', 'fanduel', 'props', 'cards', 'progress', 'exposure', 'later'] as const

export type FeatureId = (typeof FEATURE_IDS)[number]

export type Features = Record<FeatureId, boolean>

export type Preset = {
  id: string
  name: string
  features: Features
  builtin: boolean
}

export const FEATURE_LABELS: { id: FeatureId; label: string }[] = [
  { id: 'draftkings', label: 'DraftKings' },
  { id: 'fanduel', label: 'FanDuel' },
  { id: 'props', label: 'Player props' },
  { id: 'cards', label: 'Named cards' },
  { id: 'progress', label: 'Live progress' },
  { id: 'exposure', label: 'Exposure' },
  { id: 'later', label: 'Later props' },
]

const PROPS: Features = {
  draftkings: true,
  fanduel: true,
  props: true,
  cards: false,
  progress: true,
  exposure: true,
  later: true,
}

const CARDS: Features = {
  draftkings: true,
  fanduel: true,
  props: false,
  cards: true,
  progress: false,
  exposure: true,
  later: false,
}

const DRAFTKINGS: Features = {
  draftkings: true,
  fanduel: false,
  props: true,
  cards: true,
  progress: true,
  exposure: true,
  later: true,
}

const FANDUEL: Features = {
  draftkings: false,
  fanduel: true,
  props: true,
  cards: true,
  progress: true,
  exposure: true,
  later: true,
}

const FULL: Features = {
  draftkings: true,
  fanduel: true,
  props: true,
  cards: true,
  progress: true,
  exposure: true,
  later: true,
}

export const BUILTIN_PRESETS: Preset[] = [
  { id: 'props', name: 'Props', features: PROPS, builtin: true },
  { id: 'cards', name: 'Cards', features: CARDS, builtin: true },
  { id: 'draftkings', name: 'DraftKings', features: DRAFTKINGS, builtin: true },
  { id: 'fanduel', name: 'FanDuel', features: FANDUEL, builtin: true },
  { id: 'full', name: 'Full', features: FULL, builtin: true },
]

const KEY = 'sideline.presets.v1'

export function defaultFeatures(): Features {
  return { ...PROPS }
}

export function featuresEqual(left: Features, right: Features): boolean {
  return FEATURE_IDS.every((id) => left[id] === right[id])
}

export function toggleFeature(features: Features, id: FeatureId): Features {
  return { ...features, [id]: !features[id] }
}

export function matchingPreset(features: Features, custom: Preset[]): Preset | null {
  return [...BUILTIN_PRESETS, ...custom].find((preset) => featuresEqual(preset.features, features)) ?? null
}

export function allowsBook(features: Features, book: BookName): boolean {
  return book === 'DraftKings' ? features.draftkings : features.fanduel
}

export function sanitizeFeatures(value: unknown, fallback: Features = defaultFeatures()): Features {
  if (!value || typeof value !== 'object') return { ...fallback }
  const record = value as Record<string, unknown>
  const next = { ...fallback }
  for (const id of FEATURE_IDS) {
    if (typeof record[id] === 'boolean') next[id] = record[id]
  }
  return next
}

function sanitizePreset(value: unknown): Preset | null {
  if (!value || typeof value !== 'object') return null
  const record = value as Record<string, unknown>
  const id = typeof record.id === 'string' ? record.id.trim() : ''
  const name = typeof record.name === 'string' ? record.name.trim() : ''
  if (!id || !name || name.length > 32) return null
  if (BUILTIN_PRESETS.some((preset) => preset.name.toLowerCase() === name.toLowerCase())) return null
  return {
    id,
    name,
    features: sanitizeFeatures(record.features),
    builtin: false,
  }
}

export function parsePresetStore(raw: string | null): { features: Features; custom: Preset[] } {
  if (!raw) return { features: defaultFeatures(), custom: [] }
  try {
    const parsed = JSON.parse(raw) as unknown
    if (!parsed || typeof parsed !== 'object') return { features: defaultFeatures(), custom: [] }
    const record = parsed as Record<string, unknown>
    const custom = Array.isArray(record.custom) ? record.custom.map(sanitizePreset).filter((preset): preset is Preset => preset !== null) : []
    return {
      features: sanitizeFeatures(record.features),
      custom,
    }
  } catch {
    return { features: defaultFeatures(), custom: [] }
  }
}

export function readPresetStore(): { features: Features; custom: Preset[] } {
  try {
    return parsePresetStore(localStorage.getItem(KEY))
  } catch {
    return { features: defaultFeatures(), custom: [] }
  }
}

export function writePresetStore(features: Features, custom: Preset[]): void {
  localStorage.setItem(KEY, JSON.stringify({ features, custom }))
}

export function presetNameError(name: string): 'empty' | 'builtin' | null {
  const trimmed = name.trim()
  if (!trimmed) return 'empty'
  if (BUILTIN_PRESETS.some((preset) => preset.name.toLowerCase() === trimmed.toLowerCase())) return 'builtin'
  return null
}

export function upsertCustomPreset(custom: Preset[], name: string, features: Features): Preset[] {
  const trimmed = name.trim().slice(0, 32)
  const existing = custom.find((preset) => preset.name.toLowerCase() === trimmed.toLowerCase())
  if (existing) {
    return custom.map((preset) => (preset.id === existing.id ? { ...preset, name: trimmed, features: { ...features } } : preset))
  }
  const id = `custom-${trimmed.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'preset'}-${custom.length + 1}`
  return [...custom, { id, name: trimmed, features: { ...features }, builtin: false }]
}

export function removeCustomPreset(custom: Preset[], id: string): Preset[] {
  return custom.filter((preset) => preset.id !== id)
}
