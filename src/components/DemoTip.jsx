import { Lightbulb } from 'lucide-react'

// A hint for the presenter: what to do on this screen during the demo.
export function DemoTip({ children, dark = false, className = '' }) {
  return (
    <div
      className={`flex items-start gap-3 rounded-card border border-dashed px-4 py-3 text-sm leading-relaxed ${
        dark ? 'border-console-line text-console-muted' : 'border-surface-2 bg-surface/50 text-muted'
      } ${className}`}
    >
      <Lightbulb className={`mt-0.5 size-4 shrink-0 ${dark ? 'text-amber-300' : 'text-amber-500'}`} />
      <p>
        <span className={`font-bold ${dark ? 'text-console-text' : 'text-ink'}`}>Demo tip: </span>
        {children}
      </p>
    </div>
  )
}
