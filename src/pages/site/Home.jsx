import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import {
  ArrowRight,
  CalendarDays,
  Check,
  Drama,
  Laugh,
  Lock,
  MapPin,
  Music,
  RefreshCw,
  Search,
  ShieldCheck,
  Speaker,
  Sun,
  Trophy,
  Users,
  X,
} from 'lucide-react'
import { useStore } from '../../store/useStore.js'
import { getEventSummary, getUpcomingEvents } from '../../lib/selectors.js'
import { formatEventDate, formatMoney, plural } from '../../lib/format.js'
import { CATEGORIES } from '../../data/seed.js'
import { EventCard } from '../../components/EventCard.jsx'
import { EventCover } from '../../components/EventCover.jsx'
import { DemoTixWordmark } from '../../components/Logo.jsx'

const CATEGORY_ICONS = {
  concert: { icon: Music, color: 'text-brand' },
  festival: { icon: Sun, color: 'text-amber-500' },
  club: { icon: Speaker, color: 'text-slate-600' },
  sports: { icon: Trophy, color: 'text-emerald-500' },
  theatre: { icon: Drama, color: 'text-rose-500' },
  comedy: { icon: Laugh, color: 'text-cyan-500' },
}

const HERO_ART = { motif: 'lights', colors: ['#3b2d9a', '#1f5fae', '#070b1f'] }

const selectSummaries = (s) => Object.fromEntries(s.events.map((e) => [e.id, getEventSummary(s, e.id)]))

function matches(event, q) {
  const haystack = [event.name, event.venue, event.city, event.country, ...event.lineup].join(' ').toLowerCase()
  return q
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((word) => haystack.includes(word))
}

export default function Home() {
  const events = useStore(getUpcomingEvents)
  const summaries = useStore(selectSummaries)
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState(null)

  const filtered = useMemo(
    () => events.filter((e) => (!category || e.category === category) && (!query.trim() || matches(e, query))),
    [events, query, category],
  )
  const isFiltering = Boolean(query.trim() || category)
  const featured = events.find((e) => e.featured)

  const clearFilters = () => {
    setQuery('')
    setCategory(null)
  }

  return (
    <>
      <Hero
        query={query}
        onQuery={setQuery}
        onSubmit={() => document.getElementById('events')?.scrollIntoView({ block: 'start' })}
      />
      <TrustStrip />

      {featured && !isFiltering && <Spotlight event={featured} summary={summaries[featured.id]} />}

      <section className="container-page mt-12 sm:mt-14" aria-labelledby="categories-title">
        <h2 id="categories-title" className="text-[26px] font-bold tracking-tight sm:text-[32px]">
          Choose your category, see what's on
        </h2>
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {CATEGORIES.map((c) => {
            const { icon: Icon, color } = CATEGORY_ICONS[c.id]
            const active = category === c.id
            return (
              <button
                key={c.id}
                type="button"
                aria-pressed={active}
                onClick={() => setCategory(active ? null : c.id)}
                className={`tile flex items-center justify-between gap-2 p-4 text-left text-[16px] font-semibold transition-colors ${
                  active ? 'bg-brand-50 ring-2 ring-brand' : 'hover:bg-surface-2'
                }`}
              >
                {c.label}
                <Icon className={`size-6 shrink-0 ${color}`} strokeWidth={2} />
              </button>
            )
          })}
        </div>
      </section>

      <section id="events" className="container-page mt-12 scroll-mt-24 sm:mt-14" aria-labelledby="events-title">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 id="events-title" className="text-[26px] font-bold tracking-tight sm:text-[32px]">
              {isFiltering ? 'Matching events' : 'Upcoming events'}
            </h2>
            <p className="mt-1 text-muted">
              {isFiltering
                ? `${plural(filtered.length, 'event')} found`
                : 'Resale tickets from fans, each one verified with DemoTix.'}
            </p>
          </div>
          {isFiltering && (
            <button type="button" onClick={clearFilters} className="btn-secondary px-4 py-2 text-sm">
              <X className="size-4" /> Clear filters
            </button>
          )}
        </div>

        {filtered.length > 0 ? (
          <div className="mt-6 grid gap-3 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((event) => (
              <EventCard key={event.id} event={event} summary={summaries[event.id]} />
            ))}
          </div>
        ) : (
          <div className="tile mt-6 flex flex-col items-center px-6 py-14 text-center">
            <Search className="size-8 text-subtle" />
            <p className="mt-3 text-lg font-semibold">No events match your search</p>
            <p className="mt-1 text-muted">Try an artist, a venue or a city, like "Athens".</p>
            <button type="button" onClick={clearFilters} className="btn-primary mt-5">
              Show all events
            </button>
          </div>
        )}
      </section>

      <HowItWorks />
    </>
  )
}

function Hero({ query, onQuery, onSubmit }) {
  return (
    <section className="relative isolate overflow-hidden bg-[#070b1f]">
      <div className="absolute inset-0 -z-10">
        <EventCover cover={HERO_ART} />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/35 to-black/60" />
      </div>
      <div className="container-page flex min-h-[340px] flex-col items-center justify-center py-14 text-center sm:min-h-[400px]">
        <h1 className="max-w-4xl text-[36px] leading-[1.08] font-bold tracking-tight text-balance text-white sm:text-[52px] lg:text-[56px]">
          Safe, fair resale for sold-out events
        </h1>
        <p className="mt-4 max-w-2xl text-[17px] leading-relaxed text-white/85 sm:text-lg">
          Every ticket is verified with the official ticketing company and reissued in your name. Never above the
          original price.
        </p>
        <form
          role="search"
          className="mt-8 flex w-full max-w-[560px] items-center gap-3 rounded-lg bg-white px-4 shadow-lg"
          onSubmit={(e) => {
            e.preventDefault()
            onSubmit()
          }}
        >
          <Search className="size-5 shrink-0 text-ink" strokeWidth={2.4} />
          <label htmlFor="home-search" className="sr-only">
            Search events
          </label>
          <input
            id="home-search"
            type="search"
            value={query}
            onChange={(e) => onQuery(e.target.value)}
            placeholder="Search events, artists, cities"
            className="h-14 w-full bg-transparent text-[16px] text-ink outline-none placeholder:text-subtle"
            autoComplete="off"
          />
        </form>
      </div>
    </section>
  )
}

const TRUST_POINTS = [
  'Every ticket verified with the official ticketing company',
  'Never above the original price',
  'Old barcode voided, a new one issued in your name',
]

function TrustStrip() {
  return (
    <section className="border-b border-line">
      <div className="container-page flex flex-col gap-5 py-6 md:flex-row md:items-center md:justify-between">
        <ul className="space-y-2">
          {TRUST_POINTS.map((point) => (
            <li key={point} className="flex items-start gap-3 text-[15px] font-medium sm:text-base">
              <Check className="mt-0.5 size-5 shrink-0 text-brand" strokeWidth={3} />
              {point}
            </li>
          ))}
        </ul>
        <div className="flex items-center gap-3 md:flex-col md:items-start md:gap-1.5">
          <span className="text-xs font-bold tracking-wider text-subtle uppercase">Official resale partner</span>
          <DemoTixWordmark className="text-xl text-ink" />
        </div>
      </div>
    </section>
  )
}

function Spotlight({ event, summary }) {
  const hasTickets = summary.available > 0

  return (
    <section className="container-page mt-10 sm:mt-12" aria-label="Featured event">
      <div className="grid overflow-hidden rounded-card bg-ink text-white md:grid-cols-[1.1fr_1fr]">
        <Link to={`/event/${event.id}`} className="relative block aspect-[16/10] md:aspect-auto md:min-h-[300px]">
          <EventCover cover={event.cover} className="absolute inset-0" />
        </Link>
        <div className="flex flex-col justify-center p-6 sm:p-8">
          <div className="flex flex-wrap items-center gap-2">
            <span className="pill bg-coral text-white">{event.soldOut ? 'Sold out' : 'Featured'}</span>
            <span className="pill bg-white/10 text-white">
              <Users className="size-3.5" /> {plural(summary.waitlistPeople, 'fan')} on the waitlist
            </span>
          </div>
          <h2 className="mt-4 text-[28px] leading-tight font-bold tracking-tight sm:text-[34px]">{event.name}</h2>
          <div className="mt-3 space-y-1.5 text-[15px] text-white/80">
            <p className="flex items-center gap-2">
              <CalendarDays className="size-4 text-coral" /> {formatEventDate(event.startsAt)}
            </p>
            <p className="flex items-center gap-2">
              <MapPin className="size-4 text-white/60" /> {event.venue}, {event.city}
            </p>
          </div>
          <p className="mt-4 leading-relaxed text-white/75">
            {hasTickets
              ? `${plural(summary.available, 'verified ticket')} just listed, from ${formatMoney(summary.fromCents)} including fees.`
              : "Sold out at the box office. When a fan can't go, their ticket is verified with DemoTix, offered to the waitlist first, then reissued in the new fan's name."}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link to={`/event/${event.id}`} className="btn-primary">
              {hasTickets ? 'See tickets' : 'Join the waitlist'} <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

const STEPS = [
  {
    icon: ShieldCheck,
    title: 'Verified at the source',
    text: "Before a ticket is listed, the official ticketing company confirms it's real, active and belongs to the seller.",
  },
  {
    icon: Lock,
    title: 'Locked while listed',
    text: "While it's for sale on FixTix, the ticket can't be transferred or sold anywhere else.",
  },
  {
    icon: RefreshCw,
    title: 'Reissued in your name',
    text: 'When you buy, the old barcode is voided and a brand-new ticket is issued to you. No copies, no fakes.',
  },
]

function HowItWorks() {
  return (
    <section className="container-page mt-16 sm:mt-20" aria-labelledby="how-title">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="how-title" className="text-[26px] font-bold tracking-tight sm:text-[32px]">
            How FixTix keeps it fair
          </h2>
          <p className="mt-1 text-muted">Three checks with the ticketing company, on every single ticket.</p>
        </div>
        <Link to="/how-it-works" className="btn-secondary px-4 py-2 text-sm">
          Learn more
        </Link>
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {STEPS.map(({ icon: Icon, title, text }, i) => (
          <div key={title} className="tile p-6">
            <div className="flex items-center gap-3">
              <span className="grid size-11 place-items-center rounded-full bg-brand-50 text-brand">
                <Icon className="size-5" strokeWidth={2.2} />
              </span>
              <span className="text-sm font-bold text-subtle">Step {i + 1}</span>
            </div>
            <h3 className="mt-4 text-lg font-bold">{title}</h3>
            <p className="mt-1.5 leading-relaxed text-muted">{text}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
