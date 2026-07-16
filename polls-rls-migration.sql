-- Poll write protection (run in Supabase SQL editor).
-- Context: POLL_ADMIN_IDS in the app only hides the admin UI — with permissive
-- RLS, anyone holding the anon key could write to `polls` via REST. This locks
-- writes to the admin account. Reads stay public (poll display uses anon key).
--
-- STEP 0 — check what policies already exist. If any permissive "allow all"
-- write policy is listed, DROP it (policies are OR'd together):
--   select policyname, cmd, qual, with_check from pg_policies where tablename = 'polls';

alter table public.polls enable row level security;

drop policy if exists "polls_select_all"  on public.polls;
drop policy if exists "polls_insert_admin" on public.polls;
drop policy if exists "polls_update_admin" on public.polls;
drop policy if exists "polls_delete_admin" on public.polls;

-- Everyone (incl. anon) can read polls
create policy "polls_select_all" on public.polls
  for select using (true);

-- Only the admin's authenticated session can write
create policy "polls_insert_admin" on public.polls
  for insert with check (auth.uid() = '25be4a45-d04a-4f3b-a308-abd3d0c7ee55'::uuid);

create policy "polls_update_admin" on public.polls
  for update using (auth.uid() = '25be4a45-d04a-4f3b-a308-abd3d0c7ee55'::uuid);

create policy "polls_delete_admin" on public.polls
  for delete using (auth.uid() = '25be4a45-d04a-4f3b-a308-abd3d0c7ee55'::uuid);

-- NOTE: poll_votes is intentionally left open for inserts (guest voting uses a
-- generated uid). Deduping relies on the unique (poll_id, user_id) constraint.
-- Verify it exists:
--   select conname from pg_constraint where conrelid = 'public.poll_votes'::regclass;
