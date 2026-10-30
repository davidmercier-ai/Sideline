import { Link, useParams } from 'react-router-dom'
import { formatGameTime } from '../lib/format'
import { fetchNhlGame, formatSaves, type NhlGoalie, type NhlPlay, type NhlSide } from '../lib/nhl'
import { usePoll } from '../lib/usePoll'

export function NhlGamePage() {
  const { eventId = '' } = useParams()
  const { data, error, loading } = usePoll(
    () => fetchNhlGame(eventId),
    eventId,
    15000,
  )

  if (!eventId) return <p className="error">Missing game.</p>
  if (loading && !data) return <p className="loading">Waiting on the crease…</p>
  if (error) return <p className="error">{error}</p>
  if (!data) return null

  const { game, plays } = data
  const live = game.state === 'in'
  const final = game.state === 'post'

  return (
    <main>
      <p style={{ marginTop: 20 }}>
        <Link className="back-link" to="/nhl">
          ← NHL goals
        </Link>
      </p>
      <section className="page-hero">
        <div>
          <p className={live ? 'live-pill' : final ? 'status-pill final-pill' : 'status-pill muted'}>
            {live || final ? game.status : formatGameTime(game.date)}
          </p>
          <h1>
            {game.away.short} at {game.home.short}
          </h1>
          <p className="lede">{game.venue || 'NHL'}</p>
        </div>
      </section>

      <section className="card scorebug">
        <ScoreTeam side={game.away} dim={final && !game.away.winner} />
        <ScoreTeam side={game.home} dim={final && !game.home.winner} />
      </section>

      <div className="layout-2" style={{ marginTop: 14 }}>
        <ScorerPanel side={game.away} />
        <ScorerPanel side={game.home} />
      </div>

      <div className="layout-2" style={{ marginTop: 14 }}>
        <GoaliePanel side={game.away} />
        <GoaliePanel side={game.home} />
      </div>

      <section className="panel" style={{ marginTop: 14 }}>
        <h2 className="section-title" style={{ fontSize: 28, marginBottom: 12 }}>
          Goals
        </h2>
        {plays.length === 0 ? (
          <p className="muted">{game.state === 'pre' ? 'No puck drop yet.' : 'No goals logged.'}</p>
        ) : (
          <div className="play-list">
            {plays.map((play, index) => (
              <GoalPlay key={`${play.period}-${play.clock}-${index}`} play={play} />
            ))}
          </div>
        )}
      </section>
    </main>
  )
}

function ScoreTeam({ side, dim }: { side: NhlSide; dim?: boolean }) {
  const saves = formatSaves(side.saves)
  const goalie = side.goalies[0]
  return (
    <div className="scorebug-team">
      <div className="team-mark">
        {side.logo ? <img src={side.logo} alt="" width={36} height={36} /> : null}
        <div>
          <div className="team-name">{side.name}</div>
          <div className="team-record">
            {side.record ? `${side.record} · ` : ''}
            {saves
              ? `${saves}${goalie?.savePct ? ` · ${goalie.savePct}` : ''}`
              : gamePending(side)}
          </div>
        </div>
      </div>
      <div className={`runs ${dim || side.score == null ? 'muted' : ''}`}>
        {side.score ?? '–'}
      </div>
    </div>
  )
}

function gamePending(side: NhlSide): string {
  return side.score == null ? 'saves pending' : 'saves'
}

function ScorerPanel({ side }: { side: NhlSide }) {
  return (
    <section className="panel">
      <h2 className="section-title" style={{ fontSize: 28, marginBottom: 12 }}>
        {side.short} goals
      </h2>
      {side.scorers.length === 0 ? (
        <p className="muted">No goals yet.</p>
      ) : (
        <table className="standings-table">
          <thead>
            <tr>
              <th>Scorer</th>
              <th className="num">G</th>
            </tr>
          </thead>
          <tbody>
            {side.scorers.map((row) => (
              <tr key={row.name}>
                <td>{row.name}</td>
                <td className="num">{row.goals}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  )
}

function GoaliePanel({ side }: { side: NhlSide }) {
  return (
    <section className="panel">
      <h2 className="section-title" style={{ fontSize: 28, marginBottom: 12 }}>
        {side.short} saves
      </h2>
      {side.goalies.length === 0 ? (
        <p className="muted">No saves logged.</p>
      ) : (
        <table className="standings-table">
          <thead>
            <tr>
              <th>Goalie</th>
              <th className="num">SV</th>
              <th className="num">SA</th>
              <th className="num">SV%</th>
            </tr>
          </thead>
          <tbody>
            {side.goalies.map((row: NhlGoalie) => (
              <tr key={row.name}>
                <td>{row.name}</td>
                <td className="num">{row.saves}</td>
                <td className="num">{row.shotsAgainst}</td>
                <td className="num">{row.savePct || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  )
}

function GoalPlay({ play }: { play: NhlPlay }) {
  return (
    <article className="play scoring">
      <div className="row">
        <span className="meta">
          {play.period}
          {play.clock ? ` · ${play.clock}` : ''}
        </span>
        {play.team ? <span className="meta">{play.team}</span> : null}
      </div>
      <p>{play.text}</p>
    </article>
  )
}
