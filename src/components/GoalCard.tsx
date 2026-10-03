import { Link } from 'react-router-dom'
import { formatGameTime } from '../lib/format'
import { scorersFor, type SoccerMatch } from '../lib/soccer'

type Props = {
  match: SoccerMatch
}

export function GoalCard({ match }: Props) {
  const live = match.state === 'in'
  const final = match.state === 'post'
  return (
    <article className="card game-card">
      <div className="card-top">
        <div className={live ? 'live-pill' : final ? 'status-pill final-pill' : 'status-pill muted'}>
          {live || final ? match.status : formatGameTime(match.date)}
        </div>
        <span className="meta">{match.leagueName}</span>
      </div>
      <Link to={`/soccer/${encodeURIComponent(match.league)}/${match.id}`}>
        <ScoreLine side={match.away} muted={final && !match.away.winner} scorers={scorersFor(match, match.away.id)} />
        <div style={{ height: 10 }} />
        <ScoreLine side={match.home} muted={final && !match.home.winner} scorers={scorersFor(match, match.home.id)} />
      </Link>
      {match.venue ? <p className="muted" style={{ fontSize: 13 }}>{match.venue}</p> : null}
    </article>
  )
}

function ScoreLine({
  side,
  muted,
  scorers,
}: {
  side: SoccerMatch['away']
  muted?: boolean
  scorers: string
}) {
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
        <div className={`runs ${muted || side.score == null ? 'muted' : ''}`}>
          {side.score ?? '–'}
        </div>
      </div>
      {scorers ? <p className="goal-scorers">{scorers}</p> : null}
    </div>
  )
}
