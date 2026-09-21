-- Markör för att pre-arrival-mejlet skickats (idempotens för den schemalagda jobbet).
alter table public.bookings
  add column if not exists pre_arrival_sent_at timestamptz;
