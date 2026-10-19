import { useEffect, useRef } from 'react'
import { Ban, RefreshCw, X } from 'lucide-react'
import { useStore } from '../../store/useStore.js'
import { findTicketType, placeText, statusLabel } from '../../demotix/tickets.js'
import { formatEventDate, formatMoney, formatStamp, formatClock } from '../../lib/format.js'
import { StatusBadge, STATUS_DOT } from './StatusBadge.jsx'

// Side panel with everything DemoTix knows about one ticket, and its full history.
export function TicketDrawer({ ticketId, onClose, onOpenTicket }) {
  const ticket = useStore((s) => s.demotix.tickets.find((t) => t.id === Number(ticketId)) ?? null)
  const event = useStore((s) => (ticket ? s.events.find((e) => e.id === ticket.eventId) : null))
  const closeRef = useRef(null)

  useEffect(() => {
    closeRef.current?.focus()
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  if (!ticket) return null
  const voided = ticket.status === 'voided'

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} aria-hidden="true" />
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="ticket-drawer-title"
        className="absolute inset-y-0 right-0 flex w-full max-w-[460px] flex-col border-l border-console-line bg-console-panel text-console-text shadow-2xl"
      >
        <div className="flex items-center gap-3 border-b border-console-line px-5 py-4">
          <h2 id="ticket-drawer-title" className="font-mono text-xl font-bold text-white">
            Ticket {ticket.id}
          </h2>
          <StatusBadge status={ticket.status} />
          <button ref={closeRef} type="button" onClick={onClose} aria-label="Close" className="ml-auto grid size-9 place-items-center rounded-lg text-console-muted hover:bg-white/5 hover:text-white">
            <X className="size-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5">
          <div className="rounded-card border border-console-line bg-console px-4 py-3">
            <div className="text-xs font-semibold tracking-wider text-console-muted uppercase">Barcode</div>
            <div className={`mt-1 font-mono text-xl font-bold tracking-wider ${voided ? 'text-console-muted line-through decoration-red-400' : 'text-white'}`}>
              {ticket.barcode}
            </div>
          </div>

          {ticket.replacedBy && (
            <Notice tone="red" icon={Ban}>
              This barcode no longer opens the gate. It was resold through FixTix and replaced by{' '}
              <TicketLink id={ticket.replacedBy} onOpen={onOpenTicket} />.
            </Notice>
          )}
          {ticket.replaces && (
            <Notice tone="sky" icon={RefreshCw}>
              Issued through FixTix resale. Replaces <TicketLink id={ticket.replaces} onOpen={onOpenTicket} />, which is now voided.
            </Notice>
          )}

          <dl className="mt-5 grid grid-cols-[auto_1fr] gap-x-6 gap-y-2.5 text-sm">
            <Row label="Event">{event?.name}</Row>
            <Row label="Date">{event && formatEventDate(event.startsAt)}</Row>
            <Row label="Venue">{event && `${event.venue}, ${event.city}`}</Row>
            <Row label="Ticket">{findTicketType(event, ticket.ticketTypeId)?.name}</Row>
            {ticket.section && <Row label="Seat">{placeText(ticket, event)}</Row>}
            <Row label="Price paid">{formatMoney(ticket.priceCents)}</Row>
            <Row label="Owner">
              {ticket.owner.name}
              <span className="block text-console-muted">{ticket.owner.email}</span>
            </Row>
            <Row label="Order">
              <span className="font-mono">{ticket.orderRef}</span>
            </Row>
            {ticket.lockedBy && <Row label="Locked by">{ticket.lockedBy}</Row>}
          </dl>

          <h3 className="mt-7 text-xs font-semibold tracking-wider text-console-muted uppercase">History</h3>
          <ol className="mt-3">
            {ticket.history.map((h, i) => (
              <li key={i} className="relative flex gap-3 pb-5 last:pb-0">
                {i < ticket.history.length - 1 && <span className="absolute top-3 bottom-0 left-[5px] w-px bg-console-line" aria-hidden="true" />}
                <span className={`relative mt-1.5 size-[11px] shrink-0 rounded-full ring-4 ring-console-panel ${STATUS_DOT[h.status] ?? 'bg-slate-400'}`} />
                <div>
                  <div className="text-sm font-semibold text-white">{statusLabel(h.status)}</div>
                  <div className="text-sm text-console-text/85">{h.note}</div>
                  <div className="mt-0.5 font-mono text-xs text-console-muted">
                    {formatStamp(h.at)} · {formatClock(h.at)}
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </aside>
    </div>
  )
}

function Row({ label, children }) {
  return (
    <>
      <dt className="text-console-muted">{label}</dt>
      <dd className="text-console-text">{children}</dd>
    </>
  )
}

function Notice({ tone, icon: Icon, children }) {
  const tones = {
    red: 'border-red-400/30 bg-red-500/10 text-red-200',
    sky: 'border-sky-400/30 bg-sky-500/10 text-sky-200',
  }
  return (
    <p className={`mt-3 flex items-start gap-2.5 rounded-card border px-4 py-3 text-sm leading-relaxed ${tones[tone]}`}>
      <Icon className="mt-0.5 size-4 shrink-0" />
      <span>{children}</span>
    </p>
  )
}

function TicketLink({ id, onOpen }) {
  return (
    <button type="button" onClick={() => onOpen(id)} className="font-mono font-bold underline underline-offset-2 hover:text-white">
      ticket {id}
    </button>
  )
}
