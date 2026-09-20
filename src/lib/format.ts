import type { GameStatus, Linescore, Named, ScheduleGame } from './types'

export function todayET(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/New_York',
  }).format(new Date())
}

export function shiftDate(isoDate: string, days: number): string {
  const [year, month, day] = isoDate.split('-').map(Number)
  const next = new Date(Date.UTC(year, month - 1, day + days))
  return next.toISOString().slice(0, 10)
}

export function formatLongDate(isoDate: string): string {
  const [year, month, day] = isoDate.split('-').map(Number)
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(year, month - 1, day)))
}

export function formatGameTime(iso: string): string {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
  }).format(new Date(iso))
}

export function seasonFromDate(isoDate: string): number {
  return Number(isoDate.slice(0, 4))
}

export function teamAbbr(team: Named | undefined): string {
  return team?.abbreviation || team?.teamName || team?.name || '—'
}

export function teamShort(team: Named | undefined): string {
  return team?.teamName || team?.shortName || team?.name || 'Team'
}

export function personName(person: Named | undefined): string {
  return person?.fullName || person?.name || 'TBD'
}

export function lastName(person: Named | undefined): string {
  const full = personName(person)
  if (full === 'TBD') return full
  const parts = full.split(' ')
  return parts[parts.length - 1] ?? full
}

export function recordText(wins?: number, losses?: number, pct?: string): string {
  if (wins == null || losses == null) return ''
  return pct ? `${wins}–${losses} · ${pct}` : `${wins}–${losses}`
}

export function isLive(status: GameStatus | undefined): boolean {
  return status?.abstractGameState === 'Live'
}

export function isFinal(status: GameStatus | undefined): boolean {
  return status?.abstractGameState === 'Final'
}

export function inningLabel(game: {
  status: GameStatus
  linescore?: Linescore
  gameDate: string
}): string {
  if (isFinal(game.status)) return game.status.detailedState === 'Final' ? 'Final' : game.status.detailedState
  if (isLive(game.status)) {
    const ls = game.linescore
    const half = ls?.inningState || (ls?.isTopInning ? 'Top' : 'Bot')
    return `${half} ${ls?.currentInningOrdinal ?? ''}`.trim()
  }
  if (game.status.detailedState !== 'Scheduled' && game.status.detailedState !== 'Pre-Game') {
    return game.status.reason
      ? `${game.status.detailedState} · ${game.status.reason}`
      : game.status.detailedState
  }
  return formatGameTime(game.gameDate)
}

export function outsDots(outs = 0): boolean[] {
  return [0, 1, 2].map((index) => index < outs)
}

export function basesOn(linescore?: Linescore): { first: boolean; second: boolean; third: boolean } {
  return {
    first: Boolean(linescore?.offense?.first),
    second: Boolean(linescore?.offense?.second),
    third: Boolean(linescore?.offense?.third),
  }
}

export function statNum(value: number | string | undefined): string {
  if (value == null || value === '') return '—'
  return String(value)
}

export function filterGames(
  games: ScheduleGame[],
  filter: 'all' | 'live' | 'final' | 'preview' | 'watched',
  watched: number[],
): ScheduleGame[] {
  return games.filter((game) => {
    if (filter === 'watched') return watched.includes(game.gamePk)
    if (filter === 'live') return isLive(game.status)
    if (filter === 'final') return isFinal(game.status)
    if (filter === 'preview') return !isLive(game.status) && !isFinal(game.status)
    return true
  })
}

export function sortGames(games: ScheduleGame[]): ScheduleGame[] {
  const rank = (game: ScheduleGame) => {
    if (isLive(game.status)) return 0
    if (!isFinal(game.status)) return 1
    return 2
  }
  return [...games].sort((a, b) => {
    const diff = rank(a) - rank(b)
    if (diff !== 0) return diff
    return new Date(a.gameDate).getTime() - new Date(b.gameDate).getTime()
  })
}
