import { useEffect } from 'react'
import { Link, NavLink, Outlet, ScrollRestoration } from 'react-router'
import { ArrowUpRight, MonitorPlay } from 'lucide-react'
import { Logo } from '../Logo.jsx'

const TABS = [
  { to: '/admin', label: 'Demo control', end: true },
  { to: '/admin/settings', label: 'Settings' },
]

// The FixTix admin's screens: running the demo, and the numbers behind it.
export function AdminLayout() {
  useEffect(() => {
    document.title = 'Demo control | FixTix'
  }, [])

  return (
    <div className="min-h-dvh bg-surface/40 text-ink">
      <header className="border-b border-line bg-white">
        <div className="container-page flex h-16 items-center gap-3">
          <Logo to="/admin" />
          <span className="pill hidden bg-ink text-white sm:inline-flex">Admin</span>
          <nav className="flex items-center gap-1 sm:ml-2" aria-label="Admin">
            {TABS.map((t) => (
              <NavLink
                key={t.to}
                to={t.to}
                end={t.end}
                className={({ isActive }) => `rounded-lg px-3 py-2 text-sm font-semibold ${isActive ? 'bg-surface text-ink' : 'text-muted hover:text-ink'}`}
              >
                {t.label}
              </NavLink>
            ))}
          </nav>
          <div className="ml-auto hidden items-center gap-2 sm:flex">
            <Link to="/present" className="btn-primary hidden px-3.5 py-2 text-sm sm:inline-flex">
              <MonitorPlay className="size-4" /> Presentation mode
            </Link>
            <Link to="/" className="hidden items-center gap-1 text-sm font-semibold text-muted hover:text-ink md:inline-flex">
              FixTix site <ArrowUpRight className="size-4" />
            </Link>
          </div>
        </div>
      </header>
      <main className="container-page py-8 sm:py-10">
        <Outlet />
      </main>
      <ScrollRestoration />
    </div>
  )
}
