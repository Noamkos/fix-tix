// Putting tickets up for sale and taking them down (processes A and F in the spec).
import { getState, update } from '../store/store.js'
import { callDemoTix } from '../demotix/api.js'
import { newId } from '../lib/ids.js'
import { formatMoney, plural } from '../lib/format.js'
import { queueMessage } from './messages.js'
import { blockedTicketIds } from './availability.js'
import { allocateOffers } from './waitlist.js'

// Steps 7-8 of process A: DemoTix locks the tickets first, and only then the listing goes live.
export async function publishListing({ sellerId, eventId, ticketIds, priceCents, splitMode }) {
  const listingId = newId('l')
  const res = await callDemoTix('lock', { ticketIds, listingId })
  if (!res.ok) return res

  update((s) => {
    const event = s.events.find((e) => e.id === eventId)
    s.fixtix.listings.push({
      id: listingId,
      sellerId,
      eventId,
      ticketIds,
      priceCents,
      splitMode: ticketIds.length > 1 ? splitMode : 'any',
      soldTicketIds: [],
      offeredTo: [],
      status: 'live',
      createdAt: new Date().toISOString(),
    })
    queueMessage(s, {
      userId: sellerId,
      channel: 'email',
      subject: 'Your ticket is live on FixTix',
      body: `${plural(ticketIds.length, 'ticket')} for ${event?.name} ${ticketIds.length === 1 ? 'is' : 'are'} now for sale at ${formatMoney(priceCents)} each. DemoTix has locked ${ticketIds.length === 1 ? 'it' : 'them'}, so ${ticketIds.length === 1 ? 'it' : 'they'} can't be sold anywhere else.`,
      action: { label: 'View my listings', to: '/my-listings' },
    })
    allocateOffers(s, s.fixtix.listings.at(-1))
  })
  return { ok: true, listingId }
}

// Process F: the seller cancels before anyone buys (rule 4); DemoTix releases the lock.
// Tickets already sold stay sold; only the unsold ones are unlocked.
export async function cancelListing(listingId) {
  const state = getState()
  const listing = state.fixtix.listings.find((l) => l.id === listingId)
  if (!listing || listing.status !== 'live') {
    return { ok: false, message: 'This listing can no longer be cancelled.' }
  }
  if (blockedTicketIds(state, listingId).length) {
    return { ok: false, message: 'A fan is paying for this ticket right now. You can cancel if the reservation runs out.' }
  }

  const unsold = listing.ticketIds.filter((id) => !listing.soldTicketIds.includes(id))
  const res = await callDemoTix('unlock', { ticketIds: unsold, reason: 'listing cancelled by the seller' })
  if (!res.ok) return res

  update((s) => {
    const l = s.fixtix.listings.find((x) => x.id === listingId)
    l.status = 'cancelled'
    l.cancelledAt = new Date().toISOString()
  })
  return { ok: true }
}
