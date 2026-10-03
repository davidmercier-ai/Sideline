import { Link } from 'react-router-dom'
import { lineFor } from '../lib/context'
import { lastName, inningLabel, isFinal, isLive, recordText, seriesLine } from '../lib/format'
import { sidelineLean } from '../lib/lean'
import type { PitcherSeason, PublicLine, ScheduleGame } from '../lib/types'
import { LeanMeter } from './LeanMeter'
import { TeamMark } from './TeamMark'

type Props = {
  game: ScheduleGame
  watched: boolean
  onWatch: (gamePk: number) => void
  pitchers?: Record<number, PitcherSeason>
  lines?: Record<string, PublicLine>
}

export function GameCard({ game, watched, onWatch, pitchers = {}, lines = {} }: Props) {
  const { away, home } = game.teams
  const lean = sidelineLean({
    awayRecord: away.leagueRecord,
    homeRecord: home.leagueRecord,
    awayPitcher: away.probablePitcher ? pitchers[away.probablePitcher.id] : undefined,
    homePitcher: home.probablePitcher ? pitchers[home.probablePitcher.id] : undefined,
  })
  const line = lineFor(lines, away.team.abbreviation, home.team.abbreviation)
  const live = isLive(game.status)
  const final = isFinal(game.status)
  const awayScore = postedRuns(game, away.score ?? game.linescore?.teams?.away?.runs)
  const homeScore = postedRuns(game, home.score ?? game.linescore?.teams?.home?.runs)
  const series = seriesLine(game)

  return (
    <article className="card game-card">
      <div className="card-top">
        <div className={live ? 'live-pill' : final ? 'status-pill final-pill' : 'status-pill muted'}>
          {inningLabel(game)}
        </div>
        <button
          type="button"
          className="icon-btn"
          aria-pressed={watched}
          aria-label={watched ? 'Remove from watch list' : 'Add to watch list'}
          onClick={(event) => {
            event.preventDefault()
            onWatch(game.gamePk)
          }}
        >
          {watched ? 'Watching' : 'Watch'}
        </button>
      </div>

      <Link to={`/game/${game.gamePk}`}>
        <TeamLine
          team={away.team}
          record={recordText(away.leagueRecord?.wins, away.leagueRecord?.losses)}
          score={awayScore}
          muted={final && !away.isWinner}
        />
        <div style={{ height: 10 }} />
        <TeamLine
          team={home.team}
          record={recordText(home.leagueRecord?.wins, home.leagueRecord?.losses)}
          score={homeScore}
          muted={final && !home.isWinner}
        />
      </Link>

      <div className="muted" style={{ fontSize: 13 }}>
        {series ? `${series} · ` : ''}
        {lastName(away.probablePitcher)} vs {lastName(home.probablePitcher)}
        {game.venue?.name ? ` · ${game.venue.name}` : ''}
      </div>

      <LeanMeter
        away={away.team}
        home={home.team}
        awayPct={lean.away}
        homePct={lean.home}
        notes={lean.notes}
        line={line}
      />
    </article>
  )
}

function postedRuns(game: ScheduleGame, runs?: number): number | undefined {
  if (isLive(game.status) || isFinal(game.status)) return runs ?? 0
  return runs && runs > 0 ? runs : undefined
}

function TeamLine({
  team,
  record,
  score,
  muted,
}: {
  team: ScheduleGame['teams']['away']['team']
  record: string
  score?: number
  muted?: boolean
}) {
  return (
    <div className="score-row">
      <TeamMark team={team} record={record} />
      <div className={`runs ${muted || score == null ? 'muted' : ''}`}>
        {score ?? '–'}
      </div>
    </div>
  )
}
