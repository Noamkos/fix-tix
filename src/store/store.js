// The demo's single source of truth.
//
// - State lives in memory and is saved to localStorage, so a page refresh keeps the demo where it was.
// - Every change is broadcast to other open tabs (BroadcastChannel), so FixTix in one tab and
//   DemoTix in another update together.
// - resetDemo() rebuilds everything from the seed file.
//
// FixTix data lives under state.fixtix, the ticketing company's data under state.demotix,
// so it's always clear which side owns what. state.events is the shared event catalog.

import { createSeedState, DATA_VERSION } from '../data/seed.js'

const STORAGE_KEY = 'fixtix-demo-state'
const CHANNEL_NAME = 'fixtix-demo'

const listeners = new Set()
const channel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel(CHANNEL_NAME) : null

let state = loadState() ?? persist(createSeedState())

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const saved = JSON.parse(raw)
    return saved?.version === DATA_VERSION ? saved : null
  } catch {
    return null
  }
}

function persist(next) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  } catch {
    // Private mode or storage full: the demo still works, it just won't survive a refresh.
  }
  return next
}

function emit() {
  listeners.forEach((listener) => listener())
}

function commit(next) {
  state = persist(next)
  channel?.postMessage({ type: 'state', state })
  emit()
}

export function getState() {
  return state
}

export function subscribe(listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

// Apply a change. `recipe` receives a copy of the state and edits it directly:
//   update((s) => { s.settings.serviceFeePct = 12 })
export function update(recipe) {
  const draft = structuredClone(state)
  recipe(draft)
  commit(draft)
}

export function resetDemo() {
  commit(createSeedState())
}

// Another tab changed something: take its state as-is (no re-broadcast, to avoid loops).
channel?.addEventListener('message', (event) => {
  if (event.data?.type === 'state' && event.data.state?.version === DATA_VERSION) {
    state = event.data.state
    emit()
  }
})
