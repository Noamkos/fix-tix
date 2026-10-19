import { useCallback, useState } from 'react'
import { Link } from 'react-router'
import { BadgeCheck, CalendarDays, MapPin, ScanLine, Wallet } from 'lucide-react'
import { useStore } from '../../store/useStore.js'
import { getCurrentUser } from '../../lib/selectors.js'
import { placeText } from '../../demotix/tickets.js'
import { formatClock, formatEventDate, formatStamp } from '../../lib/format.js'
import { QrCode } from '../../components/QrCode.jsx'
import { EventCover } from '../../components/EventCover.jsx'
import { WalletPreview } from '../../components/WalletPreview.jsx'

// Tickets the fan got through FixTix: each one is a brand-new DemoTix ticket in their name.
const selectMyTickets = (s) => {
  const user = getCurrentUser(s)
  return s.fixtix.orders
    .filter((o) => o.buyerId === user?.id && o.newTicketIds?.length)
    .flatMap((order) =>
      order.newTicketIds.map((id) => {
        const ticket = s.demotix.tickets.find((t) => t.id === id)
        return { order, ticket, event: s.events.find((e) => e.id === ticket.eventId) }
      }),
    )
    .sort((a, b) => new Date(a.event.startsAt) - new Date(b.event.startsAt))
}

export default function MyTickets() {
  const tickets = useStore(selectMyTickets)

  return (
    <section className="container-page py-10 sm:py-14">
      <h1 className="text-[30px] font-bold tracking-tight sm:text-[36px]">My tickets</h1>
      <p className="mt-1 text-muted">Show the QR code at the gate. Each ticket was issued to you by the official ticketing company.</p>

      {tickets.length ? (
        <ul className="mt-8 grid gap-6 lg:grid-cols-2">
          {tickets.map((t) => (
            <TicketCard key={t.ticket.id} {...t} />
          ))}
        </ul>
      ) : (
        <div className="tile mt-8 flex flex-col items-center px-6 py-14 text-center">
          <p className="text-lg font-semibold">No tickets yet</p>
          <p className="mt-1 max-w-sm text-muted">Tickets you buy on FixTix appear here, issued in your name.</p>
          <Link to="/" className="btn-primary mt-5">
            Find an event
          </Link>
        </div>
      )}
    </section>
  )
}

function TicketCard({ ticket, event }) {
  const [wallet, setWallet] = useState(null)
  const closeWallet = useCallback(() => setWallet(null), [])
  const lastScan = useStore((s) => [...s.demotix.scans].reverse().find((x) => x.ticketId === ticket.id && x.result === 'valid'))
  const place = placeText(ticket, event)
  const used = ticket.status === 'scanned'
  const resold = ticket.status === 'voided'
  const valid = !used && !resold

  return (
    <li className="overflow-hidden rounded-2xl border border-line bg-white shadow-[0_12px_32px_-20px_rgba(15,10,12,0.35)]">
      <div className="relative h-24">
        <EventCover cover={event.cover} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <p className="absolute bottom-3 left-4 right-4 truncate text-lg font-bold text-white">{event.name}</p>
      </div>

      <div className="grid gap-5 p-5 sm:grid-cols-[1fr_auto]">
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-sm font-semibold text-coral">
            <CalendarDays className="size-4" /> {formatEventDate(event.startsAt)}
          </p>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-muted">
            <MapPin className="size-4" /> {event.venue}, {event.city}
          </p>
          <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="text-muted">Admission</dt>
              <dd className="font-semibold">{place}</dd>
            </div>
            <div>
              <dt className="text-muted">Holder</dt>
              <dd className="font-semibold">{ticket.owner.name}</dd>
            </div>
            <div>
              <dt className="text-muted">Ticket</dt>
              <dd className="font-semibold">{ticket.id}</dd>
            </div>
            <div>
              <dt className="text-muted">Order</dt>
              <dd className="font-mono font-semibold">{ticket.orderRef}</dd>
            </div>
          </dl>
          <p className="mt-4 flex items-center gap-1.5 text-sm font-semibold text-success">
            <BadgeCheck className="size-4" /> Issued by DemoTix, {formatStamp(ticket.issuedAt)}
          </p>
        </div>

        <div className="flex flex-col items-center">
          <div className={`relative rounded-xl border border-line p-2 ${valid ? '' : 'opacity-40'}`}>
            <QrCode value={ticket.barcode} className="size-44" />
          </div>
          <p className={`mt-1.5 font-mono text-sm font-bold tracking-wider ${resold ? 'line-through' : ''}`}>{ticket.barcode}</p>
          <span
            className={`pill mt-2 ${valid ? 'bg-emerald-50 text-success' : used ? 'bg-surface text-ink' : 'bg-danger/10 text-danger'}`}
          >
            {valid ? 'Valid' : used ? (
              <>
                <ScanLine className="size-3.5" /> Used at the gate{lastScan ? `, ${formatClock(lastScan.at)}` : ''}
              </>
            ) : (
              'Resold, no longer valid'
            )}
          </span>
        </div>
      </div>

      {valid && (
        <div className="flex flex-wrap items-center gap-2 border-t border-line bg-surface/40 px-5 py-3">
          <button type="button" onClick={() => setWallet('apple')} className="btn bg-ink px-3.5 py-2 text-sm text-white hover:bg-ink/85">
            <Wallet className="size-4" /> Add to Apple Wallet
          </button>
          <button type="button" onClick={() => setWallet('google')} className="btn border border-line bg-white px-3.5 py-2 text-sm hover:bg-surface">
            <Wallet className="size-4" /> Add to Google Wallet
          </button>
          <Link to={`/sell?order=${ticket.orderRef}`} className="ml-auto text-sm font-semibold text-brand hover:underline">
            Can't go? Resell it
          </Link>
        </div>
      )}

      {wallet && <WalletPreview wallet={wallet} ticket={ticket} event={event} place={place} onClose={closeWallet} />}
    </li>
  )
}
