// Read-only helpers that answer questions about the state.
import { buyerTotal } from './pricing.js'
import { availableTicketIds } from '../fixtix/availability.js'

export function getEvent(state, eventId) {
  return state.events.find((e) => e.id === eventId) ?? null
}

// Resale availability for one event, as a fan sees it on FixTix.
// Tickets held by a fan at checkout don't count as available (rule 7).
export function getEventSummary(state, eventId) {
  const listings = state.fixtix.listings.filter((l) => l.eventId === eventId)
  const viewerId = state.session.userId
  const open = listings.map((l) => ({ l, free: availableTicketIds(state, l, { viewerId }) })).filter((x) => x.free.length)
  const available = open.reduce((sum, x) => sum + x.free.length, 0)
  const fromCents = open.length ? Math.min(...open.map((x) => buyerTotal(x.l.priceCents, state.settings))) : null
  const sold = listings.reduce((sum, l) => sum + (l.soldTicketIds?.length ?? 0), 0)
  const waiting = state.fixtix.waitlist.filter((w) => w.eventId === eventId && ['waiting', 'offered'].includes(w.status))
  return {
    available,
    listings: open.length,
    sold,
    fromCents,
    waitlistPeople: waiting.length,
    waitlistTickets: waiting.reduce((sum, w) => sum + w.quantity, 0),
  }
}

export function getUpcomingEvents(state) {
  return state.events
    .filter((e) => e.status !== 'cancelled')
    .slice()
    .sort((a, b) => new Date(a.startsAt) - new Date(b.startsAt))
}

export function getCurrentUser(state) {
  return state.fixtix.users.find((u) => u.id === state.session.userId) ?? null
}
