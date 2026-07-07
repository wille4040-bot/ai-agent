# Sllr

B2B-marknadsplats där företag hyr ut ledig utrustning till varandra.

- **Frontend:** React + Vite (deploy: Netlify)
- **Backend:** Supabase (Postgres, Auth, Storage)
- **Betalning:** Stripe Connect (byggs i ett senare pass)

## Kom igång

```bash
cd projects/sllr
npm install
cp .env.example .env   # fyll i URL + anon-nyckel från Supabase
npm run dev
```

## Databas

SQL-migrations ligger i `supabase/migrations/`. Kör dem i turordning i
Supabase SQL Editor (eller `supabase db push` om du använder Supabase CLI):

1. `0001_init.sql` – tabeller (`profiles`, `listings`, `bookings`, `reviews`)
2. `0002_rls.sql` – Row Level Security + policyer
3. `0003_storage.sql` – Storage-bucket för annonsbilder + regler

## Byggplan

- **Pass 1 – Grund:** Vite/React + Supabase-klient + migrations ✅
- **Pass 2 – Inloggning:** registrering/inloggning + profilsida ✅
- **Pass 3 – Annonser:** formulär med bilduppladdning + lista/detaljvy ✅
- **Pass 4 – Bokning:** bokningsflöde med överlappskontroll + översikter
- **Senare:** Stripe Connect, e-postbekräftelser, BankID-signering, recensioner

## Affärsregler

- Provision är **10 % av hyran** (ej depositionen).
- Depositionen återbetalas.
- Allt gränssnitt är på svenska.
