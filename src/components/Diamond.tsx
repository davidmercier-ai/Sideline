import { basesOn } from '../lib/format'
import type { Linescore } from '../lib/types'

type Props = {
  linescore?: Linescore
}

export function Diamond({ linescore }: Props) {
  const bases = basesOn(linescore)
  return (
    <div className="diamond-wrap">
      <div className="diamond" aria-hidden="true">
        <span className={`base first ${bases.first ? 'on' : ''}`} />
        <span className={`base second ${bases.second ? 'on' : ''}`} />
        <span className={`base third ${bases.third ? 'on' : ''}`} />
        <span className="base home-plate" />
      </div>
      <div className="count-board">
        <Count label="Balls" value={linescore?.balls ?? 0} max={3} />
        <Count label="Strikes" value={linescore?.strikes ?? 0} max={2} />
        <Count label="Outs" value={linescore?.outs ?? 0} max={3} />
      </div>
    </div>
  )
}

function Count({ label, value, max }: { label: string; value: number; max: number }) {
  const shown = Array.from({ length: max }, (_, index) => index < value)
  return (
    <div className="count-col">
      <span className="meta">{label}</span>
      <div className="dot-row">
        {shown.map((on, index) => (
          <span key={`${label}-${index}`} className={`dot ${on ? 'on' : ''}`} />
        ))}
      </div>
    </div>
  )
}
