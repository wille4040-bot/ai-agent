// Edge Function: pre-arrival
// Schemaläggs dagligen. Skickar tysk anreseinformation några dagar (default 3)
// innan ankomst till bekräftade bokningar som ännu inte fått mejlet.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

import { sendPreArrivalEmail } from '../_shared/email.ts'
import { ARRIVAL } from '../_shared/arrival.ts'

const admin = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
)

const PRE_ARRIVAL_DAYS = Number(Deno.env.get('PRE_ARRIVAL_DAYS') ?? '3')
const CRON_SECRET = Deno.env.get('CRON_SECRET') ?? ''

function targetDate(): string {
  const d = new Date()
  d.setUTCDate(d.getUTCDate() + PRE_ARRIVAL_DAYS)
  return d.toISOString().slice(0, 10)
}

Deno.serve(async (req) => {
  // Enkel skydd mot obehöriga anrop (schemaläggaren skickar hemligheten).
  if (CRON_SECRET && req.headers.get('x-cron-secret') !== CRON_SECRET) {
    return new Response('forbidden', { status: 403 })
  }

  const date = targetDate()

  const { data: bookings, error } = await admin
    .from('bookings')
    .select('*')
    .eq('status', 'confirmed')
    .eq('start_date', date)
    .is('pre_arrival_sent_at', null)

  if (error) {
    console.error('pre-arrival query failed:', error)
    return new Response(JSON.stringify({ error: 'query-failed' }), { status: 500 })
  }

  let sent = 0
  for (const b of bookings ?? []) {
    const info = ARRIVAL[b.cabin_id]
    if (!info) {
      console.warn('ingen anreseinfo för stuga:', b.cabin_id)
      continue
    }
    try {
      await sendPreArrivalEmail(b, info)
      await admin
        .from('bookings')
        .update({ pre_arrival_sent_at: new Date().toISOString() })
        .eq('id', b.id)
      sent++
    } catch (e) {
      console.error('pre-arrival send failed for', b.id, e)
    }
  }

  return new Response(JSON.stringify({ date, sent }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
})
