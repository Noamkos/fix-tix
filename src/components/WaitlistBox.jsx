import { useState } from 'react'
import { useNavigate } from 'react-router'
import { Bell, BellRing, Check } from 'lucide-react'
import { useStore } from '../store/useStore.js'
import { entryFor, joinWaitlist, leaveWaitlist, positionOf, queueFor } from '../fixtix/waitlist.js'
import { isOfferActive } from '../fixtix/availability.js'
import { formatCountdown, formatDuration, plural } from '../lib/format.js'
import { useNow } from '../lib/useNow.js'

const selectWaitlist = (eventId, userId) => (s) => {
  const entry = userId ? entryFor(s, userId, eventId) : null
  return {
    entry,
    position: entry ? positionOf(s, entry) : 0,
    waiting: queueFor(s, eventId).length,
    minutes: s.settings.waitlistOfferMinutes,
  }
}

// The waitlist on an event page (process D): join, see your place in line, or your exclusive offer.
export function WaitlistBox({ event, user }) {
  const { entry, position, waiting, minutes } = useStore(selectWaitlist(event.id, user?.id))
  const [quantity, setQuantity] = useState(1)
  const navigate = useNavigate()
  const now = useNow(1000)

  if (entry && isOfferActive(entry, now)) {
    return (
      <div className="mt-5 flex items-center gap-4 rounded-card bg-brand p-4 text-white">
        <span className="grid size-11 shrink-0 place-items-center rounded-lg bg-white/15">
          <BellRing className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-semibold">You're next in line! A ticket is reserved for you.</p>
          <p className="text-sm text-white/85">
            Buy it below within <span className="font-bold tabular-nums">{formatCountdown(new Date(entry.offer.expiresAt).getTime() - now)}</span>, or it goes to
            the next fan.
          </p>
        </div>
      </div>
    )
  }

  if (entry) {
    return (
      <div className="mt-5 flex flex-wrap items-center gap-4 rounded-card border border-brand/30 bg-brand-50 p-4">
        <span className="grid size-11 shrink-0 place-items-center rounded-lg bg-brand text-white">
          <Check className="size-5" strokeWidth={3} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-semibold">
            You're #{position} in line for {plural(entry.quantity, 'ticket')}
          </p>
          <p className="text-sm text-muted">We'll email and text you the moment a fan sells.</p>
        </div>
        <button type="button" onClick={() => leaveWaitlist(entry.id)} className="btn-ghost shrink-0 px-3 py-2 text-sm text-muted">
          Leave waitlist
        </button>
      </div>
    )
  }

  function join() {
    if (!user) return navigate(`/login?next=${encodeURIComponent(`/event/${event.id}`)}`)
    joinWaitlist({ userId: user.id, eventId: event.id, quantity })
  }

  return (
    <div className="mt-5 flex flex-wrap items-center gap-4 rounded-card border border-line p-4">
      <span className="grid size-11 shrink-0 place-items-center rounded-lg bg-brand text-white">
        <Bell className="size-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-semibold">Join the waitlist</p>
        <p className="text-sm text-muted">
          When a fan sells, the first in line gets it exclusively for {formatDuration(minutes)}.
          {waiting > 0 && ` ${plural(waiting, 'fan')} waiting.`}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <label className="sr-only" htmlFor="waitlist-qty">
          Tickets needed
        </label>
        <select
          id="waitlist-qty"
          value={quantity}
          onChange={(e) => setQuantity(Number(e.target.value))}
          className="h-10 rounded-lg border border-surface-2 bg-white px-2.5 text-sm font-semibold"
        >
          {[1, 2, 3, 4].map((n) => (
            <option key={n} value={n}>
              {plural(n, 'ticket')}
            </option>
          ))}
        </select>
        <button type="button" onClick={join} className="btn-primary px-4 py-2.5 text-sm">
          Join waitlist
        </button>
      </div>
    </div>
  )
}
