import { Link, useParams } from 'react-router-dom'
import { formatGameTime } from '../lib/format'
import { fetchNbaGame, formatThrees, threePct, type NbaSide, type ThreePlay } from '../lib/nba'
import { usePoll } from '../lib/usePoll'

export function NbaGamePage() {
  const { eventId = '' } = useParams()
  const { data, error, loading } = usePoll(
    () => fetchNbaGame(eventId),
    eventId,
    15000,
  )

  if (!eventId) return <p className="error">Missing game.</p>
  if (loading && !data) return <p className="loading">Waiting on the catch-and-shoot…</p>
  if (error) return <p className="error">{error}</p>
  if (!data) return null

  const { game, plays } = data
  const live = game.state === 'in'
  const final = game.state === 'post'

  return (
    <main>
      <p style={{ marginTop: 20 }}>
        <Link className="back-link" to="/nba">
          ← NBA threes
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
          <p className="lede">{game.venue || 'NBA'}</p>
        </div>
      </section>

      <section className="card scorebug">
        <ScoreTeam side={game.away} dim={final && !game.away.winner} />
        <ScoreTeam side={game.home} dim={final && !game.home.winner} />
      </section>

      <div className="layout-2" style={{ marginTop: 14 }}>
        <ShooterPanel side={game.away} />
        <ShooterPanel side={game.home} />
      </div>

      <section className="panel" style={{ marginTop: 14 }}>
        <h2 className="section-title" style={{ fontSize: 28, marginBottom: 12 }}>
          Made threes
        </h2>
        {plays.length === 0 ? (
          <p className="muted">{game.state === 'pre' ? 'No tip-off yet.' : 'No made threes logged.'}</p>
        ) : (
          <div className="play-list">
            {plays.map((play, index) => (
              <ThreePlayRow key={`${play.period}-${play.clock}-${index}`} play={play} />
            ))}
          </div>
        )}
      </section>
    </main>
  )
}

function ScoreTeam({ side, dim }: { side: NbaSide; dim?: boolean }) {
  const threes = formatThrees(side.threes)
  return (
    <div className="scorebug-team">
      <div className="team-mark">
        {side.logo ? <img src={side.logo} alt="" width={36} height={36} /> : null}
        <div>
          <div className="team-name">{side.name}</div>
          <div className="team-record">
            {side.record ? `${side.record} · ` : ''}
            {threes ? `${threes} 3PT · ${threePct(side.threes)}` : '3PT pending'}
          </div>
        </div>
      </div>
      <div className={`runs ${dim || side.score == null ? 'muted' : ''}`}>
        {side.score ?? '–'}
      </div>
    </div>
  )
}

function ShooterPanel({ side }: { side: NbaSide }) {
  return (
    <section className="panel">
      <h2 className="section-title" style={{ fontSize: 28, marginBottom: 12 }}>
        {side.short} 3PT
      </h2>
      {side.shooters.length === 0 ? (
        <p className="muted">No made threes yet.</p>
      ) : (
        <table className="standings-table">
          <thead>
            <tr>
              <th>Shooter</th>
              <th className="num">Made</th>
              <th className="num">Att</th>
            </tr>
          </thead>
          <tbody>
            {side.shooters.map((row) => (
              <tr key={row.name}>
                <td>{row.name}</td>
                <td className="num">{row.made}</td>
                <td className="num">{row.attempted}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  )
}

function ThreePlayRow({ play }: { play: ThreePlay }) {
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
