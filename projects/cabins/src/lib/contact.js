// Skickar kontaktformuläret via Supabase Edge Function `contact`.
// Utan konfigurerad backend faller UI:t tillbaka på en mailto-länk.
const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const isContactConfigured = Boolean(url && anonKey)

export async function sendContact(payload) {
  if (!isContactConfigured) {
    throw new Error('contact-not-configured')
  }
  const res = await fetch(`${url}/functions/v1/contact`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${anonKey}`,
      apikey: anonKey,
    },
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error || `contact-failed-${res.status}`)
  }
  return res.json()
}
