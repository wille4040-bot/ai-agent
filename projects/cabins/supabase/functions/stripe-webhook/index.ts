// Edge Function: stripe-webhook
// Bekräftar bokningen efter betalning. Exclusion-constraintet i databasen är
// sista instans mot dubbelbokning: om det slår till återbetalar vi och mejlar.
import Stripe from 'https://esm.sh/stripe@16?target=deno'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

import { sendConfirmationEmail, sendUnavailableEmail } from '../_shared/email.ts'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
  apiVersion: '2024-06-20',
  httpClient: Stripe.createFetchHttpClient(),
})
const cryptoProvider = Stripe.createSubtleCryptoProvider()

const admin = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
)

const WEBHOOK_SECRET = Deno.env.get('STRIPE_WEBHOOK_SECRET') ?? ''

// Bekräfta en bokning. Returnerar false om den redan är slutförd (idempotens).
async function confirmBooking(bookingId: string, paymentIntent: string | null) {
  const { data: booking } = await admin
    .from('bookings')
    .select('*')
    .eq('id', bookingId)
    .single()
  if (!booking || booking.status !== 'pending') return

  // Försök bekräfta. Exclusion-constraintet stoppar överlapp (kod 23P01).
  const { error } = await admin
    .from('bookings')
    .update({
      status: 'confirmed',
      confirmed_at: new Date().toISOString(),
      stripe_payment_intent: paymentIntent,
    })
    .eq('id', bookingId)
    .eq('status', 'pending')

  if (error) {
    const overlap = error.code === '23P01' || /no_overlap/.test(error.message)
    if (overlap) {
      // Kapplöpning förlorad: markera avbruten, återbetala och informera gästen.
      await admin.from('bookings').update({ status: 'cancelled' }).eq('id', bookingId)
      if (paymentIntent) {
        try {
          await stripe.refunds.create({ payment_intent: paymentIntent })
        } catch (e) {
          console.error('refund failed:', e)
        }
      }
      await sendUnavailableEmail(booking)
      return
    }
    throw error
  }

  await sendConfirmationEmail(booking)
}

async function cancelBooking(bookingId: string) {
  await admin
    .from('bookings')
    .update({ status: 'cancelled' })
    .eq('id', bookingId)
    .eq('status', 'pending')
}

Deno.serve(async (req) => {
  const sig = req.headers.get('stripe-signature')
  const raw = await req.text()

  let event: Stripe.Event
  try {
    event = await stripe.webhooks.constructEventAsync(
      raw,
      sig!,
      WEBHOOK_SECRET,
      undefined,
      cryptoProvider,
    )
  } catch (err) {
    console.error('signature verification failed:', err)
    return new Response('invalid signature', { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const s = event.data.object as Stripe.Checkout.Session
        const bookingId = s.metadata?.booking_id
        // För direktbetalning (kort): 'paid'. För fördröjda (SEPA/Klarna)
        // kommer bekräftelsen via async_payment_succeeded.
        if (bookingId && s.payment_status === 'paid') {
          await confirmBooking(bookingId, s.payment_intent as string | null)
        }
        break
      }
      case 'checkout.session.async_payment_succeeded': {
        const s = event.data.object as Stripe.Checkout.Session
        const bookingId = s.metadata?.booking_id
        if (bookingId) {
          await confirmBooking(bookingId, s.payment_intent as string | null)
        }
        break
      }
      case 'checkout.session.async_payment_failed':
      case 'checkout.session.expired': {
        const s = event.data.object as Stripe.Checkout.Session
        const bookingId = s.metadata?.booking_id
        if (bookingId) await cancelBooking(bookingId)
        break
      }
      default:
        break
    }
  } catch (err) {
    console.error('webhook handler error:', err)
    return new Response('handler error', { status: 500 })
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
})
