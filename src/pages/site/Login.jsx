import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { ArrowRight, Mail, MessageSquareText, Smartphone } from 'lucide-react'
import { useStore } from '../../store/useStore.js'
import { getCurrentUser } from '../../lib/selectors.js'
import { logIn, logOut, sendLoginCode, sendLoginLink } from '../../fixtix/session.js'
import { Avatar } from '../../components/layout/UserMenu.jsx'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const selectPersonas = (s) => s.fixtix.users.filter((u) => u.persona)

// Only allow returning to a page inside this site.
function safeNext(next) {
  return next && next.startsWith('/') && !next.startsWith('//') ? next : '/'
}

export default function Login() {
  const [params] = useSearchParams()
  const next = safeNext(params.get('next'))
  const navigate = useNavigate()
  const user = useStore(getCurrentUser)
  const personas = useStore(selectPersonas)
  const [method, setMethod] = useState('email')

  const finish = (userId) => {
    logIn(userId)
    navigate(next, { replace: true })
  }

  if (user) {
    return (
      <Shell title="You're logged in">
        <div className="flex items-center gap-3 rounded-card bg-surface p-4">
          <Avatar user={user} className="size-11 text-base" />
          <div className="min-w-0">
            <div className="font-semibold">{user.name}</div>
            <div className="truncate text-sm text-muted">{user.email ?? user.phone}</div>
          </div>
        </div>
        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <Link to={next} className="btn-primary flex-1">
            Continue <ArrowRight className="size-4" />
          </Link>
          <button type="button" onClick={logOut} className="btn-secondary flex-1">
            Log in as someone else
          </button>
        </div>
      </Shell>
    )
  }

  return (
    <Shell title="Log in or sign up" subtitle="No password needed. We'll send you a login link or a code.">
      <div className="grid grid-cols-2 gap-1 rounded-xl bg-surface p-1" role="tablist" aria-label="Log in with">
        {[
          { id: 'email', label: 'Email', icon: Mail },
          { id: 'phone', label: 'Phone', icon: Smartphone },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={method === id}
            onClick={() => setMethod(id)}
            className={`flex items-center justify-center gap-2 rounded-lg py-2.5 text-[15px] font-semibold transition-colors ${
              method === id ? 'bg-white text-ink shadow-sm' : 'text-muted hover:text-ink'
            }`}
          >
            <Icon className="size-4" /> {label}
          </button>
        ))}
      </div>

      {method === 'email' ? <EmailLogin onDone={finish} /> : <PhoneLogin onDone={finish} />}

      <div className="mt-8 border-t border-line pt-6">
        <p className="text-xs font-bold tracking-wider text-subtle uppercase">Demo shortcut</p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {personas.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => finish(p.id)}
              className="flex items-center gap-3 rounded-card border border-line p-3 text-left transition-colors hover:border-brand hover:bg-brand-50"
            >
              <Avatar user={p} />
              <span className="min-w-0">
                <span className="block font-semibold">{p.name.split(' ')[0]}</span>
                <span className="block text-sm text-muted capitalize">{p.persona}</span>
              </span>
            </button>
          ))}
        </div>
      </div>
    </Shell>
  )
}

function Shell({ title, subtitle, children }) {
  return (
    <section className="container-page flex justify-center py-12 sm:py-16">
      <div className="w-full max-w-md">
        <h1 className="text-[30px] font-bold tracking-tight">{title}</h1>
        {subtitle && <p className="mt-1.5 text-muted">{subtitle}</p>}
        <div className="mt-6">{children}</div>
      </div>
    </section>
  )
}

function TextInput({ label, error, ...props }) {
  return (
    <label className="block">
      <span className="text-sm font-semibold">{label}</span>
      <input
        {...props}
        className={`mt-1 block h-12 w-full rounded-lg border bg-white px-3.5 text-[16px] outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 ${
          error ? 'border-danger' : 'border-surface-2'
        }`}
      />
      {error && <span className="mt-1 block text-sm text-danger">{error}</span>}
    </label>
  )
}

// What the demo shows instead of a real email or SMS.
function DemoDelivery({ icon: Icon, title, children }) {
  return (
    <div className="mt-5 rounded-card border border-dashed border-brand/40 bg-brand-50 p-4">
      <p className="flex items-center gap-2 text-xs font-bold tracking-wider text-brand uppercase">
        <Icon className="size-4" /> {title}
      </p>
      <div className="mt-2">{children}</div>
    </div>
  )
}

function EmailLogin({ onDone }) {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [sent, setSent] = useState(null)

  function submit(e) {
    e.preventDefault()
    if (!EMAIL_RE.test(email.trim())) return setError('Enter a valid email address')
    setError('')
    setSent({ ...sendLoginLink(email), email: email.trim().toLowerCase() })
  }

  if (sent) {
    return (
      <div className="mt-6">
        <p className="text-[17px] font-semibold">Check your inbox</p>
        <p className="mt-1 text-muted">
          We sent a login link to <span className="font-semibold text-ink">{sent.email}</span>.
        </p>
        <DemoDelivery icon={Mail} title="Demo: the email">
          <p className="font-semibold">Your FixTix login link</p>
          <p className="mt-1 text-sm text-muted">Tap the button to log in. The link works once and expires in 15 minutes.</p>
          <button type="button" onClick={() => onDone(sent.userId)} className="btn-primary mt-3 px-4 py-2.5 text-sm">
            Log in to FixTix
          </button>
        </DemoDelivery>
        <button type="button" onClick={() => setSent(null)} className="mt-4 text-sm font-semibold text-brand hover:underline">
          Use a different email
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={submit} className="mt-6 space-y-4" noValidate>
      <TextInput label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="off" error={error} />
      <button type="submit" className="btn-primary w-full">
        Send me a login link
      </button>
    </form>
  )
}

function PhoneLogin({ onDone }) {
  const [phone, setPhone] = useState('')
  const [error, setError] = useState('')
  const [sent, setSent] = useState(null)
  const [code, setCode] = useState('')

  function sendCode(e) {
    e.preventDefault()
    if (phone.replace(/\D/g, '').length < 8) return setError('Enter your phone number, with the country code')
    setError('')
    setSent({ ...sendLoginCode(phone), phone: phone.trim() })
  }

  function verify(e) {
    e.preventDefault()
    if (code.trim() !== sent.code) return setError("That code isn't right. Check the SMS and try again.")
    onDone(sent.userId)
  }

  if (sent) {
    return (
      <form onSubmit={verify} className="mt-6" noValidate>
        <p className="text-[17px] font-semibold">Enter the 6-digit code</p>
        <p className="mt-1 text-muted">
          We texted a code to <span className="font-semibold text-ink">{sent.phone}</span>.
        </p>
        <DemoDelivery icon={MessageSquareText} title="Demo: the SMS">
          <p>
            Your FixTix code is <span className="font-mono text-lg font-bold tracking-[0.2em]">{sent.code}</span>. It expires in 10 minutes.
          </p>
        </DemoDelivery>
        <div className="mt-5">
          <TextInput
            label="Code"
            inputMode="numeric"
            maxLength={6}
            value={code}
            onChange={(e) => {
              setCode(e.target.value.replace(/\D/g, ''))
              setError('')
            }}
            placeholder="123456"
            autoComplete="one-time-code"
            error={error}
          />
        </div>
        <button type="submit" disabled={code.length !== 6} className="btn-primary mt-4 w-full">
          Log in
        </button>
        <button type="button" onClick={() => setSent(null)} className="mt-4 text-sm font-semibold text-brand hover:underline">
          Use a different number
        </button>
      </form>
    )
  }

  return (
    <form onSubmit={sendCode} className="mt-6 space-y-4" noValidate>
      <TextInput label="Phone number" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+30 690 000 0001" autoComplete="off" error={error} />
      <button type="submit" className="btn-primary w-full">
        Text me a code
      </button>
    </form>
  )
}
