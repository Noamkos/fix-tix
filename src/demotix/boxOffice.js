// DemoTix's own ticket shop: where the original ticket is bought at the start of the demo.
// This is DemoTix selling directly, so it doesn't go through the API log.

import { update } from '../store/store.js'
import { assignPlaces, findEvent, findTicketType, issueTicket, newOrderRef } from './tickets.js'

export const MAX_PER_ORDER = 4

export function buyFromBoxOffice({ eventId, ticketTypeId, quantity, buyer }) {
  let order = null
  update((s) => {
    const event = findEvent(s, eventId)
    const type = findTicketType(event, ticketTypeId)
    if (!event || !type) return

    const qty = Math.min(Math.max(1, Number(quantity) || 1), MAX_PER_ORDER)
    const orderRef = newOrderRef(s)
    const owner = { name: buyer.name.trim(), email: buyer.email.trim().toLowerCase() }
    const tickets = assignPlaces(type, qty).map((place) =>
      issueTicket(s, {
        eventId,
        ticketTypeId,
        priceCents: type.priceCents,
        owner,
        orderRef,
        place,
        note: `Issued to ${owner.name} (order ${orderRef})`,
      }),
    )

    order = { orderRef, eventId, owner, ticketIds: tickets.map((t) => t.id), totalCents: type.priceCents * qty }
  })
  return order
}
