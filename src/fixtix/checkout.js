// Buying (process B): hold the tickets for 10 minutes, take a (mock) payment, then hand over to the swap.
import { getState, update } from '../store/store.js'
import { newId } from '../lib/ids.js'
import { priceBreakdown } from '../lib/pricing.js'
import { availableTicketIds, isHoldActive, syncListingStatus } from './availability.js'
import { allocateOffers } from './waitlist.js'

const fail = (error, message) => ({ ok: false, error, message })

// Reserve tickets for one buyer (rule 7). Calling it again for the same buyer and listing
// returns the existing hold instead of creating a second one.
export function holdTickets({ buyerId, listingId, quantity }) {
  let result
  update((s) => {
    const now = Date.now()
    const listing = s.fixtix.listings.find((l) => l.id === listingId)
    if (!listing || !['live', 'reserved'].includes(listing.status)) {
      result = fail('NOT_AVAILABLE', 'This listing is no longer for sale.')
      return
    }
    if (listing.sellerId === buyerId) {
      result = fail('OWN_LISTING', "This is your own listing, so you can't buy it.")
      return
    }

    const existing = s.fixtix.orders.find((o) => o.buyerId === buyerId && o.listingId === listingId && isHoldActive(o, now))
    if (existing) {
      result = { ok: true, orderId: existing.id }
      return
    }

    const free = availableTicketIds(s, listing, { now, viewerId: buyerId })
    const qty = listing.splitMode === 'all' ? free.length : Number(quantity) || 1
    if (!free.length || qty > free.length || (listing.splitMode === 'all' && free.length < listing.ticketIds.length - listing.soldTicketIds.length)) {
      result = fail('TAKEN', 'Another fan is buying this ticket right now. Try again in a few minutes, or join the waitlist.')
      return
    }

    const b = priceBreakdown(listing.priceCents, s.settings)
    const order = {
      id: newId('o'),
      buyerId,
      sellerId: listing.sellerId,
      listingId,
      eventId: listing.eventId,
      ticketIds: free.slice(0, qty),
      unitCents: listing.priceCents,
      ticketCents: b.ticket * qty,
      feeCents: b.fee * qty,
      totalCents: b.total * qty,
      fixtixCents: b.fixtix * qty,
      partnerCents: b.partner * qty,
      status: 'held',
      holdUntil: new Date(now + s.settings.checkoutHoldMinutes * 60000).toISOString(),
      createdAt: new Date(now).toISOString(),
      paidAt: null,
      completedAt: null,
      refundedAt: null,
      newTicketIds: [],
      demoFailReissue: false,
    }
    s.fixtix.orders.push(order)
    syncListingStatus(s, listing, now)
    result = { ok: true, orderId: order.id }
  })
  return result
}

function endHold(orderId, status) {
  update((s) => {
    const order = s.fixtix.orders.find((o) => o.id === orderId)
    if (!order || order.status !== 'held') return
    order.status = status
    const listing = s.fixtix.listings.find((l) => l.id === order.listingId)
    if (listing) {
      syncListingStatus(s, listing)
      allocateOffers(s, listing)
    }
  })
}

// The buyer walks away from checkout: tickets go straight back on sale.
export const releaseHold = (orderId) => endHold(orderId, 'released')

// Mock payment. `failReissue` is a demo switch that makes DemoTix fail the swap (rule 10).
export function payOrder(orderId, { failReissue = false } = {}) {
  const order = getState().fixtix.orders.find((o) => o.id === orderId)
  if (!order || !isHoldActive(order)) return fail('HOLD_EXPIRED', 'Your reservation has expired.')
  update((s) => {
    const o = s.fixtix.orders.find((x) => x.id === orderId)
    o.status = 'paid'
    o.paidAt = new Date().toISOString()
    o.demoFailReissue = failReissue
  })
  return { ok: true }
}

// Holds that ran out of time free their tickets. Every open tab checks every few seconds.
export function expireHolds() {
  const now = Date.now()
  const overdue = getState().fixtix.orders.some((o) => o.status === 'held' && new Date(o.holdUntil).getTime() <= now)
  if (!overdue) return
  update((s) => {
    s.fixtix.orders
      .filter((o) => o.status === 'held' && new Date(o.holdUntil).getTime() <= now)
      .forEach((o) => {
        o.status = 'expired'
        const listing = s.fixtix.listings.find((l) => l.id === o.listingId)
        if (listing) {
          syncListingStatus(s, listing, now)
          allocateOffers(s, listing, now)
        }
      })
  })
}

