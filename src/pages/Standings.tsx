import { Link } from 'react-router-dom'
import { TeamMark } from '../components/TeamMark'
import { fetchStandings } from '../lib/api'
import { seasonFromDate, todayET } from '../lib/format'
import type { StandingRecord } from '../lib/types'
import { usePoll } from '../lib/usePoll'

export function StandingsPage() {
  const season = seasonFromDate(todayET())
  const { data, error, loading } = usePoll(() => fetchStandings(season), String(season), 0)

  const groups = [...(data?.records ?? [])].sort(
    (a, b) => divisionOrder(a.division.id) - divisionOrder(b.division.id),
  )

  return (
    <main>
      <section className="page-hero">
        <div>
          <p className="meta">{season} regular season</p>
          <h1>Standings</h1>
          <p className="lede">
            Division picture, games back, and run differential — the table the
            lean reads before first pitch.
          </p>
        </div>
      </section>

      {loading && !data ? <p className="loading">Checking the clubhouse board…</p> : null}
      {error ? <p className="error">{error}</p> : null}

      <div className="layout-2">
        {groups.map((group) => (
          <DivisionTable key={group.division.id} group={group} />
        ))}
      </div>
    </main>
  )
}

function DivisionTable({ group }: { group: StandingRecord }) {
  return (
    <section className="panel">
      <h2 className="section-title" style={{ fontSize: 26, marginBottom: 8 }}>
        {group.division.nameShort || group.division.name}
      </h2>
      <p className="meta" style={{ marginBottom: 10 }}>
        {group.league.name}
      </p>
      <table className="standings-table">
        <thead>
          <tr>
            <th>Team</th>
            <th className="num">W</th>
            <th className="num">L</th>
            <th className="num">GB</th>
            <th className="num">RD</th>
          </tr>
        </thead>
        <tbody>
          {group.teamRecords.map((row) => (
            <tr key={row.team.id}>
              <td>
                <Link to={`/team/${row.team.id}`}>
                  <TeamMark
                    team={row.team}
                    record={row.clinchIndicator ? row.clinchIndicator : row.streak?.streakCode}
                    compact
                  />
                </Link>
              </td>
              <td className="num">{row.wins}</td>
              <td className="num">{row.losses}</td>
              <td className="num">{row.gamesBack}</td>
              <td className="num">
                {row.runDifferential == null
                  ? '—'
                  : row.runDifferential > 0
                    ? `+${row.runDifferential}`
                    : row.runDifferential}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}

function divisionOrder(id: number): number {
  const order = [201, 202, 200, 204, 205, 203]
  const index = order.indexOf(id)
  return index === -1 ? 99 : index
}
