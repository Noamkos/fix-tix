import { useState } from 'react'
import { Link } from 'react-router'
import { CalendarDays, Loader2, Plus } from 'lucide-react'
import { useStore } from '../../store/useStore.js'
import { getCurrentUser } from '../../lib/selectors.js'
import { cancelListing } from '../../fixtix/listings.js'
import { placeText } from '../../demotix/tickets.js'
import { priceBreakdown } from '../../lib/pricing.js'
import { formatAgo, formatEventDate, formatMoney, plural } from '../../lib/format.js'
import { useNow } from '../../lib/useNow.js'
import { EventCover } from '../../components/EventCover.jsx'

const STATUS = {
  live: { label: 'Live', className: 'bg-emerald-100 text-emerald-800' },
  reserved: { label: 'Reserved', className: 'bg-amber-100 text-amber-800' },
  sold: { label: 'Sold', className: 'bg-brand-50 text-brand-700' },
  cancelled: { label: 'Cancelled', className: 'bg-surface text-muted' },
}

const selectMine = (s) => {
  const user = getCurrentUser(s)
  return s.fixtix.listings.filter((l) => l.sellerId === user?.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

const selectPayouts = (s) => {
  const mine = s.fixtix.payouts.filter((p) => p.sellerId === s.session.userId)
  const sum = (status) => mine.filter((p) => p.status === status).reduce((t, p) => t + p.amountCents, 0)
  return { pending: sum('pending'), paid: sum('paid') }
}

export default function MyListings() {
  const listings = useStore(selectMine)
  const payouts = useStore(selectPayouts)
  const live = listings.filter((l) => l.status === 'live').length

  return (
    <section className="container-page py-10 sm:py-14">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[30px] font-bold tracking-tight sm:text-[36px]">My listings</h1>
          <p className="mt-1 text-muted">Tickets you're selling, and the money on its way to you.</p>
        </div>
        <Link to="/sell" className="btn-primary">
          <Plus className="size-4" /> Sell a ticket
        </Link>
      </div>

      <div className="mt-6 grid grid-cols-3 gap-2 sm:gap-3">
        <Stat label="Live listings" value={live} />
        <Stat label="Money on the way" value={formatMoney(payouts.pending)} hint="Released once the buyer's new ticket is issued" />
        <Stat label="Paid out" value={formatMoney(payouts.paid)} />
      </div>

      {listings.length ? (
        <ul className="mt-8 space-y-3">
          {listings.map((l) => (
            <ListingRow key={l.id} listing={l} />
          ))}
        </ul>
      ) : (
        <div className="tile mt-8 flex flex-col items-center px-6 py-14 text-center">
          <p className="text-lg font-semibold">You're not selling anything yet</p>
          <p className="mt-1 max-w-sm text-muted">Can't make it to an event? List your ticket and a fan gets a brand-new ticket in their name.</p>
          <Link to="/sell" className="btn-primary mt-5">
            Sell a ticket
          </Link>
        </div>
      )}
    </section>
  )
}

function Stat({ label, value, hint }) {
  return (
    <div className="tile p-3 sm:p-4">
      <p className="text-xs leading-snug text-muted sm:text-sm">{label}</p>
      <p className="mt-1 text-lg font-bold tabular-nums sm:text-2xl">{value}</p>
      {hint && <p className="mt-1 hidden text-xs text-subtle sm:block">{hint}</p>}
    </div>
  )
}

function ListingRow({ listing }) {
  const event = useStore((s) => s.events.find((e) => e.id === listing.eventId))
  const tickets = useStore((s) => s.demotix.tickets.filter((t) => listing.ticketIds.includes(t.id)))
  const settings = useStore((s) => s.settings)
  const now = useNow()
  const [confirming, setConfirming] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const status = STATUS[listing.status] ?? STATUS.live
  const { total } = priceBreakdown(listing.priceCents, settings)

  async function cancel() {
    setBusy(true)
    setError('')
    const res = await cancelListing(listing.id)
    setBusy(false)
    setConfirming(false)
    if (!res.ok) setError(res.message)
  }

  return (
    <li className="overflow-hidden rounded-card border border-line">
      <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
        <div className="hidden h-[72px] w-[112px] shrink-0 overflow-hidden rounded-lg sm:block">
          <EventCover cover={event.cover} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-[17px] font-semibold">{event.name}</h2>
            <span className={`pill ${status.className}`}>{status.label}</span>
          </div>
          <p className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-coral">
            <CalendarDays className="size-4" /> {formatEventDate(event.startsAt)}
          </p>
          <p className="mt-1 text-sm text-muted">
            {tickets.map((t) => `Ticket ${t.id} · ${placeText(t, event)}`).join(', ')}
          </p>
          {listing.soldTicketIds.length > 0 && listing.status !== 'sold' && (
            <p className="mt-1 text-sm font-semibold text-brand">
              {listing.soldTicketIds.length} of {listing.ticketIds.length} sold
            </p>
          )}
          {listing.status === 'reserved' && <p className="mt-1 text-sm text-amber-700">A fan is paying for it right now.</p>}
        </div>
        <div className="flex items-end justify-between gap-6 sm:block sm:text-right">
          <div>
            <p className="text-lg font-bold tabular-nums">
              {formatMoney(listing.priceCents)}
              <span className="text-sm font-normal text-muted"> {listing.ticketIds.length > 1 ? 'each' : ''}</span>
            </p>
            <p className="text-xs text-muted">Fans pay {formatMoney(total)}</p>
          </div>
          <p className="text-xs text-subtle sm:mt-1">
            {listing.ticketIds.length > 1 && `${listing.splitMode === 'all' ? 'All together' : 'One or more'} · `}
            Listed {formatAgo(listing.createdAt, now)}
          </p>
        </div>
      </div>

      {listing.status === 'live' && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line bg-surface/40 px-4 py-3">
          {confirming ? (
            <>
              <p className="text-sm font-medium">
                Cancel this listing? DemoTix will unlock your {plural(listing.ticketIds.length, 'ticket')} and {listing.ticketIds.length === 1 ? "it's" : "they're"}{' '}
                yours again.
              </p>
              <div className="flex gap-2">
                <button type="button" onClick={() => setConfirming(false)} disabled={busy} className="btn-ghost px-3.5 py-2 text-sm">
                  Keep it
                </button>
                <button type="button" onClick={cancel} disabled={busy} className="btn bg-danger px-3.5 py-2 text-sm text-white hover:bg-danger/90">
                  {busy ? (
                    <>
                      <Loader2 className="size-4 animate-spin" /> Unlocking…
                    </>
                  ) : (
                    'Yes, cancel listing'
                  )}
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="text-sm text-muted">Locked at DemoTix while it's for sale.</p>
              <button type="button" onClick={() => setConfirming(true)} className="btn-ghost px-3.5 py-2 text-sm text-danger hover:bg-danger/5">
                Cancel listing
              </button>
            </>
          )}
          {error && <p className="w-full text-sm text-danger">{error}</p>}
        </div>
      )}
    </li>
  )
}
