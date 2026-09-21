// Platshållardata för stugor. Ersätts senare med riktigt innehåll (t.ex. Supabase).
// Namn och beskrivningar hålls språkneutrala tills vidare; översättning kan
// läggas till när det riktiga innehållet finns.
export const cabins = [
  { id: 'seeblick', name: 'Seeblick', region: '—', beds: 4, price: null },
  { id: 'waldrand', name: 'Waldrand', region: '—', beds: 2, price: null },
  { id: 'berghof', name: 'Berghof', region: '—', beds: 6, price: null },
]

export function getCabin(id) {
  return cabins.find((c) => c.id === id)
}
