// Hjälpfunktioner för datum och tid, alltid på svenska
// och alltid i svensk tidszon.

const TIDSZON = 'Europe/Stockholm'

// Gör om ett Date-objekt till texten "2026-07-04" (i svensk tid)
export function tillDatumStrang(datum) {
  return new Intl.DateTimeFormat('sv-SE', {
    timeZone: TIDSZON,
    year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(datum)
}

// "lördag 4 juli"
export function langDagText(datum) {
  return new Intl.DateTimeFormat('sv-SE', {
    timeZone: TIDSZON,
    weekday: 'long', day: 'numeric', month: 'long',
  }).format(datum)
}

// "lör" / "4 jul" – för de små datumknapparna
export function kortVeckodag(datum) {
  return new Intl.DateTimeFormat('sv-SE', { timeZone: TIDSZON, weekday: 'short' }).format(datum)
}
export function kortDatum(datum) {
  return new Intl.DateTimeFormat('sv-SE', { timeZone: TIDSZON, day: 'numeric', month: 'short' }).format(datum)
}

// "14:30"
export function klockslag(isoTid) {
  return new Intl.DateTimeFormat('sv-SE', {
    timeZone: TIDSZON, hour: '2-digit', minute: '2-digit',
  }).format(new Date(isoTid))
}

// ISO-veckodag för ett datum: 1 = måndag ... 7 = söndag
// (samma numrering som databasen använder)
export function isoVeckodag(datum) {
  const kort = new Intl.DateTimeFormat('en-GB', { timeZone: TIDSZON, weekday: 'short' }).format(datum)
  return { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7 }[kort]
}

// Lista med de kommande X dagarna (som Date-objekt)
export function kommandeDagar(antal) {
  const dagar = []
  const nu = new Date()
  for (let i = 0; i < antal; i++) {
    dagar.push(new Date(nu.getTime() + i * 24 * 60 * 60 * 1000))
  }
  return dagar
}

// "450 kr" / "1 595 kr"
export function prisText(pris) {
  return `${Number(pris).toLocaleString('sv-SE', { maximumFractionDigits: 0 })} kr`
}
