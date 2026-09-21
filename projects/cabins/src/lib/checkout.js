// Startar Stripe Checkout via Supabase Edge Function `create-checkout`.
// Funktionen validerar tillgänglighet, skapar en pending-bokning och
// returnerar en Checkout-URL (kort, Klarna eller SEPA väljs på Stripe-sidan).
const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const isCheckoutConfigured = Boolean(url && anonKey)

export async function startCheckout(payload) {
  if (!isCheckoutConfigured) {
    throw new Error('checkout-not-configured')
  }
  const res = await fetch(`${url}/functions/v1/create-checkout`, {
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
    throw new Error(body.error || `checkout-failed-${res.status}`)
  }
  return res.json() // { url }
}
