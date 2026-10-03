export type GameState = 'Preview' | 'Live' | 'Final' | string

export type WinRecord = {
  wins: number
  losses: number
  pct?: string
}

export type Named = {
  id: number
  name?: string
  fullName?: string
  abbreviation?: string
  teamName?: string
  shortName?: string
}

export type ScheduleTeam = {
  team: Named
  leagueRecord?: WinRecord
  score?: number
  isWinner?: boolean
  probablePitcher?: Named
  splitSquad?: boolean
}

export type LinescoreInning = {
  num: number
  ordinalNum?: string
  home?: { runs?: number; hits?: number; errors?: number }
  away?: { runs?: number; hits?: number; errors?: number }
}

export type LinescoreSide = {
  runs?: number
  hits?: number
  errors?: number
}

export type Baserunner = {
  id?: number
  fullName?: string
}

export type Linescore = {
  currentInning?: number
  currentInningOrdinal?: string
  inningState?: string
  inningHalf?: string
  isTopInning?: boolean
  scheduledInnings?: number
  balls?: number
  strikes?: number
  outs?: number
  innings?: LinescoreInning[]
  teams?: { home?: LinescoreSide; away?: LinescoreSide }
  offense?: {
    first?: Baserunner
    second?: Baserunner
    third?: Baserunner
    batter?: Named
    onDeck?: Named
    inHole?: Named
    pitcher?: Named
  }
  defense?: {
    pitcher?: Named
    catcher?: Named
  }
}

export type GameStatus = {
  abstractGameState: GameState
  detailedState: string
  codedGameState?: string
  startTimeTBD?: boolean
  reason?: string
}

export type ScheduleGame = {
  gamePk: number
  gameDate: string
  officialDate: string
  dayNight?: string
  status: GameStatus
  venue?: Named
  teams: { away: ScheduleTeam; home: ScheduleTeam }
  linescore?: Linescore
  flags?: {
    noHitter?: boolean
    perfectGame?: boolean
  }
  seriesDescription?: string
  gamesInSeries?: number
  seriesGameNumber?: number
}

export type ScheduleResponse = {
  dates: { date: string; games: ScheduleGame[] }[]
}

export type PlayResult = {
  event?: string
  description?: string
  rbi?: number
  awayScore?: number
  homeScore?: number
  isOut?: boolean
}

export type Play = {
  result?: PlayResult
  about?: {
    inning?: number
    halfInning?: string
    isComplete?: boolean
    isScoringPlay?: boolean
  }
  count?: { balls?: number; strikes?: number; outs?: number }
  matchup?: {
    batter?: Named
    pitcher?: Named
  }
}

export type BoxPlayer = {
  person?: Named
  position?: { abbreviation?: string; name?: string }
  stats?: {
    batting?: Record<string, number | string>
    pitching?: Record<string, number | string>
  }
  seasonStats?: {
    batting?: Record<string, number | string>
    pitching?: Record<string, number | string>
  }
}

export type BoxTeam = {
  team?: Named
  battingOrder?: number[]
  pitchers?: number[]
  batters?: number[]
  players?: Record<string, BoxPlayer>
}

export type LiveFeed = {
  gamePk: number
  gameData: {
    datetime?: { dateTime?: string; officialDate?: string; dayNight?: string }
    status?: GameStatus
    teams?: { away?: Named & { record?: WinRecord }; home?: Named & { record?: WinRecord } }
    venue?: Named
    weather?: { condition?: string; temp?: string; wind?: string }
    probablePitchers?: { away?: Named; home?: Named }
  }
  liveData: {
    linescore?: Linescore
    plays?: {
      allPlays?: Play[]
      currentPlay?: Play
      scoringPlays?: number[]
    }
    boxscore?: {
      teams?: { away?: BoxTeam; home?: BoxTeam }
      topPerformers?: { player?: BoxPlayer; type?: string }[]
    }
    decisions?: {
      winner?: Named
      loser?: Named
      save?: Named
    }
  }
}

export type StandingTeam = {
  team: Named
  wins: number
  losses: number
  winningPercentage: string
  gamesBack: string
  wildCardGamesBack?: string
  divisionRank?: string
  leagueRank?: string
  runDifferential?: number
  streak?: { streakCode?: string }
  clinchIndicator?: string
}

export type StandingRecord = {
  standingsType: string
  league: Named
  division: Named & { nameShort?: string }
  teamRecords: StandingTeam[]
}

export type StandingsResponse = {
  records: StandingRecord[]
}

export type RosterPlayer = {
  person: Named
  jerseyNumber?: string
  position?: { abbreviation?: string; name?: string; type?: string }
  status?: { description?: string }
}

export type TeamRecord = {
  teams: Array<
    Named & {
      locationName?: string
      venue?: Named
      league?: Named
      division?: Named
      firstYearOfPlay?: string
    }
  >
}

export type Filter = 'all' | 'live' | 'final' | 'preview' | 'watched'
