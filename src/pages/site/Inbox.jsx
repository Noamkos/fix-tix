import { useState } from 'react'
import { Link } from 'react-router'
import { ArrowLeft, Inbox as InboxIcon, Mail, MessageSquareText } from 'lucide-react'
import { useStore } from '../../store/useStore.js'
import { getCurrentUser } from '../../lib/selectors.js'
import { markAllRead, markRead } from '../../fixtix/messages.js'
import { formatAgo, formatStamp } from '../../lib/format.js'
import { useNow } from '../../lib/useNow.js'
import { LogoMark } from '../../components/Logo.jsx'
import { DemoTip } from '../../components/DemoTip.jsx'

const CHANNELS = [
  { id: 'all', label: 'All' },
  { id: 'email', label: 'Email' },
  { id: 'sms', label: 'SMS' },
]

const selectMessages = (everyone) => (s) => {
  const user = getCurrentUser(s)
  const users = Object.fromEntries(s.fixtix.users.map((u) => [u.id, u]))
  return s.fixtix.messages
    .filter((m) => everyone || m.userId === user?.id)
    .slice()
    .reverse()
    .map((m) => ({ ...m, recipient: users[m.userId] }))
}

// Screen 11: every email and SMS FixTix "sent", so notifications can be shown without sending anything.
export default function Inbox() {
  const user = useStore(getCurrentUser)
  const [everyone, setEveryone] = useState(false)
  const [channel, setChannel] = useState('all')
  const [openId, setOpenId] = useState(null)
  const all = useStore(selectMessages(everyone))
  const now = useNow(30000)

  const messages = all.filter((m) => channel === 'all' || m.channel === channel)
  const selected = all.find((m) => m.id === openId) ?? null
  const unread = all.filter((m) => !m.read).length

  function open(m) {
    setOpenId(m.id)
    if (!m.read) markRead(m.id)
  }

  return (
    <section className="container-page py-10 sm:py-14">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[30px] font-bold tracking-tight sm:text-[36px]">Inbox</h1>
          <p className="mt-1 text-muted">Every email and text message FixTix sent {everyone ? 'to anyone' : 'you'}.</p>
        </div>
        <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold">
          <input type="checkbox" checked={everyone} onChange={(e) => setEveryone(e.target.checked)} className="size-4 accent-brand" />
          Show every user's messages (demo)
        </label>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1 rounded-xl bg-surface p-1">
          {CHANNELS.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setChannel(c.id)}
              aria-pressed={channel === c.id}
              className={`rounded-lg px-4 py-1.5 text-sm font-semibold ${channel === c.id ? 'bg-white shadow-sm' : 'text-muted hover:text-ink'}`}
            >
              {c.label}
            </button>
          ))}
        </div>
        {unread > 0 && (
          <button
            type="button"
            onClick={() => markAllRead(everyone ? [...new Set(all.map((m) => m.userId))] : [user.id])}
            className="text-sm font-semibold text-brand hover:underline"
          >
            Mark all as read ({unread})
          </button>
        )}
      </div>

      <div className="mt-4 grid min-h-[480px] grid-cols-[minmax(0,1fr)] overflow-hidden rounded-card border border-line md:grid-cols-[minmax(0,360px)_minmax(0,1fr)]">
        <ul className={`divide-y divide-line border-line md:border-r ${selected ? 'hidden md:block' : ''}`}>
          {messages.length ? (
            messages.map((m) => (
              <li key={m.id}>
                <button
                  type="button"
                  onClick={() => open(m)}
                  className={`flex w-full gap-3 px-4 py-3.5 text-left transition-colors ${openId === m.id ? 'bg-brand-50' : 'hover:bg-surface/60'}`}
                >
                  <ChannelIcon channel={m.channel} />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline justify-between gap-2">
                      <span className={`truncate text-[15px] ${m.read ? 'font-medium' : 'font-bold'}`}>{m.subject ?? 'Text message'}</span>
                      <span className="shrink-0 text-xs text-subtle">{formatAgo(m.at, now)}</span>
                    </span>
                    {everyone && <span className="block text-xs font-semibold text-brand">To {m.recipient?.name}</span>}
                    <span className="mt-0.5 line-clamp-2 block text-sm text-muted">{m.body}</span>
                  </span>
                  {!m.read && <span className="mt-2 size-2 shrink-0 rounded-full bg-coral" aria-label="Unread" />}
                </button>
              </li>
            ))
          ) : (
            <li className="px-6 py-16 text-center text-muted">
              <InboxIcon className="mx-auto size-8 text-subtle" />
              <p className="mt-2">No messages yet.</p>
            </li>
          )}
        </ul>

        <div className={`min-w-0 ${selected ? '' : 'hidden md:grid md:place-items-center'}`}>
          {selected ? (
            <MessageView message={selected} onBack={() => setOpenId(null)} />
          ) : (
            <p className="text-muted">Choose a message to read it.</p>
          )}
        </div>
      </div>

      <DemoTip className="mt-8">
        In the real product these go out as real emails and SMS. In the demo they land here, so you can show the notifications without sending anything.
      </DemoTip>
    </section>
  )
}

function ChannelIcon({ channel }) {
  return channel === 'sms' ? (
    <span className="grid size-9 shrink-0 place-items-center rounded-full bg-emerald-100 text-emerald-700">
      <MessageSquareText className="size-4" />
    </span>
  ) : (
    <span className="grid size-9 shrink-0 place-items-center rounded-full bg-brand-50 text-brand">
      <Mail className="size-4" />
    </span>
  )
}

function MessageView({ message, onBack }) {
  const back = (
    <button type="button" onClick={onBack} className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-ink md:hidden">
      <ArrowLeft className="size-4" /> All messages
    </button>
  )

  if (message.channel === 'sms') {
    return (
      <div className="p-5 sm:p-8">
        {back}
        <div className="mx-auto max-w-sm rounded-[28px] border border-line bg-surface/50 p-5">
          <p className="text-center text-xs font-semibold text-muted">
            Text message to {message.to} · {formatStamp(message.at)}
          </p>
          <p className="mt-4 text-sm font-semibold">FixTix</p>
          <p className="mt-1 max-w-[85%] rounded-2xl rounded-tl-md bg-white px-4 py-3 text-[15px] leading-relaxed shadow-sm">{message.body}</p>
        </div>
      </div>
    )
  }

  return (
    <article className="p-5 sm:p-8">
      {back}
      <h2 className="text-[22px] leading-snug font-bold">{message.subject}</h2>
      <div className="mt-4 flex items-center gap-3 border-b border-line pb-4">
        <LogoMark className="size-10 shrink-0 text-brand" />
        <div className="min-w-0 text-sm">
          <p>
            <span className="font-semibold">FixTix</span> <span className="text-muted">&lt;hello@fixtix.demo&gt;</span>
          </p>
          <p className="truncate text-muted">
            to {message.recipient?.name} &lt;{message.to}&gt; · {formatStamp(message.at)}
          </p>
        </div>
      </div>
      <p className="mt-5 max-w-prose text-[15px] leading-relaxed">{message.body}</p>
      {message.action && (
        <Link to={message.action.to} className="btn-primary mt-6">
          {message.action.label}
        </Link>
      )}
      <p className="mt-8 text-xs text-subtle">FixTix · Safe and fair resale. Every ticket verified with the official ticketing company.</p>
    </article>
  )
}
