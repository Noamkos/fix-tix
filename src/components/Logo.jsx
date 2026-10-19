import { Link } from 'react-router'

// FixTix mark: a ticket with a check, for "safe and fair".
export function LogoMark({ className = 'size-8' }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <rect width="32" height="32" rx="9" fill="currentColor" />
      <path
        d="M8 9h16a2 2 0 0 1 2 2v2.5a2.5 2.5 0 0 0 0 5V21a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2v-2.5a2.5 2.5 0 0 0 0-5V11a2 2 0 0 1 2-2z"
        fill="#fff"
      />
      <path
        d="M11.6 16.2l3 3 6-6.2"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function Logo({ to = '/', className = '' }) {
  return (
    <Link to={to} className={`flex items-center gap-2 text-brand ${className}`} aria-label="FixTix home">
      <LogoMark className="size-8 sm:size-9" />
      <span className="text-[24px] font-extrabold tracking-tight sm:text-[26px]">
        <span className="text-ink">Fix</span>Tix
      </span>
    </Link>
  )
}

// Wordmark of the fictional ticketing company used throughout the demo.
// `compact` hides the name on phones and keeps only the icon.
export function DemoTixWordmark({ className = '', compact = false }) {
  return (
    <span className={`inline-flex items-center gap-1.5 font-extrabold tracking-tight ${className}`}>
      <span className="grid size-6 place-items-center rounded-md bg-dtx text-[13px] leading-none text-white">D</span>
      <span className={compact ? 'hidden sm:inline' : ''}>
        demo<span className="text-dtx">tix</span>
      </span>
    </span>
  )
}
