// The gate scanner (process E): every barcode is checked live against the DemoTix ticket table.
//   Valid          a new or untouched ticket, now marked Scanned
//   Voided         an old barcode, cancelled when the ticket was resold via FixTix
//   Already used   scanned before
//   Not found      DemoTix never issued it: a fake

import { getState, update } from '../store/store.js'
import { newId } from '../lib/ids.js'
import { formatClock } from '../lib/format.js'
import { callDemoTix } from './api.js'
import { onTicketScanned } from '../fixtix/webhooks.js'
import { placeText, setTicketStatus } from './tickets.js'

export const RESULTS = {
  valid: { ok: true, title: 'Valid' },
  voided: { ok: false, title: 'Voided' },
  used: { ok: false, title: 'Already used' },
  not_found: { ok: false, title: 'Not found' },
}

// "dtx 4kq7m2xp" and "DTX-4KQ7-M2XP" are the same barcode.
const clean = (code) => String(code ?? '').toUpperCase().replace(/[^A-Z0-9]/g, '')

// The gate's verdict on a barcode, read from the DemoTix table without changing anything.
function evaluate(s, code, gate, at) {
  const ticket = s.demotix.tickets.find((t) => clean(t.barcode) === clean(code))
  const event = ticket ? s.events.find((e) => e.id === ticket.eventId) : null
  const outcome = { at, barcode: ticket?.barcode ?? String(code).trim().toUpperCase(), ticketId: ticket?.id ?? null, gate }

  if (!ticket) {
    Object.assign(outcome, { result: 'not_found', reason: "DemoTix never issued this barcode. It's fake." })
  } else if (ticket.status === 'voided') {
    Object.assign(outcome, {
      result: 'voided',
      reason: ticket.replacedBy ? `Resold via FixTix. Replaced by ticket ${ticket.replacedBy}.` : 'This ticket was cancelled.',
    })
  } else if (ticket.status === 'scanned') {
    const first = [...s.demotix.scans].reverse().find((x) => x.ticketId === ticket.id && x.result === 'valid')
    Object.assign(outcome, { result: 'used', reason: first ? `Already scanned at ${first.gate}, ${formatClock(first.at)}.` : 'Already scanned.' })
  } else {
    Object.assign(outcome, { result: 'valid', reason: 'Welcome in!', wasListed: ticket.status === 'locked' })
  }

  if (ticket) {
    outcome.holder = ticket.owner.name
    outcome.ticketNumber = ticket.id
    outcome.eventName = event?.name
    outcome.place = placeText(ticket, event)
  }
  return outcome
}

// A real scan at the gate: a valid ticket is marked Scanned and the scan is recorded.
export function scanBarcode(code, { gate = 'Gate A' } = {}) {
  let outcome
  update((s) => {
    const at = new Date().toISOString()
    outcome = evaluate(s, code, gate, at)
    if (outcome.result === 'valid') {
      const ticket = s.demotix.tickets.find((t) => t.id === outcome.ticketId)
      ticket.lockedBy = null
      setTicketStatus(ticket, 'scanned', `Scanned at ${gate}`, at)
    }
    s.demotix.scans.push({ id: newId('sc'), at, barcode: outcome.barcode, ticketId: outcome.ticketId, result: outcome.result, gate })
  })

  // A good scan is reported to FixTix (API action 6). Runs in the background.
  if (outcome.result === 'valid') {
    callDemoTix('notify', { type: 'ticket.scanned', ticketId: outcome.ticketId, gate }).then(() => onTicketScanned(outcome.ticketId))
  }
  return outcome
}

// What the gate would say, without using the ticket up ("The other way" uses this, so the
// opening of the demo doesn't spend the ticket that gets scanned for real in step 7).
export function checkBarcode(code, { gate = 'Gate A' } = {}) {
  return evaluate(getState(), code, gate, new Date().toISOString())
}
