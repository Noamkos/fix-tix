import { useRef, useSyncExternalStore } from 'react'
import { getState, subscribe } from './store.js'

const identity = (s) => s

// Read from the demo state and re-render when it changes.
//   const events = useStore((s) => s.events)
// Derived values (filters, sums) are cached per state version, so selectors may build new arrays.
export function useStore(selector = identity) {
  const cache = useRef({ state: undefined, selector: undefined, value: undefined })

  const getSnapshot = () => {
    const current = getState()
    const c = cache.current
    if (c.state !== current || c.selector !== selector) {
      cache.current = { state: current, selector, value: selector(current) }
    }
    return cache.current.value
  }

  return useSyncExternalStore(subscribe, getSnapshot)
}
