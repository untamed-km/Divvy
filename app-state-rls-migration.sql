-- app_state RLS — Phase 1 of the auth hardening plan (run in Supabase SQL editor).
--
-- Today anyone with the anon key can read/write ANY app_state row. This locks
-- each row to its owner, with read access for their active household partner
-- (required for partner sync realtime + initHousehold pull).
--
-- Works because DistroFi logins create real Supabase Auth sessions
-- (synthetic email + derived password), so auth.uid() is populated.
-- Guests have no session and no cloud rows — they lose nothing.
--
-- ⚠️ STEP 0 — list existing policies; DROP any permissive "allow all" ones
-- (policies OR together, so a leftover permissive policy defeats these):
--   select policyname, cmd, qual, with_check from pg_policies where tablename = 'app_state';
--
-- ⚠️ STEP 1 — test right after running: log in on the live app, edit a value,
-- confirm the sync dot goes green. If sync breaks, run the ROLLBACK below.

alter table public.app_state enable row level security;

drop policy if exists "app_state_select_own_or_household" on public.app_state;
drop policy if exists "app_state_insert_own" on public.app_state;
drop policy if exists "app_state_update_own" on public.app_state;
drop policy if exists "app_state_delete_own" on public.app_state;

-- Read: your own row, or a row belonging to your active household
create policy "app_state_select_own_or_household" on public.app_state
  for select using (
    user_id = auth.uid()
    or (
      household_id is not null
      and exists (
        select 1 from public.households h
        where h.id = app_state.household_id
          and h.status = 'active'
          and (h.user1_id = auth.uid() or h.user2_id = auth.uid())
      )
    )
  );

-- Write: only your own row
create policy "app_state_insert_own" on public.app_state
  for insert with check (user_id = auth.uid());

create policy "app_state_update_own" on public.app_state
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "app_state_delete_own" on public.app_state
  for delete using (user_id = auth.uid());

-- Realtime note: postgres_changes subscriptions respect RLS, so the partner
-- keeps receiving household updates via the select policy above. Ensure the
-- supabase_realtime publication includes app_state:
--   select * from pg_publication_tables where pubname = 'supabase_realtime';
--
-- Phase 2 (later): similar policies on `profiles` and `households`. Note that
-- once `households` gets RLS, the subquery above runs under it — the household
-- policy must allow members to select their own household row.
--
-- ROLLBACK (restores current permissive behavior):
--   alter table public.app_state disable row level security;
