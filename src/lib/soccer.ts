import { getEspnJson } from './espn'
import { todayET } from './format'

export const SOCCER_LEAGUES = [
  { slug: 'eng.1', name: 'Premier League' },
  { slug: 'esp.1', name: 'LaLiga' },
  { slug: 'ger.1', name: 'Bundesliga' },
  { slug: 'ita.1', name: 'Serie A' },
  { slug: 'fra.1', name: 'Ligue 1' },
  { slug: 'usa.1', name: 'MLS' },
  { slug: 'uefa.champions', name: 'Champions League' },
  { slug: 'uefa.europa', name: 'Europa League' },
] as const

export type SoccerSide = {
  id: string
  name: string
  short: string
  score?: string
  logo?: string
  record?: string
  winner?: boolean
}

export type SoccerGoal = {
  minute: string
  player: string
  teamId: string
  penalty: boolean
  ownGoal: boolean
  text?: string
}

export type SoccerMatch = {
  id: string
  league: string
  leagueName: string
  date: string
  venue?: string
  state: 'pre' | 'in' | 'post' | string
  status: string
  away: SoccerSide
  home: SoccerSide
  goals: SoccerGoal[]
}

export type SoccerEvent = {
  minute: string
  text: string
  scoring: boolean
  type: string
}


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
    logo?: string
    logos?: Array<{ href?: string }>
  }
}

type EspnDetail = {
  type?: { text?: string }
  clock?: { displayValue?: string }
  team?: { id?: string }
  scoringPlay?: boolean
  penaltyKick?: boolean
  ownGoal?: boolean
  athletesInvolved?: Array<{ displayName?: string; shortName?: string }>
}

type EspnEvent = {
  id: string
  date: string
  status?: { type?: { state?: string; detail?: string; shortDetail?: string; completed?: boolean } }
  competitions?: Array<{
    venue?: { fullName?: string }
    competitors?: EspnCompetitor[]
    details?: EspnDetail[]
  }>
}

type EspnBoard = {
  leagues?: Array<{ name?: string; abbreviation?: string }>
  events?: EspnEvent[]
}

function emptyRecord(value?: string): string | undefined {
  if (!value || /^0-0(-0)?$/.test(value)) return undefined
  return value
}

function sideFrom(comp: EspnCompetitor | undefined): SoccerSide {
  const team = comp?.team
  return {
    id: team?.id || '',
    name: team?.displayName || 'Team',
    short: team?.shortDisplayName || team?.abbreviation || team?.displayName || 'Team',
    score: comp?.score,
    logo: team?.logo || team?.logos?.[0]?.href,
    record: emptyRecord(comp?.records?.[0]?.summary),
    winner: comp?.winner,
  }
}

function goalsFrom(details: EspnDetail[] | undefined): SoccerGoal[] {
  return (details ?? [])
    .filter((item) => item.scoringPlay || item.type?.text === 'Goal')
    .map((item) => ({
      minute: item.clock?.displayValue || '',
      player: item.athletesInvolved?.[0]?.shortName || item.athletesInvolved?.[0]?.displayName || 'Goal',
      teamId: item.team?.id || '',
      penalty: Boolean(item.penaltyKick),
      ownGoal: Boolean(item.ownGoal),
    }))
}

function toMatch(event: EspnEvent, league: string, leagueName: string): SoccerMatch {
  const comp = event.competitions?.[0]
  const away = comp?.competitors?.find((c) => c.homeAway === 'away')
  const home = comp?.competitors?.find((c) => c.homeAway === 'home')
  const type = event.status?.type
  const state = type?.state || 'pre'
  const awaySide = sideFrom(away)
  const homeSide = sideFrom(home)
  if (state === 'pre') {
    awaySide.score = undefined
    homeSide.score = undefined
  }
  return {
    id: event.id,
    league,
    leagueName,
    date: event.date,
    venue: comp?.venue?.fullName,
    state,
    status: type?.shortDetail || type?.detail || 'Scheduled',
    away: awaySide,
    home: homeSide,
    goals: goalsFrom(comp?.details),
  }
}

async function fetchBoard(slug: string, date?: string): Promise<EspnBoard> {
  const query = date ? `?dates=${date.replaceAll('-', '')}` : ''
  return getEspnJson<EspnBoard>(`/apis/site/v2/sports/soccer/${slug}/scoreboard${query}`)
}

export async function fetchSoccerSlate(): Promise<SoccerMatch[]> {
  const today = todayET()
  const results = await Promise.all(
    SOCCER_LEAGUES.flatMap((league) => [
      fetchBoard(league.slug).catch(() => ({ events: [] })),
      fetchBoard(league.slug, today).catch(() => ({ events: [] })),
    ]),
  )

  const seen = new Set<string>()
  const matches: SoccerMatch[] = []
  SOCCER_LEAGUES.forEach((league, index) => {
    const boards = [results[index * 2], results[index * 2 + 1]]
    for (const board of boards) {
      for (const event of board.events ?? []) {
        const key = `${league.slug}:${event.id}`
        if (seen.has(key)) continue
        seen.add(key)
        matches.push(toMatch(event, league.slug, league.name))
      }
    }
  })

  return matches.sort((a, b) => {
    const rank = (match: SoccerMatch) => (match.state === 'in' ? 0 : match.state === 'pre' ? 1 : 2)
    const diff = rank(a) - rank(b)
    if (diff !== 0) return diff
    return new Date(a.date).getTime() - new Date(b.date).getTime()
  })
}

export async function fetchSoccerMatch(league: string, eventId: string): Promise<{
  match: SoccerMatch
  events: SoccerEvent[]
}> {
  const data = await getEspnJson<{
    header?: {
      id?: string
      league?: { name?: string; slug?: string; midsizeName?: string }
      competitions?: Array<{
        date?: string
        venue?: { fullName?: string }
        competitors?: EspnCompetitor[]
        details?: EspnDetail[]
        status?: { type?: { state?: string; shortDetail?: string; detail?: string } }
      }>
    }
    keyEvents?: Array<{
      text?: string
      shortText?: string
      scoringPlay?: boolean
      type?: { text?: string; type?: string }
      clock?: { displayValue?: string }
    }>
  }>(`/apis/site/v2/sports/soccer/${league}/summary?event=${eventId}`)

  const header = data.header
  const comp = header?.competitions?.[0]
  const leagueName =
    header?.league?.name ||
    SOCCER_LEAGUES.find((item) => item.slug === league)?.name ||
    league
  const match = toMatch(
    {
      id: header?.id || eventId,
      date: comp?.date || new Date().toISOString(),
      status: { type: comp?.status?.type },
      competitions: comp ? [comp] : [],
    },
    league,
    leagueName,
  )

  const events: SoccerEvent[] = (data.keyEvents ?? []).map((item) => ({
    minute: item.clock?.displayValue || '',
    text: item.text || item.shortText || item.type?.text || '',
    scoring: Boolean(item.scoringPlay || item.type?.type === 'goal'),
    type: item.type?.text || item.type?.type || '',
  }))

  return { match, events }
}

export function scorersFor(match: SoccerMatch, teamId: string): string {
  const bits = match.goals
    .filter((goal) => goal.teamId === teamId)
    .map((goal) => {
      const tag = goal.ownGoal ? ' (og)' : goal.penalty ? ' (pen)' : ''
      return `${goal.player} ${goal.minute}${tag}`
    })
  return bits.join(' · ')
}
