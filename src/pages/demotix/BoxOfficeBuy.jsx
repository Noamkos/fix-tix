import { useState } from 'react'
import { Link, useParams } from 'react-router'
import { ArrowLeft, ArrowRight, CalendarDays, Check, Copy, CreditCard, MapPin, Minus, Plus } from 'lucide-react'
import { useStore } from '../../store/useStore.js'
import { buyFromBoxOffice, MAX_PER_ORDER } from '../../demotix/boxOffice.js'
import { placeText } from '../../demotix/tickets.js'
import { formatEventDate, formatMoney } from '../../lib/format.js'
import { EventCover } from '../../components/EventCover.jsx'
import { LogoMark } from '../../components/Logo.jsx'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const selectPersonas = (s) => s.fixtix.users.filter((u) => u.persona)

export default function BoxOfficeBuy() {
  const { eventId } = useParams()
  const event = useStore((s) => s.events.find((e) => e.id === eventId))
  const [order, setOrder] = useState(null)

  if (!event) {
    return (
      <div className="flex-1 bg-white px-4 py-24 text-center text-ink">
        <h1 className="text-2xl font-bold">Event not found</h1>
        <Link to="/demotix" className="btn mt-6 bg-dtx text-white hover:bg-dtx-600">
          Back to box office
        </Link>
      </div>
    )
  }

  return (
    <div className="flex-1 bg-white text-ink">
      <div className="mx-auto w-full max-w-[1100px] px-4 py-6 sm:px-6 sm:py-8">
        {order ? (
          <OrderConfirmation order={order} event={event} />
        ) : (
          <>
            <Link to="/demotix" className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-dtx">
              <ArrowLeft className="size-4" /> All events
            </Link>
            <div className="mt-4 grid gap-8 lg:grid-cols-[1fr_420px]">
              <EventDetails event={event} />
              <PurchaseForm event={event} onBought={setOrder} />
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function EventDetails({ event }) {
  return (
    <section>
      <div className="aspect-[16/9] overflow-hidden rounded-card">
        <EventCover cover={event.cover} />
      </div>
      <h1 className="mt-5 text-[28px] leading-tight font-bold tracking-tight sm:text-[34px]">{event.name}</h1>
      <div className="mt-3 space-y-1.5 text-[15px] text-muted">
        <p className="flex items-center gap-2">
          <CalendarDays className="size-4 text-dtx" /> {formatEventDate(event.startsAt)}
        </p>
        <p className="flex items-center gap-2">
          <MapPin className="size-4 text-dtx" /> {event.venue}, {event.city}, {event.country}
        </p>
      </div>
      <p className="mt-4 leading-relaxed">{event.description}</p>
      {event.lineup.length > 1 && (
        <p className="mt-3 text-sm text-muted">
          <span className="font-semibold text-ink">Line-up: </span>
          {event.lineup.join(' · ')}
        </p>
      )}
    </section>
  )
}

function PurchaseForm({ event, onBought }) {
  const personas = useStore(selectPersonas)
  const [typeId, setTypeId] = useState(event.ticketTypes[0].id)
  const [quantity, setQuantity] = useState(1)
  const [buyer, setBuyer] = useState({ name: personas[0]?.name ?? '', email: personas[0]?.email ?? '' })
  const [errors, setErrors] = useState({})
  const [paying, setPaying] = useState(false)

  const type = event.ticketTypes.find((t) => t.id === typeId)
  const total = type.priceCents * quantity

  async function pay(e) {
    e.preventDefault()
    const found = {}
    if (!buyer.name.trim()) found.name = 'Enter the name the ticket is issued to'
    if (!EMAIL_RE.test(buyer.email.trim())) found.email = 'Enter a valid email address'
    setErrors(found)
    if (Object.keys(found).length) return

    setPaying(true)
    await sleep(900)
    onBought(buyFromBoxOffice({ eventId: event.id, ticketTypeId: typeId, quantity, buyer }))
  }

  return (
    <form onSubmit={pay} className="self-start rounded-2xl border border-line p-5 shadow-[0_12px_32px_-20px_rgba(15,10,12,0.35)] sm:p-6" noValidate>
      <fieldset>
        <legend className="text-lg font-bold">Tickets</legend>
        <div className="mt-3 space-y-2">
          {event.ticketTypes.map((t) => (
            <label
              key={t.id}
              className={`flex cursor-pointer items-center justify-between gap-3 rounded-xl border-2 px-4 py-3 transition-colors ${
                t.id === typeId ? 'border-dtx bg-dtx-50' : 'border-line hover:border-surface-2'
              }`}
            >
              <span className="flex items-center gap-3">
                <input type="radio" name="ticket-type" value={t.id} checked={t.id === typeId} onChange={() => setTypeId(t.id)} className="accent-dtx" />
                <span>
                  <span className="block font-semibold">{t.name}</span>
                  {(t.seated || t.name !== 'Standing') && (
                    <span className="block text-sm text-muted">{t.seated ? 'Reserved seating' : 'Standing'}</span>
                  )}
                </span>
              </span>
              <span className="font-bold tabular-nums">{formatMoney(t.priceCents)}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="mt-5 flex items-center justify-between">
        <span className="font-semibold">Quantity</span>
        <div className="flex items-center gap-1 rounded-xl border border-line p-1">
          <button type="button" aria-label="One less" disabled={quantity <= 1} onClick={() => setQuantity((q) => q - 1)} className="grid size-9 place-items-center rounded-lg hover:bg-surface disabled:opacity-30">
            <Minus className="size-4" />
          </button>
          <span className="w-8 text-center font-bold tabular-nums" aria-live="polite">
            {quantity}
          </span>
          <button type="button" aria-label="One more" disabled={quantity >= MAX_PER_ORDER} onClick={() => setQuantity((q) => q + 1)} className="grid size-9 place-items-center rounded-lg hover:bg-surface disabled:opacity-30">
            <Plus className="size-4" />
          </button>
        </div>
      </div>

      <fieldset className="mt-6">
        <legend className="text-lg font-bold">Your details</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {personas.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => {
                setBuyer({ name: p.name, email: p.email })
                setErrors({})
              }}
              className={`pill border py-1.5 font-semibold ${buyer.email === p.email ? 'border-dtx bg-dtx-50 text-dtx' : 'border-line text-muted hover:text-ink'}`}
            >
              Fill as {p.name.split(' ')[0]}
            </button>
          ))}
        </div>
        <Field label="Full name" error={errors.name}>
          <input value={buyer.name} onChange={(e) => setBuyer({ ...buyer, name: e.target.value })} autoComplete="off" />
        </Field>
        <Field label="Email" error={errors.email}>
          <input type="email" value={buyer.email} onChange={(e) => setBuyer({ ...buyer, email: e.target.value })} autoComplete="off" />
        </Field>
      </fieldset>

      <div className="mt-6 flex items-center gap-3 rounded-xl bg-surface px-4 py-3 text-sm">
        <CreditCard className="size-5 shrink-0 text-muted" />
        <span>
          <span className="font-semibold">Test card •••• 4242.</span> <span className="text-muted">No real money is charged.</span>
        </span>
      </div>

      <div className="mt-5 flex items-baseline justify-between border-t border-line pt-4">
        <span className="text-muted">
          {quantity} × {formatMoney(type.priceCents)}
        </span>
        <span className="text-xl font-bold tabular-nums">{formatMoney(total)}</span>
      </div>

      <button type="submit" disabled={paying} className="btn mt-4 w-full bg-dtx py-3.5 text-[16px] text-white hover:bg-dtx-600">
        {paying ? 'Processing payment…' : `Pay ${formatMoney(total)}`}
      </button>
    </form>
  )
}

function Field({ label, error, children }) {
  return (
    <label className="mt-3 block">
      <span className="text-sm font-semibold">{label}</span>
      <span
        className={`mt-1 block rounded-xl border px-3.5 py-3 focus-within:border-dtx focus-within:ring-2 focus-within:ring-dtx/20 [&>input]:w-full [&>input]:bg-transparent [&>input]:outline-none ${
          error ? 'border-danger' : 'border-line'
        }`}
      >
        {children}
      </span>
      {error && <span className="mt-1 block text-sm text-danger">{error}</span>}
    </label>
  )
}

function OrderConfirmation({ order, event }) {
  const tickets = useStore((s) => s.demotix.tickets.filter((t) => order.ticketIds.includes(t.id)))
  const [copied, setCopied] = useState(false)

  async function copyOrderRef() {
    try {
      await navigator.clipboard.writeText(order.orderRef)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      // Clipboard can be blocked; the number is on screen anyway.
    }
  }

  return (
    <div className="mx-auto max-w-2xl py-4 sm:py-8">
      <div className="text-center">
        <span className="mx-auto grid size-16 place-items-center rounded-full bg-emerald-100 text-emerald-600">
          <Check className="size-8" strokeWidth={3} />
        </span>
        <h1 className="mt-4 text-[30px] font-bold tracking-tight">You're going!</h1>
        <p className="mt-1 text-muted">
          {order.ticketIds.length === 1 ? 'Your ticket' : `Your ${order.ticketIds.length} tickets`} for {event.name}, issued to{' '}
          {order.owner.name}.
        </p>
      </div>

      <div className="mt-8 flex items-center justify-between gap-4 rounded-card bg-dtx-50 px-5 py-4">
        <div>
          <div className="text-sm font-semibold text-dtx">Order number</div>
          <div className="font-mono text-2xl font-bold tracking-wide">{order.orderRef}</div>
          <div className="mt-1 text-sm text-muted">Keep it: you'll need it to resell on FixTix.</div>
        </div>
        <button type="button" onClick={copyOrderRef} className="btn shrink-0 bg-white px-3.5 py-2 text-sm text-dtx hover:bg-white/70">
          {copied ? <Check className="size-4" /> : <Copy className="size-4" />} {copied ? 'Copied' : 'Copy'}
        </button>
      </div>

      <ul className="mt-4 space-y-3">
        {tickets.map((t) => (
          <li key={t.id} className="flex overflow-hidden rounded-card border border-line">
            <div className="w-2 shrink-0 bg-dtx" />
            <div className="flex flex-1 flex-wrap items-center justify-between gap-3 px-4 py-3">
              <div>
                <div className="font-bold">Ticket {t.id}</div>
                <div className="text-sm text-muted">{placeText(t, event)}</div>
              </div>
              <div className="font-mono text-sm font-semibold tracking-wide">{t.barcode}</div>
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-6 rounded-card border border-brand/30 bg-brand-50 p-5">
        <div className="flex items-start gap-3">
          <LogoMark className="size-9 shrink-0 text-brand" />
          <div>
            <p className="font-bold">Can't make it? Resell it on FixTix.</p>
            <p className="mt-1 text-sm leading-relaxed text-muted">
              Our official resale partner. The buyer gets a brand-new ticket in their name, and you get back what you paid.
            </p>
            <Link to={`/sell?order=${order.orderRef}`} className="btn-primary mt-3 px-4 py-2.5 text-sm">
              Resell on FixTix <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </div>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Link to={`/demotix/database?ticket=${order.ticketIds[0]}`} className="btn bg-dtx text-white hover:bg-dtx-600">
          See it in the ticket database
        </Link>
        <Link to="/demotix" className="btn-secondary">
          Back to box office
        </Link>
      </div>
    </div>
  )
}
