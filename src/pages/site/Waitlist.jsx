import { Link } from 'react-router'
import { BellRing, CalendarDays, Clock } from 'lucide-react'
import { useStore } from '../../store/useStore.js'
import { getCurrentUser } from '../../lib/selectors.js'
import { endOfferNow, leaveWaitlist, positionOf } from '../../fixtix/waitlist.js'
import { isOfferActive } from '../../fixtix/availability.js'
import { update } from '../../store/store.js'
import { formatCountdown, formatDuration, formatEventDate, formatTime, plural } from '../../lib/format.js'
import { useNow } from '../../lib/useNow.js'
import { EventCover } from '../../components/EventCover.jsx'
import { DemoTip } from '../../components/DemoTip.jsx'

// Screen 8: the events this fan is waiting for, and their place in line.
const selectMine = (s) => {
  const user = getCurrentUser(s)
  return s.fixtix.waitlist
    .filter((w) => w.userId === user?.id && ['waiting', 'offered'].includes(w.status))
    .map((entry) => ({
      entry,
      position: positionOf(s, entry),
      event: s.events.find((e) => e.id === entry.eventId),
      lastMissed: entry.offer?.status === 'expired' ? entry.offer : null,
    }))
    .sort((a, b) => new Date(a.event.startsAt) - new Date(b.event.startsAt))
}

export default function Waitlist() {
  const items = useStore(selectMine)
  const minutes = useStore((s) => s.settings.waitlistOfferMinutes)
  const now = useNow(1000)

  const setMinutes = (m) =>
    update((s) => {
      s.settings.waitlistOfferMinutes = m
    })

  return (
    <section className="container-page py-10 sm:py-14">
      <h1 className="text-[30px] font-bold tracking-tight sm:text-[36px]">Waitlist</h1>
      <p className="mt-1 text-muted">
        When a fan sells, the first in line gets the ticket exclusively for {formatDuration(minutes)}. Then it moves to the
        next fan.
      </p>

      {items.length ? (
        <ul className="mt-8 space-y-3">
          {items.map(({ entry, position, event, lastMissed }) => {
            const offered = isOfferActive(entry, now)
            return (
              <li key={entry.id} className={`overflow-hidden rounded-card border ${offered ? 'border-brand ring-2 ring-brand/20' : 'border-line'}`}>
                {offered && (
                  <div className="flex flex-wrap items-center justify-between gap-3 bg-brand px-4 py-3 text-white">
                    <p className="flex items-center gap-2 font-semibold">
                      <BellRing className="size-5" /> A ticket is reserved for you
                    </p>
                    <p className="text-sm">
                      until {formatTime(entry.offer.expiresAt)} ·{' '}
                      <span className="font-bold tabular-nums">{formatCountdown(new Date(entry.offer.expiresAt).getTime() - now)} left</span>
                    </p>
                  </div>
                )}
                <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
                  <div className="hidden h-[72px] w-[112px] shrink-0 overflow-hidden rounded-lg sm:block">
                    <EventCover cover={event.cover} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[17px] font-semibold">{event.name}</p>
                    <p className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-coral">
                      <CalendarDays className="size-4" /> {formatEventDate(event.startsAt)}
                    </p>
                    <p className="mt-1 text-sm text-muted">
                      <span className="font-semibold text-ink">#{position} in line</span> · {plural(entry.quantity, 'ticket')}
                    </p>
                    {!offered && lastMissed && (
                      <p className="mt-1 flex items-center gap-1.5 text-sm text-amber-700">
                        <Clock className="size-4" /> Your last offer expired at {formatTime(lastMissed.expiresAt)} and moved to the next fan.
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {offered && (
                      <Link to={`/event/${event.id}`} className="btn-primary px-4 py-2.5 text-sm">
                        Buy now
                      </Link>
                    )}
                    <button type="button" onClick={() => leaveWaitlist(entry.id)} className="btn-ghost px-3 py-2 text-sm text-muted">
                      Leave
                    </button>
                  </div>
                </div>
                {offered && (
                  <div className="border-t border-line bg-surface/40 px-4 py-2 text-right">
                    <button type="button" onClick={() => endOfferNow(entry.id)} className="text-xs font-semibold text-muted hover:text-ink">
                      Demo: let this offer run out now
                    </button>
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      ) : (
        <div className="tile mt-8 flex flex-col items-center px-6 py-14 text-center">
          <p className="text-lg font-semibold">You're not on any waitlist</p>
          <p className="mt-1 max-w-sm text-muted">On a sold-out event page, tap Join waitlist and you'll be first to know when a fan sells.</p>
          <Link to="/" className="btn-primary mt-5">
            Find an event
          </Link>
        </div>
      )}

      <DemoTip className="mt-10">
        Exclusive offers last{' '}
        {[60, 1].map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMinutes(m)}
            className={`mx-0.5 rounded-full px-2.5 py-0.5 text-sm font-semibold ${minutes === m ? 'bg-ink text-white' : 'bg-white text-ink ring-1 ring-line hover:bg-surface'}`}
          >
            {m === 60 ? '1 hour' : '1 minute (demo)'}
          </button>
        ))}
        . With 1 minute you can watch an unclaimed offer move to the next fan during the meeting. New offers use the new time.
      </DemoTip>
    </section>
  )
}
