import { fetchSchedule } from './api'
import { dateInET, shiftDate, sortGames, todayET } from './format'
import { fetchNbaSlate, sortNbaGames, type NbaGame } from './nba'
import { fetchNhlSlate, sortNhlGames, type NhlGame } from './nhl'
import { fetchSoccerSlate, type SoccerMatch } from './soccer'
import type { ScheduleGame } from './types'

export type TonightSlate = {
  date: string
  mlb: ScheduleGame[]
  nba: NbaGame[]
  nhl: NhlGame[]
  soccer: SoccerMatch[]
}

export async function fetchTonight(date = todayET()): Promise<TonightSlate> {
  const [mlb, nba, nhl, soccer] = await Promise.all([
    fetchSchedule(date).catch(() => [] as ScheduleGame[]),
    fetchNbaSlate(date).catch(() => [] as NbaGame[]),
    fetchNhlSlate(date).catch(() => [] as NhlGame[]),
    fetchSoccerSlate(date)
      .then((matches) => matches.filter((match) => dateInET(match.date) === date))
      .catch(() => [] as SoccerMatch[]),
  ])

  return {
    date,
    mlb: sortGames(mlb),
    nba: sortNbaGames(nba),
    nhl: sortNhlGames(nhl),
    soccer,
  }
}

export async function findSimSlateDate(from = todayET()): Promise<string> {
  let best: { date: string; sports: number; games: number } | undefined
  for (let i = 1; i <= 6; i += 1) {
    const date = shiftDate(from, -i)
    const [mlb, nba, nhl] = await Promise.all([
      fetchSchedule(date).catch(() => [] as ScheduleGame[]),
      fetchNbaSlate(date).catch(() => [] as NbaGame[]),
      fetchNhlSlate(date).catch(() => [] as NhlGame[]),
    ])
    const games = mlb.length + nba.length + nhl.length
    const sports = [mlb, nba, nhl].filter((list) => list.length > 0).length
    if (!best || sports > best.sports || (sports === best.sports && games > best.games)) {
      best = { date, sports, games }
    }
    if (sports >= 3 && games >= 8) return date
  }
  return best?.date ?? shiftDate(from, -1)
}

export function boardPath(path: string, date: string): string {
  if (date === todayET()) return path
  return `${path}?date=${date}`
}

export function tonightCounts(slate: TonightSlate): {
  games: number
  live: number
} {
  const soccerLive = slate.soccer.filter((match) => match.state === 'in').length
  const nbaLive = slate.nba.filter((game) => game.state === 'in').length
  const nhlLive = slate.nhl.filter((game) => game.state === 'in').length
  const mlbLive = slate.mlb.filter((game) => game.status.abstractGameState === 'Live').length
  return {
    games: slate.mlb.length + slate.nba.length + slate.nhl.length + slate.soccer.length,
    live: mlbLive + nbaLive + nhlLive + soccerLive,
  }
}
