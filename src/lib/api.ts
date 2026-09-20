import type {
  LiveFeed,
  ScheduleGame,
  ScheduleResponse,
  StandingsResponse,
  TeamRecord,
  RosterPlayer,
} from './types'

const MLB = import.meta.env.DEV ? '/mlb' : 'https://statsapi.mlb.com'

async function getJson<T>(path: string): Promise<T> {
  const response = await fetch(`${MLB}${path}`)
  if (!response.ok) {
    throw new Error(`MLB request failed (${response.status})`)
  }
  return response.json() as Promise<T>
}

export async function fetchSchedule(date: string): Promise<ScheduleGame[]> {
  const hydrate = [
    'probablePitcher',
    'linescore',
    'team',
    'venue',
    'flags',
  ].join(',')
  const data = await getJson<ScheduleResponse>(
    `/api/v1/schedule?sportId=1&date=${date}&hydrate=${hydrate}`,
  )
  return data.dates[0]?.games ?? []
}

export async function fetchLiveGame(gamePk: number): Promise<LiveFeed> {
  return getJson<LiveFeed>(`/api/v1.1/game/${gamePk}/feed/live`)
}

export async function fetchStandings(season: number): Promise<StandingsResponse> {
  return getJson<StandingsResponse>(
    `/api/v1/standings?leagueId=103,104&season=${season}&standingsTypes=regularSeason`,
  )
}

export async function fetchTeam(teamId: number): Promise<TeamRecord['teams'][number]> {
  const data = await getJson<TeamRecord>(`/api/v1/teams/${teamId}`)
  const team = data.teams[0]
  if (!team) throw new Error('Team not found')
  return team
}

export async function fetchRoster(teamId: number): Promise<RosterPlayer[]> {
  const data = await getJson<{ roster: RosterPlayer[] }>(
    `/api/v1/teams/${teamId}/roster?rosterType=active`,
  )
  return data.roster ?? []
}

export async function fetchTeamSchedule(
  teamId: number,
  season: number,
): Promise<ScheduleGame[]> {
  const data = await getJson<ScheduleResponse>(
    `/api/v1/schedule?sportId=1&teamId=${teamId}&season=${season}&hydrate=probablePitcher,linescore,team,venue`,
  )
  return data.dates.flatMap((day) => day.games)
}

export function teamLogo(teamId: number, size = 72): string {
  return `https://midfield.mlbstatic.com/v1/team/${teamId}/spots/${size}`
}
