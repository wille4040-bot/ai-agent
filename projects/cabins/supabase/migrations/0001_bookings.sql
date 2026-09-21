-- Bokningar för Sommen-stugorna.
-- Kräver btree_gist för exclusion-constraint på (cabin_id, daterange).

create extension if not exists pgcrypto;
create extension if not exists btree_gist;

create table if not exists public.bookings (
  id                    uuid primary key default gen_random_uuid(),
  cabin_id              text not null,
  guest_name            text not null,
  guest_email           text not null,
  start_date            date not null,
  end_date              date not null,          -- exklusiv utcheckningsdag
  weeks                 int  not null check (weeks > 0),
  options               jsonb not null default '[]'::jsonb,
  total_cents           int  not null check (total_cents >= 0),
  currency              text not null default 'eur',
  status                text not null default 'pending'
                          check (status in ('pending', 'confirmed', 'cancelled')),
  locale                text not null default 'de',
  stripe_session_id     text unique,
  stripe_payment_intent text,
  created_at            timestamptz not null default now(),
  confirmed_at          timestamptz,
  constraint end_after_start check (end_date > start_date)
);

create index if not exists bookings_cabin_idx on public.bookings (cabin_id);
create index if not exists bookings_status_idx on public.bookings (status);

-- Dubbelbokningsspärr: inga överlappande *bekräftade* bokningar för samma stuga.
-- daterange '[)' = inklusiv start, exklusiv slut (utcheckningsdag är fri).
alter table public.bookings
  drop constraint if exists bookings_no_overlap;
alter table public.bookings
  add constraint bookings_no_overlap
  exclude using gist (
    cabin_id with =,
    daterange(start_date, end_date, '[)') with &&
  )
  where (status = 'confirmed');

-- RLS: tabellen är låst. Edge Functions använder service-role och kringgår RLS.
-- Publik tillgänglighet exponeras via en vy med endast datumintervall (ingen PII).
alter table public.bookings enable row level security;

create or replace view public.availability as
  select cabin_id, start_date, end_date
  from public.bookings
  where status = 'confirmed';

grant select on public.availability to anon, authenticated;
