import { Link } from 'react-router'
import { BadgeCheck, Banknote, Lock, RefreshCw, ScanLine, ShieldCheck, Tag, Undo2 } from 'lucide-react'
import { useStore } from '../../store/useStore.js'
import { priceBreakdown } from '../../lib/pricing.js'
import { formatDuration, formatMoney } from '../../lib/format.js'
import { DemoTixWordmark } from '../../components/Logo.jsx'

const selectSettings = (s) => s.settings

// The swap, in the four checks every ticket goes through with the ticketing company.
const STEPS = [
  {
    icon: BadgeCheck,
    title: 'Verified at the source',
    text: "The seller enters their order number. DemoTix confirms the ticket is real, still valid and in the seller's name.",
  },
  {
    icon: Lock,
    title: 'Locked while listed',
    text: "From the moment it's listed, DemoTix locks the ticket. It can't be transferred or sold anywhere else.",
  },
  {
    icon: RefreshCw,
    title: 'Reissued in your name',
    text: 'When you buy, DemoTix voids the old barcode and issues a brand-new ticket to you. Only the new one works.',
  },
  {
    icon: ScanLine,
    title: 'Checked at the gate',
    text: 'The gate scanner asks DemoTix. Your new barcode turns green; the old one, or any copy of it, turns red.',
  },
]

export default function HowItWorks() {
  const settings = useStore(selectSettings)
  const example = priceBreakdown(8000, settings)

  const faq = [
    {
      q: 'Is my ticket real?',
      a: "Yes. Every ticket on FixTix is checked with the official ticketing company before it's listed, and the one you receive is issued by them, in your name.",
    },
    {
      q: 'Why do I get a new barcode?',
      a: "Because the seller's barcode is cancelled the moment you buy. No screenshot, PDF or second sale of the old ticket can get anyone in. Only your new ticket opens the gate.",
    },
    {
      q: 'Can a seller ask for more than they paid?',
      a: "No. The highest price is what the seller paid the ticketing company. They can lower it, never raise it.",
    },
    {
      q: 'What does it cost?',
      a: `The buyer pays a ${settings.serviceFeePct}% service fee on top of the ticket price, shown in every price before you choose. Sellers pay nothing. On an ${formatMoney(example.ticket)} ticket you pay ${formatMoney(example.total)}.`,
    },
    {
      q: 'When does the seller get paid?',
      a: "As soon as the buyer's new ticket has been issued, not when they press Pay. If the ticketing company can't issue it, the buyer gets a full refund automatically and the ticket goes back on sale.",
    },
    {
      q: 'What if the event is cancelled?',
      a: 'The ticketing company refunds the original price to whoever the ticket is issued to at that moment, through its usual refund process. After a FixTix resale, that is the buyer.',
    },
    {
      q: 'Can I change my mind after buying?',
      a: 'Once your new ticket is issued, the sale is final, just like a ticket bought at the box office.',
    },
    {
      q: 'How do I log in?',
      a: "With a login link by email or a code by text message. No password, no ID: the real check is with the ticketing company.",
    },
  ]

  return (
    <>
      <section className="bg-surface/60">
        <div className="container-page py-12 text-center sm:py-16">
          <p className="text-sm font-bold tracking-wider text-brand uppercase">How it works</p>
          <h1 className="mx-auto mt-2 max-w-3xl text-[32px] leading-tight font-bold tracking-tight text-balance sm:text-[44px]">
            Every ticket checked with the people who issued it
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted">
            FixTix works directly with the official ticketing company. That's how every resale stays safe and fair.
          </p>
          <p className="mt-6 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm text-muted shadow-sm">
            Official resale partner of <DemoTixWordmark className="text-base text-ink" />
          </p>
        </div>
      </section>

      <section className="container-page mt-12 sm:mt-16" aria-labelledby="steps-title">
        <h2 id="steps-title" className="text-[26px] font-bold tracking-tight sm:text-[32px]">
          From the seller to you, in four checks
        </h2>
        <ol className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {STEPS.map(({ icon: Icon, title, text }, i) => (
            <li key={title} className="tile p-6">
              <div className="flex items-center gap-3">
                <span className="grid size-11 place-items-center rounded-full bg-brand text-white">
                  <Icon className="size-5" />
                </span>
                <span className="text-sm font-bold text-subtle">Step {i + 1}</span>
              </div>
              <h3 className="mt-4 text-lg font-bold">{title}</h3>
              <p className="mt-1.5 leading-relaxed text-muted">{text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="container-page mt-12 sm:mt-16" aria-labelledby="fair-title">
        <h2 id="fair-title" className="text-[26px] font-bold tracking-tight sm:text-[32px]">
          Fair for both sides
        </h2>
        <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_1fr]">
          <div className="rounded-card border border-line p-6">
            <ul className="space-y-4">
              <Rule icon={Tag} title="Never above the original price">
                Sellers can lower the price, but never sell for more than they paid.
              </Rule>
              <Rule icon={ShieldCheck} title="The full price, before you choose">
                Every price on FixTix already includes the {settings.serviceFeePct}% service fee.
              </Rule>
              <Rule icon={Banknote} title="Sellers pay nothing">
                They get back exactly their price, as soon as the buyer's new ticket is issued.
              </Rule>
              <Rule icon={Undo2} title="Refunded if anything fails">
                If the new ticket can't be issued, the buyer's money comes back automatically.
              </Rule>
            </ul>
          </div>
          <div className="rounded-card bg-brand-50 p-6">
            <p className="font-semibold">Where the money goes, on an {formatMoney(example.ticket)} ticket</p>
            <dl className="mt-4 space-y-2.5 text-[15px]">
              <Line label="You pay" value={formatMoney(example.total)} strong />
              <Line label="The fan who couldn't go gets back" value={formatMoney(example.ticket)} />
              <Line label="Service fee" value={formatMoney(example.fee)} />
              <Line label="of which, the ticketing company" value={formatMoney(example.partner)} indent />
              <Line label="of which, FixTix" value={formatMoney(example.fixtix)} indent />
            </dl>
            <p className="mt-4 text-sm text-muted">
              Sold out? Join the waitlist on the event page: when a fan sells, the first in line gets the ticket to themselves for{' '}
              {formatDuration(settings.waitlistOfferMinutes)} before anyone else can buy it.
            </p>
          </div>
        </div>
      </section>

      <section className="container-page mt-12 sm:mt-16" aria-labelledby="faq-title">
        <h2 id="faq-title" className="text-[26px] font-bold tracking-tight sm:text-[32px]">
          Questions
        </h2>
        <div className="mt-6 divide-y divide-line rounded-card border border-line">
          {faq.map(({ q, a }) => (
            <details key={q} className="group px-5 py-4">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold">
                {q}
                <span className="grid size-7 shrink-0 place-items-center rounded-full bg-surface text-lg leading-none text-muted transition-transform group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="mt-2 max-w-3xl leading-relaxed text-muted">{a}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="container-page mt-12 sm:mt-16">
        <div className="flex flex-col items-center gap-4 rounded-card bg-ink px-6 py-10 text-center text-white">
          <p className="text-2xl font-bold">Ready when you are</p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link to="/" className="btn-primary">
              Find tickets
            </Link>
            <Link to="/sell" className="btn bg-white/10 text-white hover:bg-white/20">
              Sell a ticket
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}

function Rule({ icon: Icon, title, children }) {
  return (
    <li className="flex gap-3">
      <Icon className="mt-0.5 size-5 shrink-0 text-brand" />
      <span>
        <span className="block font-semibold">{title}</span>
        <span className="block text-muted">{children}</span>
      </span>
    </li>
  )
}

function Line({ label, value, strong, indent }) {
  return (
    <div className={`flex justify-between gap-4 ${indent ? 'pl-4 text-sm' : ''}`}>
      <dt className={indent ? 'text-muted' : ''}>{label}</dt>
      <dd className={strong ? 'text-lg font-bold' : 'font-semibold'}>{value}</dd>
    </div>
  )
}
