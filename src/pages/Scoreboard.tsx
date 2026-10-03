import { useMemo, useState } from 'react'
import { GameCard } from '../components/GameCard'
import { fetchSchedule } from '../lib/api'
import { filterGames, formatLongDate, isLive, seriesLine, shiftDate, sortGames, todayET } from '../lib/format'
import type { Filter } from '../lib/types'
import { usePoll } from '../lib/usePoll'
import { readWatched, toggleWatched, writeWatched } from '../lib/watch'

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'live', label: 'Live' },
  { id: 'preview', label: 'Upcoming' },
  { id: 'final', label: 'Final' },
  { id: 'watched', label: 'Watching' },
]

export function ScoreboardPage() {
  const [date, setDate] = useState(todayET)
  const [filter, setFilter] = useState<Filter>('all')
  const [watched, setWatched] = useState(readWatched)

  const { data, error, loading } = usePoll(
    () => fetchSchedule(date),
    date,
    20000,
  )

  const games = useMemo(() => sortGames(data ?? []), [data])
  const visible = useMemo(
    () => filterGames(games, filter, watched),
    [games, filter, watched],
  )
  const liveCount = games.filter((game) => isLive(game.status)).length
  const postseason = games.some((game) => Boolean(seriesLine(game)))

  function onWatch(gamePk: number) {
    const next = toggleWatched(watched, gamePk)
    setWatched(next)
    writeWatched(next)
  }

  return (
    <main>
      <section className="page-hero">
        <div>
          <p className="meta">Today from the grass</p>
          <h1>Scoreboard</h1>
          <p className="lede">
            Live MLB, a clean scorebug, and a Sideline lean on every game — the
            first surface for the model sitting in the next repo.
          </p>
        </div>
        <div className="date-nav">
          <button type="button" className="date-btn" onClick={() => setDate(shiftDate(date, -1))}>
            Prev
          </button>
          <input
            type="date"
            value={date}
            aria-label="Scoreboard date"
            onChange={(event) => setDate(event.target.value)}
          />
          <button type="button" className="date-btn" onClick={() => setDate(shiftDate(date, 1))}>
            Next
          </button>
          {date !== todayET() ? (
            <button type="button" className="date-btn" onClick={() => setDate(todayET())}>
              Today
            </button>
          ) : null}
        </div>
      </section>

      <div className="row" style={{ marginBottom: 12 }}>
        <p className="muted">{formatLongDate(date)}</p>
        <p className="meta">
          {postseason ? 'Postseason · ' : ''}
          {liveCount} live · {games.length} games
        </p>
      </div>

      <div className="filters" role="tablist" aria-label="Game filters">
        {FILTERS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`chip ${filter === item.id ? 'active' : ''}`}
            onClick={() => setFilter(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>

      {loading && !data ? <p className="loading">Walking out to the first-base line…</p> : null}
      {error ? <p className="error">{error}</p> : null}
      {!loading && !error && visible.length === 0 ? (
        <p className="empty">No games in this view. Try another filter or date.</p>
      ) : null}

      <div className="game-grid">
        {visible.map((game) => (
          <GameCard
            key={game.gamePk}
            game={game}
            watched={watched.includes(game.gamePk)}
            onWatch={onWatch}
          />
        ))}
      </div>
    </main>
  )
}
