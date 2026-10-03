export async function getEspnJson<T>(path: string): Promise<T> {
  const response = await fetch(`/espn${path}`)
  if (!response.ok) throw new Error(`ESPN request failed (${response.status})`)
  return response.json() as Promise<T>
}
