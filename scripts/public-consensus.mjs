/**
 * Public consensus that is not a sportsbook price and not one of our models.
 *
 * Covers publishes the share of handicapper picks on each side, with a count.
 * ESPN's Matchup Predictor is a public model: a win chance, not a spread pick.
 * Absent rows stay missing. Neither source is blended into the four models.
 */

import { namesMatch } from './book-prices.mjs'

const COVERS = 'https://contests.covers.com/consensus/topconsensus'
const ESPN = 'https://site.api.espn.com'

const COVERS_LEAGUES = ['nba', 'nhl', 'ncaaf']

const COVERS_NAMES = {
  cha: 'Hornets',
  was: 'Wizards',
  orl: 'Magic',
  tor: 'Raptors',
  den: 'Nuggets',
  pho: 'Suns',
  det: 'Pistons',
  bk: 'Nets',
  lac: 'Clippers',
  min: 'Timberwolves',
  ind: 'Pacers',
  mia: 'Heat',
  lal: 'Lakers',
  gs: 'Warriors',
  chi: 'Bulls',
  bos: 'Celtics',
  hou: 'Rockets',
  dal: 'Mavericks',
  ny: 'Knicks',
  phi: '76ers',
  win: 'Jets',
  fla: 'Panthers',
  sea: 'Kraken',
  cal: 'Flames',
  nj: 'Devils',
  njd: 'Devils',
  vgk: 'Golden Knights',
  tuln: 'Tulane',
  char: 'Charlotte',
  kent: 'Kent State',
  csus: 'Sacramento',
  bay: 'Baylor',
  ucf: 'UCF',
  harv: 'Harvard',
  dart: 'Dartmouth',
}

async function getText(url) {
  let lastError
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const response = await fetch(url, {
        headers: { 'User-Agent': 'SidelineProjection/0.1', Accept: 'text/html,application/json' },
      })
      if (!response.ok) throw new Error(`${response.status} ${url}`)
      return await response.text()
    } catch (error) {
      lastError = error
      await new Promise((resolve) => setTimeout(resolve, 300 * (attempt + 1)))
    }
  }
  throw lastError
}

function rowLines(row) {
  return row
    .replace(/<[^>]+>/g, '\n')
    .split('\n')
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter((line) => line && line !== 'Details')
}

function parseCovers(html, league) {
  const picks = []
  for (const row of html.match(/<tr[\s\S]*?<\/tr>/g) ?? []) {
    if (!row.includes('covers-CoversConsensus-table--league')) continue
    const lines = rowLines(row)
    if (lines.length < 11 || lines[0].toLowerCase() !== league) continue
    const awayPct = Number(lines[5].replace('%', ''))
    const homePct = Number(lines[6].replace('%', ''))
    const awayPicks = Number(lines[9])
    const homePicks = Number(lines[10])
    if (![awayPct, homePct, awayPicks, homePicks].every((value) => Number.isFinite(value))) continue
    const awayNumber = Math.abs(Number(lines[7]))
    const homeNumber = Math.abs(Number(lines[8]))
    picks.push({
      source: 'Covers',
      kind: 'handicappers',
      league,
      awayCode: lines[1],
      homeCode: lines[2],
      awayName: COVERS_NAMES[lines[1].toLowerCase()] ?? lines[1],
      homeName: COVERS_NAMES[lines[2].toLowerCase()] ?? lines[2],
      when: `${lines[3]} ${lines[4]}`,
      dateText: lines[3],
      awayPct,
      homePct,
      awayNumber: lines[7],
      homeNumber: lines[8],
      numberKind: awayNumber >= 100 || homeNumber >= 100 ? 'moneyline' : 'spread',
      awayPicks,
      homePicks,
    })
  }
  return picks
}

function teamHits(label, team) {
  return [team.name, team.full, team.short, team.abbr].some((value) => namesMatch(label, value))
}

function etMonthDay(iso) {
  if (!iso) return null
  const parsed = new Date(iso)
  if (Number.isNaN(parsed.getTime())) return null
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    month: 'short',
    day: 'numeric',
  }).format(parsed)
}

export async function loadCoversConsensus() {
  const picks = []
  const errors = []
  for (const league of COVERS_LEAGUES) {
    try {
      const html = await getText(`${COVERS}/${league}/overall`)
      picks.push(...parseCovers(html, league))
    } catch (error) {
      errors.push(`Covers ${league}: ${error instanceof Error ? error.message : String(error)}`)
    }
  }
  return { picks, errors }
}

export function matchCovers(game, picks, league) {
  if (!league) return null
  const monthDay = etMonthDay(game.date)
  const matched = picks.filter((pick) => (
    pick.league === league
    && teamHits(pick.awayName, game.away)
    && teamHits(pick.homeName, game.home)
    && (!monthDay || pick.dateText.includes(monthDay))
  ))
  return matched[0] ?? null
}

export async function espnPredictor(sportPath, eventId) {
  try {
    const data = JSON.parse(await getText(`${ESPN}/apis/site/v2/sports/${sportPath}/summary?event=${eventId}`))
    const away = Number(data.predictor?.awayTeam?.gameProjection)
    const home = Number(data.predictor?.homeTeam?.gameProjection)
    if (!Number.isFinite(away) || !Number.isFinite(home)) return null
    return {
      source: 'ESPN Matchup Predictor',
      kind: 'public model',
      awayWin: away,
      homeWin: home,
    }
  } catch {
    return null
  }
}

export function coversLeagueFor(sportKey) {
  if (sportKey === 'nba' || sportKey === 'nhl' || sportKey === 'ncaaf') return sportKey
  return null
}
