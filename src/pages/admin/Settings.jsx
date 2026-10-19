import { update } from '../../store/store.js'
import { useStore } from '../../store/useStore.js'
import { DEFAULT_SETTINGS } from '../../data/seed.js'
import { priceBreakdown } from '../../lib/pricing.js'
import { formatMoney } from '../../lib/format.js'

const selectSettings = (s) => s.settings

function set(key, value) {
  update((s) => {
    s.settings[key] = value
    // The ticketing company's share is part of the fee, so it can never be larger than the fee.
    if (s.settings.partnerSharePct > s.settings.serviceFeePct) s.settings.partnerSharePct = s.settings.serviceFeePct
  })
}

// Screen 20: the demo's numbers. Every change applies at once, so the split can be
// negotiated live while the Partner dashboard is on screen.
export default function Settings() {
  const settings = useStore(selectSettings)
  const fixtixPct = +(settings.serviceFeePct - settings.partnerSharePct).toFixed(2)
  const example = priceBreakdown(8000, settings)

  return (
    <div className="max-w-[760px]">
      <h1 className="text-[28px] font-bold tracking-tight sm:text-[32px]">Settings</h1>
      <p className="mt-1 text-muted">Changes apply immediately, everywhere in the demo, including the Partner dashboard.</p>

      <section className="mt-6 rounded-card border border-line bg-white p-5 sm:p-6" aria-labelledby="fees-title">
        <h2 id="fees-title" className="text-lg font-bold">
          Fees and split
        </h2>
        <p className="mt-0.5 text-sm text-muted">Percentages of the ticket price. The seller never pays a fee.</p>

        <Slider
          label="Service fee, paid by the buyer"
          value={settings.serviceFeePct}
          min={0}
          max={20}
          step={0.5}
          suffix="%"
          onChange={(v) => set('serviceFeePct', v)}
        />
        <Slider
          label="Ticketing company's share"
          hint="Part of the service fee that goes to DemoTix"
          value={settings.partnerSharePct}
          min={0}
          max={settings.serviceFeePct}
          step={0.5}
          suffix="%"
          onChange={(v) => set('partnerSharePct', v)}
        />
        <div className="mt-5 flex items-center justify-between rounded-lg bg-surface px-4 py-3 text-sm">
          <span className="text-muted">FixTix keeps (payment costs come out of this)</span>
          <span className="text-base font-bold">{fixtixPct}%</span>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-4">
          <Split label="Buyer pays" value={formatMoney(example.total)} strong />
          <Split label="To the seller" value={formatMoney(example.ticket)} />
          <Split label="To DemoTix" value={formatMoney(example.partner)} accent />
          <Split label="To FixTix" value={formatMoney(example.fixtix)} />
        </div>
        <p className="mt-2 text-xs text-subtle">Example: an {formatMoney(8000)} ticket. Sales already made keep the split recorded at the time.</p>
      </section>

      <section className="mt-6 rounded-card border border-line bg-white p-5 sm:p-6" aria-labelledby="times-title">
        <h2 id="times-title" className="text-lg font-bold">
          Times
        </h2>
        <Choice
          label="Waitlist offer"
          hint="How long the first fan in line has the ticket to themselves"
          value={settings.waitlistOfferMinutes}
          options={[
            [1, '1 min (demo)'],
            [5, '5 min'],
            [15, '15 min'],
            [60, '1 hour'],
          ]}
          onChange={(v) => set('waitlistOfferMinutes', v)}
        />
        <Choice
          label="Reserved at checkout"
          hint="How long a ticket is held while the buyer pays"
          value={settings.checkoutHoldMinutes}
          options={[
            [2, '2 min'],
            [5, '5 min'],
            [10, '10 min'],
            [15, '15 min'],
          ]}
          onChange={(v) => set('checkoutHoldMinutes', v)}
        />
        <p className="mt-4 text-xs text-subtle">New offers and reservations use the new times; ones already running keep theirs.</p>
      </section>

      <button
        type="button"
        onClick={() =>
          update((s) => {
            s.settings = { ...DEFAULT_SETTINGS }
          })
        }
        className="btn-secondary mt-6"
      >
        Restore the defaults
      </button>
      <p className="mt-2 text-xs text-subtle">10% fee, 3% to the ticketing company, 1-hour waitlist offers, 10 minutes at checkout.</p>
    </div>
  )
}

function Slider({ label, hint, value, min, max, step, suffix, onChange }) {
  return (
    <label className="mt-5 block">
      <span className="flex items-baseline justify-between gap-3">
        <span>
          <span className="font-semibold">{label}</span>
          {hint && <span className="block text-sm text-muted">{hint}</span>}
        </span>
        <span className="text-xl font-bold">
          {value}
          {suffix}
        </span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-2 w-full accent-brand"
      />
      <span className="flex justify-between text-xs text-subtle">
        <span>
          {min}
          {suffix}
        </span>
        <span>
          {max}
          {suffix}
        </span>
      </span>
    </label>
  )
}

function Choice({ label, hint, value, options, onChange }) {
  return (
    <fieldset className="mt-5">
      <legend className="font-semibold">{label}</legend>
      <p className="text-sm text-muted">{hint}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {options.map(([v, text]) => (
          <button
            key={v}
            type="button"
            aria-pressed={value === v}
            onClick={() => onChange(v)}
            className={`rounded-full px-3.5 py-1.5 text-sm font-semibold ${value === v ? 'bg-ink text-white' : 'bg-surface text-ink hover:bg-surface-2'}`}
          >
            {text}
          </button>
        ))}
      </div>
    </fieldset>
  )
}

function Split({ label, value, strong, accent }) {
  return (
    <div className={`rounded-lg px-3 py-2.5 ${accent ? 'bg-dtx-50' : 'bg-surface/70'}`}>
      <p className="text-xs text-muted">{label}</p>
      <p className={`mt-0.5 ${strong ? 'text-lg font-bold' : 'font-semibold'} ${accent ? 'text-dtx' : ''}`}>{value}</p>
    </div>
  )
}
