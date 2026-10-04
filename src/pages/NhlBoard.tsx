import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { NhlCard } from '../components/NhlCard'
import { formatLongDate, shiftDate, todayET } from '../lib/format'
import { fetchNhlSlate, filterNhlGames, parseNhlDate, sortNhlGames, totalGoals, totalSaves } from '../lib/nhl'
import { usePoll } from '../lib/usePoll'

type Filter = 'all' | 'in' | 'pre' | 'post'

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'in', label: 'Live' },
  { id: 'pre', label: 'Upcoming' },
  { id: 'post', label: 'Final' },
]

export function NhlBoardPage() {
  const [params, setParams] = useSearchParams()
  const date = parseNhlDate(params.get('date')) ?? todayET()
  const [filter, setFilter] = useState<Filter>('all')

  const { data, error, loading } = usePoll(() => fetchNhlSlate(date), date, 20000)

  const games = useMemo(() => sortNhlGames(data ?? []), [data])
  const visible = useMemo(() => filterNhlGames(games, filter), [games, filter])
  const liveCount = games.filter((game) => game.state === 'in').length
  const goalCount = games.reduce((sum, game) => sum + totalGoals(game), 0)
  const saveCount = games.reduce((sum, game) => sum + totalSaves(game), 0)

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
          <p className="meta">Who scored and who stopped it</p>
          <h1>NHL goals</h1>
          <p className="lede">
            Scorers, goalie saves, and the goal timeline. The card is the puck,
            not the rest of the sheet.
          </p>
        </div>
        <div className="date-nav">
          <button type="button" className="date-btn" onClick={() => setDate(shiftDate(date, -1))}>
            Prev
          </button>
          <input
            type="date"
            value={date}
            aria-label="NHL date"
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
          {liveCount} live · {goalCount} goals · {saveCount} saves · {games.length} games
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

      {loading && !data ? <p className="loading">Waiting on the faceoff…</p> : null}
      {error ? <p className="error">{error}</p> : null}
      {!loading && !error && visible.length === 0 ? (
        <p className="empty">
          {filter === 'all'
            ? 'No NHL games on this date.'
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
          <NhlCard key={game.id} game={game} />
        ))}
      </div>
    </main>
  )
}
