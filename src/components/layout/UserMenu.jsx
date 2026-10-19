import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import { ChevronDown, Inbox, ListChecks, LogOut, Ticket, Users } from 'lucide-react'
import { logOut } from '../../fixtix/session.js'

export const ACCOUNT_LINKS = [
  { to: '/my-tickets', label: 'My tickets', icon: Ticket },
  { to: '/my-listings', label: 'My listings', icon: ListChecks },
  { to: '/waitlist', label: 'Waitlist', icon: Users },
  { to: '/inbox', label: 'Inbox', icon: Inbox },
]

export function initials(name) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('')
}

export function Avatar({ user, className = 'size-9 text-sm' }) {
  return (
    <span className={`grid shrink-0 place-items-center rounded-full bg-brand font-bold text-white ${className}`} aria-hidden="true">
      {initials(user.name)}
    </span>
  )
}

// Logged-in fan's menu in the header (desktop).
export function UserMenu({ user, unread }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => setOpen(false), [location.pathname])

  useEffect(() => {
    if (!open) return
    const onClick = (e) => !ref.current?.contains(e.target) && setOpen(false)
    const onKey = (e) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex items-center gap-2 rounded-full py-1 pr-2.5 pl-1 hover:bg-surface"
      >
        <span className="relative">
          <Avatar user={user} />
          {unread > 0 && <span className="absolute -top-0.5 -right-0.5 size-3 rounded-full bg-coral ring-2 ring-white" />}
        </span>
        <span className="text-[15px] font-semibold">{user.name.split(' ')[0]}</span>
        <ChevronDown className={`size-4 text-muted transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div role="menu" className="absolute top-full right-0 mt-2 w-64 overflow-hidden rounded-card border border-line bg-white py-2 shadow-[0_16px_40px_-16px_rgba(15,10,12,0.35)]">
          <div className="px-4 pt-1 pb-3">
            <div className="font-semibold">{user.name}</div>
            <div className="truncate text-sm text-muted">{user.email ?? user.phone}</div>
          </div>
          <div className="border-t border-line py-1">
            {ACCOUNT_LINKS.map(({ to, label, icon: Icon }) => (
              <Link key={to} to={to} role="menuitem" className="flex items-center gap-3 px-4 py-2.5 text-[15px] hover:bg-surface">
                <Icon className="size-4 text-muted" /> {label}
                {to === '/inbox' && unread > 0 && <span className="pill ml-auto bg-coral text-white">{unread}</span>}
              </Link>
            ))}
          </div>
          <div className="border-t border-line pt-1">
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                logOut()
                navigate('/')
              }}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-[15px] hover:bg-surface"
            >
              <LogOut className="size-4 text-muted" /> Log out
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
