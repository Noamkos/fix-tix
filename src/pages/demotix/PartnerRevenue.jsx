import { Link } from 'react-router'
import { ArrowUpRight } from 'lucide-react'
import { useStore } from '../../store/useStore.js'
import { partnerStats } from '../../fixtix/partnerStats.js'
import { formatCount, formatMoney, formatStamp, plural } from '../../lib/format.js'
import { isFresh } from '../../lib/useNow.js'

// Screen 15: a small summary inside DemoTix of what resale on FixTix earned, linking to the full dashboard.
export default function PartnerRevenue() {
  const stats = useStore(partnerStats)
  const recent = stats.sales.slice().reverse().slice(0, 5)

  return (
    <div className="mx-auto w-full max-w-[900px] px-4 py-6 sm:px-6 sm:py-8">
      <h1 className="text-[26px] font-bold tracking-tight text-white sm:text-[30px]">Partner revenue</h1>
      <p className="mt-1 text-console-muted">Your share of the service fee on every ticket resold through FixTix.</p>

      <div className="mt-6 rounded-card border border-console-line bg-console-panel p-5 sm:p-6">
        <p className="text-sm font-semibold text-dtx-300">Earned so far</p>
        <p className="mt-1 text-[52px] leading-none font-bold tracking-tight text-white">{formatMoney(stats.partnerCents)}</p>
        <p className="mt-3 text-sm text-console-muted">
          {stats.settings.partnerSharePct}% of the ticket price on {plural(stats.ticketsSwapped, 'resold ticket')}. Six API actions on your side; FixTix runs everything else.
        </p>

        <dl className="mt-6 grid grid-cols-3 gap-3 border-t border-console-line pt-5">
          <Figure label="Tickets swapped" value={formatCount(stats.ticketsSwapped)} />
          <Figure label="Back to fans" value={formatMoney(stats.toFansCents)} />
          <Figure label="Fans waiting" value={formatCount(stats.waitingFans)} />
        </dl>

        <Link to="/partner" className="btn mt-6 bg-dtx text-white hover:bg-dtx-600">
          Open the full partner dashboard <ArrowUpRight className="size-4" />
        </Link>
      </div>

      <h2 className="mt-8 text-lg font-bold text-white">Latest resales</h2>
      <div className="mt-3 overflow-hidden rounded-card border border-console-line bg-console-panel">
        {recent.length ? (
          <ul className="divide-y divide-console-line">
            {recent.map((x) => (
              <li key={x.orderId} className={`flex items-center justify-between gap-4 px-4 py-3 ${isFresh(x.at) ? 'animate-row-flash' : ''}`}>
                <div className="min-w-0">
                  <p className="truncate font-medium text-console-text">{x.event.name}</p>
                  <p className="font-mono text-xs text-console-muted">
                    {x.oldTicketIds.map((id, i) => `${id} → ${x.newTicketIds[i]}`).join(', ')} · {formatStamp(x.at)}
                  </p>
                </div>
                <p className="shrink-0 font-semibold text-emerald-300">+{formatMoney(x.recordedPartnerCents ?? x.partnerCents)}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="px-4 py-8 text-center text-sm text-console-muted">No resales yet. They appear here the moment a fan buys on FixTix.</p>
        )}
      </div>
    </div>
  )
}

function Figure({ label, value }) {
  return (
    <div>
      <dt className="text-xs text-console-muted">{label}</dt>
      <dd className="mt-0.5 text-xl font-bold text-white">{value}</dd>
    </div>
  )
}
