import type { StatKey, TicketSide } from './tickets'

type AthleteRow = {
  athlete?: { displayName?: string }
  stats?: string[]
}

type StatGroup = {
  name?: string
  keys?: string[]
  athletes?: AthleteRow[]
}

type BoxTeam = {
  statistics?: StatGroup[]
}

export type BoxScore = {
  players?: BoxTeam[]
}

const GROUP_FOR: Record<Exclude<StatKey, 'anytimeTouchdowns'>, string> = {
  receivingYards: 'receiving',
  passingYards: 'passing',
}

export function samePlayer(ticketName: string, displayName: string): boolean {
  const wanted = ticketName.trim().toLowerCase()
  const shown = displayName.trim().toLowerCase()
  return shown === wanted || shown.startsWith(`${wanted} `)
}

function statValue(group: StatGroup, displayName: string, key: string): number | null {
  const index = (group.keys ?? []).indexOf(key)
  if (index < 0) return null
  for (const row of group.athletes ?? []) {
    const name = row.athlete?.displayName ?? ''
    if (!samePlayer(displayName, name) && !samePlayer(name, displayName)) continue
    const raw = row.stats?.[index]
    const value = Number(raw)
    return Number.isFinite(value) ? value : null
  }
  return null
}

function groupNamed(box: BoxScore, name: string): StatGroup[] {
  return (box.players ?? []).flatMap((team) => (team.statistics ?? []).filter((group) => group.name === name))
}

/** Yards, or touchdowns for an anytime ticket. Null before the box exists. */
export function readPlayerStat(box: BoxScore | null, player: string, key: StatKey): number | null {
  if (!box) return null
  if (key === 'anytimeTouchdowns') {
    let total = 0
    const pairs: [string, string][] = [
      ['rushing', 'rushingTouchdowns'],
      ['receiving', 'receivingTouchdowns'],
    ]
    for (const [groupName, statKey] of pairs) {
      for (const group of groupNamed(box, groupName)) {
        const value = statValue(group, player, statKey)
        if (value != null) total += value
      }
    }
    return total
  }
  const groups = groupNamed(box, GROUP_FOR[key])
  if (groups.length === 0) return 0
  const values = groups.map((group) => statValue(group, player, key)).filter((value): value is number => value != null)
  if (values.length === 0) return 0
  return Math.max(...values)
}

export function progressLine(side: TicketSide, line: number | null, stat: number | null, book: string): string {
  if (stat == null) return `${book} is waiting on the first stat.`
  if (side === 'anytime') return stat > 0 ? `${book} has a touchdown.` : `${book} has no touchdown yet.`
  if (line == null) return `${book} has ${stat}.`
  if (side === 'over') {
    if (stat > line) return `${book} over ${line} has cleared at ${stat}.`
    if (stat === line) return `${book} over ${line} is on the number at ${stat}.`
    return `${book} over ${line} has ${stat}.`
  }
  if (stat < line) return `${book} under ${line} still holds at ${stat}.`
  if (stat === line) return `${book} under ${line} is on the number at ${stat}.`
  return `${book} under ${line} is gone at ${stat}.`
}
