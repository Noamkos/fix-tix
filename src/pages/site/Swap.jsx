import { useEffect, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router'
import { ArrowDown, ArrowRight, Check, Loader2, RefreshCw, X } from 'lucide-react'
import { useStore } from '../../store/useStore.js'
import { getCurrentUser } from '../../lib/selectors.js'
import { runSwap } from '../../fixtix/swap.js'
import { placeText } from '../../demotix/tickets.js'
import { formatMoney } from '../../lib/format.js'
import { TicketStub } from '../../components/TicketStub.jsx'
import { DemoTip } from '../../components/DemoTip.jsx'

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

// The four steps from the spec, in order.
const STEPS = [
  { id: 'verifying', label: 'Verifying', text: 'Payment received, ticket still locked at DemoTix' },
  { id: 'voiding', label: 'Voiding old barcode', text: "DemoTix cancels the seller's barcode" },
  { id: 'issuing', label: 'Issuing your new ticket', text: 'A new barcode, in your name' },
  { id: 'done', label: 'Done', text: 'Sent to your email and My tickets' },
]
const ORDER = STEPS.map((s) => s.id)

function initialPhase(status) {
  if (status === 'completed' || status === 'partially_refunded') return 'done'
  if (status === 'refunded') return 'failed'
  return 'verifying'
}

const selectSwap = (orderId) => (s) => {
  const order = s.fixtix.orders.find((o) => o.id === orderId)
  if (!order) return null
  const ticket = (id) => s.demotix.tickets.find((t) => t.id === id) ?? null
  return {
    order,
    event: s.events.find((e) => e.id === order.eventId),
    buyer: s.fixtix.users.find((u) => u.id === order.buyerId),
    oldTicket: ticket(order.ticketIds[0]),
    newTicket: ticket(order.newTicketIds[0]),
  }
}

export default function Swap() {
  const { orderId } = useParams()
  const user = useStore(getCurrentUser)
  const data = useStore(selectSwap(orderId))
  const [phase, setPhase] = useState(() => initialPhase(data?.order.status))
  const status = data?.order.status

  useEffect(() => {
    if (!['paid', 'swapping'].includes(status)) return
    let alive = true
    runSwap(orderId, { onStep: (step) => alive && setPhase(step) }).then(async (out) => {
      if (!alive) return
      if (out?.order?.newTicketIds?.length) {
        setPhase('issuing')
        await sleep(1800)
        if (alive) setPhase('done')
      } else {
        setPhase('failed')
      }
    })
    return () => {
      alive = false
    }
    // Start (or join) the swap once per order; later status changes come from the swap itself.
  }, [orderId])

  if (!data || data.order.buyerId !== user.id) {
    return (
      <section className="container-page py-24 text-center">
        <h1 className="text-[26px] font-bold">Order not found</h1>
        <Link to="/" className="btn-primary mt-6">
          Back to events
        </Link>
      </section>
    )
  }

  const { order, event, buyer, oldTicket, newTicket } = data
  if (order.status === 'held') return <Navigate to={`/checkout/${order.id}`} replace />

  const failed = phase === 'failed'
  const done = phase === 'done'
  const index = failed ? 1 : ORDER.indexOf(phase)
  const oldState = !failed && index >= 2 ? 'voided' : 'valid'
  const showNew = !failed && index >= 2 && newTicket
  const extra = order.ticketIds.length - 1

  return (
    <section className="container-page py-10 sm:py-14">
      <div className="mx-auto max-w-[760px]">
        <div className="text-center">
          {done ? (
            <>
              <h1 className="text-[30px] font-bold tracking-tight sm:text-[36px]">You're in! Your new ticket is ready</h1>
              <p className="mx-auto mt-2 max-w-xl text-muted">
                Ticket {newTicket?.id} is issued to {buyer.name}. The old barcode no longer opens the gate.
              </p>
            </>
          ) : failed ? (
            <>
              <h1 className="text-[30px] font-bold tracking-tight sm:text-[36px]">We couldn't issue your ticket</h1>
              <p className="mx-auto mt-2 max-w-xl text-muted">
                DemoTix couldn't issue a new ticket, so nothing changed: the seller's ticket is still valid and back on sale. We refunded{' '}
                <span className="font-semibold text-ink">{formatMoney(order.refundCents ?? order.totalCents)}</span> to your card, in full.
              </p>
            </>
          ) : (
            <>
              <h1 className="text-[30px] font-bold tracking-tight sm:text-[36px]">Swapping your ticket</h1>
              <p className="mx-auto mt-2 max-w-xl text-muted">
                FixTix is asking DemoTix to void the old barcode and issue a new ticket in your name. This takes a few seconds.
              </p>
            </>
          )}
        </div>

        <div className="mt-10 grid items-center gap-4 sm:grid-cols-[1fr_auto_1fr] sm:gap-6">
          <div className={`rounded-2xl transition-shadow ${phase === 'voiding' ? 'animate-pulse ring-4 ring-danger/25' : ''}`}>
            <p className="mb-2 text-center text-xs font-bold tracking-wider text-subtle uppercase">Old ticket</p>
            {oldTicket && (
              <TicketStub
                event={event}
                ticketNumber={oldTicket.id}
                place={placeText(oldTicket, event)}
                owner={oldTicket.owner.name}
                barcode={oldTicket.barcode}
                state={oldState}
              />
            )}
          </div>

          <div className="flex justify-center">
            <span className={`grid size-12 place-items-center rounded-full ${failed ? 'bg-danger/10 text-danger' : 'bg-brand-50 text-brand'}`}>
              {failed ? (
                <X className="size-5" />
              ) : done ? (
                <>
                  <ArrowRight className="hidden size-5 sm:block" />
                  <ArrowDown className="size-5 sm:hidden" />
                </>
              ) : (
                <RefreshCw className="size-5 animate-spin [animation-duration:1.6s]" />
              )}
            </span>
          </div>

          <div>
            <p className="mb-2 text-center text-xs font-bold tracking-wider text-subtle uppercase">New ticket</p>
            {showNew ? (
              <TicketStub
                className="animate-rise"
                event={event}
                ticketNumber={newTicket.id}
                place={placeText(newTicket, event)}
                owner={newTicket.owner.name}
                barcode={newTicket.barcode}
                state={done ? 'issued' : 'valid'}
              />
            ) : (
              <TicketStub state="pending" />
            )}
          </div>
        </div>
        {extra > 0 && <p className="mt-3 text-center text-sm text-muted">…and {extra} more, swapped the same way.</p>}

        <ol className="mx-auto mt-10 max-w-md space-y-3">
          {STEPS.map((step, i) => {
            const state = failed ? (i === 0 ? 'done' : i === 1 ? 'failed' : 'idle') : i < index || done ? 'done' : i === index ? 'active' : 'idle'
            return (
              <li key={step.id} className="flex items-start gap-3">
                <span
                  className={`mt-0.5 grid size-7 shrink-0 place-items-center rounded-full ${
                    state === 'done' ? 'bg-success text-white' : state === 'active' ? 'bg-brand-50 text-brand' : state === 'failed' ? 'bg-danger text-white' : 'bg-surface text-subtle'
                  }`}
                >
                  {state === 'done' ? (
                    <Check className="size-4" strokeWidth={3} />
                  ) : state === 'active' ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : state === 'failed' ? (
                    <X className="size-4" strokeWidth={3} />
                  ) : (
                    <span className="text-xs font-bold">{i + 1}</span>
                  )}
                </span>
                <span>
                  <span className={`block font-semibold ${state === 'idle' ? 'text-subtle' : ''}`}>{step.label}</span>
                  <span className="block text-sm text-muted">{state === 'failed' ? 'DemoTix could not issue a new ticket' : step.text}</span>
                </span>
              </li>
            )
          })}
        </ol>

        {(done || failed) && (
          <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            {done ? (
              <>
                <Link to="/my-tickets" className="btn-primary">
                  View my tickets
                </Link>
                <Link to="/" className="btn-secondary">
                  Back to events
                </Link>
              </>
            ) : (
              <Link to={`/event/${event.id}`} className="btn-primary">
                Back to the event
              </Link>
            )}
          </div>
        )}
        {done && <p className="mt-4 text-center text-sm text-muted">We've also emailed it to {buyer.email}.</p>}

        {(done || failed) && (
          <DemoTip className="mt-10">
            Open the{' '}
            <Link to={`/demotix/database?ticket=${done ? newTicket?.id : oldTicket?.id}`} className="font-semibold text-brand hover:underline">
              DemoTix ticket database
            </Link>
            {done
              ? `: ticket ${oldTicket?.id} is now Voided and ticket ${newTicket?.id} is Reissued to ${buyer.name.split(' ')[0]}, with a new barcode.`
              : `: ticket ${oldTicket?.id} is still Locked for resale, and the API log shows the failed Void and reissue.`}
          </DemoTip>
        )}
      </div>
    </section>
  )
}
