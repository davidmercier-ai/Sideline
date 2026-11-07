/**
 * Regular-season player logs for the prop stats the books already post.
 * A missing stat stays missing. Opponent allowance is not applied.
 */

const UA = { 'User-Agent': 'SidelineProjection/0.1', Accept: 'application/json' }

const SPORT = {
  nfl: 'football/nfl',
  nba: 'basketball/nba',
  nhl: 'hockey/nhl',
  epl: 'soccer/eng.1',
}

export function sportPath(league) {
  return SPORT[league] ?? null
}

export function looseName(value) {
  return String(value ?? '').toLowerCase().replace(/[^a-z0-9]/g, '')
}

export function playerStat(market, selection) {
  const text = `${market ?? ''} ${selection ?? ''}`
  if (/first (td|touchdown)/i.test(text)) return { stat: 'firstTd', binary: true }
  if (/first basket|first field goal/i.test(text)) return { stat: 'firstBasket', binary: true }
  if (/first goal/i.test(text)) return { stat: 'firstGoal', binary: true }
  if (/touchdown scorer|anytime td|any time td/i.test(text)) return { stat: 'anytimeTd', binary: true }
  if (/passing yards/i.test(text)) return { stat: 'passYds', binary: false }
  if (/rushing yards|rush yards/i.test(text)) return { stat: 'rushYds', binary: false }
  if (/receiving yards/i.test(text)) return { stat: 'recYds', binary: false }
  if (/receptions/i.test(text)) return { stat: 'receptions', binary: false }
  if (/rebounds/i.test(text)) return { stat: 'reb', binary: false }
  if (/assists/i.test(text)) return { stat: 'ast', binary: false }
  if (/three pointers|threes/i.test(text)) return { stat: 'threes', binary: false }
  if (/\bpoints\b/i.test(text)) return { stat: 'points', binary: false }
  return null
}

function selectionIsLine(selection) {
  return /^(over|under)$/i.test(selection)
    || /^(over|under)\b/i.test(selection)
    || /^[+-]?\d/.test(selection)
}

export function playerNameFromLeg(leg) {
  const selection = String(leg?.selection ?? '').trim()
  const market = String(leg?.market ?? '').trim()
  if (selection && !selectionIsLine(selection)) return selection
  return market
    .replace(/\b(passing|rushing|receiving) yards.*$/i, '')
    .replace(/\b(rush yards|receptions|rebounds|assists|points|threes).*$/i, '')
    .trim()
}

function num(raw) {
  if (raw == null || raw === '-' || raw === '') return null
  const value = Number(raw)
  return Number.isFinite(value) ? value : null
}

function statValue(row, names, stat) {
  const has = (key) => names.includes(key)
  const get = (key) => (has(key) ? num(row[key]) : null)
  if (stat === 'points') return get('PTS') ?? get('points')
  if (stat === 'reb') return get('REB') ?? get('totalRebounds')
  if (stat === 'ast') return get('AST') ?? get('assists')
  if (stat === 'threes') {
    const raw = row['3PT'] ?? row['threePointFieldGoalsMade-threePointFieldGoalsAttempted']
    if (!raw || raw === '-') return null
    const made = Number(String(raw).split('-')[0])
    return Number.isFinite(made) ? made : null
  }
  if (stat === 'passYds') return get('passingYards')
  if (stat === 'rushYds') return get('rushingYards')
  if (stat === 'recYds') return get('receivingYards')
  if (stat === 'receptions') return get('receptions')
  if (stat === 'anytimeTd') {
    const receiving = has('receivingTouchdowns') ? num(row.receivingTouchdowns) ?? 0 : null
    const rushing = has('rushingTouchdowns') ? num(row.rushingTouchdowns) ?? 0 : null
    if (receiving == null && rushing == null) return null
    return (receiving ?? 0) + (rushing ?? 0) >= 1 ? 1 : 0
  }
  if (stat === 'minutes') return get('minutes') ?? get('MIN')
  if (stat === 'fga') return get('fieldGoalsAttempted') ?? get('FGA')
  if (stat === 'targets') return get('receivingTargets') ?? get('targets')
  if (stat === 'shots') return get('totalShots') ?? get('shots') ?? get('SHOT')
  if (stat === 'sog') return get('shotsOnTarget') ?? get('shotsOnGoal') ?? get('SOG')
  return null
}

export function rowsFromGamelog(data, stat) {
  const labels = data.labels || []
  const names = data.names || []
  const labelCounts = new Map()
  for (const label of labels) labelCounts.set(label, (labelCounts.get(label) || 0) + 1)
  const seasons = data.seasonTypes || []
  const season = seasons.find((item) => /2026|2027/.test(item.displayName || '') && /Regular/i.test(item.displayName || ''))
    || seasons.find((item) => /2026|2027/.test(item.displayName || '') && !/preseason|playoff|postseason/i.test(item.displayName || ''))
  const keys = new Set([...names, ...labels])
  const rows = []
  const seen = new Set()
  for (const category of season?.categories || []) {
    if (category.type !== 'event') continue
    for (const event of category.events || []) {
      if (seen.has(event.eventId)) continue
      seen.add(event.eventId)
      const row = {}
      event.stats.forEach((value, index) => {
        if (names[index]) row[names[index]] = value
        const label = labels[index]
        if (label && labelCounts.get(label) === 1) row[label] = value
      })
      const value = statValue(row, [...keys], stat)
      if (!Number.isFinite(value)) continue
      const meta = data.events?.[event.eventId] || {}
      const at = meta.atVs
      rows.push({
        date: String(meta.gameDate || event.eventId),
        venue: at === '@' ? 'away' : at === 'vs' ? 'home' : 'neutral',
        value,
      })
    }
  }
  return {
    team: season?.displayTeam || '',
    season: season?.displayName || '',
    rows,
  }
}

const STATS = {
  nfl: ['passYds', 'rushYds', 'recYds', 'receptions', 'anytimeTd', 'targets'],
  nba: ['points', 'reb', 'ast', 'threes', 'minutes', 'fga'],
}

async function getJson(url) {
  let last
  for (let attempt = 0; attempt < 4; attempt += 1) {
    try {
      const response = await fetch(url, { headers: UA })
      if (!response.ok) throw new Error(`${response.status} ${url}`)
      return await response.json()
    } catch (error) {
      last = error
      await new Promise((resolve) => setTimeout(resolve, 250 * (attempt + 1)))
    }
  }
  throw last
}

async function searchPlayer(name, league) {
  const data = await getJson(
    `https://site.web.api.espn.com/apis/common/v3/search?query=${encodeURIComponent(name)}&limit=8&type=player`,
  )
  const target = looseName(name)
  const code = league === 'epl' ? 'eng.1' : league
  let items = (data.items || []).filter((item) => item.league === code)
  if (!items.length && league === 'epl') {
    items = (data.items || []).filter((item) => looseName(item.displayName) === target)
  }
  const exact = items.filter((item) => looseName(item.displayName) === target)
  return exact.length ? exact : items.filter((item) => looseName(item.displayName).startsWith(target)).slice(0, 2)
}

export async function fetchAthleteGamelog(name, league) {
  const path = SPORT[league]
  if (!path) return { name, league, error: 'no sport' }
  const candidates = await searchPlayer(name, league)
  if (!candidates.length) return { name, league, error: 'no ESPN player' }
  let best = null
  for (const hit of candidates) {
    const data = await getJson(
      `https://site.web.api.espn.com/apis/common/v3/sports/${path}/athletes/${hit.id}/gamelog`,
    )
    const season = (data.seasonTypes || []).find((item) => /2026/.test(item.displayName || '') && /Regular/i.test(item.displayName || ''))
    const games = (season?.categories || []).filter((category) => category.type === 'event')
      .reduce((sum, category) => sum + (category.events || []).length, 0)
    const record = { name: hit.displayName, id: String(hit.id), league, games, data }
    if (!best || record.games > best.games) best = record
  }
  return best
}

export async function fetchPlayerLog(name, league) {
  const candidates = await searchPlayer(name, league)
  if (!candidates.length) return { name, league, error: 'no ESPN player' }
  let best = null
  for (const hit of candidates) {
    const data = await getJson(
      `https://site.web.api.espn.com/apis/common/v3/sports/${SPORT[league]}/athletes/${hit.id}/gamelog`,
    )
    const stats = {}
    let team = ''
    let season = ''
    let games = 0
    for (const stat of STATS[league]) {
      const parsed = rowsFromGamelog(data, stat)
      stats[stat] = parsed.rows
      team = parsed.team || team
      season = parsed.season || season
      games = Math.max(games, parsed.rows.length)
    }
    const record = {
      name: hit.displayName,
      id: String(hit.id),
      league,
      team,
      season,
      games,
      stats,
    }
    if (!best || record.games > best.games) best = record
  }
  return best
}

export async function teamShortNames(league) {
  const sport = league === 'nba' ? 'basketball/nba' : 'football/nfl'
  const data = await getJson(`https://site.api.espn.com/apis/site/v2/sports/${sport}/teams?limit=50`)
  const teams = data.sports?.[0]?.leagues?.[0]?.teams || []
  const byAbbr = new Map()
  for (const item of teams) {
    const team = item.team
    if (team?.abbreviation) byAbbr.set(team.abbreviation, team.shortDisplayName || team.displayName)
  }
  return byAbbr
}
