import { useEffect } from 'react'
import { Link, NavLink, Outlet, ScrollRestoration } from 'react-router'
import { ArrowUpRight } from 'lucide-react'
import { DemoTixWordmark } from '../Logo.jsx'

const NAV = [
  { to: '/demotix', label: 'Box office', end: true },
  { to: '/demotix/database', label: 'Ticket database', short: 'Database' },
  { to: '/demotix/api-log', label: 'API log' },
  { to: '/demotix/revenue', label: 'Revenue' },
  { to: '/scanner', label: 'Gate scanner', short: 'Scanner' },
]

// Frame for every DemoTix screen: the fictional ticketing company that stands in for a real one.
export function DemoTixLayout() {
  useEffect(() => {
    document.title = 'DemoTix | Mock ticketing company'
  }, [])

  return (
    <div className="flex min-h-dvh flex-col bg-console text-console-text">
      <header className="sticky top-0 z-40 border-b border-console-line bg-console/95 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-[1400px] items-center gap-3 px-4 sm:gap-5 sm:px-6">
          <Link to="/demotix" aria-label="DemoTix box office" className="shrink-0">
            <DemoTixWordmark compact className="text-[19px] text-white" />
          </Link>
          <span className="pill hidden bg-white/5 font-semibold text-console-muted lg:inline-flex">Mock ticketing company</span>

          <nav
            className="-mx-1 ml-auto flex min-w-0 items-center gap-1 overflow-x-auto px-1 [scrollbar-width:none] max-lg:pr-6 max-lg:[mask-image:linear-gradient(to_right,black_85%,transparent)] [&::-webkit-scrollbar]:hidden"
            aria-label="DemoTix"
          >
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `shrink-0 rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                    isActive ? 'bg-dtx text-white' : 'text-console-muted hover:bg-white/5 hover:text-white'
                  }`
                }
              >
                {item.short ? (
                  <>
                    <span className="sm:hidden">{item.short}</span>
                    <span className="hidden sm:inline">{item.label}</span>
                  </>
                ) : (
                  item.label
                )}
              </NavLink>
            ))}
          </nav>

          <Link
            to="/"
            className="hidden shrink-0 items-center gap-1 rounded-lg border border-console-line px-3 py-2 text-sm font-semibold text-console-muted hover:text-white md:inline-flex"
          >
            FixTix <ArrowUpRight className="size-4" />
          </Link>
        </div>
      </header>

      <main className="flex flex-1 flex-col">
        <Outlet />
      </main>
      <ScrollRestoration />
    </div>
  )
}
