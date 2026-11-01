import { getEspnJson } from './espn'
import { readPlayerStat, type BoxScore } from './boxScore'

export type GameSnap = {
  eventId: string
  state: 'pre' | 'in' | 'post'
  detail: string
  matchup: string
  score: string
}

type Scoreboard = {
  events?: {
    id?: string
    competitions?: {
      status?: { type?: { state?: string; shortDetail?: string } }
      competitors?: {
        homeAway?: string
        score?: string
        team?: { displayName?: string }
      }[]
    }[]
  }[]
}

type Summary = {
  boxscore?: BoxScore
}

export async function loadGameSnaps(eventIds: string[]): Promise<Record<string, GameSnap>> {
  const board = await getEspnJson<Scoreboard>('/apis/site/v2/sports/football/nfl/scoreboard?dates=20261101')
  const wanted = new Set(eventIds)
  const snaps: Record<string, GameSnap> = {}
  for (const event of board.events ?? []) {
    const id = event.id ?? ''
    if (!wanted.has(id)) continue
    const competition = event.competitions?.[0]
    const status = competition?.status?.type
    const state = status?.state === 'in' || status?.state === 'post' ? status.state : 'pre'
    const home = competition?.competitors?.find((team) => team.homeAway === 'home')
    const away = competition?.competitors?.find((team) => team.homeAway === 'away')
    const awayName = away?.team?.displayName ?? 'Away'
    const homeName = home?.team?.displayName ?? 'Home'
    snaps[id] = {
      eventId: id,
      state,
      detail: status?.shortDetail ?? '',
      matchup: `${awayName} at ${homeName}`,
      score: state === 'pre' ? '' : `${away?.score ?? '0'}–${home?.score ?? '0'}`,
    }
  }
  return snaps
}

export async function loadStats(
  snaps: Record<string, GameSnap>,
  requests: { eventId: string; player: string; statKey: 'receivingYards' | 'passingYards' | 'anytimeTouchdowns' }[],
): Promise<Record<string, number | null>> {
  const liveIds = [...new Set(requests.map((row) => row.eventId))].filter((id) => snaps[id]?.state !== 'pre')
  const boxes = new Map<string, BoxScore | null>()
  await Promise.all(
    liveIds.map(async (id) => {
      try {
        const summary = await getEspnJson<Summary>(`/apis/site/v2/sports/football/nfl/summary?event=${id}`)
        boxes.set(id, summary.boxscore ?? null)
      } catch {
        boxes.set(id, null)
      }
    }),
  )
  const stats: Record<string, number | null> = {}
  for (const row of requests) {
    const key = `${row.eventId}:${row.player}:${row.statKey}`
    if (snaps[row.eventId]?.state === 'pre') {
      stats[key] = null
      continue
    }
    stats[key] = readPlayerStat(boxes.get(row.eventId) ?? null, row.player, row.statKey)
  }
  return stats
}
