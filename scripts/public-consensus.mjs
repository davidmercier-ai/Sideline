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

const COVERS_LEAGUES = ['nfl', 'nba', 'nhl', 'ncaaf']

const COVERS_NAMES = {
  nfl: {
    bal: 'Ravens', buf: 'Bills', ten: 'Titans', cin: 'Bengals', lac: 'Chargers', la: 'Rams',
    lv: 'Raiders', nyj: 'Jets', ne: 'Patriots', mia: 'Dolphins', ind: 'Colts', jac: 'Jaguars',
    ari: 'Cardinals', dal: 'Cowboys', cle: 'Browns', pit: 'Steelers', atl: 'Falcons', tb: 'Buccaneers',
    phi: 'Eagles', was: 'Commanders', kc: 'Chiefs', den: 'Broncos', min: 'Vikings', det: 'Lions',
    chi: 'Bears', sea: 'Seahawks',
  },
  nba: {
    cha: 'Hornets', was: 'Wizards', orl: 'Magic', tor: 'Raptors', den: 'Nuggets', pho: 'Suns',
    det: 'Pistons', bk: 'Nets', lac: 'Clippers', min: 'Timberwolves', ind: 'Pacers', mia: 'Heat',
    lal: 'Lakers', gs: 'Warriors', chi: 'Bulls', bos: 'Celtics', hou: 'Rockets', dal: 'Mavericks',
    ny: 'Knicks', phi: '76ers',
  },
  nhl: {
    win: 'Jets', fla: 'Panthers', sea: 'Kraken', cal: 'Flames', nj: 'Devils', njd: 'Devils', vgk: 'Golden Knights',
  },
  ncaaf: {
    tuln: 'Tulane', char: 'Charlotte', kent: 'Kent State', csus: 'Sacramento', bay: 'Baylor', ucf: 'UCF', bc: 'Boston College', duke: 'Duke',
    harv: 'Harvard', dart: 'Dartmouth', ill: 'Illinois', md: 'Maryland', ccu: 'Coastal', gsu: 'Georgia St',
    fiu: 'FIU', lib: 'Liberty', txst: 'Texas St', bsu: 'Boise', ku: 'Kansas', tcu: 'TCU', minn: 'Minnesota',
    iu: 'Indiana', stan: 'Stanford', lou: 'Louisville', nev: 'Nevada', ucla: 'UCLA', tem: 'Temple',
    ecu: 'East Carolina', mrsh: 'Marshall', odu: 'Old Dominion', orst: 'Oregon St', fres: 'Fresno',
    utep: 'UTEP', ndsu: 'N Dakota St', gt: 'Georgia Tech', pitt: 'Pitt', wash: 'Washington', neb: 'Nebraska',
    csu: 'Colorado St', usu: 'Utah State', uab: 'UAB', usf: 'South Florida', wis: 'Wisconsin', iowa: 'Iowa',
    bgsu: 'Bowling Green', wmu: 'W Michigan', usm: 'Southern Miss', ulm: 'UL Monroe', cal: 'California',
    ncst: 'NC State', asu: 'Arizona St', byu: 'BYU', conn: 'UConn', afa: 'Air Force', wsu: 'Washington St',
    sdsu: 'San Diego St', smu: 'SMU', syr: 'Syracuse', uva: 'Virginia', wake: 'Wake Forest', nw: 'Northwestern',
    ore: 'Oregon', niu: 'N Illinois', unlv: 'UNLV', clem: 'Clemson', fsu: 'Florida St', okst: 'Oklahoma St',
    isu: 'Iowa State', mizz: 'Missouri', ark: 'Arkansas', aub: 'Auburn', miss: 'Ole Miss', pur: 'Purdue',
    psu: 'Penn State', mich: 'Michigan', rutg: 'Rutgers', lt: 'Louisiana Tech', usa: 'South Alabama',
    army: 'Army', mem: 'Memphis', mia: 'Miami', unc: 'North Carolina', fla: 'Florida', uga: 'Georgia',
    ariz: 'Arizona', ttu: 'Texas Tech', ksu: 'Kansas St', colo: 'Colorado', utah: 'Utah', cin: 'Cincinnati',
    app: 'App State', gaso: 'GA Southern', socar: 'South Carolina', okla: 'Oklahoma', msst: 'Mississippi St',
    tex: 'Texas', nd: 'Notre Dame', navy: 'Navy', osu: 'Ohio State', usc: 'USC',
  },
}

function coversName(league, code) {
  return COVERS_NAMES[league]?.[code.toLowerCase()] ?? code
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
      awayName: coversName(league, lines[1]),
      homeName: coversName(league, lines[2]),
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

function coversMonthDay(dateText) {
  const match = String(dateText).match(/([A-Za-z]{3})\.?\s+0?(\d{1,2})\b/)
  if (!match) return null
  const month = match[1].slice(0, 1).toUpperCase() + match[1].slice(1).toLowerCase()
  return `${month} ${Number(match[2])}`
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
    && (!monthDay || coversMonthDay(pick.dateText) === monthDay)
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
  if (sportKey === 'nfl' || sportKey === 'nba' || sportKey === 'nhl' || sportKey === 'ncaaf') return sportKey
  return null
}
