// The swap (process C), the heart of FixTix:
// 1. one request to DemoTix per ticket: void the old barcode and issue a new ticket to the buyer
// 2. the new ticket goes to the buyer (email + My tickets)
// 3. only then is the seller paid (rule 9), and the fee is split with the ticketing company
// If DemoTix can't issue the new ticket, the buyer is refunded in full and the listing goes back on sale (rule 10).

import { getState, update } from '../store/store.js'
import { callDemoTix } from '../demotix/api.js'
import { newId } from '../lib/ids.js'
import { formatMoney, plural } from '../lib/format.js'
import { queueMessage } from './messages.js'
import { syncListingStatus } from './availability.js'
import { allocateOffers, fulfillWaitlist } from './waitlist.js'

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
const jobs = new Map()

// Runs the swap for a paid order. Safe to call twice (or after a page refresh): it never swaps a ticket twice.
// `onStep` reports progress for the animation: 'verifying', then 'voiding'. A second caller joins the
// running swap and hears its current step straight away.
export function runSwap(orderId, { onStep } = {}) {
  let job = jobs.get(orderId)
  if (!job) {
    job = { step: null, listeners: new Set() }
    const emit = (step) => {
      job.step = step
      job.listeners.forEach((listener) => listener(step))
    }
    job.promise = swap(orderId, emit).finally(() => jobs.delete(orderId))
    jobs.set(orderId, job)
  }
  if (onStep) {
    job.listeners.add(onStep)
    if (job.step) onStep(job.step)
  }
  return job.promise
}

async function swap(orderId, onStep) {
  const order = getState().fixtix.orders.find((o) => o.id === orderId)
  if (!order || !['paid', 'swapping'].includes(order.status)) return { ok: order?.status === 'completed', order }

  // Step 1, Verifying: payment captured, tickets still locked for this listing.
  onStep('verifying')
  update((s) => {
    const o = s.fixtix.orders.find((x) => x.id === orderId)
    o.status = 'swapping'
    o.swapStartedAt = o.swapStartedAt ?? new Date().toISOString()
  })
  await sleep(1300)

  // Step 2-3, Voiding and Issuing: one Void and reissue request per ticket.
  onStep('voiding')
  const buyer = getState().fixtix.users.find((u) => u.id === order.buyerId)
  const results = []
  for (const ticketId of order.ticketIds) {
    // After a refresh mid-swap, a ticket may already be done. (The demo can see DemoTix's table;
    // the real product would ask DemoTix for the ticket's status.)
    const current = getState().demotix.tickets.find((t) => t.id === ticketId)
    if (current?.status === 'voided' && current.replacedBy) {
      const fresh = getState().demotix.tickets.find((t) => t.id === current.replacedBy)
      results.push({ ticketId, ok: true, oldBarcode: current.barcode, ticket: { ticketId: fresh.id, barcode: fresh.barcode } })
      continue
    }
    const res = await callDemoTix('void_reissue', {
      ticketId,
      newOwner: { name: buyer.name, email: buyer.email },
      fixtixOrderId: orderId,
      simulateFailure: order.demoFailReissue,
    })
    results.push({ ticketId, ok: res.ok, oldBarcode: current?.barcode, ticket: res.ticket, error: res.message })
    if (!res.ok) break
  }

  return finish(orderId, results)
}

function finish(orderId, results) {
  const swapped = results.filter((r) => r.ok)
  let outcome
  update((s) => {
    const now = new Date().toISOString()
    const order = s.fixtix.orders.find((o) => o.id === orderId)
    if (order.status !== 'swapping') {
      outcome = { ok: order.status === 'completed', order }
      return
    }
    const listing = s.fixtix.listings.find((l) => l.id === order.listingId)
    const event = s.events.find((e) => e.id === order.eventId)
    const seller = s.fixtix.users.find((u) => u.id === order.sellerId)
    const n = swapped.length
    const failedIds = order.ticketIds.filter((id) => !swapped.some((r) => r.ticketId === id))

    // Every attempt is recorded, successful or not.
    results.forEach((r) =>
      s.fixtix.swaps.push({
        id: newId('sw'),
        orderId,
        oldTicketId: r.ticketId,
        oldBarcode: r.oldBarcode ?? null,
        newTicketId: r.ticket?.ticketId ?? null,
        newBarcode: r.ticket?.barcode ?? null,
        ok: r.ok,
        error: r.ok ? null : r.error,
        at: now,
      }),
    )

    if (n) {
      listing.soldTicketIds.push(...swapped.map((r) => r.ticketId))
      fulfillWaitlist(s, order.buyerId, order.eventId)
      const share = (cents) => Math.round((cents * n) / order.ticketIds.length)
      s.fixtix.feeSplits.push({
        id: newId('fs'),
        orderId,
        eventId: order.eventId,
        tickets: n,
        feeCents: share(order.feeCents),
        fixtixCents: share(order.fixtixCents),
        partnerCents: share(order.partnerCents),
        at: now,
      })
      // Rule 9: the seller is paid only now that the new ticket exists.
      s.fixtix.payouts.push({
        id: newId('po'),
        sellerId: order.sellerId,
        orderId,
        amountCents: order.unitCents * n,
        status: 'pending',
        createdAt: now,
      })
      queueMessage(s, {
        userId: order.buyerId,
        channel: 'email',
        subject: `Your ticket for ${event.name}`,
        body: `${n === 1 ? `Ticket ${swapped[0].ticket.ticketId} is` : `Tickets ${swapped.map((r) => r.ticket.ticketId).join(', ')} are`} now issued in your name. The previous barcode was voided, so this is the only valid ticket.`,
        action: { label: 'View my tickets', to: '/my-tickets' },
      })
      queueMessage(s, {
        userId: order.sellerId,
        channel: 'email',
        subject: `Sold! ${formatMoney(order.unitCents * n)} is on its way`,
        body: `A fan bought ${plural(n, 'ticket')} for ${event.name}. DemoTix issued them a new ticket, so we've released your payout${seller?.payout ? ` to ${seller.payout.method} •••• ${seller.payout.last4}` : ''}.`,
        action: { label: 'View my listings', to: '/my-listings' },
      })
    }

    // Rule 10: anything DemoTix couldn't reissue is refunded in full, and goes back on sale.
    const refundCents = order.ticketIds.length ? Math.round((order.totalCents * failedIds.length) / order.ticketIds.length) : 0
    if (failedIds.length) {
      queueMessage(s, {
        userId: order.buyerId,
        channel: 'email',
        subject: 'Refund issued',
        body: `DemoTix couldn't issue your ticket for ${event.name}, so we refunded ${formatMoney(refundCents)} in full. Nothing else is needed from you.`,
        action: { label: 'Back to the event', to: `/event/${event.id}` },
      })
    }

    order.newTicketIds = swapped.map((r) => r.ticket.ticketId)
    order.status = failedIds.length ? (n ? 'partially_refunded' : 'refunded') : 'completed'
    order.completedAt = n ? now : null
    order.refundedAt = failedIds.length ? now : null
    order.refundCents = refundCents
    syncListingStatus(s, listing)
    if (failedIds.length) allocateOffers(s, listing)

    outcome = { ok: !failedIds.length, order: { ...order }, results }
  })
  return outcome
}
