-- ═══════════════════════════════════════════════════════════════════════
-- DistroFi Admin Analytics — Supabase Migration (v2)
-- Run in Supabase SQL Editor. Safe to re-run.
-- ═══════════════════════════════════════════════════════════════════════

-- ── 1. Admin flag + last_seen tracking on profiles ───────────────────────
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_admin   BOOLEAN   NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMPTZ;

-- Set yourself as admin (replace with your username):
--   UPDATE public.profiles SET is_admin = TRUE WHERE username = 'untamed';


-- ── 2. Admin stats (profiles only — no auth.users dependency) ────────────
CREATE OR REPLACE FUNCTION public.get_admin_stats()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

  SELECT json_build_object(
    'total_users',    (SELECT COUNT(*)::INT    FROM public.profiles),
    'active_30d',     (SELECT COUNT(*)::INT    FROM public.profiles
                       WHERE last_seen_at >= NOW() - INTERVAL '30 days'),
    'new_7d',         (SELECT COUNT(*)::INT    FROM public.profiles
                       WHERE created_at  >= NOW() - INTERVAL '7 days'),
    'new_30d',        (SELECT COUNT(*)::INT    FROM public.profiles
                       WHERE created_at  >= NOW() - INTERVAL '30 days'),
    'tier_free',      (SELECT COUNT(*)::INT    FROM public.profiles
                       WHERE pro_tier IS NULL OR pro_tier = 'free'),
    'tier_pro',       (SELECT COUNT(*)::INT    FROM public.profiles
                       WHERE pro_tier = 'pro'),
    'tier_couples',   (SELECT COUNT(*)::INT    FROM public.profiles
                       WHERE pro_tier = 'couples'),
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

GRANT EXECUTE ON FUNCTION public.get_admin_stats() TO authenticated;


-- ── 3. Signup trend (weekly / monthly) ───────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_signup_trend(period TEXT DEFAULT 'weekly')
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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
      FROM public.profiles
      WHERE created_at >= NOW() - INTERVAL '12 months'
      GROUP BY DATE_TRUNC('month', created_at)
    ) t;
  ELSE
    SELECT COALESCE(json_agg(row_to_json(t) ORDER BY t.period_start ASC), '[]'::JSON)
    INTO result
    FROM (
      SELECT
        TO_CHAR(DATE_TRUNC('week', created_at), 'Mon DD')    AS label,
        DATE_TRUNC('week', created_at)                        AS period_start,
        COUNT(*)::INT                                          AS count
      FROM public.profiles
      WHERE created_at >= NOW() - INTERVAL '12 weeks'
      GROUP BY DATE_TRUNC('week', created_at)
    ) t;
  END IF;

  RETURN COALESCE(result, '[]'::JSON);
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_signup_trend(TEXT) TO authenticated;


-- ── 4. Recent signups ─────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_recent_signups(lim INT DEFAULT 50)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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
      username,
      display_name,
      COALESCE(pro_tier, 'free') AS tier,
      created_at,
      last_seen_at
    FROM public.profiles
    ORDER BY created_at DESC
    LIMIT lim
  ) t;

  RETURN COALESCE(result, '[]'::JSON);
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_recent_signups(INT) TO authenticated;


-- ── 5. All current users (paginated) ─────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_all_users(
  page_num  INT  DEFAULT 1,
  page_size INT  DEFAULT 50
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result    JSON;
  total_cnt INT;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND is_admin = TRUE
  ) THEN
    RAISE EXCEPTION 'Access denied: admin only';
  END IF;

  SELECT COUNT(*)::INT INTO total_cnt FROM public.profiles;

  SELECT json_build_object(
    'total', total_cnt,
    'page',  page_num,
    'pages', CEIL(total_cnt::NUMERIC / page_size),
    'users', COALESCE((
      SELECT json_agg(row_to_json(t))
      FROM (
        SELECT
          username,
          display_name,
          COALESCE(pro_tier, 'free') AS tier,
          created_at,
          last_seen_at
        FROM public.profiles
        ORDER BY created_at DESC
        LIMIT page_size OFFSET (page_num - 1) * page_size
      ) t
    ), '[]'::JSON)
  ) INTO result;

  RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_all_users(INT, INT) TO authenticated;


-- ═══════════════════════════════════════════════════════════════════════
-- After running, set your admin flag:
--   UPDATE public.profiles SET is_admin = TRUE WHERE username = 'untamed';
-- ═══════════════════════════════════════════════════════════════════════
