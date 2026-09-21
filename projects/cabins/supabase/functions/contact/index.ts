// Edge Function: contact
// Tar emot kontaktformuläret och mejlar ägaren (reply-to gästen).
import { corsHeaders, jsonResponse } from '../_shared/cors.ts'
import { sendContactEmail } from '../_shared/email.ts'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return jsonResponse({ error: 'method-not-allowed' }, 405)

  try {
    const { name, email, subject, message } = (await req.json()) ?? {}

    if (!name?.trim()) return jsonResponse({ error: 'missing-name' }, 400)
    if (!EMAIL_RE.test(email ?? '')) return jsonResponse({ error: 'invalid-email' }, 400)
    if (!message?.trim()) return jsonResponse({ error: 'missing-message' }, 400)
    // Enkel längdgräns mot missbruk.
    if (message.length > 5000) return jsonResponse({ error: 'message-too-long' }, 400)

    await sendContactEmail({
      name: name.trim(),
      email: email.trim(),
      subject: (subject ?? '').trim(),
      message: message.trim(),
    })

    return jsonResponse({ ok: true })
  } catch (err) {
    console.error('contact error:', err)
    return jsonResponse({ error: 'internal-error' }, 500)
  }
})
