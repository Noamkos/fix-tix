// The DemoTix API: the six actions FixTix needs from a ticketing company.
//
// In the real product each one is a request over the internet, signed with FixTix's secret
// access key. Here they run in the browser with a short artificial delay, change the DemoTix
// ticket table, and write every request and answer to the API log.
//
//   const res = await callDemoTix('verify', { orderRef: 'DT-51034' })
//   if (res.ok) ...

import { update } from '../store/store.js'
import { formatDay } from '../lib/format.js'
import {
  findEvent,
  findTicket,
  findTicketType,
  issueTicket,
  newOrderRef,
  setTicketStatus,
  statusLabel,
  ticketsText,
} from './tickets.js'

// The list handed to the ticketing company: "these six, and we build everything else".
export const API_ACTIONS = [
  {
    id: 'verify',
    name: 'Verify ticket',
    what: 'Checks the ticket is real, active and belongs to the seller',
    when: 'A seller lists a ticket',
    returns: 'Event, venue, price paid, owner',
    direction: 'in',
  },
  {
    id: 'lock',
    name: 'Lock ticket',
    what: "Locks the ticket so it can't be transferred any other way",
    when: 'A listing goes live',
    returns: 'Lock confirmation',
    direction: 'in',
  },
  {
    id: 'unlock',
    name: 'Unlock ticket',
    what: 'Releases the lock',
    when: 'A listing is cancelled',
    returns: 'Unlock confirmation',
    direction: 'in',
  },
  {
    id: 'void_reissue',
    name: 'Void and reissue',
    what: "Voids the old barcode and issues a new ticket in the buyer's name",
    when: 'After a successful payment',
    returns: 'The new ticket and barcode',
    direction: 'in',
  },
  {
    id: 'get_event',
    name: 'Get event',
    what: 'Returns event details and date',
    when: 'An event page is shown',
    returns: 'Name, venue, date, status',
    direction: 'in',
  },
  {
    id: 'notify',
    name: 'Notify FixTix',
    what: 'DemoTix tells FixTix when something happens (webhook)',
    when: 'Event cancelled or postponed, ticket scanned',
    returns: 'Event type and details',
    direction: 'out',
  },
]

export const actionName = (id) => API_ACTIONS.find((a) => a.id === id)?.name ?? id

// Typical response times, so the demo feels like real network calls.
const LATENCY_MS = { verify: 650, lock: 420, unlock: 380, void_reissue: 950, get_event: 260, notify: 300 }

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const fail = (error, message) => ({ ok: false, error, message })

const eventInfo = (event) => ({
  eventId: event.id,
  name: event.name,
  venue: event.venue,
  city: event.city,
  country: event.country,
  startsAt: event.startsAt,
  status: event.status,
})

// Find all requested tickets, or explain which one is missing.
function loadTickets(s, ticketIds) {
  const ids = [].concat(ticketIds ?? []).map(Number)
  if (!ids.length) return { error: fail('BAD_REQUEST', 'No ticket numbers were sent') }
  const tickets = ids.map((id) => findTicket(s, id))
  const missing = ids.find((id, i) => !tickets[i])
  if (missing) return { error: fail('TICKET_NOT_FOUND', `Ticket ${missing} does not exist`) }
  return { ids, tickets }
}

const HANDLERS = {
  // 1. Verify: look up an order by its number and report what's in it.
  verify(s, { orderRef }) {
    const ref = String(orderRef ?? '').trim().toUpperCase()
    const tickets = s.demotix.tickets.filter((t) => t.orderRef === ref)
    if (!ref || !tickets.length) return fail('ORDER_NOT_FOUND', `No order ${ref || '(empty)'} exists`)
    const event = findEvent(s, tickets[0].eventId)
    return {
      ok: true,
      order: {
        orderRef: ref,
        owner: { ...tickets[0].owner },
        event: eventInfo(event),
        tickets: tickets.map((t) => ({
          ticketId: t.id,
          ticketType: findTicketType(event, t.ticketTypeId)?.name ?? null,
          section: t.section,
          row: t.row,
          seat: t.seat,
          pricePaidCents: t.priceCents,
          status: t.status,
        })),
      },
    }
  },

  // 2. Lock: only active tickets can be locked, and all of them or none.
  lock(s, { ticketIds, listingId }) {
    const { ids, tickets, error } = loadTickets(s, ticketIds)
    if (error) return error
    const blocked = tickets.find((t) => t.status !== 'active')
    if (blocked) return fail('TICKET_NOT_ACTIVE', `Ticket ${blocked.id} is ${statusLabel(blocked.status)}, only Active tickets can be locked`)
    const at = new Date().toISOString()
    tickets.forEach((t) => {
      t.lockedBy = 'FixTix'
      setTicketStatus(t, 'locked', `Locked for resale by FixTix${listingId ? ` (listing ${listingId})` : ''}`, at)
    })
    return { ok: true, locked: ids }
  },

  // 3. Unlock: release a FixTix lock, the ticket goes back to its owner as Active.
  unlock(s, { ticketIds, reason }) {
    const { ids, tickets, error } = loadTickets(s, ticketIds)
    if (error) return error
    const notLocked = tickets.find((t) => t.status !== 'locked')
    if (notLocked) return fail('TICKET_NOT_LOCKED', `Ticket ${notLocked.id} is ${statusLabel(notLocked.status)}, not locked`)
    const at = new Date().toISOString()
    tickets.forEach((t) => {
      t.lockedBy = null
      setTicketStatus(t, 'active', `Unlocked by FixTix: ${reason || 'listing cancelled'}`, at)
    })
    return { ok: true, unlocked: ids }
  },

  // 4. Void and reissue: the heart of FixTix. One request, two changes:
  //    the old barcode stops working and a brand-new ticket is issued to the buyer.
  void_reissue(s, { ticketId, newOwner, fixtixOrderId, simulateFailure }) {
    const old = findTicket(s, ticketId)
    if (!old) return fail('TICKET_NOT_FOUND', `Ticket ${ticketId} does not exist`)
    if (old.status !== 'locked') return fail('TICKET_NOT_LOCKED', `Ticket ${old.id} is ${statusLabel(old.status)}, it must be locked for resale first`)
    if (!newOwner?.name || !newOwner?.email) return fail('BAD_REQUEST', 'The new owner needs a name and an email')
    if (simulateFailure) return fail('REISSUE_FAILED', 'DemoTix could not issue a new ticket. Nothing was changed.')

    const at = new Date().toISOString()
    old.lockedBy = null
    old.replacedBy = s.demotix.nextTicketNumber
    setTicketStatus(old, 'voided', `Voided: resold via FixTix${fixtixOrderId ? ` (order ${fixtixOrderId})` : ''}`, at)

    const fresh = issueTicket(s, {
      eventId: old.eventId,
      ticketTypeId: old.ticketTypeId,
      priceCents: old.priceCents,
      owner: newOwner,
      orderRef: newOrderRef(s),
      place: { section: old.section, row: old.row, seat: old.seat },
      status: 'reissued',
      replaces: old.id,
      note: `Reissued to ${newOwner.name}, replaces ticket ${old.id}`,
    })

    return {
      ok: true,
      voidedTicketId: old.id,
      ticket: {
        ticketId: fresh.id,
        barcode: fresh.barcode,
        owner: { ...fresh.owner },
        eventId: fresh.eventId,
        section: fresh.section,
        row: fresh.row,
        seat: fresh.seat,
        orderRef: fresh.orderRef,
      },
    }
  },

  // 5. Get event: official event details.
  get_event(s, { eventId }) {
    const event = findEvent(s, eventId)
    if (!event) return fail('EVENT_NOT_FOUND', `No event ${eventId} exists`)
    return { ok: true, event: eventInfo(event) }
  },

  // 6. Notify FixTix (webhook): DemoTix tells FixTix something happened.
  notify(s, { type }) {
    if (!type) return fail('BAD_REQUEST', 'A notification needs a type')
    return { ok: true, received: true }
  },
}

const NOTIFY_LABELS = {
  'event.cancelled': 'event cancelled',
  'event.postponed': 'event postponed',
  'ticket.scanned': 'ticket scanned at the gate',
}

// Plain-language lines for the API log: what was asked, and what came back.
function describe(s, action, params, res) {
  const rejected = !res.ok && `Rejected: ${res.message}`
  switch (action) {
    case 'verify':
      return {
        request: `FixTix asked to verify order ${String(params.orderRef ?? '').trim().toUpperCase() || '(empty)'}`,
        result:
          rejected ||
          `Valid: ${ticketsText(res.order.tickets.map((t) => t.ticketId))} for ${res.order.event.name}, owned by ${res.order.owner.name}`,
      }
    case 'lock':
      return { request: `FixTix asked to lock ${ticketsText([].concat(params.ticketIds))}`, result: rejected || 'Locked for resale' }
    case 'unlock':
      return { request: `FixTix asked to unlock ${ticketsText([].concat(params.ticketIds))}`, result: rejected || 'Unlocked, back to Active' }
    case 'void_reissue':
      return {
        request: `FixTix asked to void ticket ${params.ticketId} and reissue it to ${params.newOwner?.name ?? 'the buyer'}`,
        result: res.ok ? `Ticket ${res.voidedTicketId} voided, new ticket ${res.ticket.ticketId} issued` : `Failed: ${res.message}`,
      }
    case 'get_event': {
      const name = findEvent(s, params.eventId)?.name ?? params.eventId
      return {
        request: `FixTix asked for the details of ${name}`,
        result: rejected || `${res.event.status === 'cancelled' ? 'Cancelled' : 'Scheduled'}, ${formatDay(res.event.startsAt)}`,
      }
    }
    case 'notify': {
      const subject = params.ticketId ? ` (ticket ${params.ticketId})` : params.eventId ? ` (${findEvent(s, params.eventId)?.name ?? params.eventId})` : ''
      return {
        request: `DemoTix notified FixTix: ${NOTIFY_LABELS[params.type] ?? params.type}${subject}`,
        result: rejected || 'Received by FixTix',
      }
    }
    default:
      return { request: action, result: res.ok ? 'OK' : rejected }
  }
}

// Send one request to DemoTix and wait for the answer.
export async function callDemoTix(action, params = {}) {
  const handler = HANDLERS[action]
  if (!handler) throw new Error(`Unknown DemoTix action: ${action}`)

  const started = performance.now()
  await sleep(LATENCY_MS[action] * (0.85 + Math.random() * 0.3))

  let response
  update((s) => {
    response = handler(s, params)
    const { request, result } = describe(s, action, params, response)
    s.demotix.apiLog.push({
      id: `api-${s.demotix.apiLog.length + 1}`,
      at: new Date().toISOString(),
      action,
      direction: action === 'notify' ? 'demotix_to_fixtix' : 'fixtix_to_demotix',
      ok: response.ok,
      summary: request,
      result,
      request: params,
      response,
      durationMs: Math.round(performance.now() - started),
    })
  })
  return response
}
