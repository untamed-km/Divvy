-- ═══════════════════════════════════════════════════════════════════════
-- DistroFi Stripe Integration — Supabase Migration
-- Run in Supabase SQL Editor. Safe to re-run.
-- ═══════════════════════════════════════════════════════════════════════

-- ── 1. Add Stripe columns to profiles ────────────────────────────────────────
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS stripe_customer_id     TEXT,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;

-- Index for fast webhook lookups by customer ID
CREATE INDEX IF NOT EXISTS profiles_stripe_customer_id_idx
  ON public.profiles (stripe_customer_id)
  WHERE stripe_customer_id IS NOT NULL;

-- ── 2. RLS: service role can update Stripe fields (webhook uses service key) ──
-- The service role key bypasses RLS by default — no extra policy needed.

-- ── 3. Payment past due flag ─────────────────────────────────────────────────
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS payment_past_due BOOLEAN NOT NULL DEFAULT FALSE;

-- ── 4. Verify ────────────────────────────────────────────────────────────────
-- SELECT username, pro_tier, stripe_customer_id, stripe_subscription_id, pro_since, cancelled_at, payment_past_due
-- FROM public.profiles LIMIT 5;
