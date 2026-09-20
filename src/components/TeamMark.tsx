import { teamLogo } from '../lib/api'
import { teamAbbr, teamShort } from '../lib/format'
import type { Named } from '../lib/types'

type Props = {
  team: Named
  record?: string
  compact?: boolean
}

export function TeamMark({ team, record, compact }: Props) {
  return (
    <div className="team-mark">
      <img src={teamLogo(team.id)} alt="" width={36} height={36} />
      <div>
        <div className="team-name">{compact ? teamAbbr(team) : teamShort(team)}</div>
        {record ? <div className="team-record">{record}</div> : null}
      </div>
    </div>
  )
}
