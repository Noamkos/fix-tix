import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router'
import { ArrowUpRight, CheckCircle2, Keyboard, List, ScanLine, Volume2, VolumeX, XCircle } from 'lucide-react'
import { useStore } from '../../store/useStore.js'
import { RESULTS, scanBarcode } from '../../demotix/gate.js'
import { FAKE_TICKET } from '../../data/seed.js'
import { beep } from '../../lib/beep.js'
import { formatClock } from '../../lib/format.js'
import { CameraScanner } from '../../components/scanner/CameraScanner.jsx'
import { StatusBadge } from '../../components/demotix/StatusBadge.jsx'

const MODES = [
  { id: 'camera', label: 'Camera', short: 'Camera', icon: ScanLine },
  { id: 'list', label: 'Pick a ticket', short: 'List', icon: List },
  { id: 'type', label: 'Type a code', short: 'Type', icon: Keyboard },
]

const RESULT_SHOWN_MS = 4500

const selectRecentScans = (s) => s.demotix.scans.slice(-8).reverse()
const selectCounts = (s) => {
  const valid = s.demotix.scans.filter((x) => x.result === 'valid').length
  return { valid, rejected: s.demotix.scans.length - valid }
}
// Most recently changed first, so the tickets from the demo story are on top.
const selectTickets = (s) => {
  const names = Object.fromEntries(s.events.map((e) => [e.id, e.name]))
  return s.demotix.tickets
    .slice()
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt) || b.id - a.id)
    .map((t) => ({ ...t, eventName: names[t.eventId] }))
}

// The steward's screen at the venue gate (process E).
export default function Scanner() {
  const [mode, setMode] = useState('list')
  const [result, setResult] = useState(null)
  const [sound, setSound] = useState(true)
  const recent = useStore(selectRecentScans)
  const counts = useStore(selectCounts)

  useEffect(() => {
    document.title = 'Gate scanner | DemoTix'
  }, [])

  const scan = useCallback(
    (code) => {
      if (result) return
      const outcome = scanBarcode(code)
      setResult(outcome)
      if (sound) beep(RESULTS[outcome.result].ok)
    },
    [result, sound],
  )

  // The result fills the screen for a few seconds, then the scanner is ready again.
  useEffect(() => {
    if (!result) return
    const timer = setTimeout(() => setResult(null), RESULT_SHOWN_MS)
    return () => clearTimeout(timer)
  }, [result])

  return (
    <div className="min-h-dvh bg-console text-console-text">
      <header className="border-b border-console-line">
        <div className="mx-auto flex h-16 w-full max-w-[1100px] items-center gap-3 px-4 sm:px-6">
          <span className="grid size-8 place-items-center rounded-lg bg-dtx text-white">
            <ScanLine className="size-4" />
          </span>
          <div className="min-w-0">
            <p className="leading-tight font-bold text-white">Gate scanner</p>
            <p className="text-xs text-console-muted">DemoTix · Gate A</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSound((v) => !v)}
              aria-label={sound ? 'Mute beeps' : 'Turn beeps on'}
              className="grid size-9 place-items-center rounded-lg text-console-muted hover:bg-white/5 hover:text-white"
            >
              {sound ? <Volume2 className="size-5" /> : <VolumeX className="size-5" />}
            </button>
            <Link to="/demotix/database" className="hidden items-center gap-1 rounded-lg border border-console-line px-3 py-2 text-sm font-semibold text-console-muted hover:text-white sm:inline-flex">
              Ticket database <ArrowUpRight className="size-4" />
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto grid w-full max-w-[1100px] gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[1fr_320px]">
        <section aria-label="Scan a ticket" className="min-w-0">
          <p className="text-console-muted">Every barcode is checked live against the DemoTix ticket database.</p>
          <div className="mt-4 grid grid-cols-3 gap-1 rounded-xl bg-console-panel p-1" role="tablist">
            {MODES.map(({ id, label, short, icon: Icon }) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={mode === id}
                onClick={() => setMode(id)}
                className={`flex items-center justify-center gap-2 rounded-lg px-2 py-2.5 text-sm font-semibold transition-colors ${
                  mode === id ? 'bg-dtx text-white' : 'text-console-muted hover:text-white'
                }`}
              >
                <Icon className="size-4 shrink-0" /> <span className="sm:hidden">{short}</span>
                <span className="hidden truncate sm:inline">{label}</span>
              </button>
            ))}
          </div>

          <div className="mt-4">
            {mode === 'camera' && <CameraScanner onCode={scan} paused={Boolean(result)} />}
            {mode === 'list' && <PickTicket onPick={scan} />}
            {mode === 'type' && <TypeCode onSubmit={scan} />}
          </div>
        </section>

        <aside aria-label="Recent scans" className="min-w-0 self-start rounded-card border border-console-line bg-console-panel">
          <div className="flex items-center justify-between border-b border-console-line px-4 py-3">
            <h2 className="text-sm font-bold text-white">Recent scans</h2>
            <p className="text-xs text-console-muted">
              <span className="font-semibold text-emerald-300">{counts.valid} in</span> · <span className="font-semibold text-red-300">{counts.rejected} rejected</span>
            </p>
          </div>
          {recent.length ? (
            <ul className="divide-y divide-console-line">
              {recent.map((s) => {
                const ok = RESULTS[s.result].ok
                return (
                  <li key={s.id} className="flex items-center gap-3 px-4 py-2.5">
                    {ok ? <CheckCircle2 className="size-5 shrink-0 text-emerald-400" /> : <XCircle className="size-5 shrink-0 text-red-400" />}
                    <div className="min-w-0 flex-1">
                      <p className={`text-sm font-semibold ${ok ? 'text-emerald-300' : 'text-red-300'}`}>{RESULTS[s.result].title}</p>
                      <p className="truncate font-mono text-xs text-console-muted">{s.barcode}</p>
                    </div>
                    <span className="font-mono text-xs text-console-muted">{formatClock(s.at)}</span>
                  </li>
                )
              })}
            </ul>
          ) : (
            <p className="px-4 py-8 text-center text-sm text-console-muted">No scans yet.</p>
          )}
        </aside>
      </main>

      {result && <ResultScreen result={result} onDone={() => setResult(null)} />}
    </div>
  )
}

function PickTicket({ onPick }) {
  const tickets = useStore(selectTickets)
  const [showAll, setShowAll] = useState(false)
  const shown = showAll ? tickets : tickets.slice(0, 6)

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={() => onPick(FAKE_TICKET.barcode)}
        className="flex w-full items-center gap-3 rounded-card border border-dashed border-red-400/40 bg-red-500/5 px-4 py-3 text-left hover:bg-red-500/10"
      >
        <XCircle className="size-5 shrink-0 text-red-300" />
        <span className="min-w-0 flex-1">
          <span className="block font-semibold text-white">A ticket from an unofficial resale site</span>
          <span className="block truncate text-sm text-console-muted">
            Bought on {FAKE_TICKET.site} · <span className="font-mono">{FAKE_TICKET.barcode}</span>
          </span>
        </span>
      </button>

      <ul className="overflow-hidden rounded-card border border-console-line bg-console-panel">
        {shown.map((t) => (
          <li key={t.id} className="border-b border-console-line last:border-0">
            <button type="button" onClick={() => onPick(t.barcode)} className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-white/[0.04]">
              <span className="w-12 shrink-0 font-mono font-bold text-white">{t.id}</span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm text-console-text">
                  {t.owner.name} · {t.eventName}
                </span>
                <span className={`block font-mono text-xs ${t.status === 'voided' ? 'text-console-muted line-through' : 'text-console-muted'}`}>{t.barcode}</span>
              </span>
              <StatusBadge status={t.status} className="hidden sm:inline-flex" />
            </button>
          </li>
        ))}
      </ul>
      {tickets.length > 6 && (
        <button type="button" onClick={() => setShowAll((v) => !v)} className="text-sm font-semibold text-dtx-300 hover:text-white">
          {showAll ? 'Show fewer' : `Show all ${tickets.length} tickets`}
        </button>
      )}
    </div>
  )
}

function TypeCode({ onSubmit }) {
  const [code, setCode] = useState('')
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        if (code.trim()) onSubmit(code)
      }}
      className="rounded-card border border-console-line bg-console-panel p-4"
    >
      <label className="block">
        <span className="text-sm font-semibold text-white">Barcode</span>
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="DTX-XXXX-XXXX"
          autoComplete="off"
          className="mt-1.5 block h-12 w-full rounded-lg border border-console-line bg-console px-3.5 font-mono text-lg tracking-wider text-white uppercase outline-none placeholder:text-console-muted/60 focus:border-dtx"
        />
      </label>
      <button type="submit" disabled={!code.trim()} className="btn mt-3 w-full bg-dtx text-white hover:bg-dtx-600">
        Check barcode
      </button>
    </form>
  )
}

function ResultScreen({ result, onDone }) {
  const meta = RESULTS[result.result]
  const Icon = meta.ok ? CheckCircle2 : XCircle

  return (
    <button
      type="button"
      onClick={onDone}
      aria-live="assertive"
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center px-6 text-center text-white ${meta.ok ? 'bg-emerald-600' : 'bg-red-600'}`}
    >
      <Icon className="size-24 animate-rise sm:size-32" strokeWidth={2.2} />
      <p className="mt-4 text-5xl font-black tracking-tight uppercase sm:text-7xl">{meta.title}</p>
      <p className="mt-3 max-w-xl text-xl font-semibold text-white/90 sm:text-2xl">{result.reason}</p>

      {result.ticketId && (
        <div className="mt-8 w-full max-w-sm rounded-card bg-black/15 px-5 py-4 text-left">
          <p className="font-semibold">{result.holder}</p>
          <p className="text-sm text-white/80">{result.eventName}</p>
          <p className="text-sm text-white/80">
            Ticket {result.ticketNumber} · {result.place}
          </p>
          <p className="mt-2 font-mono text-sm font-bold tracking-wider">{result.barcode}</p>
        </div>
      )}
      {!result.ticketId && <p className="mt-6 font-mono text-lg font-bold tracking-wider">{result.barcode}</p>}

      <p className="mt-10 text-sm text-white/75">Tap anywhere to scan the next ticket</p>
      <span className="mt-3 h-1 w-40 overflow-hidden rounded-full bg-white/25">
        <span className="block h-full origin-left animate-shrink bg-white" />
      </span>
    </button>
  )
}
