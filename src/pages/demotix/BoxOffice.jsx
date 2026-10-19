import { Link } from 'react-router'
import { useStore } from '../../store/useStore.js'
import { getUpcomingEvents } from '../../lib/selectors.js'
import { formatMoney } from '../../lib/format.js'
import { DemoTip } from '../../components/DemoTip.jsx'

const monthFormat = new Intl.DateTimeFormat('en-GB', { month: 'short' })
const whenFormat = new Intl.DateTimeFormat('en-GB', { weekday: 'short', hour: '2-digit', minute: '2-digit' })

// The demo's story event goes first, the rest by date.
const selectBoxOfficeEvents = (s) => {
  const events = getUpcomingEvents(s)
  return [...events.filter((e) => e.featured), ...events.filter((e) => !e.featured)]
}

export default function BoxOffice() {
  const events = useStore(selectBoxOfficeEvents)

  return (
    <div className="flex-1 bg-white text-ink">
      <section className="bg-gradient-to-br from-[#24168a] via-dtx to-[#8f63f7] text-white">
        <div className="mx-auto w-full max-w-[1100px] px-4 py-10 sm:px-6 sm:py-14">
          <p className="text-sm font-bold tracking-wider text-white/70 uppercase">DemoTix box office</p>
          <h1 className="mt-2 max-w-2xl text-[32px] leading-[1.1] font-bold tracking-tight text-balance sm:text-[44px]">
            Official tickets, straight from the organiser
          </h1>
          <p className="mt-3 max-w-xl text-[17px] text-white/80">
            Every ticket sold here is an official DemoTix record with its own barcode.
          </p>
        </div>
      </section>

      <div className="mx-auto w-full max-w-[1100px] px-4 py-8 sm:px-6">
        <DemoTip>Start here. Buy Dana's ticket for Aegean Sound Festival, then open the ticket database to see it appear.</DemoTip>

        <ul className="mt-6 divide-y divide-line border-y border-line">
          {events.map((event) => {
            const date = new Date(event.startsAt)
            const fromCents = Math.min(...event.ticketTypes.map((t) => t.priceCents))
            return (
              <li key={event.id} className="flex items-center gap-4 py-4">
                <div className="w-14 shrink-0 rounded-lg bg-dtx-50 py-2 text-center text-dtx">
                  <div className="text-[11px] font-bold tracking-wide uppercase">{monthFormat.format(date)}</div>
                  <div className="text-2xl leading-none font-bold">{date.getDate()}</div>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <h2 className="text-[17px] leading-snug font-semibold">{event.name}</h2>
                    {event.soldOut && <span className="pill bg-amber-100 text-amber-800">Last tickets</span>}
                  </div>
                  <p className="mt-0.5 text-sm text-muted">
                    {whenFormat.format(date)} · {event.venue}, {event.city}
                  </p>
                </div>
                <div className="hidden text-right sm:block">
                  <div className="text-xs text-muted">from</div>
                  <div className="font-bold tabular-nums">{formatMoney(fromCents)}</div>
                </div>
                <Link to={`/demotix/buy/${event.id}`} className="btn shrink-0 bg-dtx px-4 py-2.5 text-white hover:bg-dtx-600">
                  Buy
                </Link>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}
