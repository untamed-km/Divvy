-- Where DistroFi sign-ups came from. Paste into the Supabase SQL editor and run.
-- Read-only: these queries don't change anything.
-- Accounts created before the 2026-09-30 release have no source recorded.
-- Guests only appear here once they create an account.

-- 1) Latest sign-ups with their source
select
  u.created_at at time zone 'America/New_York'        as signed_up,
  u.raw_user_meta_data->>'username'                    as username,
  u.raw_user_meta_data->'signup_source'->>'source'     as source,     -- utm_source, 'referral', a referring site, or 'direct'
  u.raw_user_meta_data->'signup_source'->>'medium'     as medium,
  u.raw_user_meta_data->'signup_source'->>'campaign'   as campaign,
  u.raw_user_meta_data->'signup_source'->>'content'    as content,
  u.raw_user_meta_data->'signup_source'->>'cta'        as button,     -- which website button, e.g. hero-start, plan-pro, vs-top
  u.raw_user_meta_data->'signup_source'->>'referrer'   as referring_site,
  u.raw_user_meta_data->'signup_source'->>'first_source' as first_source
from auth.users u
order by u.created_at desc
limit 100;

-- 2) Sign-ups in the last 30 days by source and campaign
select
  coalesce(raw_user_meta_data->'signup_source'->>'source', '(not recorded)') as source,
  coalesce(raw_user_meta_data->'signup_source'->>'campaign', '')             as campaign,
  count(*) as signups
from auth.users
where created_at > now() - interval '30 days'
group by 1, 2
order by signups desc;

-- 3) Which website buttons lead to sign-ups (last 30 days)
select
  coalesce(raw_user_meta_data->'signup_source'->>'cta', '(no button)') as button,
  count(*) as signups
from auth.users
where created_at > now() - interval '30 days'
group by 1
order by signups desc;

-- Paid conversions: in Stripe, open a subscription and look under Metadata
-- (source, medium, campaign, cta, ...). The same fields are on the checkout session.
