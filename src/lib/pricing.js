// How one ticket's money is split. All amounts in euro cents.
//
// The buyer pays the ticket price plus a service fee. The seller gets the full ticket price.
// The fee is split between FixTix and the ticketing company (percentages of the ticket price).
//
//   priceBreakdown(8000, { serviceFeePct: 10, partnerSharePct: 3 })
//   -> { ticket: 8000, fee: 800, total: 8800, partner: 240, fixtix: 560 }
export function priceBreakdown(ticketCents, settings) {
  const fee = Math.round((ticketCents * settings.serviceFeePct) / 100)
  const partner = Math.min(fee, Math.round((ticketCents * settings.partnerSharePct) / 100))
  return {
    ticket: ticketCents,
    fee,
    total: ticketCents + fee,
    partner,
    fixtix: fee - partner,
  }
}

// What the buyer pays per ticket, fee included (shown everywhere a price is listed).
export function buyerTotal(ticketCents, settings) {
  return priceBreakdown(ticketCents, settings).total
}
