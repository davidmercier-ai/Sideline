import { Link } from 'react-router-dom'
import { formatGameTime } from '../lib/format'
import { formatThrees, shooterLine, type NbaGame, type NbaSide } from '../lib/nba'

type Props = {
  game: NbaGame
}

export function ThreeCard({ game }: Props) {
  const live = game.state === 'in'
  const final = game.state === 'post'
  return (
    <article className="card game-card">
      <div className="card-top">
        <div className={live ? 'live-pill' : final ? 'status-pill final-pill' : 'status-pill muted'}>
          {live || final ? game.status : formatGameTime(game.date)}
        </div>
        <span className="meta">{threeHeadline(game)}</span>
      </div>
      <Link to={`/nba/${game.id}`}>
        <ScoreLine side={game.away} muted={final && !game.away.winner} />
        <div style={{ height: 10 }} />
        <ScoreLine side={game.home} muted={final && !game.home.winner} />
      </Link>
      {game.venue ? <p className="muted" style={{ fontSize: 13 }}>{game.venue}</p> : null}
    </article>
  )
}

function ScoreLine({ side, muted }: { side: NbaSide; muted?: boolean }) {
  const threes = formatThrees(side.threes)
  const shooters = shooterLine(side.shooters)
  return (
    <div>
      <div className="score-row">
        <div className="team-mark">
          {side.logo ? <img src={side.logo} alt="" width={36} height={36} /> : null}
          <div>
            <div className="team-name">{side.short}</div>
            {side.record ? <div className="team-record">{side.record}</div> : null}
          </div>
        </div>
        <div className="three-score">
          <div className={`runs ${muted || side.score == null ? 'muted' : ''}`}>
            {side.score ?? '–'}
          </div>
          {threes ? <div className="three-stat">{threes}</div> : null}
        </div>
      </div>
      {shooters ? <p className="shooter-line">{shooters}</p> : null}
    </div>
  )
}

function threeHeadline(game: NbaGame): string {
  const away = game.away.threes
  const home = game.home.threes
  if (!away && !home) return game.state === 'pre' ? '3PT pending' : '3PT'
  const made = (away?.made ?? 0) + (home?.made ?? 0)
  return `${made} threes`
}
