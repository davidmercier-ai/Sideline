import type { PitcherSeason, WinRecord } from './types'

const HOME_EDGE = 0.03
const LEAGUE_ERA = 4.15
const ERA_POINT = 0.035

export type LeanInput = {
  awayRecord?: WinRecord
  homeRecord?: WinRecord
  awayPitcher?: PitcherSeason
  homePitcher?: PitcherSeason
}

export type LeanResult = {
  home: number
  away: number
  notes: string[]
}

function clamp(value: number, min = 0.08, max = 0.92): number {
  return Math.min(max, Math.max(min, value))
}

function winRate(record?: WinRecord): number {
  const wins = record?.wins ?? 0
  const losses = record?.losses ?? 0
  const games = wins + losses
  if (games < 10) return 0.5
  return Math.min(0.95, Math.max(0.05, wins / games))
}

function parseEra(value?: number | string): number | undefined {
  if (value == null || value === '') return undefined
  const n = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(n) ? n : undefined
}

function parseIp(value?: number | string): number {
  if (value == null || value === '') return 0
  const n = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(n) ? n : 0
}

export function pitcherWeight(pitcher?: PitcherSeason): number {
  const ip = parseIp(pitcher?.inningsPitched)
  const gs = pitcher?.gamesStarted ?? 0
  if (ip >= 60 || gs >= 12) return 1
  if (ip >= 25 || gs >= 6) return 0.55
  if (ip >= 10) return 0.25
  return 0
}

function log5(away?: WinRecord, home?: WinRecord): number {
  const pAway = winRate(away)
  const pHome = Math.min(0.95, Math.max(0.05, winRate(home) + HOME_EDGE))
  const denom = pAway + pHome - 2 * pAway * pHome
  if (denom === 0) return 0.5
  return clamp((pHome - pAway * pHome) / denom)
}

/**
 * Team log5 + home edge, then a starter ERA tilt.
 * Small samples are down-weighted. Not a betting model.
 */
export function sidelineLean(input: LeanInput): LeanResult {
  const notes: string[] = []
  let home = log5(input.awayRecord, input.homeRecord)
  notes.push('Season records + 3-point home edge')

  const awayEra = parseEra(input.awayPitcher?.era)
  const homeEra = parseEra(input.homePitcher?.era)
  const awayW = pitcherWeight(input.awayPitcher)
  const homeW = pitcherWeight(input.homePitcher)

  if (awayEra != null && awayW > 0 && input.awayPitcher) {
    notes.push(
      `${input.awayPitcher.fullName} ${awayEra.toFixed(2)} ERA in ${parseIp(input.awayPitcher.inningsPitched).toFixed(0)} IP`,
    )
  }
  if (homeEra != null && homeW > 0 && input.homePitcher) {
    notes.push(
      `${input.homePitcher.fullName} ${homeEra.toFixed(2)} ERA in ${parseIp(input.homePitcher.inningsPitched).toFixed(0)} IP`,
    )
  }

  if (awayEra != null && homeEra != null && awayW > 0 && homeW > 0) {
    const weight = Math.min(awayW, homeW)
    home += (awayEra - homeEra) * ERA_POINT * weight
  } else if (homeEra != null && homeW > 0) {
    home += (LEAGUE_ERA - homeEra) * ERA_POINT * 0.5 * homeW
  } else if (awayEra != null && awayW > 0) {
    home -= (LEAGUE_ERA - awayEra) * ERA_POINT * 0.5 * awayW
  } else {
    notes.push('Starters TBD or too thin to move the lean')
  }

  home = clamp(home)
  return { home, away: 1 - home, notes }
}

export function formatLean(value: number): string {
  return `${Math.round(value * 100)}%`
}

export function formatAmerican(odds: number): string {
  return odds > 0 ? `+${odds}` : `${odds}`
}

export function impliedFromAmerican(odds: number): number {
  if (odds > 0) return 100 / (odds + 100)
  const abs = Math.abs(odds)
  return abs / (abs + 100)
}

export function noVig(awayOdds: number, homeOdds: number): { away: number; home: number } {
  const away = impliedFromAmerican(awayOdds)
  const home = impliedFromAmerican(homeOdds)
  const sum = away + home
  if (sum === 0) return { away: 0.5, home: 0.5 }
  return { away: away / sum, home: home / sum }
}
