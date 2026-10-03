import { fetchPitcherStats, fetchPublicLines, lineKey } from './api'
import { seasonFromDate } from './format'
import type { PitcherSeason, PublicLine, ScheduleGame } from './types'

export type SidelineContext = {
  pitchers: Record<number, PitcherSeason>
  lines: Record<string, PublicLine>
}

export async function loadSidelineContext(games: ScheduleGame[]): Promise<SidelineContext> {
  const pitcherIds = games.flatMap((game) => [
    game.teams.away.probablePitcher?.id,
    game.teams.home.probablePitcher?.id,
  ]).filter((id): id is number => typeof id === 'number')

  const dates = [...new Set(games.map((game) => game.officialDate).filter(Boolean))]
  const season = seasonFromDate(dates[0] || games[0]?.officialDate || '2026-01-01')

  const [pitchers, lineSets] = await Promise.all([
    fetchPitcherStats(pitcherIds, season),
    Promise.all(dates.slice(0, 8).map((date) => fetchPublicLines(date))),
  ])

  const lines: Record<string, PublicLine> = {}
  for (const set of lineSets) Object.assign(lines, set)
  return { pitchers, lines }
}

export function lineFor(
  lines: Record<string, PublicLine>,
  awayAbbr?: string,
  homeAbbr?: string,
): PublicLine | undefined {
  return lines[lineKey(awayAbbr, homeAbbr)]
}
