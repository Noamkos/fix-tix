import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { ArrowRight, ArrowUpRight, Calculator, Ticket } from 'lucide-react'
import { useStore } from '../../store/useStore.js'
import { partnerStats } from '../../fixtix/partnerStats.js'
import { priceBreakdown } from '../../lib/pricing.js'
import { formatCount, formatDay, formatMoney, formatStamp, plural } from '../../lib/format.js'
import { useNow } from '../../lib/useNow.js'
import { DemoTixWordmark, Logo } from '../../components/Logo.jsx'
import { RevenueChart } from '../../components/partner/RevenueChart.jsx'

// Screen 17: what FixTix shows the ticketing company about resale on its events.
export default function PartnerDashboard() {
  const stats = useStore(partnerStats)
  const now = useNow(15000)
  const { settings } = stats

  useEffect(() => {
    document.title = 'Partner dashboard | FixTix'
  }, [])

  return (
    <div className="min-h-dvh bg-white text-ink">
      <header className="border-b border-line">
        <div className="container-page flex h-16 items-center gap-3 sm:h-[72px]">
          <Logo to="/partner" />
          <span className="hidden h-6 w-px bg-line sm:block" />
          <span className="hidden text-[15px] font-semibold text-muted sm:block">Partner dashboard</span>
          <div className="ml-auto flex items-center gap-3">
            <span className="flex items-center gap-2 rounded-full border border-line px-3 py-1.5 text-sm">
              <span className="text-muted">Partner</span> <DemoTixWordmark className="text-[15px]" />
            </span>
            <Link to="/demotix" className="hidden items-center gap-1 text-sm font-semibold text-muted hover:text-ink md:inline-flex">
              DemoTix <ArrowUpRight className="size-4" />
            </Link>
          </div>
        </div>
      </header>

      <main className="container-page py-8 sm:py-10">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-[28px] font-bold tracking-tight sm:text-[34px]">Resale on your events</h1>
            <p className="mt-1 text-muted">Every ticket verified, locked and reissued by DemoTix. The last four weeks, and today.</p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-sm font-semibold text-success">
            <span className="size-2 animate-pulse rounded-full bg-success" /> Live
          </span>
        </div>

        {/* Headline: one hero figure, then the supporting tiles. */}
        <section className="mt-6 grid gap-3 lg:grid-cols-[1.15fr_2fr]" aria-label="Key figures">
          <div className="flex flex-col justify-between rounded-card bg-brand-50 p-5 sm:p-6">
            <p className="font-semibold text-brand-700">Your revenue from resale</p>
            <p className="mt-2 text-[52px] leading-none font-bold tracking-tight sm:text-[60px]">{formatMoney(stats.partnerCents)}</p>
            <p className="mt-3 text-sm text-muted">
              {settings.partnerSharePct}% of every resale ticket price, at the current terms. Six API actions on your side; FixTix builds and runs everything else.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Tile label="Tickets that changed hands" value={formatCount(stats.ticketsSwapped)} hint="Each one voided and reissued by DemoTix" />
            <Tile label="Back to fans who couldn't go" value={formatMoney(stats.toFansCents)} hint="What sellers got back, never above the original price" />
            <Tile label="Fans paid in total" value={formatMoney(stats.resaleVolumeCents)} hint="Ticket price plus service fee" />
            <Tile
              label="Fans on waitlists"
              value={formatCount(stats.waitingFans)}
              hint={`Waiting for ${plural(stats.waitingTickets, 'ticket')}: unmet demand`}
            />
          </div>
        </section>

        <section className="mt-6 rounded-card border border-line p-5 sm:p-6" aria-labelledby="chart-title">
          <h2 id="chart-title" className="text-lg font-bold">
            Revenue over time
          </h2>
          <p className="text-sm text-muted">Your share, added up sale by sale.</p>
          {stats.timeline.length ? (
            <>
              <div className="mt-5">
                <RevenueChart timeline={stats.timeline} now={now} />
              </div>
              <p className="mt-3 text-xs text-subtle">Sales before today are sample data for the demo; every sale made during the demo adds a new step.</p>
              <details className="mt-2">
                <summary className="cursor-pointer text-sm font-semibold text-muted hover:text-ink">Show as a table</summary>
                <table className="mt-2 w-full max-w-md text-sm">
                  <thead className="text-left text-xs text-muted uppercase">
                    <tr>
                      <th className="py-1.5 font-semibold">When</th>
                      <th className="py-1.5 font-semibold">Sale</th>
                      <th className="py-1.5 text-right font-semibold">Running total</th>
                    </tr>
                  </thead>
                  <tbody className="tabular-nums">
                    {stats.timeline.map((p) => (
                      <tr key={p.sale.orderId} className="border-t border-line">
                        <td className="py-1.5">{formatStamp(p.at)}</td>
                        <td className="py-1.5">+{formatMoney(p.sale.partnerCents)}</td>
                        <td className="py-1.5 text-right font-semibold">{formatMoney(p.cents)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </details>
            </>
          ) : (
            <div className="mt-5 grid h-[200px] place-items-center rounded-lg bg-surface/60 text-center">
              <div>
                <Ticket className="mx-auto size-7 text-subtle" />
                <p className="mt-2 font-semibold">No resales yet</p>
                <p className="mt-0.5 text-sm text-muted">Complete a purchase on FixTix and watch this chart move.</p>
              </div>
            </div>
          )}
        </section>

        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <EventTable rows={stats.perEvent} />
          <div className="space-y-6">
            <Terms settings={settings} />
            <Projection settings={settings} />
          </div>
        </div>

        <RecentSwaps sales={stats.sales} />
      </main>
    </div>
  )
}

function Tile({ label, value, hint }) {
  return (
    <div className="tile p-4">
      <p className="text-sm leading-snug text-muted">{label}</p>
      <p className="mt-1 text-[26px] font-bold tracking-tight">{value}</p>
      <p className="mt-0.5 text-xs leading-snug text-subtle">{hint}</p>
    </div>
  )
}

function EventTable({ rows }) {
  return (
    <section className="min-w-0 rounded-card border border-line" aria-labelledby="events-table-title">
      <div className="p-5 pb-3 sm:p-6 sm:pb-3">
        <h2 id="events-table-title" className="text-lg font-bold">
          By event
        </h2>
        <p className="text-sm text-muted">Waitlists show where demand is still unmet.</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead className="border-y border-line bg-surface/50 text-xs text-muted uppercase">
            <tr>
              <th className="px-5 py-2.5 font-semibold sm:px-6">Event</th>
              <th className="px-3 py-2.5 text-right font-semibold">Resold</th>
              <th className="px-3 py-2.5 text-right font-semibold">Of the event</th>
              <th className="px-3 py-2.5 text-right font-semibold">Waitlist</th>
              <th className="px-5 py-2.5 text-right font-semibold sm:px-6">Your revenue</th>
            </tr>
          </thead>
          <tbody className="tabular-nums">
            {rows.map((r) => (
              <tr key={r.event.id} className="border-b border-line last:border-0">
                <td className="px-5 py-3 sm:px-6">
                  <div className="font-semibold">{r.event.name}</div>
                  <div className="text-xs text-muted">
                    {formatDay(r.event.startsAt)} · {r.event.city} · {formatCount(r.event.capacity)} capacity
                  </div>
                </td>
                <td className="px-3 py-3 text-right">{r.resold}</td>
                <td className="px-3 py-3 text-right">{r.resold ? `${(r.shareOfEvent * 100).toFixed(r.shareOfEvent < 0.001 ? 3 : 2)}%` : '–'}</td>
                <td className="px-3 py-3 text-right">
                  {r.waitingFans ? (
                    <span>
                      {r.waitingFans} <span className="text-muted">({r.waitingTickets} tix)</span>
                    </span>
                  ) : (
                    '–'
                  )}
                </td>
                <td className="px-5 py-3 text-right font-semibold sm:px-6">{formatMoney(r.partnerCents)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function Terms({ settings }) {
  const example = priceBreakdown(8000, settings)
  const fixtixPct = settings.serviceFeePct - settings.partnerSharePct
  return (
    <section className="rounded-card border border-line p-5 sm:p-6" aria-labelledby="terms-title">
      <h2 id="terms-title" className="text-lg font-bold">
        Current terms
      </h2>
      <dl className="mt-3 space-y-2 text-[15px]">
        <div className="flex justify-between gap-3">
          <dt className="text-muted">Service fee, paid by the buyer</dt>
          <dd className="font-semibold">{settings.serviceFeePct}%</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-muted">Your share</dt>
          <dd className="font-semibold text-brand-700">{settings.partnerSharePct}%</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-muted">FixTix (incl. payment costs)</dt>
          <dd className="font-semibold">{fixtixPct}%</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-muted">Seller pays</dt>
          <dd className="font-semibold">Nothing</dd>
        </div>
      </dl>
      <p className="mt-4 rounded-lg bg-surface px-3 py-2.5 text-sm leading-relaxed text-muted">
        On an {formatMoney(example.ticket)} ticket the buyer pays <span className="font-semibold text-ink">{formatMoney(example.total)}</span>:{' '}
        {formatMoney(example.partner)} to you, {formatMoney(example.fixtix)} to FixTix, {formatMoney(example.ticket)} back to the fan.
      </p>
      <p className="mt-3 text-xs text-subtle">Percentages of the ticket price. Change them in the demo Settings and every figure here updates.</p>
    </section>
  )
}

function Projection({ settings }) {
  const [perYear, setPerYear] = useState(500000)
  const [resalePct, setResalePct] = useState(2)
  const [avgPrice, setAvgPrice] = useState(60)

  const resold = Math.round((perYear * resalePct) / 100)
  const revenue = resold * avgPrice * (settings.partnerSharePct / 100)

  return (
    <section className="rounded-card border border-line p-5 sm:p-6" aria-labelledby="projection-title">
      <h2 id="projection-title" className="flex items-center gap-2 text-lg font-bold">
        <Calculator className="size-5 text-brand" /> What it could mean per year
      </h2>
      <p className="text-sm text-muted">A projection, not a forecast. Adjust the assumptions.</p>
      <div className="mt-4 space-y-3">
        <NumberField label="Tickets you sell per year" value={perYear} onChange={setPerYear} step={50000} />
        <NumberField label="Resold through FixTix" value={resalePct} onChange={setResalePct} step={0.5} suffix="%" />
        <NumberField label="Average ticket price" value={avgPrice} onChange={setAvgPrice} step={5} prefix="€" />
      </div>
      <div className="mt-4 rounded-lg bg-brand-50 p-4">
        <p className="text-sm text-muted">{formatCount(resold)} resold tickets a year, at {settings.partnerSharePct}%</p>
        <p className="mt-1 text-[30px] leading-none font-bold tracking-tight">{formatMoney(Math.round(revenue * 100))}</p>
        <p className="mt-1 text-sm font-semibold text-brand-700">for you, per year</p>
      </div>
    </section>
  )
}

function NumberField({ label, value, onChange, step, prefix, suffix }) {
  return (
    <label className="flex items-center justify-between gap-3 text-sm">
      <span className="text-muted">{label}</span>
      <span className="flex h-10 w-36 shrink-0 items-center gap-1 rounded-lg border border-surface-2 px-3 focus-within:border-brand">
        {prefix && <span className="text-muted">{prefix}</span>}
        <input
          type="number"
          min="0"
          step={step}
          value={value}
          onChange={(e) => onChange(Math.max(0, Number(e.target.value) || 0))}
          className="w-full bg-transparent text-right font-semibold tabular-nums outline-none"
        />
        {suffix && <span className="text-muted">{suffix}</span>}
      </span>
    </label>
  )
}

function RecentSwaps({ sales }) {
  const recent = sales.slice().reverse().slice(0, 10)
  return (
    <section className="mt-6 rounded-card border border-line" aria-labelledby="swaps-title">
      <div className="flex flex-wrap items-end justify-between gap-2 p-5 pb-3 sm:p-6 sm:pb-3">
        <div>
          <h2 id="swaps-title" className="text-lg font-bold">
            Recent swaps
          </h2>
          <p className="text-sm text-muted">Each line is one Void and reissue request to DemoTix. "Recorded" is the share booked at the time of the sale.</p>
        </div>
        <Link to="/demotix/database" className="inline-flex items-center gap-1 text-sm font-semibold text-brand hover:underline">
          See them in the ticket database <ArrowRight className="size-4" />
        </Link>
      </div>
      {recent.length ? (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[620px] text-left text-sm">
            <thead className="border-y border-line bg-surface/50 text-xs text-muted uppercase">
              <tr>
                <th className="px-5 py-2.5 font-semibold sm:px-6">When</th>
                <th className="px-3 py-2.5 font-semibold">Event</th>
                <th className="px-3 py-2.5 font-semibold">Old → new ticket</th>
                <th className="px-3 py-2.5 text-right font-semibold">Fan paid</th>
                <th className="px-5 py-2.5 text-right font-semibold sm:px-6">Recorded for you</th>
              </tr>
            </thead>
            <tbody className="tabular-nums">
              {recent.map((x) => (
                <tr key={x.orderId} className="border-b border-line last:border-0">
                  <td className="px-5 py-3 whitespace-nowrap sm:px-6">{formatStamp(x.at)}</td>
                  <td className="px-3 py-3">{x.event.name}</td>
                  <td className="px-3 py-3 font-mono whitespace-nowrap">
                    {x.oldTicketIds.map((id, i) => `${id} → ${x.newTicketIds[i]}`).join(', ')}
                  </td>
                  <td className="px-3 py-3 text-right">{formatMoney(x.buyerPaidCents)}</td>
                  <td className="px-5 py-3 text-right font-semibold sm:px-6">{formatMoney(x.recordedPartnerCents ?? x.partnerCents)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="border-t border-line px-6 py-8 text-center text-muted">No swaps yet.</p>
      )}
    </section>
  )
}
