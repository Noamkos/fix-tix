const euro = new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR' })

// 8000 -> "€80.00"
export function formatMoney(cents) {
  return euro.format(cents / 100)
}

const dayFormat = new Intl.DateTimeFormat('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
const timeFormat = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit' })

// "Sat 2 Dec · 21:00"
export function formatEventDate(iso) {
  const d = new Date(iso)
  return `${dayFormat.format(d)} · ${timeFormat.format(d)}`
}

// "Sat 2 Dec"
export function formatDay(iso) {
  return dayFormat.format(new Date(iso))
}

// "21:14"
export function formatTime(iso) {
  return timeFormat.format(new Date(iso))
}

// 3125000 ms -> "52:05"
export function formatCountdown(ms) {
  const total = Math.max(0, Math.floor(ms / 1000))
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const sec = String(total % 60).padStart(2, '0')
  return h ? `${h}:${String(m).padStart(2, '0')}:${sec}` : `${m}:${sec}`
}

const clockFormat = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
const stampFormat = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })

// "19:42:08"
export function formatClock(iso) {
  return clockFormat.format(new Date(iso))
}

// "12 Oct, 11:00"
export function formatStamp(iso) {
  return stampFormat.format(new Date(iso))
}

// "just now", "3 min ago", "2 h ago", then "12 Oct, 11:00"
export function formatAgo(iso, now = Date.now()) {
  const seconds = Math.max(0, Math.round((now - new Date(iso).getTime()) / 1000))
  if (seconds < 45) return 'just now'
  if (seconds < 3600) return `${Math.round(seconds / 60)} min ago`
  if (seconds < 86400) return `${Math.round(seconds / 3600)} h ago`
  return formatStamp(iso)
}

const count = new Intl.NumberFormat('en-GB')

export function formatCount(n) {
  return count.format(n)
}

// 60 -> "an hour", 1 -> "1 minute", 15 -> "15 minutes", 120 -> "2 hours"
export function formatDuration(minutes) {
  if (minutes === 60) return 'an hour'
  if (minutes % 60 === 0) return `${minutes / 60} hours`
  return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`
}

export function plural(n, one, many = `${one}s`) {
  return `${formatCount(n)} ${n === 1 ? one : many}`
}
