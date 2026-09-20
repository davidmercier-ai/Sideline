import type { WinRecord } from './types'

const HOME_EDGE = 0.04

function clamp(value: number, min = 0.05, max = 0.95): number {
  return Math.min(max, Math.max(min, value))
}

function winRate(record?: WinRecord): number {
  const wins = record?.wins ?? 0
  const losses = record?.losses ?? 0
  const games = wins + losses
  if (games < 10) return 0.5
  return clamp(wins / games)
}

/**
 * Bill James log5, then a small home-field bump.
 * Placeholder until the Sideline MLB model is wired in.
 */
export function sidelineLean(
  away?: WinRecord,
  home?: WinRecord,
): { home: number; away: number } {
  const pAway = winRate(away)
  const pHome = clamp(winRate(home) + HOME_EDGE)
  const denom = pAway + pHome - 2 * pAway * pHome
  const homeWin = denom === 0 ? 0.5 : clamp((pHome - pAway * pHome) / denom)
  return {
    home: homeWin,
    away: 1 - homeWin,
  }
}

export function formatLean(value: number): string {
  return `${Math.round(value * 100)}%`
}
