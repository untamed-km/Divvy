# DistroFi — Standalone `/admin` Account Setup

*2026-09-10. Creates a dedicated admin console account, separate from your personal DistroFi budgeting account.*

---

## The good news: no code changes needed

`admin.html` already has a login wall, and — importantly — it passes your typed password **straight** to Supabase:

```js
await sb.auth.signInWithPassword({ email, password: pwd });
```

The main app does **not** do this. The app derives the password from your username and 4-digit PIN (`derivePassword()`), so app accounts can never have a strong password. The admin console has no such limit, which means a separate admin account with a long random password works today with zero changes to `admin.html`.

### How the login resolves your username to an email

```js
const { data: prof } = await sb.from('profiles').select('email').eq('username', username).maybeSingle();
const realEmail  = prof?.email && prof.email.includes('@') ? prof.email : null;
const synthEmail = username.replace(/[^a-z0-9]/g, '') + '@distrofi.app';
// tries realEmail first, then synthEmail
```

`profiles` has no `email` column (signup writes `recovery_email`), so that first lookup returns nothing and the **synthetic email always wins**. That gives us a simple rule:

> **The auth user's email must equal `<username-with-only-letters-and-digits>@distrofi.app`.**

Pick a username with no underscores so the two match obviously. This doc uses **`kmadmin`** → **`kmadmin@distrofi.app`**. Change both together if you want something else, and avoid `admin` itself — it's the first thing anyone would guess.

---

## Step 1 — Run the full migration

Supabase Dashboard → SQL Editor → paste the entire contents of `admin-migration.sql` → Run. It is idempotent, so run it top to bottom even if parts already ran. **Leave section 4 commented out** — we're replacing it with the separate account below.

This creates the `is_admin` / `last_seen_at` / `pro_since` / `cancelled_at` columns, the `public.is_admin()` SECURITY DEFINER helper, and the `admin_read_all_profiles` RLS policy. Without the helper and policy you'll get into the dashboard but see only one row.

## Step 2 — Create the auth user

Supabase Dashboard → **Authentication → Users → Add user → Create new user**.

| Field | Value |
|---|---|
| Email | `kmadmin@distrofi.app` |
| Password | a long random string (see below) |
| Auto Confirm User | **checked** |

Checking Auto Confirm matters: `distrofi.app` is a synthetic domain with no inbox, so an unconfirmed user can never verify.

Three freshly generated 28-character candidates. Use one, or your own from a password manager:

```
Cj!zw!9pgtLe&ijujkBL@h2A@cn^
1spaoNeWSpKjhkdG2h+xOdE-rRgC
1pa%R+0YP*NxFb&34PE@mk4STama
```

Store it in your password manager now. There is no reset path for this account — no real inbox means no password-reset email. If it's lost, you set a new one from the Dashboard.

## Step 3 — Give it a profile row with the admin flag

Creating a user in the Dashboard does **not** create a `profiles` row. DistroFi has no `handle_new_user` trigger; the app inserts that row client-side after signup, and we're bypassing the app. So insert it by hand.

SQL Editor:

```sql
-- Create the profile row for the admin auth user and flag it as admin.
INSERT INTO public.profiles (id, username, display_name, is_admin)
SELECT id, 'kmadmin', 'Admin', TRUE
FROM auth.users
WHERE email = 'kmadmin@distrofi.app'
ON CONFLICT (id) DO UPDATE
  SET username = EXCLUDED.username,
      display_name = EXCLUDED.display_name,
      is_admin = TRUE;
```

If that errors on a NOT NULL column this repo doesn't know about, the error names the column — add it to both the column list and the `SELECT`, then re-run.

## Step 4 — Verify before you try logging in

```sql
-- Should return exactly one row: the admin, confirmed, flagged.
SELECT p.username, p.is_admin, u.email, u.email_confirmed_at
FROM public.profiles p
JOIN auth.users u ON u.id = p.id
WHERE p.is_admin = TRUE;
```

You want one row, `is_admin = true`, and a non-null `email_confirmed_at`. Then go to **distrofi.org/admin** and log in with username `kmadmin` and the password from Step 2.

If you land on "access denied," the auth half worked and the flag half didn't — re-run Step 3. If you get "Incorrect username or password," the email doesn't match the synthetic form; confirm `auth.users.email` is exactly `kmadmin@distrofi.app`.

---

## One thing worth knowing before you ship this

Your **app** password scheme is weak, and this is unrelated to the admin console but shows up in the same code path:

```js
function derivePassword(username, pin) { return 'df_' + username.toLowerCase() + '_' + pin + '_2024'; }
```

The PIN is 4 digits. So every user's real Supabase password is a fully deterministic function of a public username and one of **10,000** values, and the anon key is in the page source. Anyone who can enumerate usernames can walk an account in a few thousand requests. Supabase's built-in auth rate limiting is the only thing slowing that down.

That's not something to fix today, and it doesn't affect the admin account we just built (which uses a real random password). But it belongs on the backlog above the cosmetic items, and it's a reason **not** to reuse the PIN scheme for anything privileged.

## Optional cleanup

The admin account will appear in the dashboard as a user, inflating "Total users" by one and showing up in the user list. The fix is a two-line change in `admin.html`: add `is_admin` to the `loadDashboard()` select and filter those rows out of `ALL_PROFILES`. Say the word and I'll do it with the usual stage → assert → `node --check` → commit recipe.
