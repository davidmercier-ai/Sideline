const KEY = 'sideline.watched'

export function readWatched(): number[] {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    return Array.isArray(parsed) ? parsed.filter((n) => typeof n === 'number') : []
  } catch {
    return []
  }
}

export function writeWatched(ids: number[]): void {
  localStorage.setItem(KEY, JSON.stringify(ids))
}

export function toggleWatched(ids: number[], gamePk: number): number[] {
  return ids.includes(gamePk) ? ids.filter((id) => id !== gamePk) : [...ids, gamePk]
}
