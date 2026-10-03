import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ThreeCard } from '../components/ThreeCard'
import { formatLongDate, shiftDate, todayET } from '../lib/format'
import { fetchNbaSlate, filterNbaGames, parseNbaDate, sortNbaGames, totalThrees } from '../lib/nba'
import { usePoll } from '../lib/usePoll'

type Filter = 'all' | 'in' | 'pre' | 'post'

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'in', label: 'Live' },
  { id: 'pre', label: 'Upcoming' },
  { id: 'post', label: 'Final' },
]

export function NbaBoardPage() {
  const [params, setParams] = useSearchParams()
  const date = parseNbaDate(params.get('date')) ?? todayET()
  const [filter, setFilter] = useState<Filter>('all')

  const { data, error, loading } = usePoll(() => fetchNbaSlate(date), date, 20000)

  const games = useMemo(() => sortNbaGames(data ?? []), [data])
  const visible = useMemo(() => filterNbaGames(games, filter), [games, filter])
  const liveCount = games.filter((game) => game.state === 'in').length
  const threeCount = games.reduce((sum, game) => sum + totalThrees(game), 0)

  function setDate(next: string) {
    const nextParams = new URLSearchParams(params)
    if (next === todayET()) nextParams.delete('date')
    else nextParams.set('date', next)
    setParams(nextParams, { replace: true })
  }

  return (
    <main>
      <section className="page-hero">
        <div>
          <p className="meta">From beyond the arc</p>
          <h1>NBA threes</h1>
          <p className="lede">
            Team three-point totals, the shooters who made them, and a made-three
            timeline. The card is the shot, not the rest of the box.
          </p>
        </div>
        <div className="date-nav">
          <button type="button" className="date-btn" onClick={() => setDate(shiftDate(date, -1))}>
            Prev
          </button>
          <input
            type="date"
            value={date}
            aria-label="NBA date"
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
          {liveCount} live · {threeCount} threes · {games.length} games
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

      {loading && !data ? <p className="loading">Checking the corner…</p> : null}
      {error ? <p className="error">{error}</p> : null}
      {!loading && !error && visible.length === 0 ? (
        <p className="empty">
          {filter === 'all'
            ? 'No NBA games on this date.'
            : 'No games in this view. Try another filter or date.'}
          {filter === 'all' ? (
            <>
              {' '}
              <button type="button" className="date-btn" onClick={() => setDate(shiftDate(date, 1))}>
                Next slate
              </button>
            </>
          ) : null}
        </p>
      ) : null}

      <div className="game-grid">
        {visible.map((game) => (
          <ThreeCard key={game.id} game={game} />
        ))}
      </div>
    </main>
  )
}
