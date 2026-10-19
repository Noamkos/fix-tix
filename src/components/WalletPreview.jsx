import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import { QrCode } from './QrCode.jsx'
import { LogoMark } from './Logo.jsx'
import { formatEventDate } from '../lib/format.js'

// A look at how the ticket would appear in the phone's wallet. A real Apple Wallet pass needs a
// paid Apple developer account, which the demo doesn't need (see the spec).
export function WalletPreview({ wallet, ticket, event, place, onClose }) {
  const closeRef = useRef(null)
  useEffect(() => {
    closeRef.current?.focus()
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const [, , dark] = event.cover.colors
  const apple = wallet === 'apple'

  return (
    <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-black/60 p-4" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label={`${apple ? 'Apple' : 'Google'} Wallet preview`} className="w-full max-w-[360px]" onClick={(e) => e.stopPropagation()}>
        <div className="mb-3 flex items-center justify-between text-white">
          <p className="font-semibold">{apple ? 'Apple Wallet' : 'Google Wallet'} preview</p>
          <button ref={closeRef} type="button" onClick={onClose} aria-label="Close" className="grid size-9 place-items-center rounded-full bg-white/15 hover:bg-white/25">
            <X className="size-5" />
          </button>
        </div>

        {apple ? (
          <div className="overflow-hidden rounded-[22px] text-white shadow-2xl" style={{ backgroundColor: dark }}>
            <div className="flex items-center justify-between px-5 pt-4">
              <span className="flex items-center gap-2 font-bold">
                <LogoMark className="size-6 text-white/20" /> FixTix
              </span>
              <span className="text-right text-[11px] leading-tight uppercase opacity-80">
                Date
                <br />
                <span className="text-sm font-semibold normal-case opacity-100">{formatEventDate(event.startsAt)}</span>
              </span>
            </div>
            <div className="px-5 pt-5">
              <p className="text-[11px] uppercase opacity-70">Event</p>
              <p className="text-2xl leading-tight font-bold">{event.name}</p>
            </div>
            <div className="grid grid-cols-2 gap-3 px-5 pt-4 text-sm">
              <Field label="Venue" value={`${event.venue}, ${event.city}`} />
              <Field label="Admission" value={place} />
              <Field label="Holder" value={ticket.owner.name} />
              <Field label="Ticket" value={String(ticket.id)} />
            </div>
            <div className="mx-auto mt-5 mb-5 w-fit rounded-xl bg-white p-2.5">
              <QrCode value={ticket.barcode} className="size-36" />
              <p className="mt-1 text-center font-mono text-[11px] font-bold text-ink">{ticket.barcode}</p>
            </div>
          </div>
        ) : (
          <div className="overflow-hidden rounded-[22px] bg-white shadow-2xl">
            <div className="px-5 py-4 text-white" style={{ backgroundColor: dark }}>
              <span className="flex items-center gap-2 text-sm font-bold">
                <LogoMark className="size-5 text-white/20" /> FixTix · Issued by DemoTix
              </span>
              <p className="mt-3 text-xl leading-tight font-bold">{event.name}</p>
              <p className="mt-1 text-sm opacity-85">{formatEventDate(event.startsAt)}</p>
            </div>
            <div className="grid grid-cols-2 gap-3 px-5 pt-4 text-sm text-ink">
              <Field label="Venue" value={event.venue} light />
              <Field label="Admission" value={place} light />
              <Field label="Holder" value={ticket.owner.name} light />
              <Field label="Ticket" value={String(ticket.id)} light />
            </div>
            <div className="mx-auto my-5 w-fit">
              <QrCode value={ticket.barcode} className="size-40" />
              <p className="mt-1 text-center font-mono text-xs font-bold text-ink">{ticket.barcode}</p>
            </div>
          </div>
        )}

        <p className="mt-3 text-center text-xs leading-relaxed text-white/75">
          Preview only. A real {apple ? 'Apple' : 'Google'} Wallet pass needs a developer account, which the demo doesn't need.
        </p>
      </div>
    </div>
  )
}

function Field({ label, value, light = false }) {
  return (
    <div className="min-w-0">
      <p className={`text-[11px] uppercase ${light ? 'text-muted' : 'opacity-70'}`}>{label}</p>
      <p className="truncate font-semibold">{value}</p>
    </div>
  )
}
