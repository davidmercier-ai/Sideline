import { getEspnJson } from './espn'

export type ThreeLine = {
  made: number
  attempted: number
}

export type ThreeShooter = {
  name: string
  short: string
  made: number
  attempted: number
}

export type NbaSide = {
  id: string
  name: string
  short: string
  logo?: string
  score?: string
  record?: string
  winner?: boolean
  threes?: ThreeLine
  shooters: ThreeShooter[]
}

export type NbaGame = {
  id: string
  date: string
  venue?: string
  state: string
  status: string
  away: NbaSide
  home: NbaSide
}

export type ThreePlay = {
  clock: string
  period: string
  text: string
  team?: string
}


function emptyRecord(value?: string): string | undefined {
  if (!value || value === '0-0') return undefined
  return value
}

function parsePair(value?: string): ThreeLine | undefined {
  if (!value || !value.includes('-')) return undefined
  const [made, attempted] = value.split('-').map(Number)
  if (!Number.isFinite(made) || !Number.isFinite(attempted)) return undefined
  return { made, attempted }
}

function formatThrees(line?: ThreeLine): string {
  if (!line) return ''
  return `${line.made}–${line.attempted}`
}

export { formatThrees }

type EspnCompetitor = {
  homeAway?: string
  winner?: boolean
  score?: string
  records?: Array<{ summary?: string }>
  team?: {
    id?: string
    displayName?: string
    shortDisplayName?: string
    abbreviation?: string
    name?: string
    logo?: string
    logos?: Array<{ href?: string }>
  }
  statistics?: Array<{ name?: string; displayValue?: string }>
}

function sideFrom(comp: EspnCompetitor | undefined, extras?: { threes?: ThreeLine; shooters?: ThreeShooter[] }): NbaSide {
  const team = comp?.team
  const fromBoard = parsePair(
    comp?.statistics?.find((stat) => stat.name === 'threePointFieldGoalsMade-threePointFieldGoalsAttempted')
      ?.displayValue,
  )
  return {
    id: team?.id || '',
    name: team?.displayName || 'Team',
    short: team?.shortDisplayName || team?.name || team?.abbreviation || team?.displayName || 'Team',
    logo: team?.logo || team?.logos?.[0]?.href,
    score: comp?.score,
    record: emptyRecord(comp?.records?.[0]?.summary),
    winner: comp?.winner,
    threes: extras?.threes ?? fromBoard,
    shooters: extras?.shooters ?? [],
  }
}

function shootersFromBox(group: {
  keys?: string[]
  athletes?: Array<{ athlete?: { displayName?: string; shortName?: string }; stats?: string[] }>
}): ThreeShooter[] {
  const keys = group.keys ?? []
  const index = keys.indexOf('threePointFieldGoalsMade-threePointFieldGoalsAttempted')
  if (index < 0) return []
  const shooters: ThreeShooter[] = []
  for (const row of group.athletes ?? []) {
    const pair = parsePair(row.stats?.[index])
    if (!pair || pair.made <= 0) continue
    shooters.push({
      name: row.athlete?.displayName || 'Player',
      short: row.athlete?.shortName || row.athlete?.displayName || 'Player',
      made: pair.made,
      attempted: pair.attempted,
    })
  }
  return shooters.sort((a, b) => b.made - a.made || a.attempted - b.attempted)
}

function teamThreesFromBox(stats: Array<{ name?: string; displayValue?: string }> | undefined): ThreeLine | undefined {
  return parsePair(
    stats?.find((stat) => stat.name === 'threePointFieldGoalsMade-threePointFieldGoalsAttempted')?.displayValue,
  )
}

export async function fetchNbaSlate(date: string): Promise<NbaGame[]> {
  const compact = date.replaceAll('-', '')
  const board = await getEspnJson<{
    events?: Array<{
      id: string
      date: string
      status?: { type?: { state?: string; shortDetail?: string; detail?: string } }
      competitions?: Array<{
        venue?: { fullName?: string }
        competitors?: EspnCompetitor[]
      }>
    }>
  }>(`/apis/site/v2/sports/basketball/nba/scoreboard?dates=${compact}`)

  const events = board.events ?? []
  const extras = await Promise.all(
    events.map(async (event) => {
      const state = event.status?.type?.state
      if (state === 'pre') return { id: event.id, sides: {} as Record<string, { threes?: ThreeLine; shooters: ThreeShooter[] }> }
      try {
        const detail = await fetchNbaBox(event.id)
        return { id: event.id, sides: detail }
      } catch {
        return { id: event.id, sides: {} as Record<string, { threes?: ThreeLine; shooters: ThreeShooter[] }> }
      }
    }),
  )
  const extraMap = Object.fromEntries(extras.map((item) => [item.id, item.sides]))

  return events.map((event) => {
    const comp = event.competitions?.[0]
    const away = comp?.competitors?.find((c) => c.homeAway === 'away')
    const home = comp?.competitors?.find((c) => c.homeAway === 'home')
    const extra = extraMap[event.id] || {}
    const state = event.status?.type?.state || 'pre'
    const awaySide = sideFrom(away, extra[away?.team?.id || ''])
    const homeSide = sideFrom(home, extra[home?.team?.id || ''])
    if (state === 'pre') {
      awaySide.score = undefined
      homeSide.score = undefined
    }
    return {
      id: event.id,
      date: event.date,
      venue: comp?.venue?.fullName,
      state,
      status: event.status?.type?.shortDetail || event.status?.type?.detail || 'Scheduled',
      away: awaySide,
      home: homeSide,
    }
  })
}

type EspnBox = {
  teams?: Array<{ team?: { id?: string }; statistics?: Array<{ name?: string; displayValue?: string }> }>
  players?: Array<{
    team?: { id?: string }
    statistics?: Array<{ keys?: string[]; athletes?: Array<{ athlete?: { displayName?: string; shortName?: string }; stats?: string[] }> }>
  }>
}

function boxFromSummary(boxscore?: EspnBox): Record<string, { threes?: ThreeLine; shooters: ThreeShooter[] }> {
  const out: Record<string, { threes?: ThreeLine; shooters: ThreeShooter[] }> = {}
  for (const team of boxscore?.teams ?? []) {
    const id = team.team?.id
    if (!id) continue
    out[id] = { threes: teamThreesFromBox(team.statistics), shooters: out[id]?.shooters ?? [] }
  }
  for (const group of boxscore?.players ?? []) {
    const id = group.team?.id
    if (!id) continue
    const shooters = shootersFromBox(group.statistics?.[0] ?? {})
    out[id] = { threes: out[id]?.threes, shooters }
  }
  return out
}

async function fetchNbaBox(eventId: string): Promise<Record<string, { threes?: ThreeLine; shooters: ThreeShooter[] }>> {
  const data = await getEspnJson<{ boxscore?: EspnBox }>(
    `/apis/site/v2/sports/basketball/nba/summary?event=${eventId}`,
  )
  return boxFromSummary(data.boxscore)
}

export async function fetchNbaGame(eventId: string): Promise<{ game: NbaGame; plays: ThreePlay[] }> {
  const data = await getEspnJson<{
    header?: {
      competitions?: Array<{
        date?: string
        venue?: { fullName?: string }
        competitors?: EspnCompetitor[]
        status?: { type?: { state?: string; shortDetail?: string; detail?: string } }
      }>
    }
    boxscore?: EspnBox
    gameInfo?: { venue?: { fullName?: string } }
    plays?: Array<{
      text?: string
      scoringPlay?: boolean
      clock?: { displayValue?: string }
      period?: { displayValue?: string; number?: number }
      team?: { id?: string; displayName?: string; abbreviation?: string }
    }>
  }>(`/apis/site/v2/sports/basketball/nba/summary?event=${eventId}`)

  const extras = boxFromSummary(data.boxscore)
  const comp = data.header?.competitions?.[0]
  const away = comp?.competitors?.find((c) => c.homeAway === 'away')
  const home = comp?.competitors?.find((c) => c.homeAway === 'home')
  const state = comp?.status?.type?.state || 'pre'
  const awaySide = sideFrom(away, extras[away?.team?.id || ''])
  const homeSide = sideFrom(home, extras[home?.team?.id || ''])
  if (state === 'pre') {
    awaySide.score = undefined
    homeSide.score = undefined
  }
  const game: NbaGame = {
    id: eventId,
    date: comp?.date || new Date().toISOString(),
    venue: data.gameInfo?.venue?.fullName || comp?.venue?.fullName,
    state,
    status: comp?.status?.type?.shortDetail || comp?.status?.type?.detail || 'Scheduled',
    away: awaySide,
    home: homeSide,
  }

  const plays: ThreePlay[] = (data.plays ?? [])
    .filter((play) => {
      const text = (play.text || '').toLowerCase()
      return play.scoringPlay && (text.includes('three point') || text.includes('3-point') || text.includes('three-point'))
    })
    .map((play) => ({
      clock: play.clock?.displayValue || '',
      period: play.period?.displayValue || (play.period?.number ? `Q${play.period.number}` : ''),
      text: play.text || '',
      team:
        play.team?.abbreviation ||
        play.team?.displayName ||
        (play.team?.id === awaySide.id ? awaySide.short : play.team?.id === homeSide.id ? homeSide.short : undefined),
    }))
    .reverse()

  return { game, plays }
}

export function shooterLine(shooters: ThreeShooter[], limit = 3): string {
  return shooters.slice(0, limit).map((row) => `${row.short} ${row.made}`).join(' · ')
}

export function threePct(line?: ThreeLine): string {
  if (!line || line.attempted <= 0) return '—'
  return `${((line.made / line.attempted) * 100).toFixed(1)}%`
}

export function totalThrees(game: NbaGame): number {
  return (game.away.threes?.made ?? 0) + (game.home.threes?.made ?? 0)
}

export function filterNbaGames(games: NbaGame[], filter: 'all' | 'in' | 'pre' | 'post'): NbaGame[] {
  return games.filter((game) => filter === 'all' || game.state === filter)
}

export function sortNbaGames(games: NbaGame[]): NbaGame[] {
  const rank = (game: NbaGame) => (game.state === 'in' ? 0 : game.state === 'pre' ? 1 : 2)
  return [...games].sort((a, b) => {
    const diff = rank(a) - rank(b)
    if (diff !== 0) return diff
    return new Date(a.date).getTime() - new Date(b.date).getTime()
  })
}

export function parseNbaDate(value: string | null): string | null {
  if (!value) return null
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value
  if (/^\d{8}$/.test(value)) return `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}`
  return null
}
