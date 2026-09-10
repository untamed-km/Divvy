# Make an Admin Login — Do This

*Follow top to bottom. Don't skip. Every step tells you what you should see before moving on.*

There are only **4 parts**. It takes about 5 minutes.

---

## Part 1 — Open Supabase

1. Go to **https://supabase.com** in your browser.
2. Click **Sign in** (top right) and log in.
3. You'll see a list of projects. Click the DistroFi one. (It's the project whose URL contains **`lvpslwmodbhenxcnaifk`** — that's the one the app uses.)

**You should now see:** a dashboard with a menu down the left side.

---

## Part 2 — Make the admin user

1. In the **left menu**, click **Authentication**.
2. At the top of the page, click the **Users** tab.
3. Find the green **Add user** button (top right). Click it.
4. A small menu drops down. Click **Create new user**.
5. A form pops up. Fill in exactly these three things:

   - **Email address:** type `kmadmin@distrofi.app`
   - **Password:** type `1spaoNeWSpKjhkdG2h+xOdE-rRgC`
   - **Auto Confirm User:** click the toggle so it is **ON**

   > ⚠️ **The Auto Confirm toggle is the most important part of this whole page.** If you leave it off, Supabase will wait for you to click a link in an email — and `distrofi.app` is a made-up email address with no inbox, so that email goes nowhere and the account never works.

6. Click **Create user**.

**You should now see:** a new row in the user list with the email `kmadmin@distrofi.app`.

**Write the password down** somewhere safe (password manager, not a sticky note). There is no "forgot password" for this account, because there's no real inbox to send a reset to. If you lose it, you come back to this screen and set a new one.

---

## Part 3 — Paste one block of code

1. In the **left menu**, click **SQL Editor**.
2. Click **New query** (or the **+** button).
3. You'll get a big empty text box. Copy **everything** in the grey box below and paste it in there.

```sql
-- ═══ DistroFi admin setup — safe to run more than once ═══

-- 1. Add the columns the admin dashboard needs
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_admin      BOOLEAN      NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS last_seen_at  TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS pro_since     TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS cancelled_at  TIMESTAMPTZ;

-- 2. Helper that checks "is the person asking an admin?"
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

-- 3. Let admins read every user's row (everyone else still sees only their own)
DROP POLICY IF EXISTS "admin_read_all_profiles" ON public.profiles;

CREATE POLICY "admin_read_all_profiles"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING ( public.is_admin() OR auth.uid() = id );

-- 4. Give the new admin user a profile, and turn its admin switch ON
INSERT INTO public.profiles (id, username, display_name, is_admin)
SELECT id, 'kmadmin', 'Admin', TRUE
FROM auth.users
WHERE email = 'kmadmin@distrofi.app'
ON CONFLICT (id) DO UPDATE
  SET username     = EXCLUDED.username,
      display_name = EXCLUDED.display_name,
      is_admin     = TRUE;

-- 5. Show me that it worked
SELECT p.username, p.is_admin, u.email, u.email_confirmed_at
FROM public.profiles p
JOIN auth.users u ON u.id = p.id
WHERE p.is_admin = TRUE;
```

4. Click the green **Run** button (bottom right, or press Ctrl+Enter).

**You should now see:** a small results table at the bottom with **exactly one row** that looks like this:

| username | is_admin | email | email_confirmed_at |
|---|---|---|---|
| kmadmin | true | kmadmin@distrofi.app | *(a date and time)* |

✅ All four things must be right: username is `kmadmin`, is_admin says **true**, and `email_confirmed_at` has **a date in it** (not empty).

If `email_confirmed_at` is empty, go back to Part 2 — the Auto Confirm toggle was off. Delete that user and redo Part 2 with the toggle on, then run this code again.

---

## Part 4 — Log in

1. Go to **https://distrofi.org/admin**
2. **Username:** `kmadmin`
3. **Password:** `1spaoNeWSpKjhkdG2h+xOdE-rRgC`
4. Click **Log in**.

**You should now see:** the admin dashboard with your user numbers and charts.

🎉 Done.

---

## If something goes wrong

**It says "Incorrect username or password."**
The username and email don't match up. Go back to Supabase → Authentication → Users and check the email is spelled exactly `kmadmin@distrofi.app` — no capital letters, no typos.

**It says "Access denied."**
Good news: your password worked. The admin switch just isn't on. Go back to Part 3 and run the code block again, and check that the results table shows `is_admin` = **true**.

**The dashboard loads but only shows 1 user (you).**
Part 3 didn't fully run. Run the whole block again from the top.

**The code block gives a red error mentioning a column name.**
Copy the exact error message and send it to me — it means the `profiles` table has a required field this setup didn't know about, and it's a one-line fix.

---

## Two notes for later

- The admin account will show up in your own dashboard as a user, so "Total users" will be **1 higher** than reality. Small two-line fix in the code whenever you want it.
- That password is now written in this file on your Desktop. That's fine for now, but if you ever share this file with anyone, change the password first (Supabase → Authentication → Users → click the user → Reset password).
