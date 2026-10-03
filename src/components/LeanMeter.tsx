import { teamAbbr } from '../lib/format'
import {
  formatAmerican,
  formatLean,
  noVig,
} from '../lib/lean'
import type { Named, PublicLine } from '../lib/types'

type Props = {
  away: Named
  home: Named
  awayPct: number
  homePct: number
  notes?: string[]
  line?: PublicLine
}

export function LeanMeter({ away, home, awayPct, homePct, notes = [], line }: Props) {
  const favorite = homePct >= awayPct ? home : away
  const favoritePct = Math.max(homePct, awayPct)
  const market = line ? noVig(line.awayOdds, line.homeOdds) : null
  const edge = market
    ? (homePct >= awayPct ? homePct - market.home : awayPct - market.away)
    : null

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

      {line && market ? (
        <>
          <div className="row" style={{ marginTop: 10 }}>
            <span className="meta">{line.provider} number</span>
            <span className="meta">
              {line.details} · {formatAmerican(line.awayOdds)} / {formatAmerican(line.homeOdds)}
            </span>
          </div>
          <div className="lean-track market" aria-hidden="true">
            <i className="away" style={{ width: `${market.away * 100}%` }} />
            <i className="home" style={{ width: `${market.home * 100}%` }} />
          </div>
          <p className="meta" style={{ marginTop: 8 }}>
            {teamAbbr(favorite)} no-vig {formatLean(homePct >= awayPct ? market.home : market.away)}
            {edge != null ? (
              <>
                {' · '}
                <span className={Math.abs(edge) < 0.015 ? '' : edge > 0 ? 'edge-pos' : 'edge-neg'}>
                  {Math.abs(edge) < 0.015
                    ? 'in line with the number'
                    : `${edge > 0 ? '+' : ''}${Math.round(edge * 100)} vs the number`}
                </span>
              </>
            ) : null}
            {line.overUnder != null ? ` · tot ${line.overUnder}` : ''}
          </p>
        </>
      ) : (
        <p className="meta" style={{ marginTop: 8 }}>
          Public number not posted yet
        </p>
      )}

      {notes.length > 0 ? (
        <p className="muted" style={{ marginTop: 8, fontSize: 13 }}>
          {notes.join(' · ')}
        </p>
      ) : null}
    </div>
  )
}
