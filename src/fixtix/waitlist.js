// The waitlist (process D, rule 6). When a ticket goes up for sale, the first fan in line whose
// request fits gets it exclusively for a limited time (an hour; a minute in demo mode).
// If they don't buy in time, the offer moves on to the next fan in line.

import { getState, update } from '../store/store.js'
import { newId } from '../lib/ids.js'
import { formatDuration, formatTime, plural } from '../lib/format.js'
import { queueMessage } from './messages.js'
import { availableTicketIds, isHoldActive, isOfferActive } from './availability.js'

const ACTIVE = new Set(['waiting', 'offered'])

// Fans still waiting for this event, first come first served.
export function queueFor(s, eventId) {
  return s.fixtix.waitlist
    .filter((w) => w.eventId === eventId && ACTIVE.has(w.status))
    .sort((a, b) => a.joinedAt.localeCompare(b.joinedAt))
}

export function positionOf(s, entry) {
  return queueFor(s, entry.eventId).findIndex((w) => w.id === entry.id) + 1
}

export function entryFor(s, userId, eventId) {
  return s.fixtix.waitlist.find((w) => w.userId === userId && w.eventId === eventId && ACTIVE.has(w.status)) ?? null
}

// Use inside update(). Hands free tickets of a listing to the waitlist, in queue order.
// A fan who needs 2 tickets isn't offered a single one; a set sold "all together" goes only
// to someone who wants exactly that many.
export function allocateOffers(s, listing, now = Date.now()) {
  if (!['live', 'reserved'].includes(listing.status)) return
  let free = availableTicketIds(s, listing, { now })
  if (!free.length) return

  const event = s.events.find((e) => e.id === listing.eventId)
  const minutes = s.settings.waitlistOfferMinutes
  listing.offeredTo = listing.offeredTo ?? []

  for (const entry of queueFor(s, listing.eventId)) {
    if (!free.length) break
    if (entry.status !== 'waiting' || entry.userId === listing.sellerId || listing.offeredTo.includes(entry.userId)) continue
    const fits = listing.splitMode === 'all' ? entry.quantity === free.length : entry.quantity <= free.length
    if (!fits) continue

    const ticketIds = free.slice(0, entry.quantity)
    free = free.slice(entry.quantity)
    const expiresAt = new Date(now + minutes * 60000).toISOString()
    entry.status = 'offered'
    entry.offer = { listingId: listing.id, ticketIds, createdAt: new Date(now).toISOString(), expiresAt, status: 'active' }
    listing.offeredTo.push(entry.userId)

    const what = plural(ticketIds.length, 'ticket')
    queueMessage(s, {
      userId: entry.userId,
      channel: 'email',
      subject: `You're next in line for ${event.name}`,
      body: `A fan just listed ${what} for ${event.name}. ${ticketIds.length === 1 ? "It's" : "They're"} reserved for you until ${formatTime(expiresAt)}. Buy before then, or the offer goes to the next fan in line.`,
      action: { label: 'Buy now', to: `/event/${event.id}` },
    })
    queueMessage(s, {
      userId: entry.userId,
      channel: 'sms',
      body: `FixTix: You're next in line for ${event.name}! ${what} reserved for you until ${formatTime(expiresAt)}. Buy now on FixTix.`,
    })
  }
}

export function joinWaitlist({ userId, eventId, quantity }) {
  let entryId
  update((s) => {
    const existing = entryFor(s, userId, eventId)
    if (existing) {
      existing.quantity = quantity
      entryId = existing.id
      return
    }
    const entry = { id: newId('w'), eventId, userId, quantity, joinedAt: new Date().toISOString(), status: 'waiting', offer: null }
    s.fixtix.waitlist.push(entry)
    entryId = entry.id
    const event = s.events.find((e) => e.id === eventId)
    queueMessage(s, {
      userId,
      channel: 'email',
      subject: `You're on the waitlist for ${event.name}`,
      body: `You're number ${positionOf(s, entry)} in line for ${plural(quantity, 'ticket')}. When a fan sells, the first in line gets the ticket exclusively for ${formatDuration(s.settings.waitlistOfferMinutes)}. We'll email and text you.`,
      action: { label: 'View my waitlist', to: '/waitlist' },
    })
  })
  return entryId
}

export function leaveWaitlist(entryId) {
  update((s) => {
    const entry = s.fixtix.waitlist.find((w) => w.id === entryId)
    if (!entry || !ACTIVE.has(entry.status)) return
    const listingId = entry.offer?.status === 'active' ? entry.offer.listingId : null
    entry.status = 'left'
    if (entry.offer?.status === 'active') entry.offer.status = 'withdrawn'
    const listing = listingId && s.fixtix.listings.find((l) => l.id === listingId)
    if (listing) allocateOffers(s, listing)
  })
}

// Use inside update(): the buyer got their ticket, so they leave the waitlist for this event.
export function fulfillWaitlist(s, userId, eventId) {
  const entry = entryFor(s, userId, eventId)
  if (!entry) return
  entry.status = 'fulfilled'
  if (entry.offer?.status === 'active') entry.offer.status = 'accepted'
}

// Demo shortcut: end an offer now instead of waiting for the timer.
export function endOfferNow(entryId) {
  update((s) => {
    const entry = s.fixtix.waitlist.find((w) => w.id === entryId)
    if (entry?.offer?.status === 'active') entry.offer.expiresAt = new Date(Date.now() - 1000).toISOString()
  })
  expireOffers()
}

// Offers that ran out move to the next fan in line. A fan who is paying right now keeps
// the ticket until their checkout ends (their 10-minute hold protects it).
export function expireOffers() {
  const now = Date.now()
  const due = (s, w) =>
    w.status === 'offered' &&
    w.offer?.status === 'active' &&
    !isOfferActive(w, now) &&
    !s.fixtix.orders.some((o) => o.buyerId === w.userId && o.listingId === w.offer.listingId && (isHoldActive(o, now) || ['paid', 'swapping'].includes(o.status)))

  const state = getState()
  if (!state.fixtix.waitlist.some((w) => due(state, w))) return

  update((s) => {
    s.fixtix.waitlist
      .filter((w) => due(s, w))
      .forEach((w) => {
        w.status = 'waiting'
        w.offer.status = 'expired'
        const listing = s.fixtix.listings.find((l) => l.id === w.offer.listingId)
        const event = s.events.find((e) => e.id === w.eventId)
        queueMessage(s, {
          userId: w.userId,
          channel: 'email',
          subject: `Your offer for ${event.name} expired`,
          body: `You didn't buy in time, so the ticket went to the next fan in line. You're still on the waitlist for the next one.`,
          action: { label: 'View my waitlist', to: '/waitlist' },
        })
        if (listing) allocateOffers(s, listing, now)
      })
  })
}
