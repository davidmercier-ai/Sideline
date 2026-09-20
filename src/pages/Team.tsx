import { Link, useParams } from 'react-router-dom'
import { GameCard } from '../components/GameCard'
import { TeamMark } from '../components/TeamMark'
import { fetchRoster, fetchTeam, fetchTeamSchedule } from '../lib/api'
import { isFinal, seasonFromDate, sortGames, todayET } from '../lib/format'
import type { RosterPlayer, ScheduleGame } from '../lib/types'
import { usePoll } from '../lib/usePoll'
import { readWatched, toggleWatched, writeWatched } from '../lib/watch'
import { useState } from 'react'

export function TeamPage() {
  const { teamId } = useParams()
  const id = Number(teamId)
  const season = seasonFromDate(todayET())
  const [watched, setWatched] = useState(readWatched)

  const { data, error, loading } = usePoll(
    async () => {
      const [team, roster, games] = await Promise.all([
        fetchTeam(id),
        fetchRoster(id),
        fetchTeamSchedule(id, season),
      ])
      return { team, roster, games }
    },
    `${id}-${season}`,
    0,
  )

  if (!Number.isFinite(id)) return <p className="error">Missing team.</p>
  if (loading && !data) return <p className="loading">Pulling the media guide…</p>
  if (error) return <p className="error">{error}</p>
  if (!data) return null

  const upcoming = sortGames(
    data.games.filter((game) => !isFinal(game.status)),
  ).slice(0, 6)
  const recent = [...data.games].filter((game) => isFinal(game.status)).slice(-6).reverse()
  const groups = groupRoster(data.roster)

  function onWatch(gamePk: number) {
    const next = toggleWatched(watched, gamePk)
    setWatched(next)
    writeWatched(next)
  }

  return (
    <main>
      <p style={{ marginTop: 20 }}>
        <Link className="back-link" to="/standings">
          ← Standings
        </Link>
      </p>
      <section className="page-hero">
        <div>
          <p className="meta">
            {data.team.league?.name} · {data.team.division?.name}
          </p>
          <h1>{data.team.name}</h1>
          <p className="lede">
            {data.team.venue?.name}
            {data.team.firstYearOfPlay ? ` · Est. ${data.team.firstYearOfPlay}` : ''}
          </p>
        </div>
        <TeamMark team={data.team} />
      </section>

      <section>
        <h2 className="section-title" style={{ fontSize: 30, marginBottom: 12 }}>
          Next up
        </h2>
        <div className="game-grid">
          {upcoming.map((game) => (
            <GameCard
              key={game.gamePk}
              game={game}
              watched={watched.includes(game.gamePk)}
              onWatch={onWatch}
            />
          ))}
        </div>
        {upcoming.length === 0 ? <p className="muted">No upcoming games on the slate.</p> : null}
      </section>

      <section style={{ marginTop: 28 }}>
        <h2 className="section-title" style={{ fontSize: 30, marginBottom: 12 }}>
          Recent
        </h2>
        <div className="game-grid">
          {recent.map((game: ScheduleGame) => (
            <GameCard
              key={game.gamePk}
              game={game}
              watched={watched.includes(game.gamePk)}
              onWatch={onWatch}
            />
          ))}
        </div>
      </section>

      <section style={{ marginTop: 28 }}>
        <h2 className="section-title" style={{ fontSize: 30, marginBottom: 12 }}>
          Active roster
        </h2>
        {Object.entries(groups).map(([type, players]) => (
          <div key={type} style={{ marginBottom: 18 }}>
            <p className="meta" style={{ marginBottom: 8 }}>
              {type}
            </p>
            <div className="roster-grid">
              {players.map((player) => (
                <article key={player.person.id} className="roster-card">
                  <div className="row">
                    <strong>{player.person.fullName}</strong>
                    <span className="meta">{player.position?.abbreviation}</span>
                  </div>
                  <p className="muted">#{player.jerseyNumber || '—'}</p>
                </article>
              ))}
            </div>
          </div>
        ))}
      </section>
    </main>
  )
}

function groupRoster(roster: RosterPlayer[]): Record<string, RosterPlayer[]> {
  const order = ['Pitcher', 'Catcher', 'Infielder', 'Outfielder', 'Two-Way Player']
  const grouped: Record<string, RosterPlayer[]> = {}
  for (const player of roster) {
    const key = player.position?.type || 'Other'
    grouped[key] ??= []
    grouped[key].push(player)
  }
  return Object.fromEntries(
    [...order.filter((key) => grouped[key]), ...Object.keys(grouped).filter((key) => !order.includes(key))]
      .map((key) => [key, grouped[key]]),
  )
}
