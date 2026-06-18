-- ═══════════════════════════════════════════════════════════════════════
-- DistroFi Bill Reminders — Supabase Migration
-- Run in Supabase SQL Editor. Safe to re-run.
-- ═══════════════════════════════════════════════════════════════════════

-- ── 1. Push subscription columns ─────────────────────────────────────────────
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS push_endpoint    TEXT,
  ADD COLUMN IF NOT EXISTS push_p256dh      TEXT,
  ADD COLUMN IF NOT EXISTS push_auth        TEXT,
  ADD COLUMN IF NOT EXISTS bill_reminders   BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS bill_due_days    JSONB;

-- ── 2. Verify ────────────────────────────────────────────────────────────────
-- SELECT username, bill_reminders, bill_due_days, push_endpoint IS NOT NULL AS has_push
-- FROM public.profiles LIMIT 5;
