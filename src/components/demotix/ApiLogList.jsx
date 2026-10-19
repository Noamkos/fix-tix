import { ArrowLeft, ArrowRight, Check, X } from 'lucide-react'
import { actionName } from '../../demotix/api.js'
import { formatClock } from '../../lib/format.js'
import { isFresh } from '../../lib/useNow.js'

// One request between FixTix and DemoTix, in plain language.
// `compact` is the short version shown next to the ticket table.
export function ApiLogEntry({ entry, compact = false }) {
  const inbound = entry.direction === 'fixtix_to_demotix'

  return (
    <li className={`px-4 py-3 ${isFresh(entry.at) ? 'animate-row-flash' : ''}`}>
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
        <span className="font-mono text-console-muted">{formatClock(entry.at)}</span>
        <span className="rounded-md bg-dtx/20 px-1.5 py-0.5 font-bold text-dtx-300">{actionName(entry.action)}</span>
        {!compact && (
          <span className="inline-flex items-center gap-1 text-console-muted">
            {inbound ? (
              <>
                FixTix <ArrowRight className="size-3" /> DemoTix
              </>
            ) : (
              <>
                DemoTix <ArrowRight className="size-3" /> FixTix · webhook
              </>
            )}
          </span>
        )}
        <span className="ml-auto font-mono text-console-muted">{entry.durationMs} ms</span>
      </div>

      <p className={`mt-1.5 font-medium text-console-text ${compact ? 'text-sm' : 'text-[15px]'}`}>{entry.summary}</p>
      <p className={`mt-1 flex items-start gap-1.5 text-sm ${entry.ok ? 'text-emerald-300' : 'text-red-300'}`}>
        {entry.ok ? <Check className="mt-0.5 size-4 shrink-0" strokeWidth={3} /> : <X className="mt-0.5 size-4 shrink-0" strokeWidth={3} />}
        {entry.result}
      </p>

      {!compact && (
        <details className="group mt-2">
          <summary className="cursor-pointer text-xs font-semibold text-console-muted select-none hover:text-console-text">
            Show request and response
          </summary>
          <div className="mt-2 grid gap-2 md:grid-cols-2">
            <JsonBlock title={inbound ? 'Request from FixTix' : 'Sent to FixTix'} value={entry.request} icon={ArrowRight} />
            <JsonBlock title={inbound ? 'Response from DemoTix' : 'FixTix replied'} value={entry.response} icon={ArrowLeft} />
          </div>
        </details>
      )}
    </li>
  )
}

function JsonBlock({ title, value, icon: Icon }) {
  return (
    <div className="min-w-0 rounded-lg border border-console-line bg-console">
      <div className="flex items-center gap-1.5 border-b border-console-line px-3 py-1.5 text-xs font-semibold text-console-muted">
        <Icon className="size-3" /> {title}
      </div>
      <pre className="overflow-x-auto p-3 font-mono text-xs leading-relaxed text-console-text">{JSON.stringify(value, null, 2)}</pre>
    </div>
  )
}

export function ApiLogList({ entries, compact = false, empty }) {
  if (!entries.length) {
    return <p className="px-4 py-8 text-center text-sm text-console-muted">{empty}</p>
  }
  return (
    <ul className="divide-y divide-console-line">
      {entries.map((entry) => (
        <ApiLogEntry key={entry.id} entry={entry} compact={compact} />
      ))}
    </ul>
  )
}
