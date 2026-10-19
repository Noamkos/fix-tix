// A ticket drawn on screen: event band on top, owner and barcode below, perforated edges.
// `state`: 'valid' | 'voided' | 'issued' | 'fake' | 'pending' (a dashed placeholder while the new ticket is being made).

// Stripes derived from the barcode text, so each barcode looks different.
function Stripes({ code, muted }) {
  const bars = []
  let x = 0
  for (const ch of code.replace(/-/g, '')) {
    const n = ch.charCodeAt(0)
    for (let i = 0; i < 3; i++) {
      const w = 1 + ((n >> i) % 3)
      bars.push(<rect key={bars.length} x={x} y="0" width={w} height="34" />)
      x += w + 1 + ((n >> (i + 2)) % 2)
    }
  }
  return (
    <svg viewBox={`0 0 ${x} 34`} preserveAspectRatio="none" className={`h-9 w-full ${muted ? 'fill-subtle/50' : 'fill-ink'}`} aria-hidden="true">
      {bars}
    </svg>
  )
}

const STAMPS = {
  voided: { text: 'Voided', className: 'border-danger text-danger' },
  issued: { text: 'Valid', className: 'border-success text-success' },
  fake: { text: 'Not found', className: 'border-danger text-danger' },
}

export function TicketStub({ event, ticketNumber, subtitle, place, owner, barcode, state = 'valid', className = '' }) {
  if (state === 'pending') {
    return (
      <div className={`grid min-h-[200px] place-items-center rounded-2xl border-2 border-dashed border-surface-2 bg-surface/40 p-6 text-center ${className}`}>
        <div className="animate-pulse">
          <div className="mx-auto h-3 w-28 rounded bg-surface-2" />
          <div className="mx-auto mt-3 h-3 w-20 rounded bg-surface-2" />
          <div className="mx-auto mt-6 h-8 w-40 rounded bg-surface-2" />
          <p className="mt-4 text-sm font-semibold text-subtle">Your new ticket</p>
        </div>
      </div>
    )
  }

  const voided = state === 'voided' || state === 'fake'
  const stamp = STAMPS[state]

  return (
    <div className={`relative overflow-hidden rounded-2xl border border-line bg-white shadow-[0_12px_32px_-18px_rgba(15,10,12,0.4)] ${className}`}>
      <div className={`px-4 py-3 text-white ${voided ? 'bg-subtle' : 'bg-gradient-to-r from-brand to-brand-700'}`}>
        <p className="truncate text-sm font-bold">{event.name}</p>
        <p className="text-xs text-white/80">{subtitle ?? `Ticket ${ticketNumber}`}</p>
      </div>
      {/* perforation */}
      <div className="relative border-b border-dashed border-line">
        <span className="absolute -top-2.5 -left-2.5 size-5 rounded-full border border-line bg-white" />
        <span className="absolute -top-2.5 -right-2.5 size-5 rounded-full border border-line bg-white" />
      </div>
      <div className="px-4 pt-3 pb-4">
        <p className="text-xs text-muted">{place}</p>
        <p className={`text-[15px] font-semibold ${voided ? 'text-muted' : ''}`}>{owner}</p>
        <div className="mt-3">
          <Stripes code={barcode} muted={voided} />
        </div>
        <p className={`mt-1.5 text-center font-mono text-sm font-bold tracking-wider ${voided ? 'text-muted line-through decoration-danger decoration-2' : ''}`}>
          {barcode}
        </p>
      </div>

      {stamp && (
        <span className="pointer-events-none absolute inset-0 grid place-items-center">
          <span className={`animate-stamp rounded-lg border-4 bg-white/80 px-3 py-1 text-xl font-black tracking-widest whitespace-nowrap uppercase ${stamp.className}`}>
            {stamp.text}
          </span>
        </span>
      )}
    </div>
  )
}
