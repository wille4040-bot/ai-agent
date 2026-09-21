// Tillval som kan läggas till i bokningen (utöver det som redan ingår i stugan).
// Pris i EUR, fast pris per bokning. Etiketter finns i locales under `options.<id>`.
export const bookingOptions = [
  { id: 'kayak', price: 90 },
  { id: 'bike', price: 70 },
  { id: 'grill', price: 40 },
  { id: 'fishing', price: 60 },
]

export function getOption(id) {
  return bookingOptions.find((o) => o.id === id)
}
