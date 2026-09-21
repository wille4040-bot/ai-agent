-- Schemalägg pre-arrival-funktionen dagligen (kör EN gång i Supabase SQL Editor).
-- Kräver tilläggen pg_cron och pg_net (aktiveras under Database → Extensions).
--
-- Ersätt platshållarna:
--   <PROJECT_REF>  – ditt Supabase-projekt-ref (t.ex. abcd1234)
--   <CRON_SECRET>  – samma värde som secreten CRON_SECRET på funktionen
--
-- Kör 08:00 UTC varje dag och anropar Edge Functionen via HTTP.

create extension if not exists pg_cron;
create extension if not exists pg_net;

select cron.schedule(
  'pre-arrival-daily',
  '0 8 * * *',
  $$
    select net.http_post(
      url     := 'https://<PROJECT_REF>.functions.supabase.co/pre-arrival',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-cron-secret', '<CRON_SECRET>'
      ),
      body    := '{}'::jsonb
    );
  $$
);

-- Avschemalägg vid behov:
--   select cron.unschedule('pre-arrival-daily');
