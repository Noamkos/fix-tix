import { useEffect, useRef, useState } from 'react'
import { formatMoney, formatStamp, formatTime } from '../../lib/format.js'

// Cumulative revenue over time, as a step line: money arrives at the moment of each sale.
// One series, so no legend (the card title names it). Hover or arrow keys show each sale.

const PLOT_H = 200
const AXIS_H = 28
const LEFT = 52
const RIGHT = 64
const TOP = 16

// Round the top of the scale up to a clean number of euros: 1, 2, 2.5, 5 × 10^k.
function niceMax(cents) {
  const euros = Math.max(cents / 100, 1)
  const power = 10 ** Math.floor(Math.log10(euros))
  const step = [1, 2, 2.5, 5, 10].find((m) => m * power >= euros)
  return step * power * 100
}

const euroTick = (cents) => {
  const e = cents / 100
  return e >= 1000 ? `€${(e / 1000).toFixed(e % 1000 ? 1 : 0)}K` : `€${Number.isInteger(e) ? e : e.toFixed(2)}`
}

export function RevenueChart({ timeline, now }) {
  const wrapRef = useRef(null)
  const [width, setWidth] = useState(null)
  const [active, setActive] = useState(null)

  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => setWidth(Math.max(280, Math.round(entry.contentRect.width))))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // Frame the sales: start a little before the first one and end now, so the steps fill the chart.
  const firstAt = new Date(timeline[0].at).getTime()
  const lastAt = new Date(timeline.at(-1).at).getTime()
  const end = Math.max(now, lastAt)
  const lead = Math.max(60000, (end - firstAt) * 0.25)
  if (!width) return <div ref={wrapRef} style={{ height: TOP + PLOT_H + AXIS_H }} />

  const t0 = firstAt - lead
  const t1 = end + Math.max(5000, (end - t0) * 0.03)
  const yMax = niceMax(timeline.at(-1).cents)
  const plotW = width - LEFT - RIGHT

  const x = (t) => LEFT + ((t - t0) / (t1 - t0)) * plotW
  const y = (cents) => TOP + PLOT_H - (cents / yMax) * PLOT_H
  const pts = timeline.map((p) => ({ ...p, px: x(new Date(p.at).getTime()), py: y(p.cents) }))

  // Step-after path: flat until the next sale, then straight up.
  let line = `M${x(t0)} ${y(0)}`
  let level = 0
  pts.forEach((p) => {
    line += ` H${p.px} V${p.py}`
    level = p.cents
  })
  const endX = x(end)
  line += ` H${endX}`
  const area = `${line} V${y(0)} H${LEFT} Z`

  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((f) => Math.round(yMax * f))
  const spanH = (t1 - t0) / 3600000
  const xLabel = (t) => (spanH > 36 ? formatStamp(new Date(t).toISOString()).split(',')[0] : formatTime(new Date(t).toISOString()))
  // Up to four time labels, skipping repeats (a few minutes of demo would otherwise read 20:32, 20:32).
  const xTicks = (plotW < 360 ? [0, 1] : [0, 1 / 3, 2 / 3, 1])
    .map((f) => t0 + f * (t1 - t0))
    .filter((t, i, all) => i === 0 || xLabel(t) !== xLabel(all[i - 1]))

  function onMove(e) {
    const rect = e.currentTarget.getBoundingClientRect()
    const mx = ((e.clientX - rect.left) / rect.width) * width
    let best = 0
    pts.forEach((p, i) => {
      if (Math.abs(p.px - mx) < Math.abs(pts[best].px - mx)) best = i
    })
    setActive(best)
  }

  function onKey(e) {
    if (e.key === 'ArrowRight') setActive((i) => Math.min(pts.length - 1, (i ?? -1) + 1))
    else if (e.key === 'ArrowLeft') setActive((i) => Math.max(0, (i ?? pts.length) - 1))
    else return
    e.preventDefault()
  }

  const a = active !== null ? pts[active] : null
  const last = pts.at(-1)

  return (
    <div ref={wrapRef} className="relative">
      <svg width={width} height={TOP + PLOT_H + AXIS_H} className="block overflow-visible" role="img" aria-label={`Cumulative revenue: ${formatMoney(level)} from ${pts.length} sales`}>
        {yTicks.map((t) => (
          <g key={t}>
            <line x1={LEFT} x2={width - RIGHT} y1={y(t)} y2={y(t)} stroke="var(--color-line)" strokeWidth="1" />
            <text x={LEFT - 8} y={y(t)} dy="0.32em" textAnchor="end" className="fill-subtle text-[11px] tabular-nums">
              {euroTick(t)}
            </text>
          </g>
        ))}
        {xTicks.map((t, i) => (
          <text
            key={i}
            x={x(t)}
            y={TOP + PLOT_H + 18}
            textAnchor={i === 0 ? 'start' : i === xTicks.length - 1 ? 'end' : 'middle'}
            className="fill-subtle text-[11px] tabular-nums"
          >
            {xLabel(t)}
          </text>
        ))}

        <path d={area} fill="var(--color-brand)" fillOpacity="0.1" />
        <path d={line} fill="none" stroke="var(--color-brand)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />

        {a && <line x1={a.px} x2={a.px} y1={TOP} y2={TOP + PLOT_H} stroke="var(--color-subtle)" strokeWidth="1" />}
        {(a ? [a] : []).concat(last).map((p, i) => (
          <circle key={i} cx={p.px} cy={p.py} r="4" fill="var(--color-brand)" stroke="#fff" strokeWidth="2" />
        ))}
        <text x={endX + 8} y={last.py} dy="0.32em" className="fill-ink text-[12px] font-semibold">
          {formatMoney(last.cents)}
        </text>

        <rect
          x={LEFT}
          y={TOP}
          width={plotW}
          height={PLOT_H}
          fill="transparent"
          tabIndex={0}
          aria-label="Sales on the chart. Use the arrow keys to step through them."
          onPointerMove={onMove}
          onPointerLeave={() => setActive(null)}
          onFocus={() => setActive(pts.length - 1)}
          onBlur={() => setActive(null)}
          onKeyDown={onKey}
          className="cursor-crosshair outline-none focus-visible:stroke-brand"
        />
      </svg>

      {a && (
        <div
          className="pointer-events-none absolute z-10 w-max max-w-[220px] rounded-lg border border-line bg-white px-3 py-2 text-sm shadow-[0_8px_24px_-12px_rgba(15,10,12,0.35)]"
          style={{ left: Math.min(Math.max(a.px - 110, 0), width - 220), top: Math.max(a.py - 86, 0) }}
        >
          <p className="font-bold text-ink">{formatMoney(a.cents)} so far</p>
          <p className="flex items-center gap-1.5 text-muted">
            <span className="inline-block h-0.5 w-3 rounded bg-brand" aria-hidden="true" />+{formatMoney(a.sale.partnerCents)} at {formatTime(a.at)}
          </p>
          <p className="truncate text-xs text-subtle">{a.sale.event.name}</p>
        </div>
      )}
    </div>
  )
}
