import { getEspnJson } from './espn'
import type {
  LiveFeed,
  PitcherSeason,
  PublicLine,
  RosterPlayer,
  ScheduleGame,
  ScheduleResponse,
  StandingsResponse,
  TeamRecord,
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
    `/api/v1/standings?leagueId=103,104&season=${season}&standingsTypes=regularSeason&hydrate=division,league,team`,
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

export async function fetchPitcherStats(
  ids: number[],
  season: number,
): Promise<Record<number, PitcherSeason>> {
  const unique = [...new Set(ids.filter((id) => Number.isFinite(id) && id > 0))]
  if (unique.length === 0) return {}
  const data = await getJson<{
    people?: Array<{
      id: number
      fullName: string
      stats?: Array<{ splits?: Array<{ stat?: Record<string, number | string> }> }>
    }>
  }>(
    `/api/v1/people?personIds=${unique.join(',')}&hydrate=stats(group=[pitching],type=[season],season=${season})`,
  )
  const out: Record<number, PitcherSeason> = {}
  for (const person of data.people ?? []) {
    const stat = person.stats?.[0]?.splits?.[0]?.stat ?? {}
    out[person.id] = {
      id: person.id,
      fullName: person.fullName,
      era: stat.era,
      whip: stat.whip,
      inningsPitched: stat.inningsPitched,
      gamesStarted: Number(stat.gamesStarted) || 0,
    }
  }
  return out
}

const ABBR_ALIAS: Record<string, string> = {
  CHW: 'CWS',
  CWS: 'CWS',
  ARI: 'AZ',
  AZ: 'AZ',
  KAN: 'KC',
  KCR: 'KC',
  TBR: 'TB',
  TAM: 'TB',
  WAS: 'WSH',
  WSH: 'WSH',
  OAK: 'ATH',
  ATH: 'ATH',
  SDP: 'SD',
  SFG: 'SF',
}

export function normAbbr(abbr?: string): string {
  const key = (abbr || '').toUpperCase()
  return ABBR_ALIAS[key] || key
}

export function lineKey(awayAbbr?: string, homeAbbr?: string): string {
  return `${normAbbr(awayAbbr)}@${normAbbr(homeAbbr)}`
}

export async function fetchPublicLines(date: string): Promise<Record<string, PublicLine>> {
  const compact = date.replaceAll('-', '')
  try {
    const data = await getEspnJson<{
      events?: Array<{
        competitions?: Array<{
          competitors?: Array<{ homeAway?: string; team?: { abbreviation?: string } }>
          odds?: Array<{
            provider?: { displayName?: string; name?: string }
            details?: string
            overUnder?: number
            moneyline?: { home?: { close?: { odds?: string } }; away?: { close?: { odds?: string } } }
          }>
        }>
      }>
    }>(`/apis/site/v2/sports/baseball/mlb/scoreboard?dates=${compact}`)
    const lines: Record<string, PublicLine> = {}
    for (const event of data.events ?? []) {
      const comp = event.competitions?.[0]
      const away = comp?.competitors?.find((c) => c.homeAway === 'away')?.team?.abbreviation
      const home = comp?.competitors?.find((c) => c.homeAway === 'home')?.team?.abbreviation
      const odd = comp?.odds?.[0]
      const awayOdds = Number(odd?.moneyline?.away?.close?.odds)
      const homeOdds = Number(odd?.moneyline?.home?.close?.odds)
      if (!away || !home || !Number.isFinite(awayOdds) || !Number.isFinite(homeOdds)) continue
      lines[lineKey(away, home)] = {
        provider: odd?.provider?.displayName || odd?.provider?.name || 'Public board',
        awayAbbr: normAbbr(away),
        homeAbbr: normAbbr(home),
        awayOdds,
        homeOdds,
        details: odd?.details || `${home} ${homeOdds}`,
        overUnder: odd?.overUnder,
      }
    }
    return lines
  } catch {
    return {}
  }
}
