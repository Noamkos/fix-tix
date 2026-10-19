import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import { MonitorPlay, RotateCcw, Settings2, SlidersHorizontal, X } from 'lucide-react'
import { useStore } from '../../store/useStore.js'
import { getCurrentUser } from '../../lib/selectors.js'
import { isEmbedded, resetDemo, switchUser } from '../../fixtix/demo.js'
import { Avatar } from '../layout/UserMenu.jsx'

const selectPersonas = (s) => s.fixtix.users.filter((u) => u.persona)

// The presenter's little panel, on every screen (bottom left): reset, switch fan, presentation mode.
// Hidden inside presentation mode, where the top bar has the same controls.
export function DemoDock() {
  const [open, setOpen] = useState(false)
  const [confirmReset, setConfirmReset] = useState(false)
  const user = useStore(getCurrentUser)
  const personas = useStore(selectPersonas)
  const location = useLocation()
  const navigate = useNavigate()
  const ref = useRef(null)

  useEffect(() => {
    setOpen(false)
    setConfirmReset(false)
  }, [location.pathname])

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

  if (isEmbedded() || location.pathname.startsWith('/present')) return null

  return (
    <div ref={ref} className="fixed bottom-4 left-4 z-[60] print:hidden">
      {open && (
        <div role="dialog" aria-label="Demo controls" className="mb-2 w-[290px] overflow-hidden rounded-card border border-line bg-white text-ink shadow-[0_16px_40px_-12px_rgba(15,10,12,0.45)]">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <p className="text-sm font-bold">Demo controls</p>
            <button type="button" onClick={() => setOpen(false)} aria-label="Close" className="grid size-7 place-items-center rounded-md text-muted hover:bg-surface">
              <X className="size-4" />
            </button>
          </div>

          <div className="px-4 py-3">
            <p className="text-xs font-semibold text-subtle uppercase">Using FixTix as</p>
            <div className="mt-2 grid grid-cols-3 gap-1.5">
              {personas.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => switchUser(p.id)}
                  className={`rounded-lg px-2 py-2 text-sm font-semibold ${user?.id === p.id ? 'bg-brand text-white' : 'bg-surface hover:bg-surface-2'}`}
                >
                  {p.name.split(' ')[0]}
                </button>
              ))}
              <button
                type="button"
                onClick={() => switchUser(null)}
                className={`rounded-lg px-2 py-2 text-sm font-semibold ${!user ? 'bg-ink text-white' : 'bg-surface hover:bg-surface-2'}`}
              >
                Nobody
              </button>
            </div>
            {user && !user.persona && <p className="mt-2 text-xs text-muted">Currently: {user.name}</p>}
          </div>

          <div className="space-y-1 border-t border-line px-2 py-2">
            <Link to="/present" className="flex items-center gap-3 rounded-lg px-2 py-2 text-sm font-medium hover:bg-surface">
              <MonitorPlay className="size-4 text-brand" /> Presentation mode
            </Link>
            <Link to="/admin" className="flex items-center gap-3 rounded-lg px-2 py-2 text-sm font-medium hover:bg-surface">
              <SlidersHorizontal className="size-4 text-muted" /> Demo control and script
            </Link>
            <Link to="/admin/settings" className="flex items-center gap-3 rounded-lg px-2 py-2 text-sm font-medium hover:bg-surface">
              <Settings2 className="size-4 text-muted" /> Settings
            </Link>
          </div>

          <div className="border-t border-line px-4 py-3">
            {confirmReset ? (
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium">Back to the start?</p>
                <div className="flex gap-1.5">
                  <button type="button" onClick={() => setConfirmReset(false)} className="rounded-lg px-2.5 py-1.5 text-sm font-semibold text-muted hover:bg-surface">
                    No
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      resetDemo()
                      setConfirmReset(false)
                      setOpen(false)
                      navigate('/')
                    }}
                    className="rounded-lg bg-danger px-2.5 py-1.5 text-sm font-semibold text-white"
                  >
                    Reset
                  </button>
                </div>
              </div>
            ) : (
              <button type="button" onClick={() => setConfirmReset(true)} className="flex w-full items-center gap-2 text-sm font-semibold text-danger">
                <RotateCcw className="size-4" /> Reset the demo
              </button>
            )}
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label="Demo controls"
        className="flex items-center gap-2 rounded-full bg-ink p-1.5 text-sm font-semibold text-white opacity-80 shadow-lg ring-1 ring-white/10 hover:bg-ink/90 hover:opacity-100 sm:pr-3.5 sm:opacity-100"
      >
        {user ? (
          <Avatar user={user} className="size-7 text-[11px]" />
        ) : (
          <span className="grid size-7 place-items-center rounded-full bg-white/15">
            <SlidersHorizontal className="size-3.5" />
          </span>
        )}
        {/* On phones just the round icon, so it doesn't cover the page. */}
        <span className="hidden sm:inline">Demo</span>
      </button>
    </div>
  )
}
