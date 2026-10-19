import { ArrowRight } from 'lucide-react'
import { useStore } from '../../store/useStore.js'
import { API_ACTIONS } from '../../demotix/api.js'
import { plural } from '../../lib/format.js'
import { ApiLogList } from '../../components/demotix/ApiLogList.jsx'

const selectLog = (s) => s.demotix.apiLog.slice().reverse()
const selectCallCounts = (s) => {
  const counts = {}
  s.demotix.apiLog.forEach((e) => (counts[e.action] = (counts[e.action] ?? 0) + 1))
  return counts
}

// Every request between FixTix and DemoTix, plus the short list of what FixTix needs.
export default function ApiLog() {
  const log = useStore(selectLog)
  const calls = useStore(selectCallCounts)

  return (
    <div className="mx-auto w-full max-w-[1100px] px-4 py-6 sm:px-6 sm:py-8">
      <h1 className="text-[26px] font-bold tracking-tight text-white sm:text-[30px]">API log</h1>
      <p className="mt-1 text-console-muted">Every request between FixTix and DemoTix, in plain language.</p>

      <section className="mt-8" aria-labelledby="actions-title">
        <h2 id="actions-title" className="text-lg font-bold text-white">
          What FixTix needs from DemoTix: six actions
        </h2>
        <p className="mt-0.5 text-sm text-console-muted">That's the whole list. Everything else, FixTix builds.</p>
        <ol className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {API_ACTIONS.map((a, i) => (
            <li key={a.id} className="flex flex-col rounded-card border border-console-line bg-console-panel p-4">
              <div className="flex items-center gap-2.5">
                <span className="grid size-7 shrink-0 place-items-center rounded-full bg-dtx text-sm font-bold text-white">{i + 1}</span>
                <h3 className="font-bold text-white">{a.name}</h3>
                <span className="ml-auto rounded-full bg-console-raised px-2 py-0.5 text-xs font-semibold text-console-muted tabular-nums">
                  {plural(calls[a.id] ?? 0, 'call')}
                </span>
              </div>
              <p className="mt-2.5 text-sm text-console-text">{a.what}.</p>
              <dl className="mt-3 space-y-1 text-xs">
                <div>
                  <dt className="inline font-semibold text-console-muted">When: </dt>
                  <dd className="inline text-console-text/85">{a.when}</dd>
                </div>
                <div>
                  <dt className="inline font-semibold text-console-muted">Returns: </dt>
                  <dd className="inline text-console-text/85">{a.returns}</dd>
                </div>
              </dl>
              <p className="mt-auto inline-flex items-center gap-1 pt-3 text-xs font-semibold text-dtx-300">
                {a.direction === 'in' ? (
                  <>
                    FixTix <ArrowRight className="size-3" /> DemoTix
                  </>
                ) : (
                  <>
                    DemoTix <ArrowRight className="size-3" /> FixTix (webhook)
                  </>
                )}
              </p>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-10" aria-labelledby="requests-title">
        <div className="flex items-baseline justify-between gap-3">
          <h2 id="requests-title" className="text-lg font-bold text-white">
            Requests
          </h2>
          <span className="text-sm text-console-muted">{plural(log.length, 'request')}, newest first</span>
        </div>
        <div className="mt-3 overflow-hidden rounded-card border border-console-line bg-console-panel">
          <ApiLogList entries={log} empty="No requests yet. They appear here the moment FixTix talks to DemoTix." />
        </div>
        <p className="mt-3 text-xs text-console-muted">
          In the real product, each request travels over the internet with FixTix's secret access key.
        </p>
      </section>
    </div>
  )
}
