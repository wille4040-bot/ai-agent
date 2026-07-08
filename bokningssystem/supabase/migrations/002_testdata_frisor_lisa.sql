-- ============================================================
-- TESTDATA – "Frisör Lisa" (Fas 1)
-- Körs i Supabase SQL Editor EFTER 001_grundschema.sql.
-- Skapar en testkund med tjänster och öppettider så att
-- bokningssidan har riktigt innehåll från dag ett.
-- ============================================================

-- Företaget
insert into foretag (slug, namn, epost, telefon, adress)
values (
  'frisor-lisa',
  'Frisör Lisa',
  'lisa@frisorlisa.se',
  '070-123 45 67',
  'Storgatan 1, 123 45 Exempelstad'
)
on conflict (slug) do nothing;

-- Tjänster
insert into tjanster (foretag_id, namn, beskrivning, langd_minuter, pris_kr)
select f.id, t.namn, t.beskrivning, t.langd, t.pris
from foretag f,
     (values
       ('Klippning',           'Tvätt, klippning och fön.',              45, 450.00),
       ('Klippning barn',      'För barn upp till 12 år.',               30, 320.00),
       ('Klipp & färg',        'Klippning samt färgning av hela håret.',120, 1595.00),
       ('Slingor',             'Folieslingor, inkl. fön.',               90, 1195.00),
       ('Fön & styling',       'Tvätt och styling inför fest.',          30, 350.00)
     ) as t(namn, beskrivning, langd, pris)
where f.slug = 'frisor-lisa'
  and not exists (
    select 1 from tjanster tj
    where tj.foretag_id = f.id and tj.namn = t.namn
  );

-- Öppettider (1 = måndag ... 7 = söndag; lördag kortare, söndag stängt)
insert into oppettider (foretag_id, veckodag, oppnar, stanger)
select f.id, o.veckodag, o.oppnar::time, o.stanger::time
from foretag f,
     (values
       (1, '09:00', '18:00'),
       (2, '09:00', '18:00'),
       (3, '09:00', '18:00'),
       (4, '09:00', '19:00'),
       (5, '09:00', '17:00'),
       (6, '10:00', '15:00')
     ) as o(veckodag, oppnar, stanger)
where f.slug = 'frisor-lisa'
on conflict (foretag_id, veckodag) do nothing;

-- ============================================================
-- KOPPLA DIN INLOGGNING TILL FÖRETAGET (görs sist!)
-- 1. Skapa först en användare i Supabase:
--    Authentication -> Users -> Add user (e-post + lösenord)
-- 2. Byt ut e-postadressen nedan mot den du valde
-- 3. Ta bort de två bindestrecken framför "update" och kör raden
-- ============================================================
-- update foretag set agare_user_id = (select id from auth.users where email = 'DIN-EPOST-HÄR') where slug = 'frisor-lisa';
