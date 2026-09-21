# Sommen Hütten

Website för uthyrning av ferienhütten vid sjön Sommen. Konceptet: **hütte och
utrustning i en och samma bokning**. Tyska är standardspråk, med växlare för
svenska och engelska.

## Stack

- **Vite + React 18** – samma grund som `projects/sllr`.
- **react-router-dom** – klientrouting (SPA).
- **react-i18next** – tre språk: **tyska (standard)**, svenska, engelska.
  Valt språk sparas i `localStorage` (`cabins.lang`).
- **Supabase** – databas för bokningar + Edge Functions (Deno).
- **Stripe Checkout** – betalning med kort, Klarna och SEPA.
- **Resend** – transaktionsmejl (bekräftelse och anreseinformation), på tyska.

## Frontend-struktur

```
src/
  i18n.js               # i18next-init, språkval + persistens
  locales/              # de.json (standard), sv.json, en.json
  data/                 # cabins.js (3 exempelstugor), options.js (tillval)
  lib/                  # format, pricing, supabase (availability), checkout
  components/           # Layout, Navbar, LanguageSwitcher, Footer, Seo,
                        # CabinCard, Gallery, CabinMap, AvailabilityCalendar, ...
  pages/                # Home, Cabins, CabinDetail, Equipment, About, ContactFaq,
                        # Booking (+ success/cancelled), FishingLanding, DogsLanding
```

Rutter: `/`, `/cabins`, `/cabins/:id`, `/equipment`, `/about`, `/contact`,
`/booking` (+ `/booking/success`, `/booking/cancelled`), `/angeln`, `/hunde`.
URL-vägar hålls stabila; endast texten översätts. Varje stuga har en egen URL.

## Bokningsflöde (3 steg, en total)

1. Välj stuga, anresa och antal veckor.
2. Lägg till tillval (kajak, cykel, grill, fiskeutrustning).
3. Översikt + gästuppgifter → Stripe Checkout (kort / Klarna / SEPA).

Summan visas live genom hela flödet. Priset räknas alltid om på servern –
klientens summor litas aldrig på (se `supabase/functions/_shared/catalog.ts`).

## Dubbelbokningsspärr

`bookings`-tabellen har ett `EXCLUDE`-constraint (btree_gist) som förhindrar
överlappande **bekräftade** bokningar för samma stuga. Vid en kapplöpning där
två gäster betalar samtidigt bekräftas den första; den andra markeras avbruten,
återbetalas via Stripe och får ett tyskt mejl om att stugan tyvärr var upptagen.
Publik tillgänglighet exponeras via vyn `availability` (endast datumintervall,
ingen gästinformation).

## SEO (tyska)

- Per-sida `<title>`, meta-description, Open Graph och canonical via
  `components/Seo.jsx`.
- Nyckelordsrika rubriker samt egna landningssidor: `/angeln` (fiske) och
  `/hunde` (hundvänligt).
- Alt-/aria-text på bilder, `public/robots.txt`, favicon och `<html lang>`
  som följer valt språk.

## Backend – setup

1. **Databas:** kör migrationerna i `supabase/migrations/` (Supabase CLI:
   `supabase db push`, eller klistra in i SQL Editor).
2. **Secrets** (Edge Functions):
   ```bash
   supabase secrets set \
     STRIPE_SECRET_KEY=sk_... \
     STRIPE_WEBHOOK_SECRET=whsec_... \
     RESEND_API_KEY=re_... \
     EMAIL_FROM="Sommen Hütten <buchung@dindomän.se>" \
     ALLOW_ORIGIN=https://din-domän.se \
     CRON_SECRET=$(openssl rand -hex 16)
   ```
3. **Deploy funktioner:**
   ```bash
   supabase functions deploy create-checkout
   supabase functions deploy stripe-webhook   # verify_jwt=false (config.toml)
   supabase functions deploy pre-arrival       # verify_jwt=false
   supabase functions deploy contact           # kräver secret CONTACT_TO
   ```
4. **Stripe webhook:** peka en webhook till `.../functions/v1/stripe-webhook`
   för händelserna `checkout.session.completed`,
   `checkout.session.async_payment_succeeded/failed` och
   `checkout.session.expired`.
5. **Anresemejl (steg 8):** schemalägg `pre-arrival` dagligen – se
   `supabase/cron/pre-arrival.sql` (pg_cron + pg_net). Skickar tysk anrese-
   information (adress, vägbeskrivning, incheckningstid, nyckelöverlämning)
   `PRE_ARRIVAL_DAYS` dagar (default 3) före ankomst.
6. **Frontend-env:** kopiera `.env.example` → `.env.local` och fyll i
   `VITE_SUPABASE_URL` och `VITE_SUPABASE_ANON_KEY`.

Utan frontend-env körs appen ändå (statisk tillgänglighet, betalning avstängd
med ett tydligt meddelande) – bra för lokal utveckling.

## Utveckling

```bash
npm install
npm run dev      # startar Vite-dev-server
npm run build    # produktionsbygge till dist/
npm run preview  # förhandsvisa bygget
```

## Deploy (frontend)

`public/_redirects` finns för SPA-routing på Netlify. Rot-`netlify.toml` pekar
i dagsläget på `projects/sllr`; en egen deploy-konfiguration för det här
projektet läggs till i ett senare steg. Ersätt domänen i `public/robots.txt`
före lansering.
