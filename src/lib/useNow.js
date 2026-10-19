import { useEffect, useState } from 'react'

// Re-render every few seconds, so "2 min ago" labels stay correct.
export function useNow(intervalMs = 15000) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs)
    return () => clearInterval(id)
  }, [intervalMs])
  return now
}

// True for a few seconds after `iso`: used to make a just-changed row light up.
export function isFresh(iso, ms = 4000) {
  return Date.now() - new Date(iso).getTime() < ms
}
