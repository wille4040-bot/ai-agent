// Edge Function: create-checkout
// Validerar tillgänglighet, prissätter på servern, skapar en pending-bokning
// och returnerar en Stripe Checkout-URL (kort, Klarna eller SEPA).
import Stripe from 'https://esm.sh/stripe@16?target=deno'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

import { corsHeaders, jsonResponse } from '../_shared/cors.ts'
import { CABINS, OPTIONS, priceBooking } from '../_shared/catalog.ts'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
  apiVersion: '2024-06-20',
  httpClient: Stripe.createFetchHttpClient(),
})

const admin = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
)

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const STRIPE_LOCALES: Record<string, string> = { de: 'de', sv: 'sv', en: 'en' }

function addDays(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return jsonResponse({ error: 'method-not-allowed' }, 405)

  try {
    const body = await req.json()
    const {
      cabinId,
      weeks,
      startDate,
      optionIds = [],
      guestName,
      guestEmail,
      locale = 'de',
      successUrl,
      cancelUrl,
    } = body ?? {}

    // Validering
    if (!CABINS[cabinId]) return jsonResponse({ error: 'unknown-cabin' }, 400)
    if (!DATE_RE.test(startDate)) return jsonResponse({ error: 'invalid-start' }, 400)
    if (!guestName?.trim()) return jsonResponse({ error: 'missing-name' }, 400)
    if (!EMAIL_RE.test(guestEmail ?? '')) return jsonResponse({ error: 'invalid-email' }, 400)
    if (!successUrl || !cancelUrl) return jsonResponse({ error: 'missing-urls' }, 400)

    // Prissätt på servern – klientens summor ignoreras.
    const priced = priceBooking(cabinId, Number(weeks), optionIds)
    const endDate = addDays(startDate, priced.weeks * 7) // exklusiv utcheckningsdag

    // Tillgänglighetskontroll: inga bekräftade överlapp för denna stuga.
    const { data: overlaps, error: overlapErr } = await admin
      .from('bookings')
      .select('id')
      .eq('cabin_id', cabinId)
      .eq('status', 'confirmed')
      .lt('start_date', endDate)
      .gt('end_date', startDate)
    if (overlapErr) throw overlapErr
    if (overlaps && overlaps.length > 0) {
      return jsonResponse({ error: 'not-available' }, 409)
    }

    // Skapa pending-bokning.
    const { data: booking, error: insertErr } = await admin
      .from('bookings')
      .insert({
        cabin_id: cabinId,
        guest_name: guestName.trim(),
        guest_email: guestEmail.trim(),
        start_date: startDate,
        end_date: endDate,
        weeks: priced.weeks,
        options: priced.optionIds,
        total_cents: priced.totalCents,
        currency: priced.currency,
        status: 'pending',
        locale,
      })
      .select()
      .single()
    if (insertErr) throw insertErr

    // Bygg itemiserade rader (samma total, transparent för gästen).
    const lineItems = [
      {
        quantity: priced.weeks,
        price_data: {
          currency: 'eur',
          unit_amount: CABINS[cabinId].pricePerWeek * 100,
          product_data: { name: `${priced.cabinName} — Ferienhütte am Sommen` },
        },
      },
      ...priced.optionIds.map((id) => ({
        quantity: 1,
        price_data: {
          currency: 'eur',
          unit_amount: OPTIONS[id].price * 100,
          product_data: { name: `Extra: ${id}` },
        },
      })),
    ]

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card', 'klarna', 'sepa_debit'],
      line_items: lineItems,
      customer_email: guestEmail.trim(),
      locale: STRIPE_LOCALES[locale] ?? 'de',
      client_reference_id: booking.id,
      metadata: { booking_id: booking.id },
      success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl,
    })

    await admin
      .from('bookings')
      .update({ stripe_session_id: session.id })
      .eq('id', booking.id)

    return jsonResponse({ url: session.url })
  } catch (err) {
    console.error('create-checkout error:', err)
    return jsonResponse({ error: 'internal-error' }, 500)
  }
})
