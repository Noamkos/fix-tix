// Logging in to FixTix: by email (login link) or by phone (SMS code). No passwords, no ID documents:
// the real check happens with the ticketing company when someone sells (rule 8).
import { update } from '../store/store.js'
import { newId } from '../lib/ids.js'
import { queueMessage } from './messages.js'

export const normalizeEmail = (email) => email.trim().toLowerCase()
const digits = (phone) => (phone ?? '').replace(/\D/g, '')

export function findUserByEmail(s, email) {
  return s.fixtix.users.find((u) => u.email === normalizeEmail(email)) ?? null
}

// Matches with or without the country code: "690 000 0001" finds "+30 690 000 0001".
export function findUserByPhone(s, phone) {
  const typed = digits(phone)
  if (typed.length < 8) return null
  return s.fixtix.users.find((u) => u.phone && digits(u.phone).endsWith(typed)) ?? null
}

// Does this person own the ticket at the ticketing company? Matched by email or phone.
export function isSameOwner(user, owner) {
  if (!user || !owner) return false
  if (owner.email && user.email && normalizeEmail(owner.email) === user.email) return true
  return Boolean(owner.phone && user.phone && digits(owner.phone) === digits(user.phone))
}

function nameFromEmail(email) {
  const local = normalizeEmail(email).split('@')[0].split(/[._-]/)[0]
  return local ? local[0].toUpperCase() + local.slice(1) : 'FixTix fan'
}

// First login creates the account.
function ensureUser(s, { email, phone }) {
  let user = email ? findUserByEmail(s, email) : findUserByPhone(s, phone)
  if (!user) {
    user = {
      id: newId('u'),
      name: email ? nameFromEmail(email) : 'FixTix fan',
      email: email ? normalizeEmail(email) : null,
      phone: phone ? phone.trim() : null,
      persona: null,
      payout: null,
    }
    s.fixtix.users.push(user)
  }
  return user
}

export function sendLoginLink(email) {
  let userId
  update((s) => {
    const user = ensureUser(s, { email })
    userId = user.id
    queueMessage(s, {
      userId,
      channel: 'email',
      subject: 'Your FixTix login link',
      body: 'Tap the button to log in to FixTix. The link works once and expires in 15 minutes.',
      action: { label: 'Log in to FixTix', to: '/login' },
    })
  })
  return { userId }
}

export function sendLoginCode(phone) {
  const code = String(crypto.getRandomValues(new Uint32Array(1))[0] % 1000000).padStart(6, '0')
  let userId
  update((s) => {
    const user = ensureUser(s, { phone })
    userId = user.id
    queueMessage(s, { userId, channel: 'sms', body: `Your FixTix code is ${code}. It expires in 10 minutes.` })
  })
  return { userId, code }
}

export function logIn(userId) {
  update((s) => {
    s.session.userId = userId
  })
}

export function logOut() {
  update((s) => {
    s.session.userId = null
  })
}
