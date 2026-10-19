// Things that happen on their own when time runs out, even if nobody touches the page:
// checkout reservations (10 minutes) and exclusive waitlist offers (an hour, or a minute in demo mode).
// Every open tab checks every couple of seconds; the checks are safe to run twice.
import { expireHolds } from './checkout.js'
import { expireOffers } from './waitlist.js'

function tick() {
  expireHolds()
  expireOffers()
}

export function startTimers(intervalMs = 2000) {
  tick()
  return setInterval(tick, intervalMs)
}
