import { getEspnJson } from './espn'

export type NhlScorer = {
  name: string
  short: string
  goals: number
}

export type NhlGoalie = {
  name: string
  short: string
  saves: number
  shotsAgainst: number
  savePct?: string
}

export type NhlSide = {
  id: string
  name: string
  short: string
  logo?: string
  score?: string
  record?: string
  winner?: boolean
  goals?: number
  saves?: number
  scorers: NhlScorer[]
  goalies: NhlGoalie[]
}

export type NhlGame = {
  id: string
  date: string
  venue?: string
  state: string
  status: string
  away: NhlSide
  home: NhlSide
}

export type NhlPlay = {
  clock: string
  period: string
  text: string
  team?: string
}

type NhlExtras = {
  goals?: number
  saves?: number
  scorers: NhlScorer[]
  goalies: NhlGoalie[]
}

type EspnCompetitor = {
  homeAway?: string
  winner?: boolean
  score?: string
  records?: Array<{ summary?: string }>
  statistics?: Array<{ name?: string; displayValue?: string }>
  team?: {
    id?: string
    displayName?: string
    shortDisplayName?: string
    abbreviation?: string
    name?: string
    logo?: string
    logos?: Array<{ href?: string }>
  }
}

type EspnBox = {
  players?: Array<{
    team?: { id?: string }
    statistics?: Array<{
      name?: string
      keys?: string[]
      athletes?: Array<{ athlete?: { displayName?: string; shortName?: string }; stats?: string[] }>
    }>
  }>
}

function emptyRecord(value?: string): string | undefined {
  if (!value || /^0-0(-0)?$/.test(value)) return undefined
  return value
}

function statNum(stats: Array<{ name?: string; displayValue?: string }> | undefined, name: string): number | undefined {
  const raw = stats?.find((stat) => stat.name === name)?.displayValue
  const value = Number(raw)
  return Number.isFinite(value) ? value : undefined
}

function sideFrom(comp: EspnCompetitor | undefined, extras?: NhlExtras, inGame = false): NhlSide {
  const team = comp?.team
  const boardGoals = statNum(comp?.statistics, 'goals')
  const boardSaves = statNum(comp?.statistics, 'saves')
  return {
    id: team?.id || '',
    name: team?.displayName || 'Team',
    short: team?.shortDisplayName || team?.name || team?.abbreviation || team?.displayName || 'Team',
    logo: team?.logo || team?.logos?.[0]?.href,
    score: comp?.score,
    record: emptyRecord(comp?.records?.[0]?.summary),
    winner: comp?.winner,
    goals: extras?.goals ?? (inGame ? boardGoals : undefined),
    saves: extras?.saves ?? (inGame ? boardSaves : undefined),
    scorers: extras?.scorers ?? [],
    goalies: extras?.goalies ?? [],
  }
}

function numAt(stats: string[] | undefined, keys: string[], name: string): number {
  const index = keys.indexOf(name)
  if (index < 0) return 0
  const value = Number(stats?.[index])
  return Number.isFinite(value) ? value : 0
}

function extrasFromBox(boxscore?: EspnBox): Record<string, NhlExtras> {
  const out: Record<string, NhlExtras> = {}
  for (const group of boxscore?.players ?? []) {
    const id = group.team?.id
    if (!id) continue
    const current = out[id] ?? { scorers: [], goalies: [] }
    for (const block of group.statistics ?? []) {
      const keys = block.keys ?? []
      if (keys.includes('goals')) {
        for (const row of block.athletes ?? []) {
          const goals = numAt(row.stats, keys, 'goals')
          if (goals <= 0) continue
          current.scorers.push({
            name: row.athlete?.displayName || 'Player',
            short: row.athlete?.shortName || row.athlete?.displayName || 'Player',
            goals,
          })
        }
      }
      if (keys.includes('saves')) {
        for (const row of block.athletes ?? []) {
          const saves = numAt(row.stats, keys, 'saves')
          const shotsAgainst = numAt(row.stats, keys, 'shotsAgainst')
          if (saves <= 0 && shotsAgainst <= 0) continue
          const pctIndex = keys.indexOf('savePct')
          current.goalies.push({
            name: row.athlete?.displayName || 'Goalie',
            short: row.athlete?.shortName || row.athlete?.displayName || 'Goalie',
            saves,
            shotsAgainst,
            savePct: pctIndex >= 0 ? row.stats?.[pctIndex] : undefined,
          })
        }
      }
    }
    current.scorers.sort((a, b) => b.goals - a.goals || a.name.localeCompare(b.name))
    current.goalies.sort((a, b) => b.saves - a.saves)
    current.goals = current.scorers.reduce((sum, row) => sum + row.goals, 0)
    current.saves = current.goalies.reduce((sum, row) => sum + row.saves, 0)
    out[id] = current
  }
  return out
}

function toGame(
  eventId: string,
  date: string,
  venue: string | undefined,
  state: string,
  status: string,
  away: EspnCompetitor | undefined,
  home: EspnCompetitor | undefined,
  extras: Record<string, NhlExtras>,
): NhlGame {
  const inGame = state !== 'pre'
  const awaySide = sideFrom(away, extras[away?.team?.id || ''], inGame)
  const homeSide = sideFrom(home, extras[home?.team?.id || ''], inGame)
  if (!inGame) {
    awaySide.score = undefined
    homeSide.score = undefined
  }
  return { id: eventId, date, venue, state, status, away: awaySide, home: homeSide }
}

export async function fetchNhlSlate(date: string): Promise<NhlGame[]> {
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
  }>(`/apis/site/v2/sports/hockey/nhl/scoreboard?dates=${compact}`)

  const events = board.events ?? []
  const extras = await Promise.all(
    events.map(async (event) => {
      if (event.status?.type?.state === 'pre') return { id: event.id, sides: {} as Record<string, NhlExtras> }
      try {
        return { id: event.id, sides: await fetchNhlBox(event.id) }
      } catch {
        return { id: event.id, sides: {} as Record<string, NhlExtras> }
      }
    }),
  )
  const extraMap = Object.fromEntries(extras.map((item) => [item.id, item.sides]))

  return events.map((event) => {
    const comp = event.competitions?.[0]
    return toGame(
      event.id,
      event.date,
      comp?.venue?.fullName,
      event.status?.type?.state || 'pre',
      event.status?.type?.shortDetail || event.status?.type?.detail || 'Scheduled',
      comp?.competitors?.find((c) => c.homeAway === 'away'),
      comp?.competitors?.find((c) => c.homeAway === 'home'),
      extraMap[event.id] || {},
    )
  })
}

async function fetchNhlBox(eventId: string): Promise<Record<string, NhlExtras>> {
  const data = await getEspnJson<{ boxscore?: EspnBox }>(
    `/apis/site/v2/sports/hockey/nhl/summary?event=${eventId}`,
  )
  return extrasFromBox(data.boxscore)
}

export async function fetchNhlGame(eventId: string): Promise<{ game: NhlGame; plays: NhlPlay[] }> {
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
      type?: { text?: string }
      clock?: { displayValue?: string }
      period?: { displayValue?: string; number?: number }
      team?: { id?: string; displayName?: string; abbreviation?: string }
    }>
  }>(`/apis/site/v2/sports/hockey/nhl/summary?event=${eventId}`)

  const extras = extrasFromBox(data.boxscore)
  const comp = data.header?.competitions?.[0]
  const away = comp?.competitors?.find((c) => c.homeAway === 'away')
  const home = comp?.competitors?.find((c) => c.homeAway === 'home')
  const game = toGame(
    eventId,
    comp?.date || new Date().toISOString(),
    data.gameInfo?.venue?.fullName || comp?.venue?.fullName,
    comp?.status?.type?.state || 'pre',
    comp?.status?.type?.shortDetail || comp?.status?.type?.detail || 'Scheduled',
    away,
    home,
    extras,
  )

  const plays: NhlPlay[] = (data.plays ?? [])
    .filter((play) => play.scoringPlay)
    .map((play) => ({
      clock: play.clock?.displayValue || '',
      period: play.period?.displayValue || (play.period?.number ? `P${play.period.number}` : ''),
      text: play.text || play.type?.text || '',
      team:
        play.team?.abbreviation ||
        play.team?.displayName ||
        (play.team?.id === game.away.id ? game.away.short : play.team?.id === game.home.id ? game.home.short : undefined),
    }))
    .reverse()

  return { game, plays }
}

export function scorerLine(scorers: NhlScorer[], limit = 3): string {
  return scorers
    .slice(0, limit)
    .map((row) => (row.goals > 1 ? `${row.short} ${row.goals}` : row.short))
    .join(' · ')
}

export function goalieLine(goalies: NhlGoalie[], limit = 2): string {
  return goalies.slice(0, limit).map((row) => `${row.short} ${row.saves}`).join(' · ')
}

export function formatSaves(saves?: number): string {
  if (saves == null) return ''
  return `${saves} SV`
}

export function totalGoals(game: NhlGame): number {
  return (game.away.goals ?? 0) + (game.home.goals ?? 0)
}

export function totalSaves(game: NhlGame): number {
  return (game.away.saves ?? 0) + (game.home.saves ?? 0)
}

export function filterNhlGames(games: NhlGame[], filter: 'all' | 'in' | 'pre' | 'post'): NhlGame[] {
  return games.filter((game) => filter === 'all' || game.state === filter)
}

export function sortNhlGames(games: NhlGame[]): NhlGame[] {
  const rank = (game: NhlGame) => (game.state === 'in' ? 0 : game.state === 'pre' ? 1 : 2)
  return [...games].sort((a, b) => {
    const diff = rank(a) - rank(b)
    if (diff !== 0) return diff
    return new Date(a.date).getTime() - new Date(b.date).getTime()
  })
}

export function parseNhlDate(value: string | null): string | null {
  if (!value) return null
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value
  if (/^\d{8}$/.test(value)) return `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}`
  return null
}
