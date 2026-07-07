-- Sllr – Storage för annonsbilder (Pass 3)
-- Skapar en publik bucket och regler för uppladdning.
-- Säker att köra om (drop policy if exists + on conflict do nothing).

-- Publik bucket: filerna kan läsas av vem som helst via sin URL, vilket
-- behövs för att visa bilder på publika annonser.
insert into storage.buckets (id, name, public)
values ('listing-bilder', 'listing-bilder', true)
on conflict (id) do nothing;

-- Filer lagras i en mapp per användare: "<auth.uid()>/<filnamn>".
-- Det gör att policyn nedan kan låta varje företag hantera bara sina egna
-- bilder, samtidigt som alla får läsa dem.

drop policy if exists "listing_bilder_las" on storage.objects;
drop policy if exists "listing_bilder_ladda_upp" on storage.objects;
drop policy if exists "listing_bilder_uppdatera" on storage.objects;
drop policy if exists "listing_bilder_radera" on storage.objects;

create policy "listing_bilder_las"
  on storage.objects for select
  using (bucket_id = 'listing-bilder');

create policy "listing_bilder_ladda_upp"
  on storage.objects for insert
  with check (
    bucket_id = 'listing-bilder'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "listing_bilder_uppdatera"
  on storage.objects for update
  using (
    bucket_id = 'listing-bilder'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "listing_bilder_radera"
  on storage.objects for delete
  using (
    bucket_id = 'listing-bilder'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
