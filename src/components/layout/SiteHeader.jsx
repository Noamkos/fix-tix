import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router'
import { LogOut, Menu, X } from 'lucide-react'
import { Logo } from '../Logo.jsx'
import { useStore } from '../../store/useStore.js'
import { getCurrentUser } from '../../lib/selectors.js'
import { logOut } from '../../fixtix/session.js'
import { ACCOUNT_LINKS, Avatar, UserMenu } from './UserMenu.jsx'

const navClass = ({ isActive }) =>
  `rounded-lg px-3.5 py-2 text-[15px] font-medium transition-colors hover:bg-surface ${isActive ? 'text-brand' : 'text-ink/80'}`

const selectUnread = (s) => s.fixtix.messages.filter((m) => m.userId === s.session.userId && !m.read).length

export function SiteHeader() {
  const [open, setOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const user = useStore(getCurrentUser)
  const unread = useStore(selectUnread)

  // Close the mobile menu whenever the page changes.
  useEffect(() => setOpen(false), [location.pathname])

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-white/95 backdrop-blur">
      <div className="container-page flex h-16 items-center justify-between gap-4 sm:h-[72px]">
        <Logo />

        <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
          <NavLink to="/how-it-works" className={navClass}>
            How it works
          </NavLink>
          {user ? (
            <>
              <NavLink to="/my-tickets" className={navClass}>
                My tickets
              </NavLink>
              <div className="ml-1">
                <UserMenu user={user} unread={unread} />
              </div>
            </>
          ) : (
            <NavLink to="/login" className={navClass}>
              Log in
            </NavLink>
          )}
          <Link to="/sell" className="btn-primary ml-3 px-5 py-2.5">
            Sell your tickets
          </Link>
        </nav>

        <button
          type="button"
          className="relative grid size-11 place-items-center rounded-lg text-ink hover:bg-surface md:hidden"
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="size-6" /> : <Menu className="size-6" />}
          {!open && unread > 0 && <span className="absolute top-2 right-2 size-2.5 rounded-full bg-coral" />}
        </button>
      </div>

      {open && (
        <nav
          className="absolute inset-x-0 top-full border-t border-line bg-white shadow-[0_16px_24px_-16px_rgba(15,10,12,0.3)] md:hidden"
          aria-label="Mobile"
        >
          <div className="container-page flex flex-col py-3">
            {user && (
              <div className="mb-2 flex items-center gap-3 border-b border-line px-2 pb-4">
                <Avatar user={user} className="size-10 text-sm" />
                <div className="min-w-0">
                  <div className="font-semibold">{user.name}</div>
                  <div className="truncate text-sm text-muted">{user.email ?? user.phone}</div>
                </div>
              </div>
            )}
            <NavLink to="/how-it-works" className="rounded-lg px-2 py-3 text-[17px] font-medium hover:bg-surface">
              How it works
            </NavLink>
            {user ? (
              <>
                {ACCOUNT_LINKS.map(({ to, label, icon: Icon }) => (
                  <NavLink key={to} to={to} className="flex items-center gap-3 rounded-lg px-2 py-3 text-[17px] font-medium hover:bg-surface">
                    <Icon className="size-5 text-muted" /> {label}
                    {to === '/inbox' && unread > 0 && <span className="pill ml-auto bg-coral text-white">{unread}</span>}
                  </NavLink>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    logOut()
                    navigate('/')
                  }}
                  className="flex items-center gap-3 rounded-lg px-2 py-3 text-left text-[17px] font-medium hover:bg-surface"
                >
                  <LogOut className="size-5 text-muted" /> Log out
                </button>
              </>
            ) : (
              <NavLink to="/login" className="rounded-lg px-2 py-3 text-[17px] font-medium hover:bg-surface">
                Log in
              </NavLink>
            )}
            <Link to="/sell" className="btn-primary mt-2 w-full">
              Sell your tickets
            </Link>
          </div>
        </nav>
      )}
    </header>
  )
}
