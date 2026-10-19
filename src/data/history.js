// Sample history: resales that "already happened" over the last four weeks, so the Partner
// dashboard doesn't start at zero. Each one is complete on both sides, exactly as a live sale
// would leave it: at DemoTix an old ticket Voided and a new one Reissued; at FixTix a sold listing,
// a completed order, the swap, the fee split and the seller's payout.
//
// The Aegean Sound Festival is deliberately left out: that's where the live demo story happens.

import { priceBreakdown } from '../lib/pricing.js'

const DAY = 24 * 60 * 60 * 1000

function at(daysAgo, hour, minute = 0) {
  const d = new Date(Date.now() - daysAgo * DAY)
  d.setHours(hour, minute, 0, 0)
  return d.toISOString()
}

// Fans who only appear in the history (fictional, like everyone else in the demo).
export const HISTORY_USERS = [
  { id: 'u-alexis', name: 'Alexis Mavros', email: 'alexis@mail.com', phone: '+30 690 000 0012', persona: null, payout: { method: 'IBAN', last4: '3307' } },
  { id: 'u-chloe', name: 'Chloe Andreou', email: 'chloe@mail.com', phone: '+357 99 000 013', persona: null, payout: { method: 'IBAN', last4: '8120' } },
  { id: 'u-dimitris', name: 'Dimitris Kalogeros', email: 'dimitris@mail.com', phone: '+30 690 000 0014', persona: null, payout: { method: 'IBAN', last4: '4471' } },
  { id: 'u-lena', name: 'Lena Papas', email: 'lena@mail.com', phone: '+30 690 000 0015', persona: null, payout: { method: 'IBAN', last4: '5096' } },
  { id: 'u-marek', name: 'Marek Wójcik', email: 'marek@mail.com', phone: '+48 500 000 016', persona: null, payout: { method: 'IBAN', last4: '7713' } },
  { id: 'u-myrto', name: 'Myrto Ilia', email: 'myrto@mail.com', phone: '+30 690 000 0017', persona: null, payout: { method: 'IBAN', last4: '2258' } },
  { id: 'u-stavros', name: 'Stavros Nikolaou', email: 'stavros@mail.com', phone: '+357 99 000 018', persona: null, payout: { method: 'IBAN', last4: '6634' } },
  { id: 'u-zsofia', name: 'Zsófia Kovács', email: 'zsofia@mail.com', phone: '+36 30 000 0019', persona: null, payout: { method: 'IBAN', last4: '9045' } },
]

// [days ago, hour, event, ticket type, price paid, listed for, seller, buyer, seats]
const SALES = [
  [26, 19, 'ev-midnight', 'ga', 4500, 4500, 'u-alexis', 'u-chloe'],
  [24, 13, 'ev-hoops', 'lower', 3500, 3500, 'u-dimitris', 'u-stavros', [{ section: 'Lower Bowl 112', row: 'C', seat: '3' }, { section: 'Lower Bowl 112', row: 'C', seat: '4' }]],
  [21, 21, 'ev-luna', 'standing', 6500, 6500, 'u-lena', 'u-myrto'],
  [19, 10, 'ev-echo', 'ga', 4000, 4000, 'u-marek', 'u-giorgos'],
  [16, 17, 'ev-kosmos', 'upper', 3500, 3500, 'u-stavros', 'u-andreas', [{ section: 'Upper Tier', row: '12', seat: '30' }]],
  [13, 12, 'ev-danube', 'pass', 9500, 9500, 'u-zsofia', 'u-marek'],
  [10, 20, 'ev-eleni', 'ga', 2500, 2500, 'u-myrto', 'u-irini'],
  [8, 15, 'ev-luna', 'seated', 8500, 8500, 'u-chloe', 'u-alexis', [{ section: 'Terrace A', row: '6', seat: '17' }]],
  [5, 18, 'ev-midnight', 'ga', 4500, 4200, 'u-lena', 'u-sofia'],
  [3, 11, 'ev-danube', 'pass', 9500, 9500, 'u-dimitris', 'u-lena'],
  [1, 16, 'ev-echo', 'ga', 4000, 4000, 'u-alexis', 'u-yannis'],
]

// Barcodes that look like every other DemoTix barcode, the same on every reset.
function barcodeMaker(taken) {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  // mulberry32: a small, well-mixed generator with a fixed starting point.
  let x = 20261018
  const next = () => {
    x = (x + 0x6d2b79f5) | 0
    let t = Math.imul(x ^ (x >>> 15), 1 | x)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return alphabet[((t ^ (t >>> 14)) >>> 0) % alphabet.length]
  }
  return () => {
    let code
    do {
      code = `DTX-${next()}${next()}${next()}${next()}-${next()}${next()}${next()}${next()}`
    } while (taken.has(code))
    taken.add(code)
    return code
  }
}

export function buildSampleHistory({ users, tickets, settings }) {
  const person = (id) => users.find((u) => u.id === id)
  const taken = new Set(tickets.map((t) => t.id))
  // Free ticket numbers below 1042 (Dana's live ticket): older numbers for the original
  // tickets, newer ones for the reissued tickets.
  const free = []
  for (let n = 1001; n < 1042; n++) if (!taken.has(n)) free.push(n)
  const needed = SALES.reduce((sum, s) => sum + (s[8]?.length ?? 1), 0)
  const oldIds = free.slice(0, needed)
  const newIds = free.slice(free.length - needed)
  const barcode = barcodeMaker(new Set(tickets.map((t) => t.barcode)))

  const out = { tickets: [], listings: [], orders: [], swaps: [], feeSplits: [], payouts: [] }
  let k = 0

  SALES.forEach(([days, hour, eventId, typeId, paidCents, priceCents, sellerId, buyerId, seats], i) => {
    const n = seats?.length ?? 1
    const seller = person(sellerId)
    const buyer = person(buyerId)
    const num = String(i + 1).padStart(2, '0')
    const boughtAt = at(days + 30 + (i % 7), 11)
    const listedAt = at(days + 2, 9 + (i % 5))
    const soldAt = at(days, hour, (i * 17) % 60)
    const originalRef = `DT-4${String(6100 + i * 37).padStart(4, '0')}`
    const reissueRef = `DT-501${num}`
    const orderId = `o-h${num}`
    const listingId = `l-h${num}`

    const olds = []
    const news = []
    for (let j = 0; j < n; j++) {
      const place = seats?.[j] ?? {}
      const oldId = oldIds[k]
      const newId = newIds[k]
      k++
      const oldBarcode = barcode()
      const newBarcode = barcode()
      out.tickets.push({
        id: oldId,
        barcode: oldBarcode,
        eventId,
        ticketTypeId: typeId,
        section: place.section ?? null,
        row: place.row ?? null,
        seat: place.seat ?? null,
        priceCents: paidCents,
        owner: { name: seller.name, email: seller.email },
        orderRef: originalRef,
        status: 'voided',
        issuedAt: boughtAt,
        updatedAt: soldAt,
        lockedBy: null,
        replacedBy: newId,
        replaces: null,
        history: [
          { at: boughtAt, status: 'active', note: `Issued to ${seller.name} (order ${originalRef})` },
          { at: listedAt, status: 'locked', note: `Locked for resale by FixTix (listing ${listingId})` },
          { at: soldAt, status: 'voided', note: `Voided: resold via FixTix (order ${orderId})` },
        ],
      })
      out.tickets.push({
        id: newId,
        barcode: newBarcode,
        eventId,
        ticketTypeId: typeId,
        section: place.section ?? null,
        row: place.row ?? null,
        seat: place.seat ?? null,
        priceCents: paidCents,
        owner: { name: buyer.name, email: buyer.email },
        orderRef: reissueRef,
        status: 'reissued',
        issuedAt: soldAt,
        updatedAt: soldAt,
        lockedBy: null,
        replacedBy: null,
        replaces: oldId,
        history: [{ at: soldAt, status: 'reissued', note: `Reissued to ${buyer.name}, replaces ticket ${oldId}` }],
      })
      out.swaps.push({ id: `sw-h${num}${j}`, orderId, oldTicketId: oldId, oldBarcode, newTicketId: newId, newBarcode, ok: true, error: null, at: soldAt })
      olds.push(oldId)
      news.push(newId)
    }

    const b = priceBreakdown(priceCents, settings)
    out.listings.push({ id: listingId, sellerId, eventId, ticketIds: olds, priceCents, splitMode: 'any', soldTicketIds: [...olds], offeredTo: [], status: 'sold', createdAt: listedAt })
    out.orders.push({
      id: orderId,
      buyerId,
      sellerId,
      listingId,
      eventId,
      ticketIds: olds,
      unitCents: priceCents,
      ticketCents: b.ticket * n,
      feeCents: b.fee * n,
      totalCents: b.total * n,
      fixtixCents: b.fixtix * n,
      partnerCents: b.partner * n,
      status: 'completed',
      holdUntil: soldAt,
      createdAt: soldAt,
      paidAt: soldAt,
      completedAt: soldAt,
      refundedAt: null,
      refundCents: 0,
      newTicketIds: news,
      demoFailReissue: false,
    })
    out.feeSplits.push({ id: `fs-h${num}`, orderId, eventId, tickets: n, feeCents: b.fee * n, fixtixCents: b.fixtix * n, partnerCents: b.partner * n, at: soldAt })
    out.payouts.push({ id: `po-h${num}`, sellerId, orderId, amountCents: priceCents * n, status: days > 2 ? 'paid' : 'pending', createdAt: soldAt })
  })

  return out
}
