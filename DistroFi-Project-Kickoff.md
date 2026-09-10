# DistroFi — Project Context (evergreen)

*Canonical context for the DistroFi project. Anything that changes session to session lives in **DistroFi-Status-and-Backlog.md**, not here. Last reviewed 2026-09-10.*

---

## 1. What DistroFi is

DistroFi is a **paycheck-first personal budgeting PWA**. Instead of monthly budgets, users plan **one pay period at a time** — income, bills, spending, savings, investments, and debt for each paycheck. It is **manual by design: no bank linking**, which is a core privacy selling point. Live at **https://distrofi.org**. Internal repo codename is "Divvy."

**Philosophy to preserve in every change:** manual-only, no bank links, paycheck-first. Keep the tone friendly and educational, never "financial advice" (the AI feature is framed as a "Budget Assistant" with a visible disclaimer).

---

## 2. Tech stack & architecture

- **Frontend:** a single file, **`app.html`** (~7,000 lines, all HTML/CSS/JS inline, vanilla JS, no framework, Tabler Icons webfont + Nunito from CDN). This is where essentially all feature work happens. `index.html` is a small separate marketing/landing page; `admin.html` is a separate admin console.
- **Backend:** Vercel serverless/Edge functions in `/api/` (e.g. `advisor.js`, Stripe checkout/portal/webhook, push-subscription, bill-reminder cron).
- **Auth + DB:** Supabase (Postgres, Realtime, RLS). Tables: `profiles`, `app_state` (full budget JSON), `households`, `beta_codes`.
- **Payments:** Stripe (Checkout, Billing Portal, Webhooks). **Solo $2.99/mo, Couples $4.99/mo** — every shipped surface (app.html, index.html, admin.html, README) says $4.99; the old $5.99 figure appears only in stale session notes. Verify the Stripe price object once in the dashboard if quoting publicly.
- **Push:** Web Push (VAPID). **Service worker:** `sw.js`.
- **Admin console:** `admin.html`, served at `/admin` (rewrite in `vercel.json`). See §2a.
- **State:** `localStorage` key `distrofi_app` + Supabase `app_state` (debounced cloud sync).
- **Deploy:** GitHub (`untamed-km/Divvy`) → Vercel auto-deploy on push to main. **Kirk pushes manually from GitHub Desktop — Claude never pushes.**

### State model (localStorage `distrofi_app`)
```
STATE = {
  current: C,              // active pay period
  history: [ ...C ],       // archived past cycles
  savingsBuckets: [ {id,name,goal,saved,color,apy,institution,targetDate,interestEarned,kind,banner,createdAt} ],
  invGoals: [ {id,name,goal,saved,color,createdAt} ],
  partners: {p1,p2}, payFrequency: 'weekly|biweekly|semimonthly|monthly',
  payAnchor, k401Type: 'traditional|roth', pinnedSavingsId, syncMode, lastUpdated
}
C = {
  income:[{label,amount,owner,depositDate,recurring}],
  bills:[{id,name,amount,paid,dueDay,recurring,priority,category,frequency,linkedDebtId,sortOrder,essential?}],
  buckets:{ key:{label,icon,budget,baseBudget,rollover,transactions:[{amount,label,notes,date}],essential?} },
  debts:[{id,name,type,balance,originalBalance,apr,minPayment,creditLimit,essential?}],
  savings:{perPaycheck, extra:[{amount,label}]},
  investments:[{name,ticker,amount,recurring,goalId,account}],
  k401:{me,emp,recurring},
  startDate, endDate, debtExtraPayments, goalContrib
}
```
Key helpers: `billAmt(b)` returns the **monthly** amount (annual subscriptions ÷12); bills are monthly, buckets are per-pay-period. `remaining()` = income − bills − savings.perPaycheck − spent − invested − currentExtraSavings − debtExtraPayments − goalContrib. Savings goals fill **top-to-bottom (waterfall)**.

---

## 2a. Admin console access (`distrofi.org/admin`)

There is no separate admin account or password. You log in with your **normal DistroFi username and password**, and the console then checks one flag.

**How `admin.html` authenticates (lines ~380–430):**
1. `doLogin()` takes the username, lowercases it, looks up `profiles.email` for that username, and tries `signInWithPassword` against the real email first, then against a synthetic fallback `<username-stripped-of-non-alphanumerics>@distrofi.app`.
2. On success, `checkAdminAndLoad()` selects `username, display_name, is_admin` from `profiles` for `auth.uid()`.
3. **If `is_admin` is not `TRUE`, it shows the "access denied" screen** — same screen as if the profile row is missing entirely.

So "correct password but denied" means the flag is off, not that the login failed.

**The fix — run this once in the Supabase SQL Editor.** It is step 4 of `admin-migration.sql`, which ships commented out:

```sql
UPDATE public.profiles SET is_admin = TRUE WHERE username = 'untamed';
```

If the username differs, target the user id instead (Kirk's id appears in the poll-admin notes as `25be4a45-d04a-4f3b-a308-abd3d0c7ee55`):

```sql
UPDATE public.profiles SET is_admin = TRUE WHERE id = '25be4a45-d04a-4f3b-a308-abd3d0c7ee55';
SELECT id, username, email, is_admin FROM public.profiles WHERE is_admin = TRUE;
```

The rest of `admin-migration.sql` (the `is_admin()` SECURITY DEFINER helper and the `admin_read_all_profiles` RLS policy) must also have been run, or the dashboard will authenticate but show only your own row. The file is safe to re-run.

**Security note:** `admin.html` ships the Supabase **anon** key only (never the service role key), and gating is enforced by RLS via `public.is_admin()`. Related known gap: `polls` writes are gated client-side only, so RLS on that table is still worth adding.

---

## 3. HOW CLAUDE MUST EDIT `app.html` (critical)

`app.html` lives on Kirk's computer and is reached through the desktop bridge. **Never Edit/Write it directly through the mount** — the mount pads bytes and corrupts the file. Use this recipe every time:

1. `device_stage_files` the current `app.html` (note the returned `mtimeMs` and byte size).
2. Copy the staged file into the container and edit **there** with a Python script that does string replaces with **match-count assertions** (assert each anchor appears exactly N times) so edits can't land in the wrong place.
3. Validate: extract the main `<script>` block and run `node --check`; confirm the file still ends with `</html>`.
4. `SendUserFile` the edited file, then `device_commit_files` back to the same path with `expectedMtimeMs` set to the staged mtime (guards against overwriting Kirk's edits).
5. Re-grep on the device to confirm the change landed.

Other rules:
- **`check.js` is stale** — it validates `index.html` (now just the landing page), not `app.html`. Don't rely on it; hand-validate with `node --check` as above.
- **Log every code change to Notion** "DistroFi — App Changelog", page id `375005e2-bce7-8126-85b3-e7e6226ce731`, via `insert_content` at end. Recent entries are bold-titled paragraphs.
- Unit-test any non-trivial math in the container before shipping.
- Read-only inspection (grep, counting, reading) is fine directly on the device with `device_bash`. The stage/commit recipe is only for **writes** to repo files.

### Taking app screenshots (reusable capability)
`render.js` uses Playwright + Chromium to load `app.html` with a **seeded realistic demo STATE** in localStorage (bypasses login via a guest auth key + `distrofi_onboarded`), forces dark mode (`distrofi_theme='dark'` + `colorScheme:'dark'`), then navigates each screen and captures phone-sized PNGs. Reuse/adapt it for future marketing shots. Container Chromium lives under `/opt/pw-browsers/`.

---

## 4. File locations (on Kirk's computer)

Repo: `~/Desktop/AI Brain/DistroFi Budget App/DistroFi Local/Divvy/`
- `app.html` — the app · `index.html` — landing · `admin.html` — admin console
- `sw.js`, `/api/*`, `vercel.json`, `package.json`, `manifest.json`, `README.md`, `*-migration.sql`
- `/assets`, `/icons`, `/distrofi-logo`, `/landing-img`
- Dated planning docs and session bookmarks: `YYYY-MM-DD-*.md`

---

## 5. Brand basics

Navy/teal current identity (OG image refreshed). Legacy purple gradient still on the app icon. There's a **`distrofi-brand` skill** with logo files, exact colors, and fonts — use it for any logo/branding/marketing-visual work. Primary purple `#7c3aed`, accent `#6366f1`, green `#22c55e`, amber `#f59e0b`, red `#ef4444`. Couples tier uses pink/rose `#ec4899` → `#f43f5e`.

---

## 6. Working preferences

- Ask a few clarifying questions before big/ambiguous work; then proceed.
- Default deliverables to Markdown unless another format is clearly better.
- Kirk dislikes em dashes in copy he'll publish (reads as AI) — avoid them in drafts.
- Keep the Notion changelog current, and update **DistroFi-Status-and-Backlog.md** in this project at the end of each session.
