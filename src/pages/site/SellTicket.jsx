import { useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { ArrowLeft, ArrowRight, BadgeCheck, CalendarDays, Check, Loader2, Lock, MapPin, ShieldCheck, Wallet } from 'lucide-react'
import { useStore } from '../../store/useStore.js'
import { getCurrentUser } from '../../lib/selectors.js'
import { callDemoTix } from '../../demotix/api.js'
import { isSameOwner } from '../../fixtix/session.js'
import { publishListing } from '../../fixtix/listings.js'
import { priceBreakdown } from '../../lib/pricing.js'
import { formatEventDate, formatMoney, plural } from '../../lib/format.js'
import { DemoTixWordmark } from '../../components/Logo.jsx'
import { DemoTip } from '../../components/DemoTip.jsx'

const STEPS = ['Find your ticket', 'Choose tickets', 'Set your price']

// Why a ticket in the order can't be listed.
const UNAVAILABLE = {
  locked: 'Already listed for resale',
  voided: 'Already resold',
  scanned: 'Already used at the gate',
}

// "75", "75.5", "75,50", "€75" -> cents. Anything else -> null.
function parsePrice(text) {
  const clean = text.replace(/[€\s]/g, '').replace(',', '.')
  if (!/^\d+(\.\d{1,2})?$/.test(clean)) return null
  return Math.round(parseFloat(clean) * 100)
}

const centsToInput = (cents) => (cents / 100).toFixed(2)

// The current fan's own DemoTix orders that still have sellable tickets (demo shortcut).
const selectMyOrders = (s) => {
  const user = getCurrentUser(s)
  const refs = s.demotix.tickets.filter((t) => t.status === 'active' && isSameOwner(user, t.owner)).map((t) => t.orderRef)
  return [...new Set(refs)]
}

export default function SellTicket() {
  const [params] = useSearchParams()
  const user = useStore(getCurrentUser)
  const settings = useStore((s) => s.settings)
  const myOrders = useStore(selectMyOrders)

  const [step, setStep] = useState(0)
  const [orderRef, setOrderRef] = useState(params.get('order') ?? '')
  const [order, setOrder] = useState(null)
  const [selected, setSelected] = useState([])
  const [splitMode, setSplitMode] = useState('any')
  const [priceText, setPriceText] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [published, setPublished] = useState(null)

  // ---- Step 1: verify the order with DemoTix (rule 1) ----
  async function verify(e) {
    e.preventDefault()
    const ref = orderRef.trim().toUpperCase()
    if (!ref) return setError('Enter your order number')
    setBusy(true)
    setError('')
    const res = await callDemoTix('verify', { orderRef: ref })
    setBusy(false)

    if (!res.ok) return setError(`DemoTix has no order ${ref}. Check the number in your confirmation email.`)
    if (!isSameOwner(user, res.order.owner)) {
      return setError('This order is registered to someone else. Only the person the tickets are issued to can sell them.')
    }
    const sellable = res.order.tickets.filter((t) => t.status === 'active')
    if (!sellable.length) return setError('None of the tickets in this order can be sold. They are already listed, resold or used.')

    setOrder(res.order)
    setSelected(sellable.map((t) => t.ticketId))
    setPriceText(centsToInput(Math.min(...sellable.map((t) => t.pricePaidCents))))
    setStep(1)
  }

  const chosen = order ? order.tickets.filter((t) => selected.includes(t.ticketId)) : []
  const maxCents = chosen.length ? Math.min(...chosen.map((t) => t.pricePaidCents)) : 0
  const priceCents = parsePrice(priceText)
  const priceError =
    priceCents === null
      ? 'Enter a price, like 75 or 75.50'
      : priceCents > maxCents
        ? `The maximum is ${formatMoney(maxCents)}, the price you paid.`
        : priceCents < 100
          ? 'The minimum price is €1.00'
          : ''

  // ---- Step 3: DemoTix locks the tickets, then the listing goes live (rules 2 and 3) ----
  async function publish() {
    if (priceError || busy) return
    setBusy(true)
    setError('')
    const res = await publishListing({
      sellerId: user.id,
      eventId: order.event.eventId,
      ticketIds: chosen.map((t) => t.ticketId),
      priceCents,
      splitMode,
    })
    setBusy(false)
    if (!res.ok) return setError(`DemoTix couldn't lock the ticket: ${res.message}`)
    setPublished({ listingId: res.listingId, ticketIds: chosen.map((t) => t.ticketId), priceCents })
    setStep(3)
  }

  function restart() {
    setStep(0)
    setOrder(null)
    setPublished(null)
    setError('')
    setOrderRef('')
  }

  if (step === 3) {
    return <Published order={order} published={published} settings={settings} onSellAnother={restart} />
  }

  return (
    <section className="container-page py-10 sm:py-14">
      <div className="mx-auto max-w-[680px]">
        <h1 className="text-[30px] font-bold tracking-tight sm:text-[36px]">Sell a ticket</h1>
        <p className="mt-1 text-muted">Verified with the ticketing company, sold at a fair price, paid out once the buyer has their new ticket.</p>

        <Stepper current={step} />

        <div className="mt-6 rounded-2xl border border-line p-5 sm:p-7">
          {step === 0 && (
            <form onSubmit={verify} noValidate>
              <h2 className="text-xl font-bold">Where did you buy your ticket?</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="flex items-center justify-between rounded-xl border-2 border-brand bg-brand-50 px-4 py-3.5" aria-current="true">
                  <DemoTixWordmark className="text-lg text-ink" />
                  <Check className="size-5 text-brand" strokeWidth={3} />
                </div>
                <div className="flex items-center rounded-xl border-2 border-dashed border-line px-4 py-3.5 text-sm text-subtle">
                  More ticketing companies soon
                </div>
              </div>

              <label className="mt-6 block">
                <span className="font-semibold">Order number</span>
                <input
                  value={orderRef}
                  onChange={(e) => {
                    setOrderRef(e.target.value)
                    setError('')
                  }}
                  placeholder="e.g. DT-51034"
                  autoComplete="off"
                  className={`mt-1.5 block h-12 w-full rounded-lg border bg-white px-3.5 font-mono text-[16px] tracking-wide uppercase outline-none placeholder:font-sans placeholder:tracking-normal placeholder:normal-case focus:border-brand focus:ring-2 focus:ring-brand/20 ${
                    error ? 'border-danger' : 'border-surface-2'
                  }`}
                />
                <span className="mt-1.5 block text-sm text-muted">You'll find it in your DemoTix confirmation email.</span>
              </label>

              {error && <ErrorNote>{error}</ErrorNote>}

              <button type="submit" disabled={busy} className="btn-primary mt-6 w-full">
                {busy ? (
                  <>
                    <Loader2 className="size-4 animate-spin" /> Checking with DemoTix…
                  </>
                ) : (
                  <>
                    Verify with DemoTix <ArrowRight className="size-4" />
                  </>
                )}
              </button>

              <DemoTip className="mt-6">
                {myOrders.length ? (
                  <>
                    {user.name.split(' ')[0]}'s DemoTix {myOrders.length === 1 ? 'order' : 'orders'}:{' '}
                    {myOrders.map((ref, i) => (
                      <span key={ref}>
                        {i > 0 && ', '}
                        <button type="button" onClick={() => setOrderRef(ref)} className="font-mono font-bold text-brand hover:underline">
                          {ref}
                        </button>
                      </span>
                    ))}
                    . Click to fill it in.
                  </>
                ) : (
                  <>
                    {user.name.split(' ')[0]} has no unlisted DemoTix tickets.{' '}
                    <Link to="/demotix" className="font-semibold text-brand hover:underline">
                      Buy one in the DemoTix box office
                    </Link>{' '}
                    to sell it here.
                  </>
                )}
              </DemoTip>
            </form>
          )}

          {step === 1 && order && (
            <>
              <VerifiedOrder order={order} />

              <h2 className="mt-7 text-xl font-bold">Which tickets do you want to sell?</h2>
              <ul className="mt-3 space-y-2">
                {order.tickets.map((t) => {
                  const available = t.status === 'active'
                  const checked = selected.includes(t.ticketId)
                  return (
                    <li key={t.ticketId}>
                      <label
                        className={`flex items-center gap-3 rounded-xl border-2 px-4 py-3 ${
                          !available ? 'border-line bg-surface/50 opacity-60' : checked ? 'cursor-pointer border-brand bg-brand-50' : 'cursor-pointer border-line hover:border-surface-2'
                        }`}
                      >
                        <input
                          type="checkbox"
                          disabled={!available}
                          checked={checked}
                          onChange={() => setSelected((sel) => (checked ? sel.filter((id) => id !== t.ticketId) : [...sel, t.ticketId]))}
                          className="size-4 accent-brand"
                        />
                        <span className="flex-1">
                          <span className="block font-semibold">Ticket {t.ticketId}</span>
                          <span className="block text-sm text-muted">
                            {t.section ? `${t.section} · Row ${t.row} · Seat ${t.seat}` : t.ticketType}
                            {!available && ` · ${UNAVAILABLE[t.status] ?? t.status}`}
                          </span>
                        </span>
                        <span className="text-sm text-muted">paid {formatMoney(t.pricePaidCents)}</span>
                      </label>
                    </li>
                  )
                })}
              </ul>

              {selected.length > 1 && (
                <fieldset className="mt-6">
                  <legend className="text-lg font-bold">How can fans buy them?</legend>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    {[
                      { id: 'any', title: 'One or more', text: 'Fans can buy any number of these tickets.' },
                      { id: 'all', title: 'All together', text: `Sold only as a set of ${selected.length}.` },
                    ].map((opt) => (
                      <label
                        key={opt.id}
                        className={`cursor-pointer rounded-xl border-2 px-4 py-3 ${splitMode === opt.id ? 'border-brand bg-brand-50' : 'border-line hover:border-surface-2'}`}
                      >
                        <span className="flex items-center gap-2 font-semibold">
                          <input type="radio" name="split" checked={splitMode === opt.id} onChange={() => setSplitMode(opt.id)} className="accent-brand" />
                          {opt.title}
                        </span>
                        <span className="mt-0.5 block pl-6 text-sm text-muted">{opt.text}</span>
                      </label>
                    ))}
                  </div>
                </fieldset>
              )}

              <StepButtons
                onBack={() => {
                  setStep(0)
                  setOrder(null)
                }}
                onNext={() => {
                  setPriceText(centsToInput(maxCents))
                  setStep(2)
                }}
                nextDisabled={!selected.length}
                nextLabel="Continue"
              />
            </>
          )}

          {step === 2 && order && (
            <>
              <h2 className="text-xl font-bold">Set your price</h2>
              <p className="mt-1 text-muted">
                You paid {formatMoney(maxCents)}. You can lower the price, but never raise it.
              </p>

              <label className="mt-5 block max-w-[260px]">
                <span className="font-semibold">Price per ticket</span>
                <span
                  className={`mt-1.5 flex h-14 items-center gap-2 rounded-lg border bg-white px-4 focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/20 ${
                    priceError ? 'border-danger' : 'border-surface-2'
                  }`}
                >
                  <span className="text-xl font-bold text-muted">€</span>
                  <input
                    value={priceText}
                    onChange={(e) => setPriceText(e.target.value)}
                    inputMode="decimal"
                    aria-invalid={Boolean(priceError)}
                    className="w-full bg-transparent text-xl font-bold tabular-nums outline-none"
                  />
                </span>
              </label>
              {priceError && <p className="mt-1.5 text-sm text-danger">{priceError}</p>}

              {!priceError && <Breakdown priceCents={priceCents} count={chosen.length} settings={settings} user={user} />}

              <ul className="mt-6 space-y-2.5 text-sm text-muted">
                <li className="flex gap-2.5">
                  <Lock className="mt-0.5 size-4 shrink-0 text-brand" />
                  When you list, DemoTix locks {chosen.length === 1 ? 'your ticket' : 'your tickets'}, so {chosen.length === 1 ? 'it' : 'they'} can't be
                  transferred or sold anywhere else.
                </li>
                <li className="flex gap-2.5">
                  <ShieldCheck className="mt-0.5 size-4 shrink-0 text-brand" />
                  You can cancel any time, until someone buys.
                </li>
              </ul>

              {error && <ErrorNote>{error}</ErrorNote>}

              <StepButtons
                onBack={() => setStep(1)}
                onNext={publish}
                nextDisabled={Boolean(priceError) || busy}
                nextLabel={
                  busy ? (
                    <>
                      <Loader2 className="size-4 animate-spin" /> Locking at DemoTix…
                    </>
                  ) : (
                    `List ${plural(chosen.length, 'ticket')}`
                  )
                }
              />
            </>
          )}
        </div>
      </div>
    </section>
  )
}

function Stepper({ current }) {
  return (
    <ol className="mt-7 flex items-center gap-2 sm:gap-3">
      {STEPS.map((label, i) => {
        const done = i < current
        const active = i === current
        return (
          <li key={label} className="flex flex-1 items-center gap-2 sm:gap-3">
            <span
              className={`grid size-8 shrink-0 place-items-center rounded-full text-sm font-bold ${
                done ? 'bg-brand text-white' : active ? 'bg-ink text-white' : 'bg-surface text-subtle'
              }`}
            >
              {done ? <Check className="size-4" strokeWidth={3} /> : i + 1}
            </span>
            <span className={`hidden text-sm font-semibold sm:block ${active ? 'text-ink' : 'text-subtle'}`}>{label}</span>
            {i < STEPS.length - 1 && <span className={`h-0.5 flex-1 rounded ${done ? 'bg-brand' : 'bg-surface-2'}`} />}
          </li>
        )
      })}
    </ol>
  )
}

function VerifiedOrder({ order }) {
  return (
    <div className="rounded-xl bg-surface p-4">
      <p className="flex items-center gap-2 text-sm font-bold text-success">
        <BadgeCheck className="size-5" /> Verified by DemoTix
      </p>
      <p className="mt-2 text-lg leading-snug font-bold">{order.event.name}</p>
      <div className="mt-1.5 space-y-1 text-sm text-muted">
        <p className="flex items-center gap-2">
          <CalendarDays className="size-4 text-coral" /> {formatEventDate(order.event.startsAt)}
        </p>
        <p className="flex items-center gap-2">
          <MapPin className="size-4" /> {order.event.venue}, {order.event.city}
        </p>
      </div>
      <p className="mt-3 text-sm">
        Issued to <span className="font-semibold">{order.owner.name}</span> · Order <span className="font-mono font-semibold">{order.orderRef}</span>
      </p>
    </div>
  )
}

function Breakdown({ priceCents, count, settings, user }) {
  const b = priceBreakdown(priceCents, settings)
  return (
    <div className="mt-5 grid gap-3 sm:grid-cols-2">
      <div className="rounded-xl bg-surface p-4">
        <p className="text-sm text-muted">Fans pay</p>
        <p className="mt-0.5 text-2xl font-bold tabular-nums">{formatMoney(b.total)}</p>
        <p className="mt-1 text-xs text-muted">
          {formatMoney(b.ticket)} ticket + {formatMoney(b.fee)} service fee, per ticket
        </p>
      </div>
      <div className="rounded-xl bg-brand-50 p-4">
        <p className="text-sm text-brand">You receive</p>
        <p className="mt-0.5 text-2xl font-bold text-ink tabular-nums">{formatMoney(b.ticket * count)}</p>
        <p className="mt-1 text-xs text-muted">No seller fees. {count > 1 ? `${formatMoney(b.ticket)} × ${count}` : 'The full ticket price.'}</p>
      </div>
      <p className="flex items-start gap-2 text-sm text-muted sm:col-span-2">
        <Wallet className="mt-0.5 size-4 shrink-0" />
        {user.payout
          ? `Paid to your ${user.payout.method} •••• ${user.payout.last4} as soon as the buyer's new ticket is issued.`
          : "We'll ask for your bank details before your first payout, which happens as soon as the buyer's new ticket is issued."}
      </p>
    </div>
  )
}

function StepButtons({ onBack, onNext, nextDisabled, nextLabel }) {
  return (
    <div className="mt-8 flex gap-3">
      <button type="button" onClick={onBack} className="btn-secondary">
        <ArrowLeft className="size-4" /> Back
      </button>
      <button type="button" onClick={onNext} disabled={nextDisabled} className="btn-primary flex-1">
        {nextLabel}
      </button>
    </div>
  )
}

function ErrorNote({ children }) {
  return (
    <p role="alert" className="mt-4 rounded-lg border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">
      {children}
    </p>
  )
}

function Published({ order, published, settings, onSellAnother }) {
  const { total } = priceBreakdown(published.priceCents, settings)
  const ids = published.ticketIds
  const one = ids.length === 1

  return (
    <section className="container-page py-12 sm:py-16">
      <div className="mx-auto max-w-[600px] text-center">
        <span className="mx-auto grid size-16 place-items-center rounded-full bg-brand-50 text-brand">
          <Check className="size-8" strokeWidth={3} />
        </span>
        <h1 className="mt-4 text-[30px] font-bold tracking-tight">{one ? 'Your ticket is live!' : 'Your tickets are live!'}</h1>
        <p className="mt-2 text-muted">
          {one ? `Ticket ${ids[0]}` : `Tickets ${ids.join(', ')}`} for {order.event.name}, listed at {formatMoney(published.priceCents)}
          {one ? '' : ' each'}. Fans see {formatMoney(total)} including fees.
        </p>

        <div className="mt-8 grid gap-3 text-left sm:grid-cols-2">
          <div className="tile p-4">
            <Lock className="size-5 text-brand" />
            <p className="mt-2 font-semibold">Locked at DemoTix</p>
            <p className="mt-0.5 text-sm text-muted">Nobody can transfer or resell {one ? 'it' : 'them'} anywhere else while {one ? "it's" : "they're"} listed.</p>
          </div>
          <div className="tile p-4">
            <Wallet className="size-5 text-brand" />
            <p className="mt-2 font-semibold">Paid after the swap</p>
            <p className="mt-0.5 text-sm text-muted">You get paid once the buyer's new ticket is issued and the old barcode is voided.</p>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link to="/my-listings" className="btn-primary">
            View my listings
          </Link>
          <button type="button" onClick={onSellAnother} className="btn-secondary">
            Sell another ticket
          </button>
        </div>

        <DemoTip className="mt-10 text-left">
          Open the{' '}
          <Link to={`/demotix/database?ticket=${ids[0]}`} className="font-semibold text-brand hover:underline">
            DemoTix ticket database
          </Link>
          : {one ? `ticket ${ids[0]} is` : 'the tickets are'} now <span className="font-semibold">Locked for resale</span>, and the API log shows Verify, then
          Lock.
        </DemoTip>
      </div>
    </section>
  )
}
