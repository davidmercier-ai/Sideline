import { teamAbbr } from '../lib/format'
import type { Linescore, Named } from '../lib/types'

type Props = {
  linescore?: Linescore
  away: Named
  home: Named
}

export function LinescoreTable({ linescore, away, home }: Props) {
  const innings = linescore?.innings ?? []
  const scheduled = linescore?.scheduledInnings ?? 9
  const cols = Math.max(scheduled, innings.length, 9)
  const headers = Array.from({ length: cols }, (_, i) => i + 1)

  return (
    <div style={{ overflowX: 'auto' }}>
      <table className="linescore">
        <thead>
          <tr>
            <th></th>
            {headers.map((n) => (
              <th key={n}>{n}</th>
            ))}
            <th>R</th>
            <th>H</th>
            <th>E</th>
          </tr>
        </thead>
        <tbody>
          <ScoreRow side="away" team={away} linescore={linescore} headers={headers} />
          <ScoreRow side="home" team={home} linescore={linescore} headers={headers} />
        </tbody>
      </table>
    </div>
  )
}

function ScoreRow({
  side,
  team,
  linescore,
  headers,
}: {
  side: 'away' | 'home'
  team: Named
  linescore?: Linescore
  headers: number[]
}) {
  const totals = linescore?.teams?.[side]
  return (
    <tr>
      <td>{teamAbbr(team)}</td>
      {headers.map((n) => {
        const cell = linescore?.innings?.find((inning) => inning.num === n)?.[side]?.runs
        return <td key={`${side}-${n}`}>{cell == null ? '·' : cell}</td>
      })}
      <td>{totals?.runs ?? '·'}</td>
      <td>{totals?.hits ?? '·'}</td>
      <td>{totals?.errors ?? '·'}</td>
    </tr>
  )
}
