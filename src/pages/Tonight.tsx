import { useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { GameCard } from '../components/GameCard'
import { GoalCard } from '../components/GoalCard'
import { NhlCard } from '../components/NhlCard'
import { ThreeCard } from '../components/ThreeCard'
import { loadSidelineContext } from '../lib/context'
import { formatLongDate, todayET } from '../lib/format'
import { fetchTonight, tonightCounts } from '../lib/tonight'
import { usePoll } from '../lib/usePoll'
import { readWatched, toggleWatched, writeWatched } from '../lib/watch'

export function TonightPage() {
  const date = todayET()
  const [watched, setWatched] = useState(readWatched)
  const { data, error, loading } = usePoll(() => fetchTonight(date), date, 20000)
  const extras = usePoll(
    () => loadSidelineContext(data?.mlb ?? []),
    `${date}-mlb-${(data?.mlb ?? []).map((game) => game.gamePk).join(',')}`,
    60000,
  )

  const counts = data ? tonightCounts(data) : { games: 0, live: 0 }

  function onWatch(gamePk: number) {
    const next = toggleWatched(watched, gamePk)
    setWatched(next)
    writeWatched(next)
  }

  return (
    <main>
      <section className="page-hero">
        <div>
          <p className="meta">Whatever’s on the grass</p>
          <h1>Tonight</h1>
          <p className="lede">
            One sheet for today’s MLB, soccer, NBA, and NHL. Each sport still
            has its own board when you want the full slate.
          </p>
        </div>
      </section>

      <div className="row" style={{ marginBottom: 12 }}>
        <p className="muted">{formatLongDate(date)}</p>
        <p className="meta">
          {counts.live} live · {counts.games} on the sheet
        </p>
      </div>

      {loading && !data ? <p className="loading">Checking every clubhouse…</p> : null}
      {error ? <p className="error">{error}</p> : null}

      {data ? (
        <>
          <SportSection
            title="Soccer"
            to="/soccer"
            empty="No matches in ET today."
            count={data.soccer.length}
          >
            {data.soccer.map((match) => (
              <GoalCard key={`${match.league}-${match.id}`} match={match} />
            ))}
          </SportSection>

          <SportSection
            title="MLB"
            to="/mlb"
            empty="No MLB games today."
            count={data.mlb.length}
          >
            {data.mlb.map((game) => (
              <GameCard
                key={game.gamePk}
                game={game}
                watched={watched.includes(game.gamePk)}
                onWatch={onWatch}
                pitchers={extras.data?.pitchers}
                lines={extras.data?.lines}
              />
            ))}
          </SportSection>

          <SportSection
            title="NHL"
            to="/nhl"
            empty="No NHL games today."
            count={data.nhl.length}
          >
            {data.nhl.map((game) => (
              <NhlCard key={game.id} game={game} />
            ))}
          </SportSection>

          <SportSection
            title="NBA"
            to="/nba"
            empty="No NBA games today."
            count={data.nba.length}
          >
            {data.nba.map((game) => (
              <ThreeCard key={game.id} game={game} />
            ))}
          </SportSection>
        </>
      ) : null}
    </main>
  )
}

function SportSection({
  title,
  to,
  empty,
  count,
  children,
}: {
  title: string
  to: string
  empty: string
  count: number
  children: ReactNode
}) {
  return (
    <section className="tonight-section">
      <div className="row" style={{ marginBottom: 12 }}>
        <h2 className="section-title" style={{ fontSize: 28 }}>
          {title}
        </h2>
        <Link className="back-link" to={to}>
          Full board →
        </Link>
      </div>
      {count === 0 ? <p className="muted">{empty}</p> : <div className="game-grid">{children}</div>}
    </section>
  )
}
