// What the ticketing company sees about resale on its events (Partner dashboard and Partner revenue).
//
// Headline money figures use the CURRENT terms in Settings, so the split can be changed live in
// the meeting and the numbers move at once. Each transaction also keeps what was recorded when it
// happened (state.fixtix.feeSplits).

import { priceBreakdown } from '../lib/pricing.js'

export function partnerStats(s) {
  const settings = s.settings
  const events = Object.fromEntries(s.events.map((e) => [e.id, e]))

  // Every order where DemoTix issued at least one new ticket is a resale that happened.
  const sales = s.fixtix.orders
    .filter((o) => o.newTicketIds?.length && o.completedAt)
    .map((o) => {
      const n = o.newTicketIds.length
      const b = priceBreakdown(o.unitCents, settings)
      const recorded = s.fixtix.feeSplits.find((f) => f.orderId === o.id)
      return {
        orderId: o.id,
        at: o.completedAt,
        event: events[o.eventId],
        tickets: n,
        oldTicketIds: o.ticketIds.slice(0, n),
        newTicketIds: o.newTicketIds,
        toSellerCents: o.unitCents * n,
        buyerPaidCents: b.total * n,
        partnerCents: b.partner * n,
        fixtixCents: b.fixtix * n,
        recordedPartnerCents: recorded?.partnerCents ?? null,
      }
    })
    .sort((a, b) => a.at.localeCompare(b.at))

  const sum = (key) => sales.reduce((t, x) => t + x[key], 0)
  const waiting = s.fixtix.waitlist.filter((w) => ['waiting', 'offered'].includes(w.status))

  let running = 0
  const timeline = sales.map((x) => {
    running += x.partnerCents
    return { at: x.at, cents: running, sale: x }
  })

  const perEvent = s.events
    .map((e) => {
      const mine = sales.filter((x) => x.event.id === e.id)
      const resold = mine.reduce((t, x) => t + x.tickets, 0)
      const fans = waiting.filter((w) => w.eventId === e.id)
      return {
        event: e,
        resold,
        shareOfEvent: resold / e.capacity,
        partnerCents: mine.reduce((t, x) => t + x.partnerCents, 0),
        waitingFans: fans.length,
        waitingTickets: fans.reduce((t, w) => t + w.quantity, 0),
      }
    })
    .sort((a, b) => b.partnerCents - a.partnerCents || b.waitingTickets - a.waitingTickets || new Date(a.event.startsAt) - new Date(b.event.startsAt))

  return {
    settings,
    sales,
    timeline,
    perEvent,
    ticketsSwapped: sum('tickets'),
    partnerCents: sum('partnerCents'),
    fixtixCents: sum('fixtixCents'),
    toFansCents: sum('toSellerCents'),
    resaleVolumeCents: sum('buyerPaidCents'),
    waitingFans: waiting.length,
    waitingTickets: waiting.reduce((t, w) => t + w.quantity, 0),
  }
}
