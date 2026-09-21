// Serverns egen priskatalog. Priser räknas ALLTID om här – klientens
// summor litar vi aldrig på. Håll i synk med src/data/cabins.js och options.js.

export const CABINS: Record<string, { name: string; pricePerWeek: number }> = {
  seeblick: { name: 'Seeblick', pricePerWeek: 1200 },
  waldhuette: { name: 'Waldhütte', pricePerWeek: 850 },
  sommenblick: { name: 'Sommenblick', pricePerWeek: 1600 },
}

export const OPTIONS: Record<string, { price: number }> = {
  kayak: { price: 90 },
  bike: { price: 70 },
  grill: { price: 40 },
  fishing: { price: 60 },
}

export type PricedBooking = {
  cabinId: string
  cabinName: string
  weeks: number
  optionIds: string[]
  cabinTotal: number
  optionsTotal: number
  total: number
  totalCents: number
  currency: string
}

// Validera och prissätt en bokning utifrån serverns katalog.
export function priceBooking(
  cabinId: string,
  weeks: number,
  optionIds: string[],
): PricedBooking {
  const cabin = CABINS[cabinId]
  if (!cabin) throw new Error('unknown-cabin')
  if (!Number.isInteger(weeks) || weeks < 1 || weeks > 8) {
    throw new Error('invalid-weeks')
  }
  const options = (optionIds || []).filter((id) => OPTIONS[id])
  const cabinTotal = cabin.pricePerWeek * weeks
  const optionsTotal = options.reduce((sum, id) => sum + OPTIONS[id].price, 0)
  const total = cabinTotal + optionsTotal
  return {
    cabinId,
    cabinName: cabin.name,
    weeks,
    optionIds: options,
    cabinTotal,
    optionsTotal,
    total,
    totalCents: total * 100,
    currency: 'eur',
  }
}
