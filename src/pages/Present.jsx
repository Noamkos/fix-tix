import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { RotateCcw, X } from 'lucide-react'
import { useStore } from '../store/useStore.js'
import { getCurrentUser } from '../lib/selectors.js'
import { resetDemo, SCRIPT, stepPaths, switchUser } from '../fixtix/demo.js'
import { getState } from '../store/store.js'
import { LogoMark } from '../components/Logo.jsx'

const LEFT_VIEWS = [
  ['Ticket database', '/demotix/database'],
  ['API log', '/demotix/api-log'],
  ['Partner revenue', '/demotix/revenue'],
  ['Box office', '/demotix'],
  ['Settings', '/admin/settings'],
]

const RIGHT_VIEWS = [
  ['The other way', '/other-way'],
  ['FixTix home', '/'],
  ['Event page', '/event/ev-aegean'],
  ['Sell a ticket', '/sell'],
  ['Inbox', '/inbox'],
  ['Waitlist', '/waitlist'],
  ['My tickets', '/my-tickets'],
  ['Box office', '/demotix'],
  ['Gate scanner', '/scanner'],
  ['Partner dashboard', '/partner'],
]

const START = { left: '/demotix/database', right: '/other-way' }
const selectPersonas = (s) => s.fixtix.users.filter((u) => u.persona)

// Presentation mode: one screen, two halves. DemoTix's side on the left, FixTix on the right
// (as in the spec). Each half is the real app in a frame; they stay in sync through the store.
export default function Present() {
  const [params, setParams] = useSearchParams()
  const user = useStore(getCurrentUser)
  const personas = useStore(selectPersonas)
  const [frames, setFrames] = useState({ left: params.get('left') ?? START.left, right: params.get('right') ?? START.right, l: 0, r: 0 })
  const [step, setStep] = useState(Number(params.get('step') ?? 0))
  const [confirmReset, setConfirmReset] = useState(false)

  useEffect(() => {
    document.title = 'Presentation mode | FixTix demo'
  }, [])

  // Keep the halves in the address bar, so a refresh brings back the same screens.
  useEffect(() => {
    setParams({ left: frames.left, right: frames.right, step: String(step) }, { replace: true })
  }, [frames.left, frames.right, step, setParams])

  // Each choice reloads its half, even when it's the same screen again.
  const show = (side, path) => setFrames((f) => ({ ...f, [side]: path, [side === 'left' ? 'l' : 'r']: f[side === 'left' ? 'l' : 'r'] + 1 }))

  function goTo(i) {
    const s = SCRIPT[i]
    if (s.reset) return doReset()
    if (s.as !== getState().session.userId) switchUser(s.as)
    const { left, right } = stepPaths(s)
    setStep(i)
    setFrames((f) => ({ left, right, l: f.l + 1, r: f.r + 1 }))
  }

  function doReset() {
    resetDemo()
    setConfirmReset(false)
    setStep(0)
    setFrames((f) => ({ ...START, l: f.l + 1, r: f.r + 1 }))
  }

  const current = SCRIPT[step]

  return (
    <div className="flex h-dvh flex-col bg-console text-console-text">
      <header className="flex shrink-0 flex-wrap items-center gap-x-3 gap-y-2 border-b border-console-line px-3 py-2">
        <Link to="/admin" className="flex items-center gap-2 text-sm font-bold text-white" title="Demo control">
          <LogoMark className="size-7 text-brand" /> Presentation
        </Link>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => goTo(Math.max(0, step - 1))}
            disabled={step === 0}
            className="rounded-md px-2 py-1.5 text-sm font-semibold text-console-muted hover:bg-white/5 hover:text-white disabled:opacity-30"
            aria-label="Previous step"
          >
            ‹
          </button>
          <label className="sr-only" htmlFor="present-step">
            Script step
          </label>
          <select
            id="present-step"
            value={step}
            onChange={(e) => goTo(Number(e.target.value))}
            className="h-8 max-w-[240px] rounded-md border border-console-line bg-console-panel px-2 text-sm text-white"
          >
            {SCRIPT.map((s, i) => (
              <option key={s.title} value={i}>
                {i + 1}. {s.title}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => goTo(Math.min(SCRIPT.length - 2, step + 1))}
            disabled={step >= SCRIPT.length - 2}
            className="rounded-md px-2 py-1.5 text-sm font-semibold text-console-muted hover:bg-white/5 hover:text-white disabled:opacity-30"
            aria-label="Next step"
          >
            ›
          </button>
        </div>

        <p className="hidden min-w-0 flex-1 truncate text-sm text-console-muted xl:block" title={current.say}>
          {current.say}
        </p>

        <div className="ml-auto flex items-center gap-1 rounded-lg bg-console-panel p-0.5">
          {personas.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => switchUser(p.id)}
              className={`rounded-md px-2.5 py-1 text-sm font-semibold ${user?.id === p.id ? 'bg-brand text-white' : 'text-console-muted hover:text-white'}`}
            >
              {p.name.split(' ')[0]}
            </button>
          ))}
          <button
            type="button"
            onClick={() => switchUser(null)}
            className={`rounded-md px-2.5 py-1 text-sm font-semibold ${!user ? 'bg-white/15 text-white' : 'text-console-muted hover:text-white'}`}
          >
            Nobody
          </button>
        </div>

        {confirmReset ? (
          <span className="flex items-center gap-1">
            <button type="button" onClick={() => setConfirmReset(false)} className="rounded-md px-2 py-1 text-sm text-console-muted hover:text-white">
              Cancel
            </button>
            <button type="button" onClick={doReset} className="rounded-md bg-danger px-2.5 py-1 text-sm font-semibold text-white">
              Reset now
            </button>
          </span>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmReset(true)}
            className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-semibold text-console-muted hover:bg-white/5 hover:text-white"
          >
            <RotateCcw className="size-4" /> Reset
          </button>
        )}
        <Link to="/admin" className="grid size-8 place-items-center rounded-md text-console-muted hover:bg-white/5 hover:text-white" aria-label="Exit presentation mode">
          <X className="size-4" />
        </Link>
      </header>

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <Half label="DemoTix" views={LEFT_VIEWS} path={frames.left} frameKey={frames.l} onShow={(p) => show('left', p)} className="lg:border-r lg:border-console-line" />
        <Half label="FixTix" views={RIGHT_VIEWS} path={frames.right} frameKey={frames.r} onShow={(p) => show('right', p)} />
      </div>
    </div>
  )
}

function Half({ label, views, path, frameKey, onShow, className = '' }) {
  const matching = views.find(([, p]) => p === path)
  return (
    <section className={`flex min-h-0 flex-1 flex-col ${className}`} aria-label={label}>
      <div className="flex shrink-0 items-center gap-2 border-b border-console-line bg-console-panel px-3 py-1.5">
        <span className="text-xs font-bold tracking-wider text-console-muted uppercase">{label}</span>
        <select
          value={matching ? path : ''}
          onChange={(e) => e.target.value && onShow(e.target.value)}
          className="h-7 rounded-md border border-console-line bg-console px-1.5 text-xs text-white"
          aria-label={`${label} screen`}
        >
          {!matching && <option value="">{path}</option>}
          {views.map(([name, p]) => (
            <option key={p} value={p}>
              {name}
            </option>
          ))}
        </select>
      </div>
      <iframe key={frameKey} src={path} title={label} className="min-h-0 w-full flex-1 bg-white" />
    </section>
  )
}
