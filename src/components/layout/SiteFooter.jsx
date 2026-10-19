import { Link } from 'react-router'
import { Logo } from '../Logo.jsx'

const COLUMNS = [
  {
    title: 'Buy',
    links: [
      { to: '/', label: 'Upcoming events' },
      { to: '/waitlist', label: 'My waitlist' },
      { to: '/my-tickets', label: 'My tickets' },
    ],
  },
  {
    title: 'Sell',
    links: [
      { to: '/sell', label: 'Sell a ticket' },
      { to: '/my-listings', label: 'My listings' },
    ],
  },
  {
    title: 'FixTix',
    links: [
      { to: '/how-it-works', label: 'How it works' },
      { to: '/inbox', label: 'Inbox' },
    ],
  },
  {
    title: 'Demo: DemoTix',
    links: [
      { to: '/demotix', label: 'Box office' },
      { to: '/demotix/database', label: 'Ticket database' },
      { to: '/demotix/api-log', label: 'API log' },
      { to: '/scanner', label: 'Gate scanner' },
      { to: '/partner', label: 'Partner dashboard' },
    ],
  },
]

export function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-line bg-surface/60">
      <div className="container-page grid grid-cols-2 gap-10 py-12 md:grid-cols-[1.4fr_repeat(4,1fr)]">
        <div className="col-span-2 md:col-span-1">
          <Logo />
          <p className="mt-4 max-w-xs text-[15px] leading-relaxed text-muted">
            Safe and fair resale for fans. Every ticket verified with the official ticketing company, never above the
            original price.
          </p>
        </div>
        {COLUMNS.map((col) => (
          <div key={col.title}>
            <h4 className="text-sm font-bold tracking-wide text-ink uppercase">{col.title}</h4>
            <ul className="mt-3 space-y-2">
              {col.links.map((l) => (
                <li key={l.to}>
                  <Link to={l.to} className="text-[15px] text-muted hover:text-brand">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-line">
        <p className="container-page py-5 text-[13px] leading-relaxed text-subtle">
          Demo build. No real payments, tickets or messages. DemoTix and all events, artists and people shown are
          fictional.
        </p>
      </div>
    </footer>
  )
}
