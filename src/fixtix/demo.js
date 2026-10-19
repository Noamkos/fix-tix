// Tools for the person presenting the demo (not part of the product).
import { getState, resetDemo as resetStore } from '../store/store.js'
import { isSameOwner, logIn, logOut } from './session.js'

// Inside presentation mode each half of the screen is a frame; the controls live in the top bar.
export const isEmbedded = () => typeof window !== 'undefined' && window.self !== window.top

export function resetDemo() {
  resetStore()
}

export function switchUser(userId) {
  if (userId) logIn(userId)
  else logOut()
}

// Dana's DemoTix order, once she has bought her ticket in the Box office (script step 3).
function danaSellPath() {
  const s = getState()
  const dana = s.fixtix.users.find((u) => u.id === 'u-dana')
  const ticket = s.demotix.tickets.find((t) => t.status === 'active' && isSameOwner(dana, t.owner))
  return ticket ? `/sell?order=${ticket.orderRef}` : '/sell'
}

// The meeting script from the spec, one step per line. `left` is the DemoTix half of
// presentation mode, `right` the FixTix half; `as` logs in that fan first.
export const SCRIPT = [
  {
    title: 'Opening: the other way',
    say: '"This is what happens to your customers today": €350, red at the gate.',
    left: '/demotix/database',
    right: '/other-way',
    as: null,
  },
  {
    title: 'The ticket is born',
    say: 'Dana buys a ticket in the DemoTix box office for €80. A new Active row appears in the table.',
    left: '/demotix/database',
    right: '/demotix/buy/ev-aegean',
    as: 'u-dana',
  },
  {
    title: "Dana can't make it",
    say: 'She lists it on FixTix. The API log shows Verify, then Lock; the row turns Locked for resale.',
    left: '/demotix/database',
    right: danaSellPath,
    as: 'u-dana',
  },
  {
    title: 'Nikos is waiting',
    say: "He's first on the waitlist: his Inbox has the message that he's next in line.",
    left: '/demotix/database',
    right: '/inbox',
    as: 'u-nikos',
  },
  {
    title: 'The purchase',
    say: 'Nikos pays €88 (€80 + €8 fee). The Swap in progress screen runs.',
    left: '/demotix/database',
    right: '/event/ev-aegean',
    as: 'u-nikos',
  },
  {
    title: 'The key moment',
    say: "In DemoTix's table the old row turns Voided and a new row appears in Nikos's name, with a new barcode.",
    left: '/demotix/database',
    right: '/my-tickets',
    as: 'u-nikos',
  },
  {
    title: 'At the gate',
    say: 'Scan the old barcode: red. Scan the new one: green.',
    left: '/demotix/database',
    right: '/scanner',
    as: null,
  },
  {
    title: 'The money',
    say: 'Open the Partner dashboard: what DemoTix earned. Change the split in Settings, live.',
    left: '/admin/settings',
    right: '/partner',
    as: null,
  },
  {
    title: 'The ask',
    say: 'Back to the API log: "These are the six actions we need from you."',
    left: '/demotix/api-log',
    right: '/partner',
    as: null,
  },
  {
    title: 'Reset',
    say: 'One click, ready for the next meeting.',
    left: '/demotix/database',
    right: '/other-way',
    as: null,
    reset: true,
  },
]

// Where a step's screens are, worked out at the moment it's opened.
export function stepPaths(step) {
  const resolve = (p) => (typeof p === 'function' ? p() : p)
  return { left: resolve(step.left), right: resolve(step.right) }
}

// Run a step outside presentation mode: switch fan, then hand back the screen to open.
export function prepareStep(step) {
  if (step.reset) resetDemo()
  else if (step.as !== undefined && step.as !== getState().session.userId) switchUser(step.as)
  return stepPaths(step)
}
