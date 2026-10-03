import { Link } from 'react-router-dom'
import { lastName, inningLabel, isFinal, isLive, recordText, seriesLine } from '../lib/format'
import { sidelineLean } from '../lib/lean'
import type { ScheduleGame } from '../lib/types'
import { LeanMeter } from './LeanMeter'
import { TeamMark } from './TeamMark'

type Props = {
  game: ScheduleGame
  watched: boolean
  onWatch: (gamePk: number) => void
}

export function GameCard({ game, watched, onWatch }: Props) {
  const { away, home } = game.teams
  const lean = sidelineLean(away.leagueRecord, home.leagueRecord)
  const live = isLive(game.status)
  const final = isFinal(game.status)
  const awayScore = away.score ?? game.linescore?.teams?.away?.runs
  const homeScore = home.score ?? game.linescore?.teams?.home?.runs
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
      />
    </article>
  )
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
