// DemoTix internals: how the mock ticketing company stores and changes its official tickets.
// These helpers edit a draft of the state, inside update(): see store.js.

export const TICKET_STATUS = {
  active: { label: 'Active' },
  locked: { label: 'Locked for resale' },
  voided: { label: 'Voided' },
  reissued: { label: 'Reissued' },
  scanned: { label: 'Scanned' },
}

export const statusLabel = (status) => TICKET_STATUS[status]?.label ?? status

// "ticket 1042" / "tickets 1042, 1043"
export function ticketsText(ids) {
  return ids.length === 1 ? `ticket ${ids[0]}` : `tickets ${ids.join(', ')}`
}

export function findTicket(s, id) {
  return s.demotix.tickets.find((t) => t.id === Number(id)) ?? null
}

export function findEvent(s, eventId) {
  return s.events.find((e) => e.id === eventId) ?? null
}

export function findTicketType(event, ticketTypeId) {
  return event?.ticketTypes.find((tt) => tt.id === ticketTypeId) ?? null
}

// Barcodes look like DTX-4KQ7-M2XP. No 0/O or 1/I, so they read clearly on screen.
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

function randomBlock() {
  const bytes = crypto.getRandomValues(new Uint8Array(4))
  return Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join('')
}

export function newBarcode(tickets) {
  const taken = new Set(tickets.map((t) => t.barcode))
  let code
  do {
    code = `DTX-${randomBlock()}-${randomBlock()}`
  } while (taken.has(code))
  return code
}

export function newOrderRef(s) {
  return `DT-${s.demotix.nextOrderNumber++}`
}

export function setTicketStatus(ticket, status, note, at = new Date().toISOString()) {
  ticket.status = status
  ticket.updatedAt = at
  ticket.history.push({ at, status, note })
}

// Create a new official ticket with the next ticket number.
export function issueTicket(s, { eventId, ticketTypeId, priceCents, owner, orderRef, place = {}, status = 'active', replaces = null, note }) {
  const at = new Date().toISOString()
  const ticket = {
    id: s.demotix.nextTicketNumber++,
    barcode: newBarcode(s.demotix.tickets),
    eventId,
    ticketTypeId,
    section: place.section ?? null,
    row: place.row ?? null,
    seat: place.seat ?? null,
    priceCents,
    owner: { name: owner.name, email: owner.email },
    orderRef,
    status,
    issuedAt: at,
    updatedAt: at,
    lockedBy: null,
    replacedBy: null,
    replaces,
    history: [{ at, status, note }],
  }
  s.demotix.tickets.push(ticket)
  return ticket
}

// Pick seats for a seated ticket type: same section and row, seats side by side.
export function assignPlaces(ticketType, quantity) {
  if (!ticketType.seated) return Array.from({ length: quantity }, () => ({}))
  const sections = ticketType.sections?.length ? ticketType.sections : [ticketType.name]
  const section = sections[Math.floor(Math.random() * sections.length)]
  const row = String(1 + Math.floor(Math.random() * 18))
  const firstSeat = 1 + Math.floor(Math.random() * 20)
  return Array.from({ length: quantity }, (_, i) => ({ section, row, seat: String(firstSeat + i) }))
}

// "Terrace B · Row 4 · Seat 9", or the ticket type for standing tickets.
export function placeText(ticket, event) {
  if (ticket.section) return `${ticket.section} · Row ${ticket.row} · Seat ${ticket.seat}`
  return findTicketType(event, ticket.ticketTypeId)?.name ?? 'General Admission'
}
