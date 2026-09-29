-- ═══════════════════════════════════════════════════════════════════════
-- DistroFi Pay-Period Reminders — Supabase Migration (2026-09-29)
-- Run in Supabase SQL Editor BEFORE deploying the matching API changes.
-- Safe to re-run. Includes the earlier cycle-reminder columns in case
-- cycle-reminder-migration.sql was never run.
-- ═══════════════════════════════════════════════════════════════════════

-- The user's current pay-period end (synced from the app) + dedupe markers
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS cycle_end_date     DATE,
  ADD COLUMN IF NOT EXISTS cycle_end_notified DATE,   -- "period ended" push already sent for this end date
  ADD COLUMN IF NOT EXISTS cycle_end_warned   DATE;   -- "ends tomorrow" push already sent for this end date

-- Own on/off switch for pay-period reminders. Defaults ON: anyone who has
-- allowed notifications gets them until they switch them off.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS cycle_reminders BOOLEAN NOT NULL DEFAULT TRUE;

-- ── Verify ───────────────────────────────────────────────────────────────
-- SELECT username, bill_reminders, cycle_reminders, cycle_end_date,
--        cycle_end_warned, cycle_end_notified, push_endpoint IS NOT NULL AS has_push
-- FROM public.profiles WHERE push_endpoint IS NOT NULL LIMIT 20;
