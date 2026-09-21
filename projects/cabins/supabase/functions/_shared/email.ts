// Skickar transaktionsmejl via Resend (https://resend.com).
// Bekräftelsemejlet är på tyska enligt kravet.

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const EMAIL_FROM = Deno.env.get('EMAIL_FROM') ?? 'Sommen Hütten <buchung@example.com>'

function euro(cents: number): string {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(cents / 100)
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('de-DE', { dateStyle: 'long' }).format(
    new Date(iso),
  )
}

async function send(to: string, subject: string, html: string) {
  if (!RESEND_API_KEY) {
    console.warn('RESEND_API_KEY saknas – hoppar över mejlutskick.')
    return
  }
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from: EMAIL_FROM, to, subject, html }),
  })
  if (!res.ok) {
    console.error('Resend-fel:', res.status, await res.text())
  }
}

type Booking = {
  guest_name: string
  guest_email: string
  cabin_id: string
  start_date: string
  end_date: string
  weeks: number
  options: string[]
  total_cents: number
}

const OPTION_LABELS_DE: Record<string, string> = {
  kayak: 'Kajak',
  bike: 'Fahrrad',
  grill: 'Grill',
  fishing: 'Angelausrüstung',
}

const CABIN_LABELS: Record<string, string> = {
  seeblick: 'Seeblick',
  waldhuette: 'Waldhütte',
  sommenblick: 'Sommenblick',
}

// Tysk bekräftelse efter lyckad betalning.
export async function sendConfirmationEmail(b: Booking) {
  const cabin = CABIN_LABELS[b.cabin_id] ?? b.cabin_id
  const extras =
    b.options.length > 0
      ? b.options.map((o) => OPTION_LABELS_DE[o] ?? o).join(', ')
      : 'Keine'

  const html = `
  <div style="font-family: Arial, sans-serif; color: #1f2a24; max-width: 560px;">
    <h2 style="color: #2f5d50;">Vielen Dank für Ihre Buchung!</h2>
    <p>Hallo ${b.guest_name},</p>
    <p>Ihre Buchung am See Sommen ist bestätigt. Hier sind Ihre Details:</p>
    <table style="border-collapse: collapse; width: 100%; margin: 16px 0;">
      <tr><td style="padding:6px 0; color:#5c6b63;">Hütte</td><td style="padding:6px 0; text-align:right;"><strong>${cabin}</strong></td></tr>
      <tr><td style="padding:6px 0; color:#5c6b63;">Anreise</td><td style="padding:6px 0; text-align:right;">${formatDate(b.start_date)}</td></tr>
      <tr><td style="padding:6px 0; color:#5c6b63;">Abreise</td><td style="padding:6px 0; text-align:right;">${formatDate(b.end_date)}</td></tr>
      <tr><td style="padding:6px 0; color:#5c6b63;">Wochen</td><td style="padding:6px 0; text-align:right;">${b.weeks}</td></tr>
      <tr><td style="padding:6px 0; color:#5c6b63;">Extras</td><td style="padding:6px 0; text-align:right;">${extras}</td></tr>
      <tr><td style="padding:10px 0; border-top:1px solid #e2ddd4; font-size:1.1em;"><strong>Gesamt</strong></td><td style="padding:10px 0; border-top:1px solid #e2ddd4; text-align:right; font-size:1.1em;"><strong>${euro(b.total_cents)}</strong></td></tr>
    </table>
    <p>Wir freuen uns auf Ihren Besuch!</p>
    <p style="color:#5c6b63;">Herzliche Grüße,<br/>Ihr Sommen-Hütten-Team</p>
  </div>`

  await send(b.guest_email, `Buchungsbestätigung – ${cabin} am Sommen`, html)
}

// Tysk information om att stugan tyvärr inte längre var ledig (med återbetalning).
export async function sendUnavailableEmail(b: Booking) {
  const cabin = CABIN_LABELS[b.cabin_id] ?? b.cabin_id
  const html = `
  <div style="font-family: Arial, sans-serif; color: #1f2a24; max-width: 560px;">
    <h2 style="color: #b3261e;">Ihre Buchung konnte nicht bestätigt werden</h2>
    <p>Hallo ${b.guest_name},</p>
    <p>leider wurde die Hütte <strong>${cabin}</strong> für den gewählten Zeitraum
    (${formatDate(b.start_date)} – ${formatDate(b.end_date)}) zwischenzeitlich
    bereits gebucht.</p>
    <p>Der Betrag von <strong>${euro(b.total_cents)}</strong> wurde vollständig
    erstattet. Gerne helfen wir Ihnen, einen anderen Termin oder eine andere
    Hütte zu finden.</p>
    <p style="color:#5c6b63;">Herzliche Grüße,<br/>Ihr Sommen-Hütten-Team</p>
  </div>`

  await send(b.guest_email, `Buchung nicht möglich – ${cabin}`, html)
}
