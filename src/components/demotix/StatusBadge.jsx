import { Ban, CheckCircle2, Lock, RefreshCw, ScanLine } from 'lucide-react'
import { statusLabel } from '../../demotix/tickets.js'

// Ticket status as DemoTix shows it, colored for the dark console.
const STYLES = {
  active: { icon: CheckCircle2, className: 'bg-emerald-500/15 text-emerald-300 ring-emerald-400/25' },
  locked: { icon: Lock, className: 'bg-amber-500/15 text-amber-300 ring-amber-400/25' },
  voided: { icon: Ban, className: 'bg-red-500/15 text-red-300 ring-red-400/25' },
  reissued: { icon: RefreshCw, className: 'bg-sky-500/15 text-sky-300 ring-sky-400/25' },
  scanned: { icon: ScanLine, className: 'bg-slate-400/15 text-slate-300 ring-slate-300/20' },
}

export function StatusBadge({ status, className = '' }) {
  const { icon: Icon, className: tone } = STYLES[status] ?? STYLES.active
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold whitespace-nowrap ring-1 ${tone} ${className}`}>
      <Icon className="size-3.5" strokeWidth={2.4} />
      {statusLabel(status)}
    </span>
  )
}

// Dot color per status, for timelines.
export const STATUS_DOT = {
  active: 'bg-emerald-400',
  locked: 'bg-amber-400',
  voided: 'bg-red-400',
  reissued: 'bg-sky-400',
  scanned: 'bg-slate-300',
}
