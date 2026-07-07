// Gemensamma värden för annonser.

export const KATEGORIER = ['Event', 'Bygg', 'Verktyg', 'Transport', 'Annat']

// Formaterar ett belopp som svenska kronor, t.ex. 1200 -> "1 200 kr".
export function kr(belopp) {
  const n = Number(belopp) || 0
  return n.toLocaleString('sv-SE', { maximumFractionDigits: 0 }) + ' kr'
}
