-- ═══════════════════════════════════════════════════════════════════════
-- DistroFi Admin Analytics — Supabase Migration
-- Run this once in your Supabase SQL Editor (Dashboard → SQL Editor)
-- ═══════════════════════════════════════════════════════════════════════

-- ── 1. Add is_admin flag to profiles ────────────────────────────────────
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT FALSE;

-- After running, set yourself as admin:
--   UPDATE public.profiles SET is_admin = TRUE WHERE username = 'your_username';


-- ── 2. Admin stats RPC ───────────────────────────────────────────────────
-- Returns aggregate metrics. SECURITY DEFINER lets it read auth.users
-- while the internal check ensures only is_admin=true users get data.

CREATE OR REPLACE FUNCTION public.get_admin_stats()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  result JSON;
BEGIN
  -- Gate: reject non-admins immediately
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND is_admin = TRUE
  ) THEN
    RAISE EXCEPTION 'Access denied: admin only';
  END IF;

  SELECT json_build_object(
    -- Total registered users
    'total_users',   (SELECT COUNT(*)::INT FROM auth.users),

    -- Users who logged in within the last 30 days
    'active_30d',    (SELECT COUNT(*)::INT FROM auth.users
                      WHERE last_sign_in_at >= NOW() - INTERVAL '30 days'),

    -- Signups in last 7 days
    'new_7d',        (SELECT COUNT(*)::INT FROM auth.users
                      WHERE created_at >= NOW() - INTERVAL '7 days'),

    -- Signups in last 30 days
    'new_30d',       (SELECT COUNT(*)::INT FROM auth.users
                      WHERE created_at >= NOW() - INTERVAL '30 days'),

    -- Plan tier breakdown (from profiles)
    'tier_free',     (SELECT COUNT(*)::INT FROM public.profiles
                      WHERE pro_tier IS NULL OR pro_tier = 'free'),
    'tier_pro',      (SELECT COUNT(*)::INT FROM public.profiles
                      WHERE pro_tier = 'pro'),
    'tier_couples',  (SELECT COUNT(*)::INT FROM public.profiles
                      WHERE pro_tier = 'couples'),

    -- Conversion rate % (pro + couples / total)
    'conversion_pct', ROUND(
      CASE WHEN (SELECT COUNT(*) FROM public.profiles) = 0 THEN 0
      ELSE (
        (SELECT COUNT(*) FROM public.profiles WHERE pro_tier IN ('pro','couples'))::NUMERIC
        / (SELECT COUNT(*) FROM public.profiles)::NUMERIC * 100
      ) END, 1
    )
  ) INTO result;

  RETURN result;
END;
$$;

-- Grant execute to authenticated users (RLS is enforced inside the function)
GRANT EXECUTE ON FUNCTION public.get_admin_stats() TO authenticated;


-- ── 3. Signup trend RPC ──────────────────────────────────────────────────
-- Returns weekly or monthly signup counts for the last 12 periods.

CREATE OR REPLACE FUNCTION public.get_signup_trend(period TEXT DEFAULT 'weekly')
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  result JSON;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND is_admin = TRUE
  ) THEN
    RAISE EXCEPTION 'Access denied: admin only';
  END IF;

  IF period = 'monthly' THEN
    SELECT COALESCE(json_agg(row_to_json(t) ORDER BY t.period_start ASC), '[]'::JSON)
    INTO result
    FROM (
      SELECT
        TO_CHAR(DATE_TRUNC('month', created_at), 'Mon ''YY') AS label,
        DATE_TRUNC('month', created_at)                       AS period_start,
        COUNT(*)::INT                                          AS count
      FROM auth.users
      WHERE created_at >= NOW() - INTERVAL '12 months'
      GROUP BY DATE_TRUNC('month', created_at)
    ) t;
  ELSE
    -- Weekly (default): last 12 weeks
    SELECT COALESCE(json_agg(row_to_json(t) ORDER BY t.period_start ASC), '[]'::JSON)
    INTO result
    FROM (
      SELECT
        TO_CHAR(DATE_TRUNC('week', created_at), 'Mon DD')    AS label,
        DATE_TRUNC('week', created_at)                        AS period_start,
        COUNT(*)::INT                                          AS count
      FROM auth.users
      WHERE created_at >= NOW() - INTERVAL '12 weeks'
      GROUP BY DATE_TRUNC('week', created_at)
    ) t;
  END IF;

  RETURN COALESCE(result, '[]'::JSON);
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_signup_trend(TEXT) TO authenticated;


-- ── 4. Optional: recent signups list ────────────────────────────────────
-- Returns last 50 signups with username + tier (no PII like email).

CREATE OR REPLACE FUNCTION public.get_recent_signups(lim INT DEFAULT 50)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  result JSON;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND is_admin = TRUE
  ) THEN
    RAISE EXCEPTION 'Access denied: admin only';
  END IF;

  SELECT COALESCE(json_agg(row_to_json(t)), '[]'::JSON)
  INTO result
  FROM (
    SELECT
      p.username,
      p.display_name,
      COALESCE(p.pro_tier, 'free') AS tier,
      p.created_at
    FROM public.profiles p
    ORDER BY p.created_at DESC
    LIMIT lim
  ) t;

  RETURN COALESCE(result, '[]'::JSON);
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_recent_signups(INT) TO authenticated;


-- ═══════════════════════════════════════════════════════════════════════
-- SETUP CHECKLIST
-- 1. Run this entire file in Supabase SQL Editor
-- 2. Set your account as admin:
--      UPDATE public.profiles SET is_admin = TRUE WHERE username = 'your_username';
-- 3. Deploy admin.html (already in your project root)
-- 4. Visit distrofi.org/admin and log in with your admin account
-- ═══════════════════════════════════════════════════════════════════════
