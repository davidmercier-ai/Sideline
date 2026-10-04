import { Link } from 'react-router-dom'
import { formatGameTime } from '../lib/format'
import { formatSaves, scorerLine, totalGoals, totalSaves, type NhlGame, type NhlSide } from '../lib/nhl'

type Props = {
  game: NhlGame
}

export function NhlCard({ game }: Props) {
  const live = game.state === 'in'
  const final = game.state === 'post'
  return (
    <article className="card game-card">
      <div className="card-top">
        <div className={live ? 'live-pill' : final ? 'status-pill final-pill' : 'status-pill muted'}>
          {live || final ? game.status : formatGameTime(game.date)}
        </div>
        <span className="meta">{puckHeadline(game)}</span>
      </div>
      <Link to={`/nhl/${game.id}`}>
        <ScoreLine side={game.away} muted={final && !game.away.winner} />
        <div style={{ height: 10 }} />
        <ScoreLine side={game.home} muted={final && !game.home.winner} />
      </Link>
      {game.venue ? <p className="muted" style={{ fontSize: 13 }}>{game.venue}</p> : null}
    </article>
  )
}

function ScoreLine({ side, muted }: { side: NhlSide; muted?: boolean }) {
  const lead = side.goalies[0]
  const saves = lead ? `${lead.short} ${lead.saves}` : formatSaves(side.saves)
  const scorers = scorerLine(side.scorers)
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
          {saves ? <div className="three-stat">{saves}</div> : null}
        </div>
      </div>
      {scorers ? <p className="goal-scorers">{scorers}</p> : null}
    </div>
  )
}

function puckHeadline(game: NhlGame): string {
  if (game.state === 'pre') return 'goals pending'
  const goals = totalGoals(game)
  const saves = totalSaves(game)
  if (!goals && !saves) return 'goals'
  const bits = []
  if (goals) bits.push(`${goals} ${goals === 1 ? 'goal' : 'goals'}`)
  if (saves) bits.push(`${saves} saves`)
  return bits.join(' · ')
}
