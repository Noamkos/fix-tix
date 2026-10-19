// FixTix never sends real emails or SMS in the demo. Every message lands in the demo Inbox instead.
import { update } from '../store/store.js'
import { newId } from '../lib/ids.js'

export function markRead(messageId) {
  update((s) => {
    const m = s.fixtix.messages.find((x) => x.id === messageId)
    if (m) m.read = true
  })
}

export function markAllRead(userIds) {
  update((s) => {
    s.fixtix.messages.filter((m) => userIds.includes(m.userId)).forEach((m) => (m.read = true))
  })
}

// Use inside update(): queueMessage(s, { userId, channel: 'email', subject, body, action })
// `action` is an optional button in the message: { label, to }.
export function queueMessage(s, { userId, channel, subject = null, body, action = null }) {
  const user = s.fixtix.users.find((u) => u.id === userId)
  s.fixtix.messages.push({
    id: newId('m'),
    userId,
    channel,
    to: channel === 'sms' ? user?.phone : user?.email,
    subject,
    body,
    action,
    at: new Date().toISOString(),
    read: false,
  })
}
