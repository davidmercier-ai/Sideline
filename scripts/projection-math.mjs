/**
 * Transparent baseline math for sports projections.
 * This is not a validated predictive model. It does not use sportsbook prices.
 */

export function asNumber(value) {
  if (value == null || value === '') return null
  if (typeof value === 'object' && value && 'value' in value) return asNumber(value.value)
  const n = typeof value === 'number' ? value : Number(String(value).replace(/,/g, ''))
  return Number.isFinite(n) ? n : null
}

export function summarize(values) {
  const nums = values.filter((value) => Number.isFinite(value))
  if (nums.length === 0) {
    return {
      n: 0,
      mean: null,
      median: null,
      modes: null,
      modeNote: 'missing game-level history',
      high: null,
      low: null,
      missing: true,
    }
  }
  const sorted = [...nums].sort((a, b) => a - b)
  const n = sorted.length
  const mean = sorted.reduce((sum, value) => sum + value, 0) / n
  const median = n % 2 === 1 ? sorted[(n - 1) / 2] : (sorted[n / 2 - 1] + sorted[n / 2]) / 2
  const counts = new Map()
  for (const value of sorted) counts.set(value, (counts.get(value) ?? 0) + 1)
  const maxCount = Math.max(...counts.values())
  const repeated = maxCount >= 2
  const modes = repeated
    ? [...counts.entries()].filter(([, count]) => count === maxCount).map(([value]) => value)
    : []
  return {
    n,
    mean,
    median,
    modes,
    modeNote: repeated ? null : 'no repeated value',
    high: sorted[n - 1],
    low: sorted[0],
    missing: false,
  }
}

/**
 * Venue-matched baseline: mean of the team's own venue production and the
 * opponent's venue allowance. Overall figures are reported separately and are
 * not blended into this number when both venue samples exist.
 */
export function projectRate(forValues, againstValues, basisLabel = 'venue-matched means') {
  const produced = summarize(forValues)
  const allowed = summarize(againstValues)
  if (produced.n > 0 && allowed.n > 0) {
    return {
      value: (produced.mean + allowed.mean) / 2,
      basis: basisLabel,
      nFor: produced.n,
      nAgainst: allowed.n,
      thin: produced.n < 3 || allowed.n < 3,
      incomplete: false,
    }
  }
  if (produced.n > 0 || allowed.n > 0) {
    return {
      value: produced.n > 0 ? produced.mean : allowed.mean,
      basis: produced.n > 0 ? 'own venue production only' : 'opponent venue allowance only',
      nFor: produced.n,
      nAgainst: allowed.n,
      thin: true,
      incomplete: true,
    }
  }
  return {
    value: null,
    basis: 'missing',
    nFor: 0,
    nAgainst: 0,
    thin: true,
    incomplete: true,
  }
}

export function overallComparison(forValues, againstValues) {
  return projectRate(forValues, againstValues, 'overall means')
}

export function round1(value) {
  if (!Number.isFinite(value)) return null
  return Math.round(value * 10) / 10
}

export function sackYardsLost(displayValue) {
  const match = String(displayValue ?? '').match(/(\d+)\s*-\s*(\d+(?:\.\d+)?)/)
  if (!match) return null
  return Number(match[2])
}

export function grossPassingYards(netYards, sackYards) {
  if (!Number.isFinite(netYards) || !Number.isFinite(sackYards)) return null
  return netYards + sackYards
}

export function reconcileTotal(rush, netPass, total) {
  if (![rush, netPass, total].every((value) => Number.isFinite(value))) {
    return { ok: false, note: 'missing component' }
  }
  const sum = rush + netPass
  const gap = Math.abs(sum - total)
  return {
    ok: gap <= 1,
    sum,
    total,
    gap,
    note: gap <= 1 ? 'rush + net pass matches total offense' : `rush + net pass differs from total offense by ${gap}`,
  }
}

export function homeMargin(home, away) {
  if (!Number.isFinite(home) || !Number.isFinite(away)) return null
  return home - away
}

export function marketHomeMargin(homeSpread) {
  if (!Number.isFinite(homeSpread)) return null
  return -homeSpread
}

export function difference(projection, market) {
  if (!Number.isFinite(projection) || !Number.isFinite(market)) return null
  return projection - market
}

export function totalDirection(diff) {
  if (!Number.isFinite(diff)) return 'unavailable'
  if (Math.abs(diff) < 0.05) return 'baseline equals the posted total'
  return diff > 0 ? 'baseline is above the posted total' : 'baseline is below the posted total'
}

export function projectedOutcome(homeName, awayName, homeScore, awayScore) {
  if (!Number.isFinite(homeScore) || !Number.isFinite(awayScore)) return 'unavailable'
  if (homeScore === awayScore) return 'projected tie'
  return homeScore > awayScore ? homeName : awayName
}
