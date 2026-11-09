import { useEffect, useState, type ReactNode } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { GameCard } from '../components/GameCard'
import { GoalCard } from '../components/GoalCard'
import { NhlCard } from '../components/NhlCard'
import { ThreeCard } from '../components/ThreeCard'
import { loadSidelineContext } from '../lib/context'
import { formatLongDate, parseIsoDate, shiftDate, todayET } from '../lib/format'
import {
  boardPath,
  fetchTonight,
  findSimSlateDate,
  tonightCounts,
  tonightPreview,
  tonightSoccerLimit,
} from '../lib/tonight'
import { usePoll } from '../lib/usePoll'
import { readWatched, toggleWatched, writeWatched } from '../lib/watch'

const PHONE_SHEET = '(max-width: 820px)'

function usePhoneSheet() {
  const [phone, setPhone] = useState(() => window.matchMedia(PHONE_SHEET).matches)
  useEffect(() => {
    const media = window.matchMedia(PHONE_SHEET)
    const onChange = () => setPhone(media.matches)
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [])
  return phone
}

export function TonightPage() {
  const [params, setParams] = useSearchParams()
  const date = parseIsoDate(params.get('date')) ?? todayET()
  const simulated = date !== todayET()
  const phone = usePhoneSheet()
  const [watched, setWatched] = useState(readWatched)
  const [simulating, setSimulating] = useState(false)
  const { data, error, loading } = usePoll(() => fetchTonight(date), date, 20000)
  const extras = usePoll(
    () => loadSidelineContext(data?.mlb ?? []),
    `${date}-mlb-${(data?.mlb ?? []).map((game) => game.gamePk).join(',')}`,
    60000,
  )

  const counts = data ? tonightCounts(data) : { games: 0, live: 0 }
  const soccer = data ? tonightPreview(data.soccer, tonightSoccerLimit(phone)) : { shown: [], more: 0 }

  function setDate(next: string) {
    const nextParams = new URLSearchParams(params)
    if (next === todayET()) nextParams.delete('date')
    else nextParams.set('date', next)
    setParams(nextParams, { replace: true })
  }

  async function simulate() {
    setSimulating(true)
    try {
      setDate(await findSimSlateDate(todayET()))
    } finally {
      setSimulating(false)
    }
  }

  function onWatch(gamePk: number) {
    const next = toggleWatched(watched, gamePk)
    setWatched(next)
    writeWatched(next)
  }

  return (
    <main>
      <section className="page-hero">
        <div>
          <p className="meta">{simulated ? 'Simulated sheet' : 'Whatever’s on the grass'}</p>
          <h1>Tonight</h1>
          <p className="lede">
            One sheet for MLB, soccer, NBA, and NHL. Simulate jumps to the
            last stacked night so you can read scores before first pitch today.
          </p>
        </div>
        <div className="date-nav">
          <button type="button" className="date-btn" onClick={() => setDate(shiftDate(date, -1))}>
            Prev
          </button>
          <input
            type="date"
            value={date}
            aria-label="Tonight date"
            onChange={(event) => setDate(event.target.value)}
          />
          <button type="button" className="date-btn" onClick={() => setDate(shiftDate(date, 1))}>
            Next
          </button>
          {simulated ? (
            <button type="button" className="date-btn" onClick={() => setDate(todayET())}>
              Today
            </button>
          ) : (
            <button type="button" className="date-btn" onClick={() => void simulate()} disabled={simulating}>
              {simulating ? 'Finding…' : 'Simulate'}
            </button>
          )}
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
          {[
            {
              title: 'Soccer',
              to: boardPath('/soccer', date),
              empty: 'No matches on this date.',
              count: data.soccer.length,
              more: soccer.more,
              live: data.soccer.some((match) => match.state === 'in'),
              cards: soccer.shown.map((match) => (
                <GoalCard key={`${match.league}-${match.id}`} match={match} />
              )),
            },
            {
              title: 'MLB',
              to: boardPath('/mlb', date),
              empty: 'No MLB games on this date.',
              count: data.mlb.length,
              more: 0,
              live: data.mlb.some((game) => game.status.abstractGameState === 'Live'),
              cards: data.mlb.map((game) => (
                <GameCard
                  key={game.gamePk}
                  game={game}
                  watched={watched.includes(game.gamePk)}
                  onWatch={onWatch}
                  pitchers={extras.data?.pitchers}
                  lines={extras.data?.lines}
                />
              )),
            },
            {
              title: 'NHL',
              to: boardPath('/nhl', date),
              empty: 'No NHL games on this date.',
              count: data.nhl.length,
              more: 0,
              live: data.nhl.some((game) => game.state === 'in'),
              cards: data.nhl.map((game) => <NhlCard key={game.id} game={game} />),
            },
            {
              title: 'NBA',
              to: boardPath('/nba', date),
              empty: 'No NBA games on this date.',
              count: data.nba.length,
              more: 0,
              live: data.nba.some((game) => game.state === 'in'),
              cards: data.nba.map((game) => <ThreeCard key={game.id} game={game} />),
            },
          ]
            .sort((a, b) => {
              const filled = Number(b.count > 0) - Number(a.count > 0)
              if (filled !== 0) return filled
              return Number(b.live) - Number(a.live)
            })
            .map((section) => (
              <SportSection
                key={section.title}
                title={section.title}
                to={section.to}
                empty={section.empty}
                count={section.count}
                more={section.more}
              >
                {section.cards}
              </SportSection>
            ))}
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
  more,
  children,
}: {
  title: string
  to: string
  empty: string
  count: number
  more: number
  children: ReactNode
}) {
  return (
    <section className="tonight-section">
      <div className="row" style={{ marginBottom: 12 }}>
        <h2 className="section-title" style={{ fontSize: 28 }}>
          {title}
        </h2>
        <Link className="back-link" to={to}>
          {more > 0 ? `Full board → ${more} more` : 'Full board →'}
        </Link>
      </div>
      {count === 0 ? <p className="muted">{empty}</p> : <div className="game-grid">{children}</div>}
    </section>
  )
}
