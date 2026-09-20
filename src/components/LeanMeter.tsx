import { formatLean } from '../lib/lean'
import { teamAbbr } from '../lib/format'
import type { Named } from '../lib/types'

type Props = {
  away: Named
  home: Named
  awayPct: number
  homePct: number
}

export function LeanMeter({ away, home, awayPct, homePct }: Props) {
  const favorite = homePct >= awayPct ? home : away
  const favoritePct = Math.max(homePct, awayPct)
  return (
    <div>
      <div className="row">
        <span className="meta">Sideline lean</span>
        <span className="meta">
          {teamAbbr(favorite)} {formatLean(favoritePct)}
        </span>
      </div>
      <div className="lean-track" aria-hidden="true">
        <i className="away" style={{ width: `${awayPct * 100}%` }} />
        <i className="home" style={{ width: `${homePct * 100}%` }} />
      </div>
    </div>
  )
}
