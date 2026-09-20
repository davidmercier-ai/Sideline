import { useCallback, useEffect, useRef, useState } from 'react'

export function usePoll<T>(
  loader: () => Promise<T>,
  key: string,
  intervalMs: number,
): { data: T | null; error: string | null; loading: boolean } {
  const loaderRef = useRef(loader)
  const [cacheKey, setCacheKey] = useState(key)
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    loaderRef.current = loader
  })

  if (cacheKey !== key) {
    setCacheKey(key)
    setData(null)
    setError(null)
    setTick(0)
  }

  const loading = data == null && error == null
  const reload = useCallback(() => setTick((n) => n + 1), [])

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const result = await loaderRef.current()
        if (cancelled) return
        setData(result)
        setError(null)
      } catch (err: unknown) {
        if (cancelled) return
        setError(err instanceof Error ? err.message : 'Something went wrong')
      }
    })()
    return () => {
      cancelled = true
    }
  }, [key, tick])

  useEffect(() => {
    if (intervalMs <= 0) return
    const id = window.setInterval(reload, intervalMs)
    return () => window.clearInterval(id)
  }, [intervalMs, reload])

  return { data, error, loading }
}
