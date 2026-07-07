// Gemensam bokningslogik.

export const PROVISION_ANDEL = 0.1 // 10 % av hyran (ej depositionen)

// Antal dagar inklusive både start- och slutdatum (heldagsmodell).
export function antalDagar(fran, till) {
  if (!fran || !till) return 0
  const ms = new Date(till) - new Date(fran)
  if (ms < 0) return 0
  return Math.round(ms / 86_400_000) + 1
}

// Räknar ut hyra, provision och totalt att betala.
//   hyra      = dagspris * antal dagar
//   provision = 10 % av hyran (Sllrs andel)
//   total     = hyra + deposition (depositionen återbetalas senare)
export function beraknaPris(dagspris, deposition, fran, till) {
  const dagar = antalDagar(fran, till)
  const hyra = dagar * Number(dagspris || 0)
  const provision = Math.round(hyra * PROVISION_ANDEL * 100) / 100
  const total = hyra + Number(deposition || 0)
  return { dagar, hyra, provision, total }
}

// Sant om [fran, till] överlappar någon av de redan bokade perioderna.
export function overlappar(fran, till, perioder) {
  return perioder.some((p) => fran <= p.datum_till && till >= p.datum_fran)
}

export const STATUS_ETIKETT = {
  forfragan: 'Förfrågan',
  bekraftad: 'Bekräftad',
  pagaende: 'Pågående',
  avslutad: 'Avslutad',
  avbruten: 'Avbruten',
}

// Dagens datum som "YYYY-MM-DD" (för min-värde i datumfält).
export function idag() {
  return new Date().toISOString().slice(0, 10)
}
