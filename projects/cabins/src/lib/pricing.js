import { bookingOptions } from '../data/options.js'

// Räkna ut totalen för en bokning. En bokning, en total.
//   stugpris = veckopris × antal veckor
//   tillval  = summan av valda tillval (fast pris per bokning)
export function computeTotal({ pricePerWeek = 0, weeks = 0, optionIds = [] }) {
  const cabinTotal = pricePerWeek * weeks
  const optionsTotal = bookingOptions
    .filter((o) => optionIds.includes(o.id))
    .reduce((sum, o) => sum + o.price, 0)
  return { cabinTotal, optionsTotal, total: cabinTotal + optionsTotal }
}

// Slutdatum (exklusiv utcheckningsdag) = startdatum + veckor × 7 dagar.
export function endDate(startISO, weeks) {
  if (!startISO || !weeks) return null
  const [y, m, d] = startISO.split('-').map(Number)
  const start = new Date(y, m - 1, d)
  const end = new Date(start)
  end.setDate(end.getDate() + weeks * 7)
  return end
}

export function toISODate(date) {
  if (!date) return ''
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}
