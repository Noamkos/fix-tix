// What FixTix does when DemoTix notifies it (API action 6, "Notify FixTix").
import { getState, update } from '../store/store.js'
import { callDemoTix } from '../demotix/api.js'
import { queueMessage } from './messages.js'
import { isHoldActive } from './availability.js'

// A ticket was scanned at the gate. If it was still listed on FixTix, the seller used it
// themselves: take the listing down so nobody can buy a ticket that's already been used,
// and give the other tickets in that listing back to the seller.
export async function onTicketScanned(ticketId) {
  const state = getState()
  const listing = state.fixtix.listings.find(
    (l) => ['live', 'reserved'].includes(l.status) && l.ticketIds.includes(ticketId) && !l.soldTicketIds.includes(ticketId),
  )
  if (!listing) return

  const others = listing.ticketIds.filter((id) => id !== ticketId && !listing.soldTicketIds.includes(id))
  if (others.length) await callDemoTix('unlock', { ticketIds: others, reason: `ticket ${ticketId} from the same listing was used at the gate` })

  update((s) => {
    const l = s.fixtix.listings.find((x) => x.id === listing.id)
    l.status = 'cancelled'
    l.cancelledAt = new Date().toISOString()
    l.cancelReason = `Ticket ${ticketId} was used at the gate`
    // Anyone in the middle of paying for it loses the reservation (they haven't paid yet).
    s.fixtix.orders.filter((o) => o.listingId === l.id && isHoldActive(o)).forEach((o) => (o.status = 'released'))
    const event = s.events.find((e) => e.id === l.eventId)
    queueMessage(s, {
      userId: l.sellerId,
      channel: 'email',
      subject: 'Your listing was taken down',
      body: `Ticket ${ticketId} for ${event?.name} was scanned at the gate, so we removed your listing. Enjoy the show!`,
      action: { label: 'View my listings', to: '/my-listings' },
    })
  })
}
