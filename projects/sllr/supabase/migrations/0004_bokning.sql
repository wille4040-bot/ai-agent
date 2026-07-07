-- Sllr – Bokningsspärr mot dubbelbokning (Pass 4)
-- Säker att köra om.

-- btree_gist behövs för att kunna kombinera likhet (listing_id) med
-- överlapp (daterange) i samma uteslutnings-villkor.
create extension if not exists btree_gist;

-- Uteslutningsvillkor: två aktiva bokningar för samma listing får inte ha
-- överlappande datumintervall. Detta gäller i databasen oavsett vem som
-- försöker boka, och är säkert även om två personer bokar samtidigt.
-- daterange(..., '[]') = båda datumen inklusive (en heldagsmodell).
alter table bookings drop constraint if exists bookings_ingen_overlapp;
alter table bookings add constraint bookings_ingen_overlapp
  exclude using gist (
    listing_id with =,
    daterange(datum_fran, datum_till, '[]') with &&
  )
  where (status in ('forfragan', 'bekraftad', 'pagaende'));

-- Funktion som returnerar de bokade (aktiva) perioderna för en annons.
-- Körs som "security definer" så att en tänkbar hyrestagare kan se VILKA
-- datum som är upptagna (för kalendern) utan att se vem som bokat eller
-- några andra detaljer.
create or replace function bokade_perioder(p_listing_id uuid)
  returns table (datum_fran date, datum_till date)
  language sql
  stable
  security definer
  set search_path = public
as $$
  select datum_fran, datum_till
  from bookings
  where listing_id = p_listing_id
    and status in ('forfragan', 'bekraftad', 'pagaende')
$$;

grant execute on function bokade_perioder(uuid) to anon, authenticated;
