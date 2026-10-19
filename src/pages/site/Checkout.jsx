import { useEffect, useState } from 'react'
import { Link, Navigate, useNavigate, useParams, useSearchParams } from 'react-router'
import { BadgeCheck, CalendarDays, Clock, CreditCard, Loader2, MapPin, RefreshCw, ShieldCheck, Undo2 } from 'lucide-react'
import { useStore } from '../../store/useStore.js'
import { getCurrentUser } from '../../lib/selectors.js'
import { holdTickets, payOrder, releaseHold } from '../../fixtix/checkout.js'
import { isHoldActive } from '../../fixtix/availability.js'
import { formatEventDate, formatMoney, plural } from '../../lib/format.js'
import { useNow } from '../../lib/useNow.js'
import { placeText } from '../../demotix/tickets.js'
import { EventCover } from '../../components/EventCover.jsx'
import { DemoTip } from '../../components/DemoTip.jsx'

const AFTER_PAYMENT = ['paid', 'swapping', 'completed', 'refunded', 'partially_refunded']

// /checkout?listing=…&qty=…  Reserve the tickets, then continue at /checkout/<order>.
export function CheckoutStart() {
  const [params] = useSearchParams()
  const user = useStore(getCurrentUser)
  const navigate = useNavigate()
  const [error, setError] = useState(null)
  const listingId = params.get('listing')
  const eventId = useStore((s) => s.fixtix.listings.find((l) => l.id === listingId)?.eventId)

  useEffect(() => {
    const res = holdTickets({ buyerId: user.id, listingId, quantity: Number(params.get('qty')) || 1 })
    if (res.ok) navigate(`/checkout/${res.orderId}`, { replace: true })
    else setError(res.message)
    // Runs once per visit; holdTickets returns the same hold if it runs again.
  }, [])

  return (
    <section className="container-page flex flex-col items-center py-24 text-center">
      {error ? (
        <>
          <h1 className="text-[26px] font-bold tracking-tight">This ticket isn't available</h1>
          <p className="mt-2 max-w-md text-muted">{error}</p>
          <Link to={eventId ? `/event/${eventId}` : '/'} className="btn-primary mt-6">
            Back to the event
          </Link>
        </>
      ) : (
        <p className="flex items-center gap-2 text-muted">
          <Loader2 className="size-5 animate-spin" /> Reserving your ticket…
        </p>
      )}
    </section>
  )
}

const selectCheckout = (orderId) => (s) => {
  const order = s.fixtix.orders.find((o) => o.id === orderId)
  if (!order) return null
  return {
    order,
    event: s.events.find((e) => e.id === order.eventId),
    seller: s.fixtix.users.find((u) => u.id === order.sellerId),
    tickets: s.demotix.tickets.filter((t) => order.ticketIds.includes(t.id)),
  }
}

// /checkout/<order>: price breakdown, 10-minute hold, mock payment.
export default function Checkout() {
  const { orderId } = useParams()
  const user = useStore(getCurrentUser)
  const data = useStore(selectCheckout(orderId))
  const now = useNow(1000)
  const navigate = useNavigate()
  const [failReissue, setFailReissue] = useState(false)
  const [paying, setPaying] = useState(false)
  const [error, setError] = useState('')

  if (!data || data.order.buyerId !== user.id) {
    return (
      <section className="container-page py-24 text-center">
        <h1 className="text-[26px] font-bold">Checkout not found</h1>
        <Link to="/" className="btn-primary mt-6">
          Back to events
        </Link>
      </section>
    )
  }

  const { order, event, seller, tickets } = data
  if (AFTER_PAYMENT.includes(order.status)) return <Navigate to={`/swap/${order.id}`} replace />

  const msLeft = new Date(order.holdUntil).getTime() - now
  const active = isHoldActive(order, now)
  const n = order.ticketIds.length

  if (!active) {
    return (
      <section className="container-page flex flex-col items-center py-24 text-center">
        <span className="grid size-14 place-items-center rounded-full bg-surface text-subtle">
          <Clock className="size-7" />
        </span>
        <h1 className="mt-4 text-[26px] font-bold tracking-tight">{order.status === 'released' ? 'Reservation cancelled' : 'Your reservation ran out'}</h1>
        <p className="mt-2 max-w-md text-muted">The ticket is back on sale for every fan. If it's still there, you can reserve it again.</p>
        <Link to={`/event/${event.id}`} className="btn-primary mt-6">
          Back to the event
        </Link>
      </section>
    )
  }

  const minutes = Math.floor(msLeft / 60000)
  const seconds = Math.floor((msLeft % 60000) / 1000)
  const urgent = msLeft < 60000

  async function pay() {
    setPaying(true)
    setError('')
    await new Promise((r) => setTimeout(r, 900))
    const res = payOrder(order.id, { failReissue })
    if (!res.ok) {
      setPaying(false)
      return setError(res.message)
    }
    navigate(`/swap/${order.id}`)
  }

  return (
    <section className="container-page py-10 sm:py-14">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-[30px] font-bold tracking-tight sm:text-[36px]">Checkout</h1>
        <span
          role="timer"
          aria-live="off"
          className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold tabular-nums ${urgent ? 'bg-coral text-white' : 'bg-amber-100 text-amber-900'}`}
        >
          <Clock className="size-4" /> Reserved for you · {minutes}:{String(seconds).padStart(2, '0')}
        </span>
      </div>
      <p className="mt-1 text-muted">Nobody else can buy {n === 1 ? 'this ticket' : 'these tickets'} while you pay.</p>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_400px]">
        <div className="space-y-4">
          <div className="flex gap-4 rounded-card border border-line p-4">
            <div className="hidden h-[72px] w-[112px] shrink-0 overflow-hidden rounded-lg sm:block">
              <EventCover cover={event.cover} />
            </div>
            <div className="min-w-0">
              <p className="text-[17px] font-semibold">{event.name}</p>
              <p className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-coral">
                <CalendarDays className="size-4" /> {formatEventDate(event.startsAt)}
              </p>
              <p className="mt-0.5 flex items-center gap-1.5 text-sm text-muted">
                <MapPin className="size-4" /> {event.venue}, {event.city}
              </p>
            </div>
          </div>

          <div className="rounded-card border border-line p-4">
            <p className="font-semibold">{plural(n, 'ticket')}</p>
            <ul className="mt-1 text-sm text-muted">
              {tickets.map((t) => (
                <li key={t.id}>{placeText(t, event)}</li>
              ))}
            </ul>
            <p className="mt-3 flex items-center gap-1.5 text-sm font-semibold text-success">
              <BadgeCheck className="size-4" /> Verified by DemoTix · sold by {seller.name.split(' ')[0]}
            </p>
          </div>

          <ul className="space-y-2.5 rounded-card bg-surface p-4 text-sm">
            <li className="flex gap-2.5">
              <RefreshCw className="mt-0.5 size-4 shrink-0 text-brand" />
              <span>
                <span className="font-semibold">A brand-new ticket in your name.</span> The seller's barcode is voided the moment you buy.
              </span>
            </li>
            <li className="flex gap-2.5">
              <ShieldCheck className="mt-0.5 size-4 shrink-0 text-brand" />
              <span>
                <span className="font-semibold">Never above the original price.</span> FixTix caps every resale at the original price.
              </span>
            </li>
            <li className="flex gap-2.5">
              <Undo2 className="mt-0.5 size-4 shrink-0 text-brand" />
              <span>
                <span className="font-semibold">Full refund if anything fails.</span> If DemoTix can't issue your ticket, your money comes back
                automatically.
              </span>
            </li>
          </ul>
        </div>

        <div className="self-start rounded-2xl border border-line p-5 shadow-[0_12px_32px_-20px_rgba(15,10,12,0.35)] sm:p-6">
          <h2 className="text-lg font-bold">Price</h2>
          <dl className="mt-3 space-y-2 text-[15px]">
            <div className="flex justify-between">
              <dt className="text-muted">
                Ticket price{n > 1 ? ` (${formatMoney(order.unitCents)} × ${n})` : ''}
              </dt>
              <dd className="tabular-nums">{formatMoney(order.ticketCents)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">Service fee</dt>
              <dd className="tabular-nums">{formatMoney(order.feeCents)}</dd>
            </div>
            <div className="flex justify-between border-t border-line pt-3 text-lg font-bold">
              <dt>Total</dt>
              <dd className="tabular-nums">{formatMoney(order.totalCents)}</dd>
            </div>
          </dl>

          <div className="mt-5 flex items-center gap-3 rounded-xl bg-surface px-4 py-3 text-sm">
            <CreditCard className="size-5 shrink-0 text-muted" />
            <span>
              <span className="font-semibold">Test card •••• 4242.</span> <span className="text-muted">No real money is charged.</span>
            </span>
          </div>

          {error && (
            <p role="alert" className="mt-4 text-sm text-danger">
              {error}
            </p>
          )}

          <button type="button" onClick={pay} disabled={paying} className="btn-primary mt-4 w-full py-3.5 text-[16px]">
            {paying ? (
              <>
                <Loader2 className="size-4 animate-spin" /> Processing payment…
              </>
            ) : (
              `Pay ${formatMoney(order.totalCents)}`
            )}
          </button>
          <p className="mt-3 text-center text-xs leading-relaxed text-muted">The sale is final once your new ticket is issued.</p>

          <button
            type="button"
            onClick={() => {
              releaseHold(order.id)
              navigate(`/event/${event.id}`)
            }}
            disabled={paying}
            className="mt-4 w-full text-center text-sm font-semibold text-muted hover:text-ink"
          >
            Cancel and release the {n === 1 ? 'ticket' : 'tickets'}
          </button>
        </div>
      </div>

      <DemoTip className="mt-8">
        <label className="inline-flex cursor-pointer items-center gap-2 align-middle">
          <input type="checkbox" checked={failReissue} onChange={(e) => setFailReissue(e.target.checked)} className="size-4 accent-brand" />
          Make DemoTix fail the reissue
        </label>{' '}
        to show what happens then: the fan gets a full refund automatically and the ticket goes back on sale.
      </DemoTip>
    </section>
  )
}
