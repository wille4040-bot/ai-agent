// Platshållardata för stugor vid sjön Sommen.
// Strukturell data ligger här; översatt text (beskrivning) ligger i locales
// under `cabinDescriptions.<id>`, och utrustningsetiketter under `features.<key>`.
//
// Fält:
//   beds            – antal bäddar
//   pricePerWeek    – veckopris i EUR
//   distanceToWater – meter till vattnet
//   coords          – { lat, lng } nära sjön Sommen (för karta)
//   images          – antal platshållarbilder i galleriet
//   included        – nycklar till `features.<key>` (ingår i bokningen)
//   booked          – bokade perioder { start, end } (ISO), för tillgänglighetskalender

export const cabins = [
  {
    id: 'seeblick',
    name: 'Seeblick',
    beds: 4,
    pricePerWeek: 1200,
    distanceToWater: 20,
    coords: { lat: 58.024, lng: 15.128 },
    images: 4,
    included: [
      'lakeAccess',
      'boat',
      'kayak',
      'sauna',
      'wifi',
      'kitchen',
      'fireplace',
      'grill',
      'parking',
      'linens',
    ],
    booked: [
      { start: '2026-10-05', end: '2026-10-12' },
      { start: '2026-12-20', end: '2027-01-03' },
    ],
  },
  {
    id: 'waldhuette',
    name: 'Waldhütte',
    beds: 2,
    pricePerWeek: 850,
    distanceToWater: 300,
    coords: { lat: 58.045, lng: 15.18 },
    images: 4,
    included: [
      'bikes',
      'wifi',
      'kitchen',
      'heating',
      'grill',
      'parking',
      'pets',
      'linens',
    ],
    booked: [{ start: '2026-09-28', end: '2026-10-05' }],
  },
  {
    id: 'sommenblick',
    name: 'Sommenblick',
    beds: 6,
    pricePerWeek: 1600,
    distanceToWater: 50,
    coords: { lat: 58.01, lng: 15.21 },
    images: 4,
    included: [
      'lakeAccess',
      'boat',
      'sauna',
      'wifi',
      'kitchen',
      'fireplace',
      'dishwasher',
      'washingMachine',
      'grill',
      'parking',
      'terrace',
      'linens',
    ],
    booked: [
      { start: '2026-11-16', end: '2026-11-23' },
      { start: '2026-12-24', end: '2026-12-31' },
    ],
  },
]

export function getCabin(id) {
  return cabins.find((c) => c.id === id)
}

// Stugor som innehåller någon av de angivna utrustningsnycklarna.
export function cabinsWithAny(...keys) {
  return cabins.filter((c) => keys.some((k) => c.included.includes(k)))
}

// Bekvämt för filter-standardvärden.
export const priceRange = {
  min: Math.min(...cabins.map((c) => c.pricePerWeek)),
  max: Math.max(...cabins.map((c) => c.pricePerWeek)),
}
export const distanceRange = {
  min: 0,
  max: Math.max(...cabins.map((c) => c.distanceToWater)),
}
