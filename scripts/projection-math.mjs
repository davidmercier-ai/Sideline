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

/** Average of two medians. This is not a median of added components. */
export function medianPair(forValues, againstValues) {
  const produced = summarize(forValues)
  const allowed = summarize(againstValues)
  if (produced.median == null || allowed.median == null) {
    return {
      value: null,
      basis: 'venue medians',
      nFor: produced.n,
      nAgainst: allowed.n,
      thin: true,
      incomplete: true,
    }
  }
  return {
    value: (produced.median + allowed.median) / 2,
    basis: 'average of the two venue medians',
    nFor: produced.n,
    nAgainst: allowed.n,
    thin: produced.n < 3 || allowed.n < 3,
    incomplete: false,
  }
}

export function sideOf(margin) {
  if (!Number.isFinite(margin)) return 'unavailable'
  if (Math.abs(margin) < 0.05) return 'tie'
  return margin > 0 ? 'home' : 'away'
}

export function rangeOf(values) {
  const nums = values.filter((value) => Number.isFinite(value))
  if (nums.length === 0) return null
  return Math.max(...nums) - Math.min(...nums)
}

/**
 * Agreement among independent methods. This is not outside consensus.
 * Unavailable methods are not counted as a vote.
 */
export function methodConvergence(methods) {
  const known = methods.filter((method) => sideOf(method.margin) !== 'unavailable')
  const counts = { home: 0, away: 0, tie: 0 }
  for (const method of known) counts[sideOf(method.margin)] += 1
  const votes = Object.entries(counts).filter(([, count]) => count > 0)
  const unanimous = known.length > 0 && votes.length === 1
  return {
    known: known.length,
    counts,
    unanimous,
    side: unanimous ? votes[0][0] : known.length ? 'split' : 'unavailable',
    marginRange: rangeOf(known.map((method) => method.margin)),
    totalRange: rangeOf(known.map((method) => method.total)),
  }
}

/**
 * The two inputs inside one matchup, each compared with that team's own overall rate.
 * Reinforce means both inputs sit on the same side of their overall rate.
 * This is not a blend and it is not a market comparison.
 */
export function inputSynergy(ownVenue, ownOverall, allowanceVenue, allowanceOverall) {
  if (![ownVenue, ownOverall, allowanceVenue, allowanceOverall].every((value) => Number.isFinite(value))) {
    return { status: 'missing-input' }
  }
  const own = ownVenue - ownOverall
  const allowance = allowanceVenue - allowanceOverall
  if (Math.abs(own) < 0.05 && Math.abs(allowance) < 0.05) return { status: 'flat', own, allowance }
  if (own * allowance > 0) return { status: 'reinforce', own, allowance }
  return { status: 'diverge', own, allowance }
}

export function mulberry32(seed) {
  let state = seed >>> 0
  return function random() {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function resampleScore(forValues, againstValues, random) {
  if (!forValues.length || !againstValues.length) return null
  const own = forValues[Math.floor(random() * forValues.length)]
  const allowed = againstValues[Math.floor(random() * againstValues.length)]
  return (own + allowed) / 2
}

/**
 * Resample completed games. This is a simulation, separate from the four
 * point estimates and from the sportsbook price.
 */
export function simulateMatch({ awayFor, homeAgainst, homeFor, awayAgainst, random, draws, homeMarginLine, totalLine }) {
  if (!awayFor.length || !homeAgainst.length || !homeFor.length || !awayAgainst.length) {
    return { ok: false, reason: 'missing venue games' }
  }
  let homeWins = 0
  let ties = 0
  let covers = 0
  let coverPushes = 0
  let overs = 0
  let overPushes = 0
  const awayScores = []
  const homeScores = []
  for (let i = 0; i < draws; i += 1) {
    const away = resampleScore(awayFor, homeAgainst, random)
    const home = resampleScore(homeFor, awayAgainst, random)
    awayScores.push(away)
    homeScores.push(home)
    const margin = home - away
    if (margin > 0) homeWins += 1
    else if (margin === 0) ties += 1
    if (Number.isFinite(homeMarginLine)) {
      if (margin > homeMarginLine) covers += 1
      else if (margin === homeMarginLine) coverPushes += 1
    }
    if (Number.isFinite(totalLine)) {
      const total = home + away
      if (total > totalLine) overs += 1
      else if (total === totalLine) overPushes += 1
    }
  }
  const median = (values) => [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)]
  return {
    ok: true,
    draws,
    awayMedian: median(awayScores),
    homeMedian: median(homeScores),
    homeWinRate: homeWins / draws,
    tieRate: ties / draws,
    awayWinRate: (draws - homeWins - ties) / draws,
    coverRate: Number.isFinite(homeMarginLine) ? covers / draws : null,
    coverPushRate: Number.isFinite(homeMarginLine) ? coverPushes / draws : null,
    overRate: Number.isFinite(totalLine) ? overs / draws : null,
    overPushRate: Number.isFinite(totalLine) ? overPushes / draws : null,
    thin: awayFor.length < 3 || homeAgainst.length < 3 || homeFor.length < 3 || awayAgainst.length < 3,
  }
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

export function impliedFromAmerican(odds) {
  const parsed = typeof odds === 'number' ? odds : Number(String(odds ?? '').replace('+', ''))
  if (!Number.isFinite(parsed) || parsed === 0) return null
  if (parsed > 0) return 100 / (parsed + 100)
  return Math.abs(parsed) / (Math.abs(parsed) + 100)
}

export function noVigPair(awayOdds, homeOdds) {
  const away = impliedFromAmerican(awayOdds)
  const home = impliedFromAmerican(homeOdds)
  if (away == null || home == null) return null
  const sum = away + home
  if (sum <= 0) return null
  return { away: away / sum, home: home / sum, hold: sum - 1 }
}

/** Where a book number sits relative to the independent methods. */
export function quotePosition(quote, values) {
  const nums = values.filter((value) => Number.isFinite(value))
  if (!Number.isFinite(quote) || nums.length === 0) return 'missing-input'
  const low = Math.min(...nums)
  const high = Math.max(...nums)
  if (quote < low || quote > high) return 'outside-method-range'
  return 'inside-method-range'
}

export function totalDirection(diff) {
  if (!Number.isFinite(diff)) return 'unavailable'
  if (Math.abs(diff) < 0.05) return 'baseline equals the posted total'
  return diff > 0 ? 'baseline is above the posted total' : 'baseline is below the posted total'
}

function placeAgainst(actual, line) {
  if (!Number.isFinite(actual) || !Number.isFinite(line)) return null
  if (actual > line) return 'cover'
  if (actual < line) return 'miss'
  return 'push'
}

function placeTotal(actual, line) {
  if (!Number.isFinite(actual) || !Number.isFinite(line)) return null
  if (actual > line) return 'over'
  if (actual < line) return 'under'
  return 'push'
}

/**
 * List completed games and place the matching slice against a posted spread and total.
 * `spread` is the market home margin: positive means the home team is favored.
 * A home row covers when its margin is greater than that number.
 * An away row covers when its margin is greater than the negative of that number.
 * The count is a read of past games. It is not a model and not an edge.
 */
export function gradeLog(rows, { matchVenue = 'overall', spread = null, total = null, side = 'home' } = {}) {
  const games = (rows ?? []).map((row) => {
    const margin = Number(row.pointsFor) - Number(row.pointsAgainst)
    const combined = Number(row.pointsFor) + Number(row.pointsAgainst)
    const matched = matchVenue === 'overall' || row.venue === matchVenue
    const line = side === 'away' ? (Number.isFinite(spread) ? -spread : null) : spread
    return {
      date: row.date || '',
      venue: row.venue || '',
      opponent: row.opponent || '',
      pointsFor: row.pointsFor,
      pointsAgainst: row.pointsAgainst,
      margin,
      combined,
      matched,
      spreadResult: matched ? placeAgainst(margin, line) : null,
      totalResult: matched ? placeTotal(combined, total) : null,
    }
  })
  const matched = games.filter((game) => game.matched)
  const tally = (key, value) => matched.filter((game) => game[key] === value).length
  return {
    games,
    matched: matched.length,
    spread: Number.isFinite(spread)
      ? { cover: tally('spreadResult', 'cover'), miss: tally('spreadResult', 'miss'), push: tally('spreadResult', 'push') }
      : null,
    total: Number.isFinite(total)
      ? { over: tally('totalResult', 'over'), under: tally('totalResult', 'under'), push: tally('totalResult', 'push') }
      : null,
  }
}

export function projectedOutcome(homeName, awayName, homeScore, awayScore) {
  if (!Number.isFinite(homeScore) || !Number.isFinite(awayScore)) return 'unavailable'
  if (homeScore === awayScore) return 'projected tie'
  return homeScore > awayScore ? homeName : awayName
}

function readOf(name, values, pick) {
  const summary = summarize(values)
  return {
    name,
    value: summary.missing ? null : pick(summary),
    n: summary.n,
    thin: summary.n > 0 && summary.n < 3,
    missing: summary.missing,
  }
}

/**
 * Four reads of one player's own log. Venue is home or away for the game
 * being projected. Opponent allowance is not applied. Overall is not copied
 * into the venue read when the venue sample is empty.
 */
export function playerReads(rows, venue) {
  const ordered = [...rows].sort((a, b) => String(a.date).localeCompare(String(b.date)))
  const overall = ordered.map((row) => row.value).filter((value) => Number.isFinite(value))
  const venueValues = ordered
    .filter((row) => venue && row.venue === venue)
    .map((row) => row.value)
    .filter((value) => Number.isFinite(value))
  const last3 = overall.slice(-3)
  return [
    readOf('Venue mean', venueValues, (summary) => summary.mean),
    readOf('Overall mean', overall, (summary) => summary.mean),
    readOf('Venue median', venueValues, (summary) => summary.median),
    readOf('Last 3 games', last3, (summary) => summary.mean),
  ]
}

/**
 * Compare the four reads with a posted number. Counting stats use the same
 * 1-unit band as a team total. A yes/no stat compares each read with one half.
 * Agreement of the venue read and at least three reads is the stance.
 * The stance is not a win probability and it is not a priced edge.
 */
export function comparePlayerReads(reads, line, { binary = false, direction = 'over' } = {}) {
  const venue = reads.find((read) => read.name === 'Venue mean') ?? reads[0]
  if (!venue || venue.missing || !Number.isFinite(line)) {
    return {
      status: 'unrated',
      stance: null,
      weight: 0,
      label: venue?.missing ? 'Venue sample missing.' : 'Player number missing.',
    }
  }
  const flag = (read) => {
    if (!read || read.missing || !Number.isFinite(read.value)) return 'missing'
    if (binary) return read.value >= 0.5 ? 'yes' : 'no'
    const gap = direction === 'under' ? line - read.value : read.value - line
    if (gap >= 1) return 'yes'
    if (gap <= -1) return 'no'
    return 'even'
  }
  const flags = reads.map(flag)
  const venueFlag = flag(venue)
  const yes = flags.filter((item) => item === 'yes').length
  const no = flags.filter((item) => item === 'no').length
  let stance = 'even'
  if (venueFlag === 'yes' && yes >= 3) stance = 'with'
  else if (venueFlag === 'no' && no >= 3) stance = 'against'
  const shown = reads
    .map((read) => {
      if (read.missing) return `${read.name} missing`
      const thin = read.thin ? `, n=${read.n}` : ''
      return `${read.name} ${round1(read.value)}${thin}`
    })
    .join(', ')
  return {
    status: 'rated',
    stance,
    weight: stance === 'with' ? 1 : stance === 'against' ? -1 : 0,
    label: `${shown}.`,
  }
}
