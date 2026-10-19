// Demo seed data: the starting point of every demo run.
// "Reset demo" rebuilds the whole state from this file.
//
// All events, artists, venues and people here are fictional.
// Money is always stored in euro cents (8000 = €80.00) to avoid rounding errors.
// Event dates are relative to the moment the demo is reset, so they always look upcoming.

import { buildSampleHistory, HISTORY_USERS } from './history.js'

// Bump this whenever the shape of the data changes: browsers holding an older
// version are reset automatically instead of breaking.
export const DATA_VERSION = 5

const DAY = 24 * 60 * 60 * 1000

// Today at hh:mm, plus N days. Returns an ISO string.
function daysFromNow(days, time = '20:00') {
  const [h, m] = time.split(':').map(Number)
  const d = new Date()
  d.setHours(h, m, 0, 0)
  d.setDate(d.getDate() + days)
  return d.toISOString()
}

function daysAgo(days, hour = 12) {
  const d = new Date(Date.now() - days * DAY)
  d.setHours(hour, 0, 0, 0)
  return d.toISOString()
}

// ---------------------------------------------------------------------------
// Event catalog (shared by FixTix and DemoTix, as both sides agree on it)
// ---------------------------------------------------------------------------

export const CATEGORIES = [
  { id: 'concert', label: 'Concerts' },
  { id: 'festival', label: 'Festivals' },
  { id: 'club', label: 'Club nights' },
  { id: 'sports', label: 'Sports' },
  { id: 'theatre', label: 'Theatre' },
  { id: 'comedy', label: 'Comedy' },
]

function buildEvents() {
  return [
    {
      id: 'ev-aegean',
      name: 'Aegean Sound Festival',
      lineup: ['Solar Tides', 'Mira Kaal', 'The Pelican Club', 'Ostria'],
      category: 'festival',
      venue: 'Faliro Bay Park',
      city: 'Athens',
      country: 'Greece',
      startsAt: daysFromNow(45, '16:00'),
      ticketingCompany: 'DemoTix',
      status: 'scheduled',
      soldOut: true,
      featured: true, // spotlighted on the home page: the demo story's event
      capacity: 12000,
      ticketTypes: [{ id: 'ga', name: 'General Admission', priceCents: 8000, seated: false }],
      description: 'Two stages on the water, from sunset to sunrise. The summer festival everyone in Athens is talking about.',
      cover: { motif: 'sun', colors: ['#FF8A4C', '#E2457A', '#4B2A8C'] },
    },
    {
      id: 'ev-luna',
      name: 'Luna Vega: Saltwater Tour',
      lineup: ['Luna Vega'],
      category: 'concert',
      venue: 'Marina Open-Air Stage',
      city: 'Limassol',
      country: 'Cyprus',
      startsAt: daysFromNow(21, '21:00'),
      ticketingCompany: 'DemoTix',
      status: 'scheduled',
      soldOut: true,
      capacity: 4500,
      ticketTypes: [
        { id: 'standing', name: 'Standing', priceCents: 6500, seated: false },
        { id: 'seated', name: 'Seated', priceCents: 8500, seated: true, sections: ['Terrace A', 'Terrace B'] },
      ],
      description: 'The Saltwater Tour comes to the Limassol marina for one night only.',
      cover: { motif: 'waves', colors: ['#16C2C9', '#1767C2', '#0B1F4D'] },
    },
    {
      id: 'ev-midnight',
      name: 'The Midnight Harbors',
      lineup: ['The Midnight Harbors', 'Velvet Static'],
      category: 'concert',
      venue: 'Warehouse 9',
      city: 'Thessaloniki',
      country: 'Greece',
      startsAt: daysFromNow(12, '20:30'),
      ticketingCompany: 'DemoTix',
      status: 'scheduled',
      soldOut: true,
      capacity: 1800,
      ticketTypes: [{ id: 'ga', name: 'General Admission', priceCents: 4500, seated: false }],
      description: 'Indie rock in a converted port warehouse, with support from Velvet Static.',
      cover: { motif: 'lights', colors: ['#7A3CF0', '#D9348F', '#120B2E'] },
    },
    {
      id: 'ev-hoops',
      name: 'Athens Hoops Classic',
      lineup: ['Piraeus Mariners', 'Sofia Falcons'],
      category: 'sports',
      venue: 'Kallithea Arena',
      city: 'Athens',
      country: 'Greece',
      startsAt: daysFromNow(9, '19:30'),
      ticketingCompany: 'DemoTix',
      status: 'scheduled',
      soldOut: false,
      capacity: 8000,
      ticketTypes: [{ id: 'lower', name: 'Lower Bowl', priceCents: 3500, seated: true, sections: ['Lower Bowl 104', 'Lower Bowl 106', 'Lower Bowl 112'] }],
      description: 'Piraeus Mariners host the Sofia Falcons in the season opener.',
      cover: { motif: 'court', colors: ['#FF8A1F', '#C2410C', '#1C1917'] },
    },
    {
      id: 'ev-eleni',
      name: 'Eleni Mavrou: Too Honest',
      lineup: ['Eleni Mavrou'],
      category: 'comedy',
      venue: 'Old Port Comedy Hall',
      city: 'Larnaca',
      country: 'Cyprus',
      startsAt: daysFromNow(17, '21:00'),
      ticketingCompany: 'DemoTix',
      status: 'scheduled',
      soldOut: false,
      capacity: 600,
      ticketTypes: [{ id: 'ga', name: 'General Admission', priceCents: 2500, seated: false }],
      description: 'A brand-new hour of stand-up, in English, from the queen of awkward honesty.',
      cover: { motif: 'mic', colors: ['#FFC83D', '#F0563C', '#2A0F12'] },
    },
    {
      id: 'ev-echo',
      name: 'Echo Valley',
      lineup: ['Nadia Brel', 'KTRL', 'Low Orbit'],
      category: 'club',
      venue: 'Praga Hall 3',
      city: 'Warsaw',
      country: 'Poland',
      startsAt: daysFromNow(26, '23:00'),
      ticketingCompany: 'DemoTix',
      status: 'scheduled',
      soldOut: true,
      capacity: 1500,
      ticketTypes: [{ id: 'ga', name: 'Entry', priceCents: 4000, seated: false }],
      description: 'Eight hours of techno in a former factory hall on the east bank of the Vistula.',
      cover: { motif: 'grid', colors: ['#3BF0A0', '#0E8F6B', '#04140F'] },
    },
    {
      id: 'ev-kosmos',
      name: 'Kosmos Strings: Film Nights',
      lineup: ['Kosmos String Orchestra'],
      category: 'theatre',
      venue: 'Ilissos Open Theatre',
      city: 'Athens',
      country: 'Greece',
      startsAt: daysFromNow(30, '21:00'),
      ticketingCompany: 'DemoTix',
      status: 'scheduled',
      soldOut: false,
      capacity: 2200,
      ticketTypes: [
        { id: 'stalls', name: 'Stalls', priceCents: 5500, seated: true, sections: ['Stalls'] },
        { id: 'upper', name: 'Upper Tier', priceCents: 3500, seated: true, sections: ['Upper Tier'] },
      ],
      description: 'Classic film scores performed live under the stars by a 40-piece orchestra.',
      cover: { motif: 'strings', colors: ['#E8C46A', '#B07A2A', '#14213D'] },
    },
    {
      id: 'ev-danube',
      name: 'Danube Lights Festival',
      lineup: ['Hollow Coast', 'Ana Ries', 'Brightside Collective', 'Tamás & the Tide'],
      category: 'festival',
      venue: 'Csepel Riverside',
      city: 'Budapest',
      country: 'Hungary',
      startsAt: daysFromNow(80, '14:00'),
      ticketingCompany: 'DemoTix',
      status: 'scheduled',
      soldOut: true,
      capacity: 25000,
      ticketTypes: [{ id: 'pass', name: '3-Day Pass', priceCents: 9500, seated: false }],
      description: 'Three days, five stages and a river full of lights.',
      cover: { motif: 'circles', colors: ['#B8F24A', '#18A999', '#0B2A3A'] },
    },
  ]
}

// ---------------------------------------------------------------------------
// FixTix side
// ---------------------------------------------------------------------------

// Phone numbers use the fictional +30 690 000 xxxx range.
function buildUsers() {
  return [
    { id: 'u-dana', name: 'Dana Alexiou', email: 'dana@mail.com', phone: '+30 690 000 0001', persona: 'seller', payout: { method: 'IBAN', last4: '4021' } },
    { id: 'u-nikos', name: 'Nikos Georgiou', email: 'nikos@mail.com', phone: '+30 690 000 0002', persona: 'buyer', payout: null },
    { id: 'u-maria', name: 'Maria Christou', email: 'maria@mail.com', phone: '+357 99 000 003', persona: null, payout: { method: 'IBAN', last4: '7730' } },
    { id: 'u-yannis', name: 'Yannis Petrou', email: 'yannis@mail.com', phone: '+30 690 000 0004', persona: null, payout: { method: 'IBAN', last4: '1188' } },
    { id: 'u-sofia', name: 'Sofia Dimitrova', email: 'sofia@mail.com', phone: '+359 88 000 0005', persona: null, payout: { method: 'IBAN', last4: '5402' } },
    { id: 'u-andreas', name: 'Andreas Kyriakou', email: 'andreas@mail.com', phone: '+30 690 000 0006', persona: null, payout: { method: 'IBAN', last4: '9314' } },
    { id: 'u-katalin', name: 'Katalin Szabó', email: 'katalin@mail.com', phone: '+36 30 000 0007', persona: null, payout: { method: 'IBAN', last4: '2276' } },
    { id: 'u-ola', name: 'Ola Nowak', email: 'ola@mail.com', phone: '+48 500 000 008', persona: null, payout: { method: 'IBAN', last4: '6650' } },
    { id: 'u-eleni', name: 'Eleni Vlachou', email: 'eleni@mail.com', phone: '+30 690 000 0009', persona: null, payout: null },
    { id: 'u-giorgos', name: 'Giorgos Antoniou', email: 'giorgos@mail.com', phone: '+30 690 000 0010', persona: null, payout: null },
    { id: 'u-irini', name: 'Irini Papadaki', email: 'irini@mail.com', phone: '+30 690 000 0011', persona: null, payout: null },
  ]
}

// Live listings by other fans, so the site doesn't look empty.
// Every ticket listed here is "locked" in the DemoTix database below.
// The Aegean Sound Festival deliberately has no listings: that's where the demo story happens.
function buildListings() {
  return [
    { id: 'l-201', sellerId: 'u-maria', eventId: 'ev-luna', ticketIds: [1006, 1007], priceCents: 6500, splitMode: 'any', soldTicketIds: [], offeredTo: [], status: 'live', createdAt: daysAgo(3, 10) },
    { id: 'l-202', sellerId: 'u-yannis', eventId: 'ev-midnight', ticketIds: [1011], priceCents: 4000, splitMode: 'any', soldTicketIds: [], offeredTo: [], status: 'live', createdAt: daysAgo(2, 18) },
    { id: 'l-203', sellerId: 'u-sofia', eventId: 'ev-hoops', ticketIds: [1015, 1016], priceCents: 3500, splitMode: 'all', soldTicketIds: [], offeredTo: [], status: 'live', createdAt: daysAgo(5, 9) },
    { id: 'l-204', sellerId: 'u-andreas', eventId: 'ev-kosmos', ticketIds: [1021], priceCents: 5500, splitMode: 'any', soldTicketIds: [], offeredTo: [], status: 'live', createdAt: daysAgo(1, 20) },
    { id: 'l-205', sellerId: 'u-katalin', eventId: 'ev-danube', ticketIds: [1028, 1029, 1030], priceCents: 9500, splitMode: 'any', soldTicketIds: [], offeredTo: [], status: 'live', createdAt: daysAgo(6, 14) },
    { id: 'l-206', sellerId: 'u-ola', eventId: 'ev-echo', ticketIds: [1036], priceCents: 3800, splitMode: 'any', soldTicketIds: [], offeredTo: [], status: 'live', createdAt: daysAgo(1, 11) },
  ]
}

// Waitlist for the sold-out festival. Nikos is first in line (demo script, step 4).
function buildWaitlist() {
  return [
    { id: 'w-1', eventId: 'ev-aegean', userId: 'u-nikos', quantity: 1, joinedAt: daysAgo(9, 13), status: 'waiting', offer: null },
    { id: 'w-2', eventId: 'ev-aegean', userId: 'u-eleni', quantity: 1, joinedAt: daysAgo(8, 19), status: 'waiting', offer: null },
    { id: 'w-3', eventId: 'ev-aegean', userId: 'u-giorgos', quantity: 1, joinedAt: daysAgo(6, 11), status: 'waiting', offer: null },
    { id: 'w-4', eventId: 'ev-aegean', userId: 'u-irini', quantity: 2, joinedAt: daysAgo(4, 21), status: 'waiting', offer: null },
    { id: 'w-5', eventId: 'ev-echo', userId: 'u-giorgos', quantity: 2, joinedAt: daysAgo(3, 16), status: 'waiting', offer: null },
    { id: 'w-6', eventId: 'ev-luna', userId: 'u-irini', quantity: 1, joinedAt: daysAgo(2, 12), status: 'waiting', offer: null },
  ]
}

// ---------------------------------------------------------------------------
// DemoTix side (the mock ticketing company)
// ---------------------------------------------------------------------------

// The official ticket records. Dana's ticket, bought live in the Box office,
// will be number 1042 (see nextTicketNumber).
function buildTickets() {
  const t = (id, barcode, eventId, ticketTypeId, priceCents, owner, orderRef, boughtDaysAgo, place = {}, lockedDaysAgo = null) => {
    const history = [{ at: daysAgo(boughtDaysAgo, 11), status: 'active', note: `Issued to ${owner.name} (order ${orderRef})` }]
    if (lockedDaysAgo !== null) {
      history.push({ at: daysAgo(lockedDaysAgo, 12), status: 'locked', note: 'Locked for resale by FixTix' })
    }
    return {
      id,
      barcode,
      eventId,
      ticketTypeId,
      section: place.section ?? null,
      row: place.row ?? null,
      seat: place.seat ?? null,
      priceCents,
      owner,
      orderRef,
      status: lockedDaysAgo !== null ? 'locked' : 'active',
      issuedAt: history[0].at,
      updatedAt: history.at(-1).at,
      lockedBy: lockedDaysAgo !== null ? 'FixTix' : null,
      replacedBy: null,
      replaces: null,
      history,
    }
  }

  const maria = { name: 'Maria Christou', email: 'maria@mail.com' }
  const yannis = { name: 'Yannis Petrou', email: 'yannis@mail.com' }
  const sofia = { name: 'Sofia Dimitrova', email: 'sofia@mail.com' }
  const andreas = { name: 'Andreas Kyriakou', email: 'andreas@mail.com' }
  const katalin = { name: 'Katalin Szabó', email: 'katalin@mail.com' }
  const ola = { name: 'Ola Nowak', email: 'ola@mail.com' }

  return [
    t(1006, 'DTX-4KQ7-M2XP', 'ev-luna', 'standing', 6500, maria, 'DT-48213', 40, {}, 3),
    t(1007, 'DTX-9WD3-TB6L', 'ev-luna', 'standing', 6500, maria, 'DT-48213', 40, {}, 3),
    t(1011, 'DTX-2HNV-8RCE', 'ev-midnight', 'ga', 4500, yannis, 'DT-48877', 33, {}, 2),
    t(1015, 'DTX-7PZA-5JQK', 'ev-hoops', 'lower', 3500, sofia, 'DT-49102', 29, { section: 'Lower Bowl 104', row: 'F', seat: '11' }, 5),
    t(1016, 'DTX-3MEY-6UVD', 'ev-hoops', 'lower', 3500, sofia, 'DT-49102', 29, { section: 'Lower Bowl 104', row: 'F', seat: '12' }, 5),
    t(1019, 'DTX-8CGT-1XNS', 'ev-luna', 'seated', 8500, { name: 'Christos Ioannou', email: 'christos@mail.com' }, 'DT-49350', 27, { section: 'Terrace B', row: '4', seat: '9' }),
    t(1021, 'DTX-5RKB-9LWF', 'ev-kosmos', 'stalls', 5500, andreas, 'DT-49511', 25, { section: 'Stalls', row: '7', seat: '14' }, 1),
    t(1024, 'DTX-6YHJ-4QMA', 'ev-midnight', 'ga', 4500, { name: 'Petra Novak', email: 'petra@mail.com' }, 'DT-49790', 22),
    t(1028, 'DTX-1VSL-7EKG', 'ev-danube', 'pass', 9500, katalin, 'DT-50023', 20, {}, 6),
    t(1029, 'DTX-0BQX-3ZTR', 'ev-danube', 'pass', 9500, katalin, 'DT-50023', 20, {}, 6),
    t(1030, 'DTX-4NDU-8HPY', 'ev-danube', 'pass', 9500, katalin, 'DT-50023', 20, {}, 6),
    t(1033, 'DTX-9AEF-2MCV', 'ev-eleni', 'ga', 2500, { name: 'Marios Hadjis', email: 'marios@mail.com' }, 'DT-50310', 16),
    t(1036, 'DTX-5TGW-6KJB', 'ev-echo', 'ga', 4000, ola, 'DT-50466', 14, {}, 1),
    t(1038, 'DTX-2LXP-9YDN', 'ev-aegean', 'ga', 8000, { name: 'Kostas Lambrou', email: 'kostas@mail.com' }, 'DT-50712', 12),
    t(1039, 'DTX-7JRC-0WQS', 'ev-aegean', 'ga', 8000, { name: 'Kostas Lambrou', email: 'kostas@mail.com' }, 'DT-50712', 12),
    t(1041, 'DTX-3QFM-5VBA', 'ev-aegean', 'ga', 8000, { name: 'Anna Stavrou', email: 'anna@mail.com' }, 'DT-50891', 10),
  ]
}

// A fake ticket "bought" on an unofficial resale site. Its barcode looks real, but DemoTix
// never issued it, so the gate scanner answers Not found ("The other way" screen, stage 8).
export const FAKE_TICKET = {
  barcode: 'DTX-8XKW-2RQF',
  eventId: 'ev-aegean',
  holder: 'Alex M.',
  site: 'tix-resale-hub.example',
  pricePaidCents: 35000,
}

// ---------------------------------------------------------------------------
// Settings (editable live in the demo's Settings screen)
// ---------------------------------------------------------------------------

export const DEFAULT_SETTINGS = {
  serviceFeePct: 10, // paid by the buyer on top of the ticket price
  partnerSharePct: 3, // part of the fee that goes to the ticketing company; FixTix keeps the rest
  waitlistOfferMinutes: 60, // exclusive offer window for the first in line (can be shortened for the demo)
  checkoutHoldMinutes: 10, // how long a ticket is reserved while the buyer pays
}

// ---------------------------------------------------------------------------

export function createSeedState() {
  const settings = { ...DEFAULT_SETTINGS }
  const users = [...buildUsers(), ...HISTORY_USERS]
  const tickets = buildTickets()
  // Four weeks of past resales, so the Partner dashboard has a story before the live demo.
  const history = buildSampleHistory({ users, tickets, settings })
  return {
    version: DATA_VERSION,
    seededAt: new Date().toISOString(),
    session: { userId: null },
    settings,
    events: buildEvents(),
    fixtix: {
      users,
      listings: [...history.listings, ...buildListings()],
      orders: history.orders,
      swaps: history.swaps,
      feeSplits: history.feeSplits,
      payouts: history.payouts,
      waitlist: buildWaitlist(),
      messages: [],
    },
    demotix: {
      tickets: [...tickets, ...history.tickets].sort((a, b) => a.id - b.id),
      apiLog: [],
      scans: [],
      nextTicketNumber: 1042,
      nextOrderNumber: 51034,
    },
  }
}
