-- ═══════════════════════════════════════════════════════════════════════
-- DistroFi Admin Analytics — Supabase Migration (v3)
-- Run in Supabase SQL Editor. Safe to re-run.
-- ═══════════════════════════════════════════════════════════════════════

-- ── 1. Columns ───────────────────────────────────────────────────────────
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_admin      BOOLEAN      NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS last_seen_at  TIMESTAMPTZ;


-- ── 2. is_admin() helper ─────────────────────────────────────────────────
-- SECURITY DEFINER means it runs as postgres (bypasses RLS on profiles),
-- so it can safely check the is_admin flag without circular policy issues.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND is_admin = TRUE
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, anon;


-- ── 3. RLS policy: admins can read all profiles ──────────────────────────
-- Drop if it already exists so re-running is safe.
DROP POLICY IF EXISTS "admin_read_all_profiles" ON public.profiles;

CREATE POLICY "admin_read_all_profiles"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING ( public.is_admin() OR auth.uid() = id );
-- Note: this adds to (OR) any existing policies — it doesn't replace them.


-- ── 4. Set yourself as admin ─────────────────────────────────────────────
-- UPDATE public.profiles SET is_admin = TRUE WHERE username = 'untamed';


-- ── 5. Revenue tracking ──────────────────────────────────────────────────
-- pro_since: timestamp when the user upgraded (never cleared on cancel,
-- so you retain upgrade history even if they downgrade later).
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS pro_since TIMESTAMPTZ;


-- ── 6. Verify it works ───────────────────────────────────────────────────
-- Run these as a quick sanity check after the above:
--   SELECT count(*) FROM public.profiles;
--   SELECT username, is_admin, last_seen_at, pro_tier, pro_since FROM public.profiles LIMIT 5;
