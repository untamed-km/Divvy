# DistroFi — Project Memory

## What it is
DistroFi is a PWA (Progressive Web App) personal budgeting tool. Deployed at **distrofi.org** via Vercel. GitHub → Vercel auto-deploy. Single-file architecture: `index.html` (~6500+ lines, all JS/CSS/HTML inline) plus split JS files.

---

## Tech Stack
- **Frontend:** Single-file PWA (`index.html`), vanilla JS, Tabler Icons, no framework
- **Backend:** Vercel Edge/Node.js functions in `/api/`
- **Auth + DB:** Supabase (Postgres + Realtime + Row Level Security)
- **Payments:** Stripe (Checkout, Billing Portal, Webhooks)
- **Push notifications:** Web Push (VAPID)
- **Service Worker:** `sw.js` (v9) — cache-first static, network-first navigation, push handlers
- **State:** `localStorage` (`distrofi_app`) + Supabase `app_state` table (cloud sync)

---

## Key Files
| File | Purpose |
|------|---------|
| `index.html` | Main PWA (~6500+ lines) |
| `auth.js` | Supabase auth, login/signup, household sync |
| `sw.js` | Service worker (v9) |
| `api/advisor.js` | AI advisor (Edge, 30s) |
| `api/create-checkout-session.js` | Stripe checkout (Edge) |
| `api/create-portal-session.js` | Stripe billing portal (Edge) |
| `api/stripe-webhook.js` | Stripe webhook (Node, bodyParser:false) |
| `api/save-push-subscription.js` | Save push subscription to Supabase (Edge) |
| `api/send-bill-reminders.js` | Daily cron — send push notifications for upcoming bills |
| `vercel.json` | Function configs + daily cron (9am UTC) |
| `package.json` | `stripe ^16`, `web-push ^3.6.7` |
| `stripe-migration.sql` | Stripe columns on `profiles` |
| `bill-reminders-migration.sql` | Push notification columns on `profiles` |

---

## Supabase Tables
- `profiles` — user data, pro_tier, stripe_customer_id, stripe_subscription_id, payment_past_due, push_endpoint, push_p256dh, push_auth, bill_reminders, bill_due_days, last_seen_at
- `app_state` — user_id, household_id, state_json (full budget JSONB), updated_at
- `households` — id, user1_id, user2_id, invite_code, status ('pending'|'active'|'left')
- `beta_codes` — invite codes for beta access
- `shared_budgets` — (planned, not yet created — couples sync uses app_state instead)

---

## State Structure (localStorage `distrofi_app`)
```js
STATE = {
  current: C,          // active pay period
  history: [],         // past cycles
  savingsBuckets: [],
  invGoals: [],        // savings/investment goals [{name, goal, saved, color, createdAt}]
  partners: {p1:'', p2:''},
  payFrequency: 'biweekly',
  syncMode: 'full',    // 'full' | 'bills' (couples sync mode)
  lastUpdated: ISO string
}

C = STATE.current = {
  income: [{label, amount, owner, depositDate, recurring}],
  bills: [{name, amount, paid, dueDay, recurring, priority, category, frequency, linkedDebtId, paidBy, sortOrder}],
  buckets: {[key]: {label, icon, budget, transactions: [{amount, label, notes, date}]}},
  debts: [{id, name, type, balance, originalBalance, apr, minPayment, creditLimit}],
  savings: {perPaycheck},
  startDate, endDate,
  debtExtraPayments
}
```

---

## Auth & Pro
- Auth stored in `localStorage` as `distrofi_auth` via `getAuth()`/`setAuth()`
- `isPro()` → checks `getAuth()?.pro_tier` OR `getProData().active`
- `isCouplePro()` → `pro_tier === 'couples'`
- Price IDs: Solo monthly `price_1ThzDb0qsJiycjN9pJxs93hG`, Solo annual `price_1ThzJH0qsJiycjN9JJqAVf4P`, Couples monthly `price_1ThzGA0qsJiycjN9EypTBY26`, Couples annual `price_1ThzJv0qsJiycjN9yh7LEb8u`
- Pricing: Solo = $2.99/mo, Couples = $4.99/mo

---

## Vercel Env Vars (all set)
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `VAPID_PUBLIC_KEY` — set in Vercel (public key; safe to expose — it ships to browsers as the push applicationServerKey)
- `VAPID_PRIVATE_KEY` — set in Vercel env only. **Never commit the value.** (The old value was previously in this file and remains in git history — rotate the VAPID keypair; see note below.)

> **TODO:** Still need to run `bill-reminders-migration.sql` in Supabase SQL Editor.

---

## Features Built (as of 2026-06-18)
- [x] Full budget PWA (income, bills, spending buckets, debts, savings, investment goals)
- [x] Supabase auth (username + password, beta invite codes)
- [x] Cloud sync (app_state table, debounced push on every saveState)
- [x] Stripe Pro upgrade (Solo $2.99/mo, Couples $4.99/mo — hosted Checkout)
- [x] Stripe Billing Portal (manage subscription, cancel, update payment)
- [x] Stripe Webhook (activate Pro, handle payment failures, cancellation)
- [x] Payment past due banner (home screen, links to billing portal)
- [x] Bill reminders — in-app banner (upcoming bills due today or in 3 days)
- [x] Bill reminders — Web Push notifications (daily 9am UTC cron via Vercel)
- [x] Bill reminders — Settings toggle (enables/disables push subscription)
- [x] Data export — CSV (all sections: summary, income, bills, transactions, debts, goals)
- [x] Data export — PDF (print-ready styled HTML, auto-opens print dialog)
- [x] Couples sync — Supabase Realtime, invite code + share link, sync mode toggle (Everything vs Bills & spending)
- [x] AI Advisor (Anthropic API, Pro feature)
- [x] Spending trends, debt tracker, 401k tracker, marketplace
- [x] Dark/light mode, currency picker, pay frequency picker
- [x] PWA install (sw.js, manifest)

---

## Roadmap (remaining)
- [ ] **Landing page** — distrofi.org marketing page (hero, features, pricing, CTA) ← NEXT
- [ ] Referral system — share link → friend signs up → both get reward
- [ ] App Store — wrap PWA as native iOS/Android (PWABuilder or Capacitor)
- [ ] Live market data
- [ ] News feed

---

## Notion Changelog
Page ID: `375005e2-bce7-8126-85b3-e7e6226ce731`
Use `notion-update-page` with `insert_content` at `{"type":"end"}` after every code change.

---

## Brand
Current DistroFi identity — see the `distrofi-brand` skill for the full kit (logo files, usage rules, and the social/OG image generator).
- Navy `#18183A` — "Distro", headings, primary text, mono mark
- Teal `#0C9488` — "Fi", accents, CTAs, key numbers
- Cream `#EFF0EA` — brand off-white background · White `#FFFFFF`
- UI status colors: Red `#ef4444`, Green `#22c55e`, Amber `#f59e0b`
- Font: **Poppins Bold** for logo/headings; system-ui / Inter for body & UI
- Logo: purple→indigo circuit-tree mark + "DistroFi" wordmark (navy "Distro" + teal "Fi"). Use the brand-kit files — don't recreate or recolor the mark.
- Logo files: the `distrofi-brand` skill (`assets/logos/…`); in-repo copies in `assets/distrofi-logo/` and `distrofi-logo/`.
- OG / link-preview: `assets/og-image.png` (navy circuit-tree banner; regenerate with the brand kit's `build_social.py --preset og`).

> Note: the in-app UI still uses a purple/indigo accent gradient (`#7c3aed`→`#6366f1`) from the original Divvy build. The navy/teal system above is the canonical brand (logo, marketing, OG image); migrating the app UI accent is a separate, unscheduled task.

---

## Deployment
GitHub repo → Vercel auto-deploy on push to main.
Live at: https://distrofi.org
