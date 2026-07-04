-- ============================================================
-- BOKNINGSSYSTEM – Grundschema (Fas 1)
-- Körs i Supabase: SQL Editor -> klistra in allt -> Run
-- ============================================================
-- Skapar tabeller för: företag, tjänster, öppettider,
-- blockerade datum och bokningar – samt säkerhetsregler (RLS)
-- och funktioner för lediga tider + att skapa bokning säkert.
-- ============================================================

-- Behövs för att kunna förbjuda överlappande bokningar i databasen
create extension if not exists btree_gist;

-- ------------------------------------------------------------
-- TABELL: foretag
-- Varje rad = ett tjänsteföretag (frisör, massör, verkstad ...)
-- ------------------------------------------------------------
create table if not exists foretag (
  id                    uuid primary key default gen_random_uuid(),
  slug                  text unique not null,          -- adressen, t.ex. "frisor-lisa"
  namn                  text not null,
  epost                 text,
  telefon               text,
  adress                text,
  tidszon               text not null default 'Europe/Stockholm',
  bokningsfonster_dagar int  not null default 60,      -- hur långt fram kunder får boka
  min_frist_timmar      int  not null default 2,       -- hur nära inpå man senast får boka
  agare_user_id         uuid references auth.users(id),-- kopplas till ägarens inloggning
  aktiv                 boolean not null default true,
  skapad                timestamptz not null default now(),
  constraint slug_format check (slug ~ '^[a-z0-9-]{2,60}$')
);

-- ------------------------------------------------------------
-- TABELL: tjanster
-- Det företaget erbjuder, t.ex. "Klippning, 45 min, 450 kr"
-- ------------------------------------------------------------
create table if not exists tjanster (
  id            uuid primary key default gen_random_uuid(),
  foretag_id    uuid not null references foretag(id) on delete cascade,
  namn          text not null,
  beskrivning   text,
  langd_minuter int  not null check (langd_minuter between 5 and 480),
  pris_kr       numeric(10,2) not null default 0 check (pris_kr >= 0),
  aktiv         boolean not null default true,
  skapad        timestamptz not null default now()
);

-- ------------------------------------------------------------
-- TABELL: oppettider
-- En rad per veckodag företaget har öppet.
-- veckodag: 1 = måndag ... 7 = söndag (ISO-standard)
-- ------------------------------------------------------------
create table if not exists oppettider (
  id         uuid primary key default gen_random_uuid(),
  foretag_id uuid not null references foretag(id) on delete cascade,
  veckodag   int  not null check (veckodag between 1 and 7),
  oppnar     time not null,
  stanger    time not null,
  constraint stanger_efter_oppnar check (stanger > oppnar),
  constraint en_rad_per_dag unique (foretag_id, veckodag)
);

-- ------------------------------------------------------------
-- TABELL: blockerade_datum
-- Semester, röda dagar m.m. – hela dagen stängd.
-- ------------------------------------------------------------
create table if not exists blockerade_datum (
  id         uuid primary key default gen_random_uuid(),
  foretag_id uuid not null references foretag(id) on delete cascade,
  datum      date not null,
  anledning  text,
  constraint ett_block_per_dag unique (foretag_id, datum)
);

-- ------------------------------------------------------------
-- TABELL: bokningar
-- Slutkundernas bokningar. Inget konto krävs för att boka.
-- ------------------------------------------------------------
create table if not exists bokningar (
  id           uuid primary key default gen_random_uuid(),
  foretag_id   uuid not null references foretag(id) on delete cascade,
  tjanst_id    uuid not null references tjanster(id),
  kund_namn    text not null,
  kund_telefon text not null,
  kund_epost   text not null,
  starttid     timestamptz not null,
  sluttid      timestamptz not null,
  status       text not null default 'bekraftad'
               check (status in ('bekraftad', 'avbokad')),
  meddelande   text,
  skapad       timestamptz not null default now(),
  constraint slut_efter_start check (sluttid > starttid)
);

-- VIKTIGT: Detta gör dubbelbokning OMÖJLIG.
-- Databasen vägrar spara två bekräftade bokningar som överlappar
-- i tid hos samma företag – även om två kunder klickar samtidigt.
alter table bokningar
  add constraint inga_dubbelbokningar
  exclude using gist (
    foretag_id with =,
    tstzrange(starttid, sluttid) with &&
  ) where (status = 'bekraftad');

create index if not exists bokningar_foretag_tid_idx
  on bokningar (foretag_id, starttid);

-- ============================================================
-- SÄKERHET (Row Level Security)
-- Grundregel: alla får LÄSA företagsinfo/tjänster/öppettider
-- (det behövs för bokningssidan), men bokningar med kunduppgifter
-- får BARA företagets inloggade ägare se.
-- ============================================================

alter table foretag          enable row level security;
alter table tjanster         enable row level security;
alter table oppettider       enable row level security;
alter table blockerade_datum enable row level security;
alter table bokningar        enable row level security;

-- Företag: publik läsning, bara ägaren får ändra
create policy "publik_lasning" on foretag
  for select using (true);
create policy "agare_uppdaterar" on foretag
  for update using (agare_user_id = auth.uid())
  with check (agare_user_id = auth.uid());

-- Hjälpvillkor som återanvänds: "raden tillhör mitt företag"
-- (skrivs ut i varje policy eftersom policies inte kan dela kod)

-- Tjänster
create policy "publik_lasning" on tjanster
  for select using (true);
create policy "agare_hanterar" on tjanster
  for all using (
    exists (select 1 from foretag f
            where f.id = tjanster.foretag_id
              and f.agare_user_id = auth.uid())
  ) with check (
    exists (select 1 from foretag f
            where f.id = tjanster.foretag_id
              and f.agare_user_id = auth.uid())
  );

-- Öppettider
create policy "publik_lasning" on oppettider
  for select using (true);
create policy "agare_hanterar" on oppettider
  for all using (
    exists (select 1 from foretag f
            where f.id = oppettider.foretag_id
              and f.agare_user_id = auth.uid())
  ) with check (
    exists (select 1 from foretag f
            where f.id = oppettider.foretag_id
              and f.agare_user_id = auth.uid())
  );

-- Blockerade datum
create policy "publik_lasning" on blockerade_datum
  for select using (true);
create policy "agare_hanterar" on blockerade_datum
  for all using (
    exists (select 1 from foretag f
            where f.id = blockerade_datum.foretag_id
              and f.agare_user_id = auth.uid())
  ) with check (
    exists (select 1 from foretag f
            where f.id = blockerade_datum.foretag_id
              and f.agare_user_id = auth.uid())
  );

-- Bokningar: INGEN publik läsning (skyddar kunduppgifter).
-- Ägaren ser och avbokar sina egna. Nya bokningar skapas endast
-- via funktionen skapa_bokning nedan.
create policy "agare_laser" on bokningar
  for select using (
    exists (select 1 from foretag f
            where f.id = bokningar.foretag_id
              and f.agare_user_id = auth.uid())
  );
create policy "agare_uppdaterar" on bokningar
  for update using (
    exists (select 1 from foretag f
            where f.id = bokningar.foretag_id
              and f.agare_user_id = auth.uid())
  ) with check (
    exists (select 1 from foretag f
            where f.id = bokningar.foretag_id
              and f.agare_user_id = auth.uid())
  );

-- ============================================================
-- FUNKTION: lediga_tider
-- Räknar ut vilka tider som går att boka en viss dag, utifrån
-- öppettider, tjänstens längd och redan bokade tider.
-- Lämnar ALDRIG ut kunduppgifter – bara fria klockslag.
-- ============================================================
create or replace function lediga_tider(
  p_slug      text,
  p_tjanst_id uuid,
  p_datum     date
)
returns table (starttid timestamptz, sluttid timestamptz)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_foretag    foretag%rowtype;
  v_tjanst     tjanster%rowtype;
  v_oppnar     time;
  v_stanger    time;
  v_dag_start  timestamptz;
  v_dag_slut   timestamptz;
  v_slot_start timestamptz;
  v_slot_slut  timestamptz;
  v_steg       interval := interval '15 minutes'; -- tider visas i 15-minuterssteg
  v_idag       date;
begin
  select * into v_foretag from foretag
    where slug = p_slug and aktiv;
  if not found then return; end if;

  select * into v_tjanst from tjanster
    where id = p_tjanst_id and foretag_id = v_foretag.id and aktiv;
  if not found then return; end if;

  -- Stängd dag? (semester m.m.)
  if exists (select 1 from blockerade_datum b
             where b.foretag_id = v_foretag.id and b.datum = p_datum) then
    return;
  end if;

  -- Bokningsfönster: inte bakåt i tiden, inte för långt fram
  v_idag := (now() at time zone v_foretag.tidszon)::date;
  if p_datum < v_idag
     or p_datum > v_idag + v_foretag.bokningsfonster_dagar then
    return;
  end if;

  -- Öppettider för veckodagen (1 = måndag ... 7 = söndag)
  select o.oppnar, o.stanger into v_oppnar, v_stanger
    from oppettider o
   where o.foretag_id = v_foretag.id
     and o.veckodag = extract(isodow from p_datum);
  if not found then return; end if;

  v_dag_start := (p_datum + v_oppnar) at time zone v_foretag.tidszon;
  v_dag_slut  := (p_datum + v_stanger) at time zone v_foretag.tidszon;

  -- Gå igenom dagen i 15-minuterssteg och ta med varje tid där
  -- hela tjänsten får plats och ingen annan bokning ligger i vägen.
  v_slot_start := v_dag_start;
  while v_slot_start + make_interval(mins => v_tjanst.langd_minuter) <= v_dag_slut loop
    v_slot_slut := v_slot_start + make_interval(mins => v_tjanst.langd_minuter);

    if v_slot_start >= now() + make_interval(hours => v_foretag.min_frist_timmar)
       and not exists (
         select 1 from bokningar bk
          where bk.foretag_id = v_foretag.id
            and bk.status = 'bekraftad'
            and tstzrange(bk.starttid, bk.sluttid) && tstzrange(v_slot_start, v_slot_slut)
       )
    then
      starttid := v_slot_start;
      sluttid  := v_slot_slut;
      return next;
    end if;

    v_slot_start := v_slot_start + v_steg;
  end loop;
end;
$$;

-- ============================================================
-- FUNKTION: skapa_bokning
-- Enda vägen in för nya bokningar. Kontrollerar allt en gång
-- till på servern (öppettider, krockar, bokningsfönster) så att
-- ingen kan fuska via webbläsaren.
-- ============================================================
create or replace function skapa_bokning(
  p_slug         text,
  p_tjanst_id    uuid,
  p_starttid     timestamptz,
  p_kund_namn    text,
  p_kund_telefon text,
  p_kund_epost   text,
  p_meddelande   text default null
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_foretag foretag%rowtype;
  v_tjanst  tjanster%rowtype;
  v_datum   date;
  v_bokning bokningar%rowtype;
begin
  -- Enkla kontroller av kunduppgifterna
  if coalesce(trim(p_kund_namn), '') = '' then
    return json_build_object('ok', false, 'fel', 'Skriv ditt namn.');
  end if;
  if coalesce(trim(p_kund_telefon), '') = '' then
    return json_build_object('ok', false, 'fel', 'Skriv ditt telefonnummer.');
  end if;
  if p_kund_epost !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    return json_build_object('ok', false, 'fel', 'E-postadressen ser inte rätt ut.');
  end if;

  select * into v_foretag from foretag where slug = p_slug and aktiv;
  if not found then
    return json_build_object('ok', false, 'fel', 'Företaget hittades inte.');
  end if;

  select * into v_tjanst from tjanster
    where id = p_tjanst_id and foretag_id = v_foretag.id and aktiv;
  if not found then
    return json_build_object('ok', false, 'fel', 'Tjänsten hittades inte.');
  end if;

  v_datum := (p_starttid at time zone v_foretag.tidszon)::date;

  -- Är tiden fortfarande ledig? (samma regler som kunden såg)
  if not exists (
    select 1 from lediga_tider(p_slug, p_tjanst_id, v_datum) lt
     where lt.starttid = p_starttid
  ) then
    return json_build_object('ok', false,
      'fel', 'Tiden är tyvärr inte längre ledig. Välj en annan tid.');
  end if;

  begin
    insert into bokningar
      (foretag_id, tjanst_id, kund_namn, kund_telefon, kund_epost,
       starttid, sluttid, meddelande)
    values
      (v_foretag.id, v_tjanst.id, trim(p_kund_namn), trim(p_kund_telefon),
       lower(trim(p_kund_epost)), p_starttid,
       p_starttid + make_interval(mins => v_tjanst.langd_minuter),
       nullif(trim(p_meddelande), ''))
    returning * into v_bokning;
  exception
    -- Om två kunder bekräftar exakt samtidigt vinner den ena,
    -- och den andra får ett vänligt besked i stället för ett fel.
    when exclusion_violation then
      return json_build_object('ok', false,
        'fel', 'Oj! Någon hann precis boka den här tiden. Välj en annan tid.');
  end;

  return json_build_object(
    'ok', true,
    'bokning_id', v_bokning.id,
    'foretag_namn', v_foretag.namn,
    'tjanst_namn', v_tjanst.namn,
    'pris_kr', v_tjanst.pris_kr,
    'starttid', v_bokning.starttid,
    'sluttid', v_bokning.sluttid
  );
end;
$$;

-- Besökare (utan konto) får använda de två funktionerna – inget annat.
grant execute on function lediga_tider(text, uuid, date) to anon, authenticated;
grant execute on function skapa_bokning(text, uuid, timestamptz, text, text, text, text) to anon, authenticated;
