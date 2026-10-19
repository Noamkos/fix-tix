import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { ArrowRight, CheckCircle2, ScanLine, XCircle } from 'lucide-react'
import { useStore } from '../store/useStore.js'
import { FAKE_TICKET } from '../data/seed.js'
import { checkBarcode } from '../demotix/gate.js'
import { placeText } from '../demotix/tickets.js'
import { formatMoney } from '../lib/format.js'
import { Logo } from '../components/Logo.jsx'
import { TicketStub } from '../components/TicketStub.jsx'

// Nikos's ticket once FixTix has reissued it (demo step 5), if it exists yet.
const selectNikosTicket = (s) => {
  const order = s.fixtix.orders.find((o) => o.buyerId === 'u-nikos' && o.eventId === 'ev-aegean' && o.newTicketIds?.length)
  return order ? s.demotix.tickets.find((t) => t.id === order.newTicketIds[0]) : null
}
const selectEvent = (s) => s.events.find((e) => e.id === FAKE_TICKET.eventId)

// Screen 18: the meeting's opening. Two fans, one sold-out festival: an unofficial resale site
// against FixTix. Both scans ask the real DemoTix table, without using any ticket up.
export default function OtherWay() {
  const event = useStore(selectEvent)
  const nikosTicket = useStore(selectNikosTicket)
  const face = event.ticketTypes[0].priceCents

  useEffect(() => {
    document.title = 'The other way | FixTix'
  }, [])

  return (
    <div className="min-h-dvh bg-white text-ink">
      <header className="border-b border-line">
        <div className="container-page flex h-16 items-center justify-between gap-3">
          <Logo />
          <Link to="/demotix" className="inline-flex items-center gap-1 text-sm font-semibold text-muted hover:text-ink">
            Start the demo <ArrowRight className="size-4" />
          </Link>
        </div>
      </header>

      <main className="container-page py-8 sm:py-12">
        <div className="text-center">
          <p className="text-sm font-bold tracking-wider text-subtle uppercase">The other way</p>
          <h1 className="mx-auto mt-2 max-w-3xl text-[30px] leading-tight font-bold tracking-tight text-balance sm:text-[44px]">
            Two fans. One sold-out festival.
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-lg text-muted">
            {event.name}, original price {formatMoney(face)}. One fan buys on an unofficial resale site; the other on FixTix.
          </p>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          <Story
            tone="bad"
            heading="Today: an unofficial resale site"
            price={FAKE_TICKET.pricePaidCents}
            priceNote={`${(FAKE_TICKET.pricePaidCents / face).toFixed(1)}× the original price`}
            steps={[
              `Finds a ticket on ${FAKE_TICKET.site}`,
              'Pays by bank transfer: no buyer protection',
              'Gets a PDF with a QR code. Nobody checked it',
              'At the gate, DemoTix has never heard of it',
            ]}
            ticket={{
              event,
              subtitle: `Bought on ${FAKE_TICKET.site}`,
              place: 'General Admission',
              owner: FAKE_TICKET.holder,
              barcode: FAKE_TICKET.barcode,
            }}
            barcode={FAKE_TICKET.barcode}
            ending="Lost €350, and the festival."
          />
          <Story
            tone="good"
            heading="With FixTix"
            price={8800}
            priceNote={`${formatMoney(face)} ticket + ${formatMoney(800)} service fee, never above the original price`}
            steps={[
              'First on the waitlist: gets the ticket exclusively',
              'DemoTix verified the ticket and locked it',
              'Pays: the old barcode is voided, a new ticket issued in his name',
              'At the gate, DemoTix knows the ticket and the fan',
            ]}
            ticket={
              nikosTicket
                ? {
                    event,
                    ticketNumber: nikosTicket.id,
                    place: placeText(nikosTicket, event),
                    owner: nikosTicket.owner.name,
                    barcode: nikosTicket.barcode,
                  }
                : { event, subtitle: 'Issued during the demo, in step 5', place: 'General Admission', owner: 'Nikos Georgiou', barcode: 'DTX-NEW1-TKT5' }
            }
            barcode={nikosTicket?.barcode ?? null}
            ending="Paid €88, got in. Dana, who couldn't go, got her €80 back."
          />
        </div>
      </main>
    </div>
  )
}

function Story({ tone, heading, price, priceNote, steps, ticket, barcode, ending }) {
  const [result, setResult] = useState(null)
  const bad = tone === 'bad'

  function scan() {
    // Nikos's ticket doesn't exist before step 5: show how it will end.
    setResult(barcode ? checkBarcode(barcode) : { result: 'valid', reason: 'Welcome in!', preview: true })
  }

  const ok = result && result.result === 'valid'

  return (
    <section className={`flex flex-col rounded-2xl border p-5 sm:p-7 ${bad ? 'border-danger/20 bg-danger/[0.03]' : 'border-brand/25 bg-brand-50/60'}`}>
      <p className={`text-sm font-bold tracking-wider uppercase ${bad ? 'text-danger' : 'text-brand-700'}`}>{heading}</p>
      <p className="mt-3 text-[44px] leading-none font-bold tracking-tight">{formatMoney(price)}</p>
      <p className="mt-1.5 text-sm text-muted">{priceNote}</p>

      <ol className="mt-6 space-y-2.5">
        {steps.map((s, i) => (
          <li key={s} className="flex gap-3 text-[15px]">
            <span className={`grid size-6 shrink-0 place-items-center rounded-full text-xs font-bold text-white ${bad ? 'bg-danger/80' : 'bg-brand'}`}>{i + 1}</span>
            {s}
          </li>
        ))}
      </ol>

      <div className="mt-6 max-w-sm">
        <TicketStub {...ticket} state={!result ? 'valid' : ok ? 'issued' : result.result === 'not_found' ? 'fake' : 'voided'} />
      </div>

      <div className="mt-auto pt-6">
        {result ? (
          <div className={`rounded-xl px-5 py-4 text-white ${ok ? 'bg-emerald-600' : 'bg-red-600'}`} role="status">
            <p className="flex items-center gap-2 text-2xl font-black tracking-tight uppercase">
              {ok ? <CheckCircle2 className="size-7" /> : <XCircle className="size-7" />}
              {ok ? 'Valid' : result.result === 'not_found' ? 'Not found' : result.result === 'used' ? 'Already used' : 'Voided'}
            </p>
            <p className="mt-1 font-medium text-white/90">
              {result.reason}
              {result.preview && ' (Preview: the real ticket is issued in step 5.)'}
            </p>
            <p className="mt-3 border-t border-white/20 pt-3 text-sm font-semibold">{ending}</p>
          </div>
        ) : (
          <button type="button" onClick={scan} className={`btn w-full py-3.5 text-[16px] text-white ${bad ? 'bg-ink hover:bg-ink/85' : 'bg-brand hover:bg-brand-600'}`}>
            <ScanLine className="size-5" /> Scan at the gate
          </button>
        )}
      </div>
    </section>
  )
}
