import { Link } from 'react-router'
import { CalendarDays } from 'lucide-react'
import { EventCover } from './EventCover.jsx'
import { CATEGORIES } from '../data/seed.js'
import { formatEventDate, formatMoney, plural } from '../lib/format.js'

const categoryLabel = (id) => CATEGORIES.find((c) => c.id === id)?.label.replace(/s$/, '') ?? 'Event'

// One event in a grid: artwork on top, details on a soft grey base (TicketSwap style).
// On phones it becomes a compact row: thumbnail on the left, details on the right.
// `summary` comes from getEventSummary(): resale tickets available, lowest price incl. fees, waitlist.
export function EventCard({ event, summary }) {
  const hasTickets = summary.available > 0

  return (
    <Link
      to={`/event/${event.id}`}
      className="group flex overflow-hidden rounded-card bg-surface transition-shadow duration-200 hover:shadow-[0_8px_24px_-12px_rgba(15,10,12,0.35)] sm:flex-col"
    >
      <div className="relative w-[116px] shrink-0 overflow-hidden sm:aspect-[16/10] sm:w-full">
        <EventCover cover={event.cover} className="absolute inset-0 transition-transform duration-300 group-hover:scale-[1.03]" />
        <span className="pill absolute top-3 left-3 hidden bg-ink/85 text-white sm:inline-flex">
          {categoryLabel(event.category)}
        </span>
        {event.soldOut && (
          <span className="pill absolute top-2 left-2 bg-white text-ink sm:top-3 sm:right-3 sm:left-auto">Sold out</span>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col p-3.5 sm:p-4">
        <h3 className="line-clamp-2 text-[16px] leading-snug font-semibold text-ink sm:line-clamp-1 sm:text-[17px]">
          {event.name}
        </h3>
        <p className="mt-0.5 line-clamp-1 text-sm text-muted">
          {event.venue}, {event.city}
        </p>
        <p className="mt-1.5 flex items-center gap-1.5 text-sm font-semibold text-coral sm:mt-2">
          <CalendarDays className="size-4 shrink-0" strokeWidth={2.2} />
          {formatEventDate(event.startsAt)}
        </p>

        <div className="mt-auto flex flex-col gap-0.5 pt-3 text-sm sm:flex-row sm:items-end sm:justify-between sm:gap-3 sm:pt-4">
          {hasTickets ? (
            <>
              <span className="font-semibold text-brand">{plural(summary.available, 'ticket')} available</span>
              <span className="text-muted">
                from <span className="text-[15px] font-bold text-ink">{formatMoney(summary.fromCents)}</span>
              </span>
            </>
          ) : (
            <>
              <span className="text-muted">No tickets listed yet</span>
              {summary.waitlistTickets > 0 && (
                <span className="font-semibold text-ink">{summary.waitlistTickets} wanted</span>
              )}
            </>
          )}
        </div>
      </div>
    </Link>
  )
}
