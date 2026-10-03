import { useMemo, useState } from 'react'
import { GoalCard } from '../components/GoalCard'
import { fetchSoccerSlate, SOCCER_LEAGUES, type SoccerMatch } from '../lib/soccer'
import { usePoll } from '../lib/usePoll'

type Filter = 'all' | 'in' | 'pre' | 'post'

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'in', label: 'Live' },
  { id: 'pre', label: 'Upcoming' },
  { id: 'post', label: 'Final' },
]

export function SoccerBoardPage() {
  const [filter, setFilter] = useState<Filter>('all')
  const [league, setLeague] = useState('all')
  const { data, error, loading } = usePoll(fetchSoccerSlate, 'soccer-slate', 30000)

  const matches = data ?? []
  const visible = useMemo(
    () =>
      (data ?? []).filter((match) => {
        if (filter !== 'all' && match.state !== filter) return false
        if (league !== 'all' && match.league !== league) return false
        return true
      }),
    [data, filter, league],
  )
  const liveCount = matches.filter((match) => match.state === 'in').length
  const goalCount = matches.reduce((sum, match) => sum + match.goals.length, 0)

  return (
    <main>
      <section className="page-hero">
        <div>
          <p className="meta">Who put it in the net</p>
          <h1>Soccer goals</h1>
          <p className="lede">
            Scores and scorers across the big leagues. The card is the goal, not
            the table.
          </p>
        </div>
      </section>

      <div className="row" style={{ marginBottom: 12 }}>
        <p className="muted">{matches.length} matches on the slate</p>
        <p className="meta">
          {liveCount} live · {goalCount} goals logged
        </p>
      </div>

      <div className="filters" role="tablist" aria-label="Match filters">
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
      <div className="filters" role="tablist" aria-label="Leagues">
        <button
          type="button"
          className={`chip ${league === 'all' ? 'active' : ''}`}
          onClick={() => setLeague('all')}
        >
          All leagues
        </button>
        {SOCCER_LEAGUES.map((item) => (
          <button
            key={item.slug}
            type="button"
            className={`chip ${league === item.slug ? 'active' : ''}`}
            onClick={() => setLeague(item.slug)}
          >
            {item.name}
          </button>
        ))}
      </div>

      {loading && !data ? <p className="loading">Waiting on the far post…</p> : null}
      {error ? <p className="error">{error}</p> : null}
      {!loading && !error && visible.length === 0 ? (
        <p className="empty">No matches in this view.</p>
      ) : null}

      <div className="game-grid">
        {visible.map((match: SoccerMatch) => (
          <GoalCard key={`${match.league}-${match.id}`} match={match} />
        ))}
      </div>
    </main>
  )
}
