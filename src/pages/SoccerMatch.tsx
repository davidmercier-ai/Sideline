import { Link, useParams } from 'react-router-dom'
import { formatGameTime } from '../lib/format'
import { fetchSoccerMatch } from '../lib/soccer'
import { usePoll } from '../lib/usePoll'

export function SoccerMatchPage() {
  const { league = '', eventId = '' } = useParams()
  const decoded = decodeURIComponent(league)
  const { data, error, loading } = usePoll(
    () => fetchSoccerMatch(decoded, eventId),
    `${decoded}-${eventId}`,
    15000,
  )

  if (loading && !data) return <p className="loading">Checking the goal line…</p>
  if (error) return <p className="error">{error}</p>
  if (!data) return null

  const { match, events } = data
  const live = match.state === 'in'
  const final = match.state === 'post'
  const goals = events.filter((event) => event.scoring)

  return (
    <main>
      <p style={{ marginTop: 20 }}>
        <Link className="back-link" to="/soccer">
          ← Soccer goals
        </Link>
      </p>
      <section className="page-hero">
        <div>
          <p className={live ? 'live-pill' : final ? 'status-pill final-pill' : 'status-pill muted'}>
            {live || final ? match.status : formatGameTime(match.date)}
          </p>
          <h1>
            {match.away.short} at {match.home.short}
          </h1>
          <p className="lede">
            {match.leagueName}
            {match.venue ? ` · ${match.venue}` : ''}
          </p>
        </div>
      </section>

      <section className="card scorebug">
        <div className="scorebug-team">
          <div className="team-mark">
            {match.away.logo ? <img src={match.away.logo} alt="" width={36} height={36} /> : null}
            <div>
              <div className="team-name">{match.away.name}</div>
              {match.away.record ? <div className="team-record">{match.away.record}</div> : null}
            </div>
          </div>
          <div className={`runs ${final && !match.away.winner ? 'muted' : ''}`}>
            {match.away.score ?? '–'}
          </div>
        </div>
        <div className="scorebug-team">
          <div className="team-mark">
            {match.home.logo ? <img src={match.home.logo} alt="" width={36} height={36} /> : null}
            <div>
              <div className="team-name">{match.home.name}</div>
              {match.home.record ? <div className="team-record">{match.home.record}</div> : null}
            </div>
          </div>
          <div className={`runs ${final && !match.home.winner ? 'muted' : ''}`}>
            {match.home.score ?? '–'}
          </div>
        </div>
      </section>

      <section className="panel" style={{ marginTop: 14 }}>
        <h2 className="section-title" style={{ fontSize: 28, marginBottom: 12 }}>
          Goals
        </h2>
        {goals.length === 0 ? (
          <p className="muted">{match.state === 'pre' ? 'No kickoff yet.' : 'No goals yet.'}</p>
        ) : (
          <div className="play-list">
            {goals.map((event, index) => (
              <article key={`${event.minute}-${index}`} className="play scoring">
                <div className="row">
                  <span className="meta">{event.minute || event.type}</span>
                  <span className="meta">Goal</span>
                </div>
                <p>{event.text}</p>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="panel" style={{ marginTop: 14 }}>
        <h2 className="section-title" style={{ fontSize: 28, marginBottom: 12 }}>
          Key events
        </h2>
        <div className="play-list">
          {events.length === 0 ? <p className="muted">No events yet.</p> : null}
          {events.map((event, index) => (
            <article
              key={`${event.type}-${index}`}
              className={`play ${event.scoring ? 'scoring' : ''}`}
            >
              <div className="row">
                <span className="meta">
                  {event.minute} {event.type}
                </span>
              </div>
              <p>{event.text}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  )
}
