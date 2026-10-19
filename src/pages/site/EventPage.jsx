import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { BadgeCheck, CalendarDays, ChevronRight, Loader2, MapPin, Ticket } from 'lucide-react'
import { useStore } from '../../store/useStore.js'
import { getCurrentUser, getEvent, getEventSummary } from '../../lib/selectors.js'
import { activeOffers, availableTicketIds, blockedTicketIds, isHoldActive } from '../../fixtix/availability.js'
import { useEventCheck } from '../../fixtix/eventCheck.js'
import { priceBreakdown } from '../../lib/pricing.js'
import { formatCountdown, formatEventDate, formatMoney, formatTime, plural } from '../../lib/format.js'
import { useNow } from '../../lib/useNow.js'
import { WaitlistBox } from '../../components/WaitlistBox.jsx'
import { CATEGORIES } from '../../data/seed.js'
import { EventCover } from '../../components/EventCover.jsx'
import { Avatar } from '../../components/layout/UserMenu.jsx'

// Everything the event page needs, in one pass over the state.
function selectOffers(eventId) {
  return (s) => {
    const user = getCurrentUser(s)
    const offers = s.fixtix.listings
      .filter((l) => l.eventId === eventId)
      .map((listing) => {
        const free = availableTicketIds(s, listing, { viewerId: user?.id })
        const myHold = user ? s.fixtix.orders.find((o) => o.listingId === listing.id && o.buyerId === user.id && isHoldActive(o)) : null
        const myOffer = user ? activeOffers(s, listing.id).find((o) => o.userId === user.id) : null
        return {
          listing,
          free,
          myHold,
          myOffer,
          tickets: s.demotix.tickets.filter((t) => free.concat(myHold?.ticketIds ?? []).includes(t.id)),
          seller: s.fixtix.users.find((u) => u.id === listing.sellerId),
        }
      })
      .filter((o) => o.free.length || o.myHold)
      .sort((a, b) => a.listing.priceCents - b.listing.priceCents)
    const heldByOthers = s.fixtix.listings
      .filter((l) => l.eventId === eventId)
      .flatMap((l) => blockedTicketIds(s, l.id))
      .filter((id) => !offers.some((o) => o.myHold?.ticketIds.includes(id))).length
    // Tickets offered exclusively to other fans on the waitlist (rule 6), and when they open up.
    const offeredToOthers = s.fixtix.listings
      .filter((l) => l.eventId === eventId)
      .flatMap((l) => activeOffers(s, l.id).filter((o) => o.userId !== user?.id))
    return { offers, heldByOthers, offeredToOthers }
  }
}

export default function EventPage() {
  const { eventId } = useParams()
  const event = useStore((s) => getEvent(s, eventId))
  const summary = useStore((s) => getEventSummary(s, eventId))
  const { offers, heldByOthers, offeredToOthers } = useStore(selectOffers(eventId))
  const user = useStore(getCurrentUser)
  const settings = useStore((s) => s.settings)
  const check = useEventCheck(eventId)

  if (!event) {
    return (
      <section className="container-page py-24 text-center">
        <h1 className="text-[28px] font-bold">Event not found</h1>
        <Link to="/" className="btn-primary mt-6">
          Back to events
        </Link>
      </section>
    )
  }

  const category = CATEGORIES.find((c) => c.id === event.category)

  return (
    <>
      <div className="container-page pt-4">
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm text-muted">
          <Link to="/" className="underline-offset-2 hover:underline">
            Home
          </Link>
          <ChevronRight className="size-3.5" />
          <span>{category?.label}</span>
          <ChevronRight className="size-3.5" />
          <span className="truncate text-ink/70">{event.name}</span>
        </nav>
      </div>

      <div className="relative mt-4 h-24 overflow-hidden sm:h-28" aria-hidden="true">
        <EventCover cover={event.cover} className="scale-110 blur-xl" />
        <div className="absolute inset-0 bg-black/25" />
      </div>

      <div className="container-page grid gap-8 lg:grid-cols-[360px_1fr] lg:gap-12">
        <aside className="-mt-16 sm:-mt-20">
          <div className="aspect-[16/10] overflow-hidden rounded-card shadow-[0_12px_32px_-16px_rgba(15,10,12,0.5)] ring-4 ring-white">
            <EventCover cover={event.cover} />
          </div>
          <h1 className="mt-5 text-[30px] leading-[1.1] font-bold tracking-tight">{event.name}</h1>
          <div className="mt-3 space-y-1.5 text-[15px]">
            <p className="flex items-center gap-2 font-semibold text-coral">
              <CalendarDays className="size-4" /> {formatEventDate(event.startsAt)}
            </p>
            <p className="flex items-center gap-2 text-muted">
              <MapPin className="size-4" /> {event.venue}, {event.city}, {event.country}
            </p>
          </div>
          <EventCheckBadge check={check} />
          <p className="mt-4 leading-relaxed text-ink/85">{event.description}</p>
          {event.lineup.length > 1 && (
            <p className="mt-3 text-sm text-muted">
              <span className="font-semibold text-ink">Line-up: </span>
              {event.lineup.join(' · ')}
            </p>
          )}
          <Link to="/sell" className="btn-primary mt-5 w-full">
            Sell your tickets
          </Link>
        </aside>

        <section aria-labelledby="tickets-title" className="lg:pt-8">
          {event.status === 'cancelled' && (
            <p className="mb-5 rounded-card border border-danger/30 bg-danger/5 px-4 py-3 font-semibold text-danger">
              This event was cancelled by the organiser. DemoTix refunds ticket holders directly.
            </p>
          )}

          <h2 id="tickets-title" className="text-[28px] font-bold tracking-tight">
            Tickets
          </h2>
          <p className="mt-1 text-muted">
            {summary.available} available · {summary.sold} sold · {summary.waitlistTickets} wanted
          </p>

          <WaitlistBox event={event} user={user} />

          <h3 className="mt-8 text-lg font-bold">Original price</h3>
          <ul className="mt-2 flex flex-wrap gap-2">
            {event.ticketTypes.map((t) => (
              <li key={t.id} className="tile px-4 py-2.5 text-sm">
                <span className="font-semibold">{t.name}</span> <span className="text-muted">· {formatMoney(t.priceCents)}</span>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-sm text-muted">Fans can never sell above the original price.</p>

          <h3 className="mt-8 text-lg font-bold">Available tickets</h3>
          {offers.length ? (
            <ul className="mt-3 space-y-3">
              {offers.map((offer) => (
                <Offer key={offer.listing.id} offer={offer} event={event} settings={settings} user={user} />
              ))}
            </ul>
          ) : (
            <div className="tile mt-3 px-5 py-8 text-center">
              <Ticket className="mx-auto size-7 text-subtle" />
              <p className="mt-2 font-semibold">No tickets for sale right now</p>
              <p className="mt-1 text-sm text-muted">Join the waitlist and you'll be first to know when a fan sells.</p>
            </div>
          )}
          {offeredToOthers.length > 0 && (
            <p className="mt-3 text-sm text-muted">
              {offeredToOthers.reduce((n, o) => n + o.ticketIds.length, 0) === 1 ? '1 ticket is' : 'Some tickets are'} being offered first to fans
              on the waitlist. If they don't buy, the offer moves on at {formatTime(offeredToOthers.map((o) => o.expiresAt).sort().at(-1))}.
            </p>
          )}
          {heldByOthers > 0 && (
            <p className="mt-3 text-sm text-muted">
              {heldByOthers === 1 ? '1 more ticket is' : `${heldByOthers} more tickets are`} reserved by a fan who's paying right now.
            </p>
          )}

          <p className="mt-8 flex items-start gap-2.5 rounded-card bg-brand-50 px-4 py-3 text-sm leading-relaxed">
            <BadgeCheck className="mt-0.5 size-4 shrink-0 text-brand" />
            Every ticket here was verified with DemoTix and is locked while it's for sale. When you buy, the old barcode is voided and a
            brand-new ticket is issued in your name.
          </p>
        </section>
      </div>
    </>
  )
}

function EventCheckBadge({ check }) {
  if (!check) {
    return (
      <p className="mt-3 inline-flex items-center gap-1.5 text-sm text-muted">
        <Loader2 className="size-4 animate-spin" /> Checking event details with DemoTix…
      </p>
    )
  }
  if (!check.ok) return null
  return (
    <p className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-success">
      <BadgeCheck className="size-4" /> Event details confirmed by DemoTix
    </p>
  )
}

function placeLines(tickets, event) {
  const type = event.ticketTypes.find((t) => t.id === tickets[0]?.ticketTypeId)
  if (!tickets[0]?.section) return { area: type?.name ?? 'General Admission', detail: 'No reserved seat' }
  const seats = tickets.map((t) => t.seat).join(', ')
  return { area: tickets[0].section, detail: `Row ${tickets[0].row} · ${tickets.length > 1 ? 'Seats' : 'Seat'} ${seats}` }
}

function Offer({ offer, event, settings, user }) {
  const navigate = useNavigate()
  const { listing, free, myHold, myOffer, tickets, seller } = offer
  const now = useNow(1000)
  const [qty, setQty] = useState(listing.splitMode === 'all' ? free.length : 1)
  const b = priceBreakdown(listing.priceCents, settings)
  const face = event.ticketTypes.find((t) => t.id === tickets[0]?.ticketTypeId)?.priceCents ?? listing.priceCents
  const mine = user?.id === listing.sellerId
  const { area, detail } = placeLines(tickets, event)
  const count = listing.splitMode === 'all' ? free.length : qty

  return (
    <li className={`overflow-hidden rounded-card border p-4 transition-colors sm:p-5 ${myOffer ? 'border-brand ring-2 ring-brand/20' : 'border-line hover:border-surface-2'}`}>
      {myOffer && (
        <p className="-mx-4 -mt-4 mb-4 flex flex-wrap items-center justify-between gap-2 bg-brand px-4 py-2.5 text-sm font-semibold text-white sm:-mx-5 sm:-mt-5 sm:px-5">
          <span>You're next in line: reserved for you</span>
          <span className="tabular-nums">{formatCountdown(new Date(myOffer.expiresAt).getTime() - now)} left</span>
        </p>
      )}
      <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
        <div className="min-w-0">
          <p className="text-[17px] font-semibold">{area}</p>
          <p className="text-sm text-muted">{detail}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="pill bg-emerald-50 text-success">
              <BadgeCheck className="size-3.5" /> Verified by DemoTix
            </span>
            <span className="pill bg-surface text-ink">{plural(free.length || myHold?.ticketIds.length || 0, 'ticket')}</span>
            {listing.splitMode === 'all' && listing.ticketIds.length > 1 && <span className="pill bg-surface text-ink">Sold together</span>}
            {listing.priceCents < face && (
              <span className="pill bg-brand-50 text-brand-700">{formatMoney(face - listing.priceCents)} below original</span>
            )}
          </div>
        </div>
        <div className="sm:text-right">
          <p className="text-2xl font-bold tabular-nums">{formatMoney(b.total)}</p>
          <p className="text-xs text-muted">
            {formatMoney(b.ticket)} + {formatMoney(b.fee)} fee, per ticket
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
        <span className="flex items-center gap-2 text-sm text-muted">
          <Avatar user={seller} className="size-7 text-[11px]" /> Sold by {seller.name.split(' ')[0]}
        </span>

        {mine ? (
          <Link to="/my-listings" className="pill bg-surface px-3 py-2 text-sm text-ink">
            Your listing
          </Link>
        ) : myHold ? (
          <Link to={`/checkout/${myHold.id}`} className="btn-primary px-5 py-2.5 text-sm">
            Reserved for you · Continue
          </Link>
        ) : (
          <div className="flex items-center gap-2">
            {listing.splitMode !== 'all' && free.length > 1 && (
              <label className="flex items-center gap-2 text-sm">
                <span className="sr-only">Quantity</span>
                <select value={qty} onChange={(e) => setQty(Number(e.target.value))} className="h-10 rounded-lg border border-surface-2 bg-white px-2.5 font-semibold">
                  {free.map((_, i) => (
                    <option key={i} value={i + 1}>
                      {i + 1}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <button
              type="button"
              onClick={() => navigate(`/checkout?listing=${listing.id}&qty=${count}`)}
              className="btn-primary px-5 py-2.5 text-sm"
            >
              {count > 1 ? `Buy ${count} · ${formatMoney(b.total * count)}` : 'Buy'}
            </button>
          </div>
        )}
      </div>
    </li>
  )
}
