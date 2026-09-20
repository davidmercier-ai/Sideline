import { basesOn } from '../lib/format'
import type { Linescore } from '../lib/types'

type Props = {
  linescore?: Linescore
}

export function Diamond({ linescore }: Props) {
  const bases = basesOn(linescore)
  return (
    <div className="diamond-wrap">
      <svg className="diamond" viewBox="0 0 100 100" aria-hidden="true">
        <polygon
          points="50,16 84,50 50,84 16,50"
          fill="rgba(230,195,106,0.06)"
          stroke="rgba(239,232,214,0.28)"
          strokeWidth="1.5"
        />
        <Base x={78} y={50} on={bases.first} />
        <Base x={50} y={22} on={bases.second} />
        <Base x={22} y={50} on={bases.third} />
        <polygon points="50,78 56,84 50,90 44,84" fill="#efe8d6" />
      </svg>
      <div className="count-board">
        <Count label="Balls" value={linescore?.balls ?? 0} max={3} />
        <Count label="Strikes" value={linescore?.strikes ?? 0} max={2} />
        <Count label="Outs" value={linescore?.outs ?? 0} max={3} />
      </div>
    </div>
  )
}

function Base({ x, y, on }: { x: number; y: number; on: boolean }) {
  return (
    <rect
      x={x - 6}
      y={y - 6}
      width="12"
      height="12"
      transform={`rotate(45 ${x} ${y})`}
      fill={on ? '#e6c36a' : 'transparent'}
      stroke={on ? '#e6c36a' : 'rgba(239,232,214,0.55)'}
      strokeWidth="1.8"
    />
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
