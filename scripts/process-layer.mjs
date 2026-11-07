/**
 * The stat on the card is the conversion. The volume underneath it is the process.
 * A rate from past games is not the chance tonight.
 * The three layers are from the Circles Off YouTube channel. This file is the record.
 */

import { asNumber } from './projection-math.mjs'

export function americanNumber(value) {
  const number = Number(String(value ?? '').replace('+', ''))
  return Number.isFinite(number) && number !== 0 ? number : null
}

/** A two-sided total is the main line when neither price is shorter than -300. */
export function isMainTotal(quote) {
  const over = americanNumber(quote?.over)
  const under = americanNumber(quote?.under)
  if (over == null || under == null) return false
  return over > -300 && under > -300
}

export function preferMainTotal(quotes) {
  const mains = (quotes ?? []).filter(isMainTotal)
  if (!mains.length) return null
  const distance = (quote) => Math.min(Math.abs(americanNumber(quote.over)), Math.abs(americanNumber(quote.under)))
  return [...mains].sort((a, b) => distance(a) - distance(b) || a.line - b.line)[0]
}

/** ESPN sign: negative means the home team is favored. "+0.5" is a home dog. */
export function homeSpreadFromClose(line) {
  return asNumber(line)
}

export const SIM_BUCKETS = [
  { id: 'under50', label: 'Under 50%', test: (rate) => rate < 0.5 },
  { id: 'to60', label: '50 to 60%', test: (rate) => rate >= 0.5 && rate < 0.6 },
  { id: 'to70', label: '60 to 70%', test: (rate) => rate >= 0.6 && rate < 0.7 },
  { id: 'to80', label: '70 to 80%', test: (rate) => rate >= 0.7 && rate < 0.8 },
  { id: 'over80', label: '80% or more', test: (rate) => rate >= 0.8 },
]

export function simBucket(rate) {
  if (!Number.isFinite(rate)) return null
  return SIM_BUCKETS.find((bucket) => bucket.test(rate))?.id ?? null
}

export function simCalibration(rows) {
  return SIM_BUCKETS.map((bucket) => {
    const sample = (rows ?? []).filter((row) => (
      simBucket(row.simHomeRate) === bucket.id
      && (row.actual === 'home' || row.actual === 'away')
    ))
    const hits = sample.filter((row) => row.actual === 'home').length
    return { id: bucket.id, label: bucket.label, hits, decided: sample.length }
  })
}

function mean(values) {
  const nums = values.filter((value) => Number.isFinite(value))
  if (!nums.length) return null
  return nums.reduce((sum, value) => sum + value, 0) / nums.length
}

/**
 * Last 3 of the binary first-goal log, beside last 3 of goals scored.
 * A first-goal zero is the conversion window. It is not a scoring drought.
 */
export function conversionWindow(firstValues, goalValues) {
  const firstLast3 = mean([...(firstValues ?? [])].filter((value) => Number.isFinite(value)).slice(-3))
  const scoredLast3 = mean([...(goalValues ?? [])].filter((value) => Number.isFinite(value)).slice(-3))
  const firstText = firstLast3 == null ? 'missing' : `${Math.round(firstLast3 * 100)}%`
  const goalText = scoredLast3 == null ? 'missing' : `${scoredLast3.toFixed(1)} per game`
  return {
    firstLast3,
    scoredLast3,
    label: `Last 3 first goals ${firstText}. Last 3 goals ${goalText}.`,
  }
}

function priorMean(rows, gameDate, field) {
  const prior = rows.filter((row) => String(row.date) < String(gameDate) && Number.isFinite(row[field]))
  return { mean: mean(prior.map((row) => row[field])), n: prior.length }
}

/**
 * One leader by prior venue shots, one by prior venue first-goal share.
 * A player needs 3 prior games at the site. A hit means that player scored first.
 */
export function scoreProcessLeaders(games, appearances) {
  const byPlayer = new Map()
  for (const row of appearances ?? []) {
    const key = `${row.name}|${row.teamId}`
    const list = byPlayer.get(key) ?? []
    list.push(row)
    byPlayer.set(key, list)
  }
  const tally = {
    shots: { hits: 0, decided: 0 },
    share: { hits: 0, decided: 0 },
  }
  const ordered = [...(games ?? [])].sort((a, b) => String(a.date).localeCompare(String(b.date)))
  for (const game of ordered) {
    const shotCandidates = []
    const shareCandidates = []
    for (const rows of byPlayer.values()) {
      const current = rows.find((row) => row.eventId === game.id)
      if (!current) continue
      const venueRows = rows.filter((row) => row.venue === current.venue)
      const shots = priorMean(venueRows, game.date, 'shots')
      const share = priorMean(venueRows, game.date, 'first')
      if (shots.n >= 3 && shots.mean != null) {
        shotCandidates.push({ name: current.name, value: current.first, mean: shots.mean })
      }
      if (share.n >= 3 && share.mean != null) {
        shareCandidates.push({ name: current.name, value: current.first, mean: share.mean })
      }
    }
    const take = (candidates, key) => {
      if (!candidates.length) return
      candidates.sort((a, b) => b.mean - a.mean || String(a.name).localeCompare(String(b.name)))
      tally[key].decided += 1
      if (candidates[0].value === 1) tally[key].hits += 1
    }
    take(shotCandidates, 'shots')
    take(shareCandidates, 'share')
  }
  return tally
}
