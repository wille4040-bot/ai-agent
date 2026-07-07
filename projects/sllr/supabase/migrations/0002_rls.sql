-- Sllr – Row Level Security (Pass 1)
-- Aktivera RLS och lägg på policyer. Utan aktiv policy nekas all åtkomst,
-- så varje behörighet måste anges explicit.
--
-- Denna fil är skriven så att den är säker att köra om: varje policy tas bort
-- (om den finns) innan den skapas på nytt. Kör hela filen hur många gånger
-- som helst utan att få "policy already exists".

alter table profiles enable row level security;
alter table listings enable row level security;
alter table bookings enable row level security;
alter table reviews  enable row level security;

-- ---------------------------------------------------------------------------
-- profiles
--   Läsbara för alla (företagsnamn/ort visas på annonser), men bara ägaren
--   får skapa och redigera sin egen profil.
-- ---------------------------------------------------------------------------
drop policy if exists "profiles_select_alla" on profiles;
drop policy if exists "profiles_insert_egen" on profiles;
drop policy if exists "profiles_update_egen" on profiles;

create policy "profiles_select_alla"
  on profiles for select
  using (true);

create policy "profiles_insert_egen"
  on profiles for insert
  with check (auth.uid() = id);

create policy "profiles_update_egen"
  on profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- ---------------------------------------------------------------------------
-- listings
--   Alla får läsa aktiva annonser. Ägaren ser även sina inaktiva och är
--   ensam om att få skapa, ändra och ta bort sina egna annonser.
-- ---------------------------------------------------------------------------
drop policy if exists "listings_select_aktiva_eller_egna" on listings;
drop policy if exists "listings_insert_agare" on listings;
drop policy if exists "listings_update_agare" on listings;
drop policy if exists "listings_delete_agare" on listings;

create policy "listings_select_aktiva_eller_egna"
  on listings for select
  using (aktiv = true or agare_id = auth.uid());

create policy "listings_insert_agare"
  on listings for insert
  with check (agare_id = auth.uid());

create policy "listings_update_agare"
  on listings for update
  using (agare_id = auth.uid())
  with check (agare_id = auth.uid());

create policy "listings_delete_agare"
  on listings for delete
  using (agare_id = auth.uid());

-- ---------------------------------------------------------------------------
-- bookings
--   Bara inblandade parter ser en bokning: hyrestagaren själv, eller ägaren
--   till den uthyrda annonsen. Endast hyrestagaren skapar bokningen; båda
--   parter får uppdatera status (t.ex. bekräfta/avboka).
-- ---------------------------------------------------------------------------
drop policy if exists "bookings_select_parter" on bookings;
drop policy if exists "bookings_insert_hyrestagare" on bookings;
drop policy if exists "bookings_update_parter" on bookings;

create policy "bookings_select_parter"
  on bookings for select
  using (
    hyrestagare_id = auth.uid()
    or exists (
      select 1 from listings l
      where l.id = bookings.listing_id
        and l.agare_id = auth.uid()
    )
  );

create policy "bookings_insert_hyrestagare"
  on bookings for insert
  with check (hyrestagare_id = auth.uid());

create policy "bookings_update_parter"
  on bookings for update
  using (
    hyrestagare_id = auth.uid()
    or exists (
      select 1 from listings l
      where l.id = bookings.listing_id
        and l.agare_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- reviews
--   Recensioner är läsbara för alla. Bara en part i den kopplade bokningen
--   får skriva en recension.
-- ---------------------------------------------------------------------------
drop policy if exists "reviews_select_alla" on reviews;
drop policy if exists "reviews_insert_parter" on reviews;

create policy "reviews_select_alla"
  on reviews for select
  using (true);

create policy "reviews_insert_parter"
  on reviews for insert
  with check (
    exists (
      select 1 from bookings b
      where b.id = reviews.booking_id
        and (
          b.hyrestagare_id = auth.uid()
          or exists (
            select 1 from listings l
            where l.id = b.listing_id
              and l.agare_id = auth.uid()
          )
        )
    )
  );
