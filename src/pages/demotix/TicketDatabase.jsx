import { useCallback, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { ArrowRight, Search } from 'lucide-react'
import { useStore } from '../../store/useStore.js'
import { placeText, TICKET_STATUS } from '../../demotix/tickets.js'
import { formatAgo, formatMoney } from '../../lib/format.js'
import { isFresh, useNow } from '../../lib/useNow.js'
import { StatusBadge } from '../../components/demotix/StatusBadge.jsx'
import { TicketDrawer } from '../../components/demotix/TicketDrawer.jsx'
import { ApiLogList } from '../../components/demotix/ApiLogList.jsx'
import { DemoTip } from '../../components/DemoTip.jsx'
import { partnerStats } from '../../fixtix/partnerStats.js'

const selectTickets = (s) => s.demotix.tickets
const selectEvents = (s) => s.events
const selectRecentLog = (s) => s.demotix.apiLog.slice(-6).reverse()
const selectRevenue = (s) => partnerStats(s).partnerCents

// DemoTix's live ticket table: the screen the ticketing company cares about most.
export default function TicketDatabase() {
  const tickets = useStore(selectTickets)
  const events = useStore(selectEvents)
  const recentLog = useStore(selectRecentLog)
  const revenueCents = useStore(selectRevenue)
  const now = useNow()
  const [params, setParams] = useSearchParams()
  const [status, setStatus] = useState('all')
  const [eventId, setEventId] = useState('all')
  const [query, setQuery] = useState('')

  const eventsById = useMemo(() => Object.fromEntries(events.map((e) => [e.id, e])), [events])

  const counts = useMemo(() => {
    const c = { all: tickets.length }
    tickets.forEach((t) => (c[t.status] = (c[t.status] ?? 0) + 1))
    return c
  }, [tickets])

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    return tickets
      .filter((t) => status === 'all' || t.status === status)
      .filter((t) => eventId === 'all' || t.eventId === eventId)
      .filter((t) => !q || [t.id, t.barcode, t.owner.name, t.owner.email, t.orderRef].join(' ').toLowerCase().includes(q))
      .sort((a, b) => b.id - a.id)
  }, [tickets, status, eventId, query])

  const openTicket = params.get('ticket')
  const openDrawer = useCallback((id) => setParams({ ticket: String(id) }, { replace: true }), [setParams])
  const closeDrawer = useCallback(() => setParams({}, { replace: true }), [setParams])

  return (
    <div className="mx-auto w-full max-w-[1400px] px-4 py-6 sm:px-6 sm:py-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-[26px] font-bold tracking-tight text-white sm:text-[30px]">Ticket database</h1>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs font-bold text-emerald-300">
              <span className="relative flex size-2">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex size-2 rounded-full bg-emerald-400" />
              </span>
              Live
            </span>
          </div>
          <p className="mt-1 text-console-muted">The official ticket records. Every change FixTix requests shows up here instantly.</p>
        </div>
        <Link
          to="/demotix/revenue"
          className="flex items-center gap-3 rounded-card border border-console-line bg-console-panel px-4 py-2.5 hover:border-dtx"
        >
          <span>
            <span className="block text-xs text-console-muted">Earned from FixTix resale</span>
            <span className="block text-xl font-bold text-emerald-300">{formatMoney(revenueCents)}</span>
          </span>
          <ArrowRight className="size-4 text-console-muted" />
        </Link>
      </div>

      <div className="mt-5 flex flex-wrap gap-2" role="group" aria-label="Filter by status">
        {['all', ...Object.keys(TICKET_STATUS)].map((key) => (
          <button
            key={key}
            type="button"
            aria-pressed={status === key}
            onClick={() => setStatus(key)}
            className={`inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-sm font-semibold transition-colors ${
              status === key ? 'bg-white text-console' : 'bg-console-raised text-console-muted hover:text-white'
            }`}
          >
            {key === 'all' ? 'All tickets' : TICKET_STATUS[key].label}
            <span className={`tabular-nums ${status === key ? 'text-console/60' : 'text-console-muted/70'}`}>{counts[key] ?? 0}</span>
          </button>
        ))}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_320px]">
        <section aria-label="Tickets" className="min-w-0">
          <div className="flex flex-col gap-3 sm:flex-row">
            <label className="flex flex-1 items-center gap-2.5 rounded-lg border border-console-line bg-console-panel px-3.5 focus-within:border-dtx">
              <Search className="size-4 shrink-0 text-console-muted" />
              <span className="sr-only">Search tickets</span>
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ticket number, barcode, owner or order"
                className="h-11 w-full bg-transparent text-sm text-console-text outline-none placeholder:text-console-muted"
              />
            </label>
            <label className="sr-only" htmlFor="event-filter">
              Event
            </label>
            <select
              id="event-filter"
              value={eventId}
              onChange={(e) => setEventId(e.target.value)}
              className="h-11 rounded-lg border border-console-line bg-console-panel px-3 text-sm text-console-text outline-none focus:border-dtx"
            >
              <option value="all">All events</option>
              {events.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-3 overflow-x-auto rounded-card border border-console-line bg-console-panel">
            <table className="w-full min-w-[800px] text-left text-sm">
              <thead className="border-b border-console-line text-xs tracking-wider text-console-muted uppercase">
                <tr>
                  <th scope="col" className="px-3 py-3 pl-4 font-semibold">Ticket</th>
                  <th scope="col" className="px-3 py-3 font-semibold">Barcode</th>
                  <th scope="col" className="px-3 py-3 font-semibold">Owner</th>
                  <th scope="col" className="px-3 py-3 text-right font-semibold">Price</th>
                  <th scope="col" className="px-3 py-3 font-semibold">Status</th>
                  <th scope="col" className="px-3 py-3 font-semibold">Event</th>
                  <th scope="col" className="px-3 py-3 pr-4 font-semibold">Changed</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((t) => {
                  const event = eventsById[t.eventId]
                  const voided = t.status === 'voided'
                  return (
                    // The key includes updatedAt, so a changed row re-mounts and its highlight replays.
                    <tr
                      key={`${t.id}-${t.updatedAt}`}
                      onClick={() => openDrawer(t.id)}
                      className={`cursor-pointer border-b border-console-line/60 last:border-0 hover:bg-white/[0.03] ${isFresh(t.updatedAt) ? 'animate-row-flash' : ''}`}
                    >
                      <td className="px-3 py-3 pl-4">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            openDrawer(t.id)
                          }}
                          className="font-mono font-bold text-white hover:text-dtx-300"
                        >
                          {t.id}
                        </button>
                      </td>
                      <td className={`px-3 py-3 font-mono whitespace-nowrap ${voided ? 'text-console-muted line-through decoration-red-400/80' : 'text-console-text'}`}>
                        {t.barcode}
                      </td>
                      <td className="px-3 py-3">
                        <div className={`whitespace-nowrap ${voided ? 'text-console-muted' : 'text-console-text'}`}>{t.owner.name}</div>
                        <div className="text-xs text-console-muted">{t.owner.email}</div>
                      </td>
                      <td className="px-3 py-3 text-right tabular-nums">{formatMoney(t.priceCents)}</td>
                      <td className="px-3 py-3">
                        <StatusBadge status={t.status} />
                      </td>
                      <td className="max-w-[170px] px-3 py-3">
                        <div className="truncate font-medium text-console-text">{event?.name}</div>
                        <div className="truncate text-xs text-console-muted">{placeText(t, event)}</div>
                      </td>
                      <td className="px-3 py-3 pr-4 whitespace-nowrap text-console-muted" title={t.history.at(-1)?.note}>
                        {formatAgo(t.updatedAt, now)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            {!rows.length && <p className="px-4 py-10 text-center text-console-muted">No tickets match these filters.</p>}
          </div>
          <p className="mt-2 text-xs text-console-muted">Click a ticket to see its full history.</p>
        </section>

        <aside aria-label="Latest requests from FixTix" className="self-start overflow-hidden rounded-card border border-console-line bg-console-panel xl:sticky xl:top-24">
          <div className="flex items-center justify-between border-b border-console-line px-4 py-3">
            <h2 className="text-sm font-bold text-white">Requests from FixTix</h2>
            <Link to="/demotix/api-log" className="inline-flex items-center gap-1 text-xs font-semibold text-dtx-300 hover:text-white">
              Full API log <ArrowRight className="size-3.5" />
            </Link>
          </div>
          <ApiLogList entries={recentLog} compact empty="No requests yet. They appear here the moment FixTix talks to DemoTix." />
        </aside>
      </div>

      <DemoTip dark className="mt-8">
        Keep this screen open next to FixTix (or in presentation mode). When Dana lists her ticket, its row turns Locked; when Nikos
        buys it, the old row turns Voided and a new Reissued row appears.
      </DemoTip>

      {openTicket && <TicketDrawer ticketId={openTicket} onClose={closeDrawer} onOpenTicket={openDrawer} />}
    </div>
  )
}
