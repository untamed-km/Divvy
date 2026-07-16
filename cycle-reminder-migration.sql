-- Cycle-end push reminder — profile columns (run in Supabase SQL editor).
-- cycle_end_date:     the user's current pay-period end (synced from the app)
-- cycle_end_notified: last end date we already notified for (dedupe)

alter table public.profiles add column if not exists cycle_end_date date;
alter table public.profiles add column if not exists cycle_end_notified date;
