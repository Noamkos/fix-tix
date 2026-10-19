// Showing an event page asks DemoTix for the official event details (API action "Get event").
// Asked at most once a minute per event, so the API log stays readable during a demo.
import { useEffect, useState } from 'react'
import { getState } from '../store/store.js'
import { callDemoTix } from '../demotix/api.js'

const recent = new Map()

function checkEvent(eventId) {
  // Keyed by demo run, so a fresh check happens right after "Reset demo".
  const key = `${getState().seededAt}:${eventId}`
  const hit = recent.get(key)
  if (hit && Date.now() - hit.at < 60000) return hit.promise
  const promise = callDemoTix('get_event', { eventId })
  recent.set(key, { at: Date.now(), promise })
  return promise
}

// null while asking, then DemoTix's answer.
export function useEventCheck(eventId) {
  const [answer, setAnswer] = useState(null)
  useEffect(() => {
    let alive = true
    setAnswer(null)
    checkEvent(eventId).then((res) => alive && setAnswer(res))
    return () => {
      alive = false
    }
  }, [eventId])
  return answer
}
