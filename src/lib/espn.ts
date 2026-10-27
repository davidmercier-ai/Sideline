import { dateInET } from './format'

export async function getEspnJson<T>(path: string): Promise<T> {
  const response = await fetch(`/espn${path}`)
  if (!response.ok) throw new Error(`ESPN request failed (${response.status})`)
  const text = await response.text()
  if (!text.trim()) return {} as T
  return JSON.parse(text) as T
}

export async function fetchEspnScoreboard<T extends { date?: string }>(
  path: string,
  date: string,
): Promise<T[]> {
  const compact = date.replaceAll('-', '')
  const dated = await getEspnJson<{ events?: T[] }>(`${path}?dates=${compact}`)
  if (dated.events?.length) return dated.events
  const fallback = await getEspnJson<{ events?: T[] }>(path)
  return (fallback.events ?? []).filter((event) => event.date && dateInET(event.date) === date)
}
