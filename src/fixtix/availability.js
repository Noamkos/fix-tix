// Which listed tickets can a fan buy right now?
// A ticket is off the market once it's sold, while another fan holds it at checkout (rule 7),
// or while it's offered exclusively to someone on the waitlist (rule 6).

const OPEN = new Set(['live', 'reserved'])

export function isHoldActive(order, now = Date.now()) {
  return order.status === 'held' && new Date(order.holdUntil).getTime() > now
}

export function isOfferActive(entry, now = Date.now()) {
  return entry.status === 'offered' && entry.offer?.status === 'active' && new Date(entry.offer.expiresAt).getTime() > now
}

// Tickets of this listing that are held or already in a paid order going through the swap.
export function blockedTicketIds(s, listingId, now = Date.now()) {
  return s.fixtix.orders
    .filter((o) => o.listingId === listingId && (isHoldActive(o, now) || o.status === 'paid' || o.status === 'swapping'))
    .flatMap((o) => o.ticketIds)
}

// Exclusive waitlist offers on this listing: [{ userId, ticketIds, expiresAt }].
export function activeOffers(s, listingId, now = Date.now()) {
  return s.fixtix.waitlist
    .filter((w) => w.offer?.listingId === listingId && isOfferActive(w, now))
    .map((w) => ({ userId: w.userId, ticketIds: w.offer.ticketIds, expiresAt: w.offer.expiresAt }))
}

// Tickets `viewerId` may buy right now. Tickets offered to someone else are hidden;
// tickets offered to the viewer are theirs to buy. `ignoreOffers` looks past offers entirely.
export function availableTicketIds(s, listing, { now = Date.now(), viewerId = null, ignoreOffers = false } = {}) {
  if (!OPEN.has(listing.status)) return []
  const sold = new Set(listing.soldTicketIds ?? [])
  const blocked = new Set(blockedTicketIds(s, listing.id, now))
  const offeredToOthers = new Set(
    ignoreOffers
      ? []
      : activeOffers(s, listing.id, now)
          .filter((o) => o.userId !== viewerId)
          .flatMap((o) => o.ticketIds),
  )
  return listing.ticketIds.filter((id) => !sold.has(id) && !blocked.has(id) && !offeredToOthers.has(id))
}

// Keep a listing's status in line with its tickets: Live, Reserved (all held at checkout) or Sold.
export function syncListingStatus(s, listing, now = Date.now()) {
  if (listing.status === 'cancelled') return
  const soldCount = (listing.soldTicketIds ?? []).length
  if (soldCount === listing.ticketIds.length) {
    listing.status = 'sold'
    return
  }
  const free = availableTicketIds(s, { ...listing, status: 'live' }, { now, ignoreOffers: true })
  listing.status = free.length ? 'live' : 'reserved'
}
