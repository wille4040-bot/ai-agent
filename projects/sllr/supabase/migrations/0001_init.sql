-- Sllr – grundschema (Pass 1)
-- Kör i Supabase SQL Editor eller via Supabase CLL (supabase db push).

-- ---------------------------------------------------------------------------
-- Enum-typer
-- ---------------------------------------------------------------------------
create type roll_typ as enum ('uthyrare', 'hyrestagare', 'bada');

create type bokning_status as enum (
  'forfragan',   -- förfrågan skickad
  'bekraftad',   -- uthyraren har accepterat
  'pagaende',    -- hyresperioden pågår
  'avslutad',    -- återlämnad och klar
  'avbruten'     -- avbokad
);

-- ---------------------------------------------------------------------------
-- profiles: ett företag per konto, kopplat till auth.users
-- ---------------------------------------------------------------------------
create table profiles (
  id                uuid primary key references auth.users (id) on delete cascade,
  org_nr            text,
  foretagsnamn      text,
  roll              roll_typ    not null default 'bada',
  ort               text,
  stripe_account_id text,                -- null tills Stripe Connect byggs
  created_at        timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- listings: utrustning som hyrs ut
-- ---------------------------------------------------------------------------
create table listings (
  id          uuid primary key default gen_random_uuid(),
  agare_id    uuid          not null references profiles (id) on delete cascade,
  titel       text          not null,
  kategori    text,
  beskrivning text,
  dagspris    numeric(10, 2) not null check (dagspris >= 0),
  deposition  numeric(10, 2) not null default 0 check (deposition >= 0),
  ort         text,
  bild_url    text,
  aktiv       boolean       not null default true,
  created_at  timestamptz   not null default now()
);

create index listings_agare_id_idx on listings (agare_id);
create index listings_aktiv_idx on listings (aktiv);

-- ---------------------------------------------------------------------------
-- bookings: en hyresperiod för en listing
-- ---------------------------------------------------------------------------
create table bookings (
  id             uuid primary key default gen_random_uuid(),
  listing_id     uuid           not null references listings (id) on delete cascade,
  hyrestagare_id uuid           not null references profiles (id) on delete cascade,
  datum_fran     date           not null,
  datum_till     date           not null,
  totalpris      numeric(10, 2) not null check (totalpris >= 0),
  provision      numeric(10, 2) not null check (provision >= 0),
  status         bokning_status not null default 'forfragan',
  created_at     timestamptz    not null default now(),
  constraint datum_giltigt check (datum_till >= datum_fran)
);

create index bookings_listing_id_idx on bookings (listing_id);
create index bookings_hyrestagare_id_idx on bookings (hyrestagare_id);

-- ---------------------------------------------------------------------------
-- reviews: en recension per genomförd bokning
-- ---------------------------------------------------------------------------
create table reviews (
  id         uuid primary key default gen_random_uuid(),
  booking_id uuid        not null references bookings (id) on delete cascade,
  betyg      smallint    not null check (betyg between 1 and 5),
  kommentar  text,
  created_at timestamptz not null default now()
);

create index reviews_booking_id_idx on reviews (booking_id);
