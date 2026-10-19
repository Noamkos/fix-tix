import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { ArrowRight, Check, MonitorPlay, RotateCcw } from 'lucide-react'
import { useStore } from '../../store/useStore.js'
import { getCurrentUser } from '../../lib/selectors.js'
import { prepareStep, resetDemo, SCRIPT, switchUser } from '../../fixtix/demo.js'
import { Avatar } from '../../components/layout/UserMenu.jsx'

const selectUsers = (s) => s.fixtix.users

// Every screen in the demo, by part, so any of them is one click away.
const SCREENS = [
  {
    group: 'FixTix site',
    links: [
      ['Home', '/'],
      ['Event page', '/event/ev-aegean'],
      ['Checkout and swap', '/event/ev-aegean'],
      ['My tickets', '/my-tickets'],
      ['Sell a ticket', '/sell'],
      ['My listings', '/my-listings'],
      ['Waitlist', '/waitlist'],
      ['Login', '/login'],
      ['How it works', '/how-it-works'],
      ['Inbox', '/inbox'],
    ],
  },
  {
    group: 'DemoTix',
    links: [
      ['Box office', '/demotix'],
      ['Ticket database', '/demotix/database'],
      ['API log', '/demotix/api-log'],
      ['Partner revenue', '/demotix/revenue'],
    ],
  },
  {
    group: 'Gate, partner and presenting',
    links: [
      ['Gate scanner', '/scanner'],
      ['Partner dashboard', '/partner'],
      ['The other way', '/other-way'],
      ['Presentation mode', '/present'],
      ['Settings', '/admin/settings'],
    ],
  },
]

// Screen 19: run the demo. Reset, choose the fan, start presentation mode, follow the script.
export default function DemoControl() {
  const user = useStore(getCurrentUser)
  const users = useStore(selectUsers)
  const navigate = useNavigate()
  const [done, setDone] = useState([])
  const [confirmReset, setConfirmReset] = useState(false)
  const personas = users.filter((u) => u.persona)

  function openStep(step, i) {
    const { right } = prepareStep(step)
    setDone((d) => (step.reset ? [] : [...new Set([...d, i])]))
    if (!step.reset) navigate(right)
  }

  return (
    <div>
      <h1 className="text-[28px] font-bold tracking-tight sm:text-[32px]">Demo control</h1>
      <p className="mt-1 text-muted">Everything the presenter needs: start fresh, choose who's using FixTix, and follow the script.</p>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <section className="rounded-card border border-line bg-white p-5" aria-labelledby="reset-title">
          <h2 id="reset-title" className="font-bold">
            Start fresh
          </h2>
          <p className="mt-1 text-sm text-muted">
            Back to the starting point: Dana has no ticket yet, Nikos is first on the waitlist, four weeks of sample history, nobody logged in.
          </p>
          {confirmReset ? (
            <div className="mt-4 flex gap-2">
              <button type="button" onClick={() => setConfirmReset(false)} className="btn-secondary flex-1 px-3 py-2.5 text-sm">
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  resetDemo()
                  setDone([])
                  setConfirmReset(false)
                }}
                className="btn flex-1 bg-danger px-3 py-2.5 text-sm text-white hover:bg-danger/90"
              >
                Yes, reset
              </button>
            </div>
          ) : (
            <button type="button" onClick={() => setConfirmReset(true)} className="btn mt-4 w-full border border-danger/30 py-2.5 text-sm text-danger hover:bg-danger/5">
              <RotateCcw className="size-4" /> Reset the demo
            </button>
          )}
        </section>

        <section className="rounded-card border border-line bg-white p-5" aria-labelledby="who-title">
          <h2 id="who-title" className="font-bold">
            Who's using FixTix
          </h2>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {personas.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => switchUser(p.id)}
                className={`flex items-center gap-2 rounded-lg border p-2.5 text-left ${user?.id === p.id ? 'border-brand bg-brand-50' : 'border-line hover:border-surface-2'}`}
              >
                <Avatar user={p} className="size-8 text-xs" />
                <span>
                  <span className="block text-sm font-semibold">{p.name.split(' ')[0]}</span>
                  <span className="block text-xs text-muted capitalize">{p.persona}</span>
                </span>
              </button>
            ))}
          </div>
          <div className="mt-2 flex items-center gap-2">
            <label className="sr-only" htmlFor="any-user">
              Any fan
            </label>
            <select
              id="any-user"
              value={user && !user.persona ? user.id : ''}
              onChange={(e) => e.target.value && switchUser(e.target.value)}
              className="h-10 min-w-0 flex-1 rounded-lg border border-surface-2 bg-white px-2 text-sm"
            >
              <option value="">Another fan…</option>
              {users
                .filter((u) => !u.persona)
                .map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
            </select>
            <button type="button" onClick={() => switchUser(null)} className="btn-secondary px-3 py-2 text-sm">
              Log out
            </button>
          </div>
          <p className="mt-2 text-xs text-muted">Now: {user ? user.name : 'nobody logged in'}</p>
        </section>

        <section className="rounded-card bg-brand p-5 text-white" aria-labelledby="present-title">
          <h2 id="present-title" className="font-bold">
            Presentation mode
          </h2>
          <p className="mt-1 text-sm text-white/85">One screen, two halves: the DemoTix database on the left, FixTix on the right. Changes show on both at once.</p>
          <Link to="/present" className="btn mt-4 w-full bg-white py-2.5 text-sm text-brand hover:bg-white/90">
            <MonitorPlay className="size-4" /> Start presentation mode
          </Link>
        </section>
      </div>

      <section className="mt-8" aria-labelledby="script-title">
        <h2 id="script-title" className="text-xl font-bold">
          The meeting script
        </h2>
        <p className="mt-0.5 text-sm text-muted">Ten steps, one ticket. "Open" logs in the right fan and opens the right screen. In presentation mode the same steps are in the top bar.</p>
        <ol className="mt-4 overflow-hidden rounded-card border border-line bg-white">
          {SCRIPT.map((step, i) => {
            const isDone = done.includes(i)
            return (
              <li key={step.title} className="flex items-center gap-4 border-b border-line px-4 py-3.5 last:border-0 sm:px-5">
                <span
                  className={`grid size-8 shrink-0 place-items-center rounded-full text-sm font-bold ${isDone ? 'bg-success text-white' : 'bg-surface text-ink'}`}
                >
                  {isDone ? <Check className="size-4" strokeWidth={3} /> : i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{step.title}</p>
                  <p className="text-sm text-muted">{step.say}</p>
                </div>
                <button
                  type="button"
                  onClick={() => openStep(step, i)}
                  className={`btn shrink-0 px-3.5 py-2 text-sm ${step.reset ? 'border border-danger/30 text-danger hover:bg-danger/5' : 'btn-secondary'}`}
                >
                  {step.reset ? (
                    <>
                      <RotateCcw className="size-4" /> Reset
                    </>
                  ) : (
                    <>
                      Open <ArrowRight className="size-4" />
                    </>
                  )}
                </button>
              </li>
            )
          })}
        </ol>
      </section>

      <section className="mt-8" aria-labelledby="screens-title">
        <h2 id="screens-title" className="text-xl font-bold">
          All screens
        </h2>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {SCREENS.map((g) => (
            <div key={g.group} className="rounded-card border border-line bg-white p-4">
              <p className="text-xs font-bold tracking-wider text-subtle uppercase">{g.group}</p>
              <ul className="mt-2 space-y-1">
                {g.links.map(([label, to]) => (
                  <li key={label}>
                    <Link to={to} className="text-[15px] text-ink hover:text-brand">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
