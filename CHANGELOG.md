# DistroFi — App Changelog

**Canonical copy:** this file, `CHANGELOG.md`, in the Divvy repo. It is git-tracked, so every
revision is recoverable, and new entries are appended to the bottom.
**Drive mirror:** a Google Doc copy lives in the `DistroFi` folder in My Drive, republished
whenever this file changes. The Doc is for reading and sharing; edits belong here.

Migrated from the Notion page "DistroFi — App Changelog" on 2026-09-10. Notion is no longer
updated. History below is complete and unedited apart from un-escaping `$` and removing Notion's
auto-links on bare filenames.

Entries run oldest to newest. The newest entry is always at the bottom.

---

## v36 — Baseline (2026-06-03)
**File:** `2026-06-03-divvy-app-v36.html`
Starting point for this build cycle. All features from v9–v20 already present:
- Partner finances (p1/p2 avatars, who-paid prompt)
- Bill priority flag (amber toggle + stripe)
- Savings waterfall with drag-to-reorder goals
- Investment growth chart
- Spending search
- Spending trends gating (Pro only)
- Pay frequency picker
- Onboarding overlay
- AI Advisor
---
## v37 — PIN Auth · Currency Picker · Bill Drag-Reorder (2026-06-03)
**File:** `2026-06-03-divvy-app-v37.html`
### #2 — Simplified auth
- Replaced email + password with **name + 4-digit PIN**
- Signup: name + PIN. Login: PIN only
- PIN stored in localStorage (`distrofi_auth`)
- On signup, name syncs to Partner 1
- Google Sign-In removed. "Continue as guest" retained
### #8 — Currency preset picker
- Added `CURRENCIES` array: USD, EUR, GBP, CAD, AUD, MXN, JPY, INR, BRL, CHF
- `fmt()` now uses selected currency's locale + symbol
- JPY shows no decimals
- Currency picker accessible via Settings
### Bill drag-to-reorder
- Bills get `sortOrder` on creation
- Sort order: paid → priority (high first) → sortOrder
- Grip handle on unpaid bill cards — touch drag to reorder
- Drag only reorders within same priority group
---
## v38 — Working base for paywall work (2026-06-04)
**File:** `2026-06-04-divvy-app-v38.html`
Intermediate copy used as base for paywall revamp.
---
## v39 — Paywall Revamp: B+C Tier Structure (2026-06-04)
**File:** `2026-06-04-divvy-app-v39.html`
### New tier structure
- **Free:** Unlimited everything core — buckets, bills, goals, history. No quantity limits
- **Pro Solo ($2.99/mo):** AI Advisor, Spending Trends, Investment Goals, Data Export, Custom Watchlist
- **Pro Couples ($5.99/mo):** Everything in Solo + partner sync (future), shared goals, combined net worth
### Implementation
- `isPro()` checks `distrofi_pro` localStorage key
- `isCouplePro()` checks tier === 'couples'
- `activatePro(tier)` accepts `'solo'` or `'couples'`
- `checkLimit()` always returns true — no quantity gates
- `startTrial(tier)` accepts tier parameter
- Paywall modal shows side-by-side Solo vs Couples cards
- Settings banner updated: free shows "Unlimited tracking", Pro shows tier name + price
- All `confirm()` dialogs updated with tier-aware copy
---
## v40 — Rebrand: Divvy → DistroFi (2026-06-04)
**File:** `2026-06-04-distrofi-v40.html`
- All UI text replaced: login screen, nav, onboarding, paywall, settings, feedback modal, marketplace
- All localStorage keys renamed: `distrofi_app`, `distrofi_pro`, `distrofi_auth`, `distrofi_watchlist`, etc.
- Export filename: `distrofi_backup.json`
- Title, meta tags, PWA app name all updated
- Logo images replaced with DistroFi PNG (full wordmark in all placements)
---
## v41 — DistroFi Logo Embedded (2026-06-04)
**File:** `2026-06-04-distrofi-v41.html`
- Exact DistroFi.png embedded as base64 in all 3 logo placements
- Auth screen large logo, auth icon, top bar icon all updated
---
## v42 — Icon-Only Crop for Small Placements (2026-06-04)
**File:** `2026-06-04-distrofi-v42.html`
- Auth screen (54px) and top bar (30px) now use cropped hexagon icon only
- Full wordmark retained for any large display use
- Crop: left square portion of the PNG (213×213px content area)
---
## v43 — Transparent Icon Background (2026-06-04)
**File:** `2026-06-04-distrofi-v43.html`
- Icon PNG had solid cream background (#f5f5ee) — removed via alpha mask
- Icon now sits cleanly against dark nav background
- 528k pixels made transparent
---
## v44 — Icon Centered Correctly (2026-06-04)
**File:** `2026-06-04-distrofi-v44.html`
- Previous crop captured hexagon + part of wordmark text — off-center
- Re-cropped to exact hexagon bounds (213×213px content)
- Added equal 30px padding on all sides for proper centering in container
---
## v45 — Auth Screen Branding Polish (2026-06-04)
**File:** `2026-06-04-distrofi-v45.html`
- "DistroFi" heading: Nunito 900, 30px, split color (Distro white / Fi teal #2dd4bf)
- "FINANCE TOGETHER" tagline: uppercase, letter-spaced, teal
- Nunito font loaded from Google Fonts
---
## v46 — Home Screen Branding Matches Auth (2026-06-04)
**File:** `2026-06-04-distrofi-v46.html`
- Home top bar "DistroFi": Nunito 900, 20px, split color
- "FINANCE TOGETHER" subtitle: uppercase teal, letter-spaced
---
## v47 — Polish Audit Fixes (2026-06-04)
**File:** `2026-06-04-distrofi-v47.html`
- **Toast system:** `alert()` replaced with pill toast sliding up from nav bar (`showToast()`)
- **PWA icon:** `apple-touch-icon` meta tag added with DistroFi hexagon icon
- **Theme color:** Updated from `#0f1117` → `#1b2e4c` (brand navy)
- **Marketplace copy:** Affiliate cards, disclaimer, and 3 "Coming soon" sections rewritten — confident and intentional, not placeholder-y
---
## v48–v52 — Members Page (unstable, superseded)
These versions had a doubled-HTML bug from a failed patch. Superseded by v53/v54.
---
## v53 — Finance Together Conditional Display (2026-06-04)
**File:** `2026-06-04-distrofi-v53.html`
- "Finance Together" on home screen hidden by default
- Only appears when a partner name is set in Settings → Finance together
- Auth screen tagline always visible (brand message)
- `renderHome()` updated to show/hide based on `getPartners().p2`
---
## v54 — Members Page (Stable) (2026-06-04)
**File:** `2026-06-04-distrofi-v54.html` ← **Current deployable version**
### Members page (replaces Marketplace)
- Top bar button: crown icon, "Members" label, purple dot for free users
- Screen heading: "Members"
**Free users** see an upgrade gate:
- Crown icon + "Members Only" heading
- Description of the Members area
- "What's inside" card with teal bullet points:
	- AI spending insights
	- Stock & crypto watchlist
	- Curated financial news
	- Money lessons & guides
	- Exclusive member deals
- "Unlock Members — from $2.99/mo" CTA button
- "See all plans" secondary link
**Pro Solo** members see:
- PRO SOLO badge
- AI Weekly Insight card (pulled from real spending data)
- Customisable stock + crypto watchlist
- Financial news feed
- Learn section
- Member deals
**Pro Couples** members additionally see:
- COUPLES badge
- Shared perks section (Partner sync roadmap card)
---
## Upcoming (Next Session)
- [ ] Supabase backend — replace localStorage PIN auth with real auth + data sync
- [ ] Stripe integration — wire $2.99 Solo and $5.99 Couples price IDs to `startTrial()`
- [ ] PWA manifest.json + service worker for full offline + homescreen support
- [ ] Live market data API ([Polygon.io](http://Polygon.io) or Yahoo Finance proxy)
- [ ] Onboarding personalisation — use selected preferences to pre-populate buckets/goals
- [ ] This changelog: update with each new version going forward
---
## v55 — Supabase Auth + State Sync (2026-06-05)
**File:** `2026-06-04-distrofi-v55.html` ← **Current deployable version**
### Supabase project
- URL: `https://lvpslwmodbhenxcnaifk.supabase.co`
- SDK loaded via CDN: `@supabase/supabase-js@2`
### Auth (Supabase-powered)
- Signup: username + display name + 4-digit PIN
- Username validated: min 3 chars, alphanumeric + underscores, uniqueness checked against `profiles` table
- Synthetic email pattern: `{username}@distrofi.app` (users never see this)
- Derived password: `df_{username}_{pin}_2024` (never exposed)
- Login: username + PIN → `signInWithPassword` against Supabase
- Session persistence: Supabase session auto-restores on app reopen — stays logged in across devices
- Offline fallback: if Supabase unreachable, validates against cached local PIN
- `checkAuthGate()` now async — checks Supabase session first, falls back to localStorage
### State sync
- `saveState()` now calls `scheduleSyncPush()` after every local save
- Debounced 800ms push to `app_state` table (prevents spam on rapid changes)
- On login from new device: pulls `app_state.state_json` from Supabase, merges into localStorage
- On session restore: same cloud pull happens automatically
- Sync status dot in home top bar: green (synced) · amber (syncing) · grey (offline) · red (error)
### Settings
- Log out row shows `@username` instead of display name
- Log out calls `sb.auth.signOut()` to clear Supabase session
### Required Supabase setup
Run in SQL Editor before first use:
```sql
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique not null,
  display_name text,
  created_at timestamptz default now()
);
create table app_state (
  user_id uuid references auth.users on delete cascade primary key,
  state_json jsonb not null default '{}',
  updated_at timestamptz default now()
);
alter table profiles enable row level security;
alter table app_state enable row level security;
create policy "Users can manage own profile" on profiles for all using (auth.uid() = id);
create policy "Users can manage own state" on app_state for all using (auth.uid() = user_id);
```
---
## Upcoming (Next Session)
- [ ] Stripe — wire $2.99 Solo and $5.99 Couples price IDs to `startTrial()`
- [ ] PWA manifest.json + service worker (offline support + Android homescreen)
- [ ] Live market data API for Members screen ([Polygon.io](http://Polygon.io) or Yahoo Finance)
- [ ] Onboarding personalisation — use preferences to pre-populate buckets/goals
- [ ] Couples sync — real-time shared state when both partners are logged in
---
## v56 — Signup Screen Polish + Terms of Service (2026-06-05)
**File:** `2026-06-04-distrofi-v56.html` ← **Current deployable version**
### Signup screen redesign
- Labelled field sections with uppercase headers (USERNAME, DISPLAY NAME, PIN)
- Helper text under username: "Letters, numbers & underscores only. Used to log in on new devices."
- Auto-focus on first field when switching between login and signup modes
### PIN input redesign
- Replaced single wide input with 4 individual PIN boxes (54×62px each)
- Accent border on focus, auto-advances on digit entry, backspace returns to previous box
- `pinBoxInput()`, `pinBoxKeydown()`, `clearPinBoxes()` functions handle all box logic
### Terms of Service
- ToS checkbox appears on signup only — hidden on login
- Signup blocked if checkbox not ticked
- "Terms of Service" link opens full modal with Mayer Ventures LLC ToS v1.1 (7 sections: scope, financial disclaimers, account security, third-party integrations, IP, termination, governing law — Florida)
- "Privacy Policy" link opens placeholder modal — ready to populate
---
## Upcoming
- [ ] Stripe — wire $2.99 Solo and $5.99 Couples price IDs to `startTrial()`
- [ ] PWA manifest.json + service worker (offline support + Android homescreen)
- [ ] Live market data API for Members screen
- [ ] Privacy Policy — add content to `openPrivacy()` modal
- [ ] Onboarding personalisation — use preferences to pre-populate buckets/goals
- [ ] Couples sync — real-time shared state when both partners are logged in
---
## v56 additions — Login Polish + Forgot Username + Speed Insights (2026-06-05)
*These changes were applied to the v56 file after the initial v56 entry above.*
### Login screen — @ prefix on username input
- Username field replaced with a styled row: `@` prefix + bare input, no label
- Tapping anywhere on the row focuses the input
- Accent border on focus, grey on blur
- Cleaner, more app-native feel
### Vercel Speed Insights
- Added `<script defer src="/_vercel/insights/script.js"></script>` to `<head>`
- Enable in Vercel dashboard → Project Settings → Speed Insights to activate
- No npm, no build step — zero-config for a single HTML file project
### Forgot username flow
- "Forgot your username?" link on login screen only (hidden on signup)
- Opens modal with recovery email input
- Calls Supabase RPC `get_username_by_recovery_email(lookup_email)` — security definer function, safe for unauthenticated use
- Shows `@username` on success, clear error if email not found
### Signup — Recovery email field
- Optional "Recovery email" field added after display name on signup
- Helper text: "Used only to recover your username if you forget it. Never shown publicly."
- Saved to `recovery_email` column in `profiles` table
### Required Supabase SQL (run before deploying)
```sql
alter table profiles add column if not exists recovery_email text;

create or replace function get_username_by_recovery_email(lookup_email text)
returns text language plpgsql security definer as $$
declare found_username text;
begin
  select username into found_username from profiles
  where lower(trim(recovery_email)) = lower(trim(lookup_email)) limit 1;
  return found_username;
end; $$;
```
---
## Upcoming
- [ ] Save as v57 and deploy
- [ ] Stripe — wire $2.99 Solo and $5.99 Couples price IDs to `startTrial()`
- [ ] PWA manifest.json + service worker (offline support + Android homescreen)
- [ ] Live market data API for Members screen
- [ ] Privacy Policy — add content to `openPrivacy()` modal
- [ ] Onboarding personalisation — use preferences to pre-populate buckets/goals
- [ ] Couples sync — real-time shared state when both partners are logged in
---
## v57 — Baseline for v58 fixes (2026-06-04)
**File:** `2026-06-04-distrofi-v57.html`
Minor delta from v56. Used as base for the v58 bug fix session.
---
## v58 — Auth Copy Removed · History Income Bug Fixed (2026-06-04)
**File:** `2026-06-04-distrofi-v58.html` ← **Current deployable version**
### Auth UX
- Removed stale footer line: "Demo sign-in for preview. Real accounts connect when the app goes online."
- Supabase auth has been live since v55 — this copy was misleading to real users
### Bug fix — History income display
- `renderHistory()` computed income using the old format: `week1 + week2 + extra`
- Current cycles store income as an array of line items (`[{amount, label}]`)
- Old history cycles showed $0 income as a result
- Fixed: income now computed with format detection — array format uses `.reduce()`, legacy format falls back to `week1 + week2 + extra`
- Note: `openCycleDetail()` already handled both formats correctly; only `renderHistory()` needed the fix
---
## v59 — Spend Empty State · Trial Awareness Toast (2026-06-04)
**File:** `2026-06-04-distrofi-v59.html` ← **Current deployable version**
### Spend screen empty state
- When no budget categories exist, the Spend screen was blank
- Now shows a centered empty state: wallet-off icon, "No spending categories yet" heading, helper copy, and an "Add budget" CTA button
- Tapping the button opens `openNewBucketModal()` directly
### Trial UX — awareness toast
- `gateFeature()` previously granted one silent trial use per feature with no user feedback
- Users would use a Pro feature once, then hit the paywall cold on the next attempt with no context
- Fixed: when a trial use is granted, a 3.5s toast now appears: "Free preview: \[Feature Name\] — upgrade to keep access"
- Feature names are human-readable (e.g. "AI Advisor", "Investment Goals", "Spending Trends")
- Applies to both standard Pro features and Couples-only features
---
## Upcoming
- [ ] Stripe — wire $2.99 Solo and $5.99 Couples price IDs to `startTrial()`
- [ ] PWA manifest.json + service worker (offline support + Android homescreen)
- [ ] Live market data API for Members screen
- [ ] Privacy Policy — add content to `openPrivacy()` modal
- [ ] Onboarding personalisation — use preferences to pre-populate buckets/goals
- [ ] Couples sync — real-time shared state when both partners are logged in
### Bug fix — 401k remaining calculation (added to v59)
- `remaining()` did not subtract 401k contributions at all — home screen overstated cash remaining
- `openCycleDetail()` subtracted `me + emp` (your contribution + employer match) — employer match is not your outgoing cash, so this understated remaining in history
- Fixed: `remaining()` now subtracts `C.k401?.me` only
- Fixed: `openCycleDetail()` now subtracts `k401me` only, not `k401me + k401emp`
### Additional fixes (also in v59)
- **Home delta — income format** — "vs last period" income delta used array-only income format; old history cycles showed wrong delta. Fixed with format detection.
- **What-if screen — income format** — same bug; per-cycle income in the What-if calculator also used array-only format. Fixed.
- **History savings — extra savings missing** — cycle cards in History only subtracted `perPaycheck` savings, not `perPaycheck + extra`. Remaining badge was overstated. Fixed.
- **Empty bucket name** — saving a category with no name was silently rejected. Now shows a toast: "Please enter a category name."
- **401k in cycle detail** — `rem` in history cycle detail previously subtracted 401k (wrongly). Since income entered is take-home pay (post-401k), it's now excluded from `rem`. 401k (you / employer / total) is shown as its own stat card when contributions exist.
- **Marketplace flash** — `members-gate` now renders as `display:flex` by default so free users see the gate on first paint, before JS runs.
### Additional fixes (also in v59)
- **Finance Together banner** — defaulted to visible because `p2` was initialized as `'Partner'` (truthy). Changed default `p2` to `''` across `loadState()` and `getPartners()`. Banner now hidden until user adds a partner name in Settings → Finance together.
- **Currency picker broken** — Settings row called `openCurrencyPicker();closeModal();` which immediately wiped the picker modal after opening it. Removed the erroneous `closeModal()` call — picker now opens correctly.
### Additional bug fixes (also in v59)
- **"New pay period" from Settings broken** — Settings row called `startNewCycle();closeModal();` which immediately wiped the confirmation modal. Fixed by reversing to `closeModal();startNewCycle();`.
- **Snapshot remaining inconsistent** — Snapshot screen duplicated the `remaining()` formula manually but was missing extra savings, causing it to overstate remaining vs every other screen. Fixed to call `remaining()` directly.
### Additional fixes (also in v59)
- **Recurring income** — each income line now has a "Carry to next period" toggle (on by default, matching bill/investment behavior). Recurring lines carry forward to new cycles with amount intact; deposit date is cleared since it's a new period.
- **Snapshot bills inconsistency** — Snapshot showed gross bills (including paid), while home screen showed net unpaid bills. Fixed to use `totalBills() - paidBillsAmt()` for consistency.
### Additional fix (also in v59)
- **Spend tab donut — text clipping on mobile** — 160×160 SVG + 16px gap left insufficient room for the legend on narrow phones. Reduced donut render size to 130×130 (viewBox unchanged so chart quality stays), tightened gap to 10px, and added `text-overflow:ellipsis` to legend labels so long category names truncate cleanly instead of overflowing the card edge.
---
## v60 — GitHub release (2026-06-04)
**File:** `2026-06-04-distrofi-v60.html` ← **Current deployable version**
Renamed from v59 for GitHub commit. Contains all fixes from this session — see v58 and v59 entries above for full change list.
### Bug fix (v60)
- **Net worth banner missing on Summary screen** — when the snapshot `rem` formula was refactored, `extraSavingsAmt` was removed from the local variables but a stale reference remained in the snapshot table rows array. This caused a JS error that stopped `renderSnapshot()` before it reached the net worth banner. Fixed by removing the stale `+extraSavingsAmt` (extra savings is already included in the `savings` variable).
### Bug fix (v60)
- **Savings icon missing on Invest tab** — `ti-piggy-bank` is not a valid Tabler icon class. Replaced all 6 occurrences with `ti-pig-money` which is confirmed valid in this icon set.
---
## v61 — GitHub release (2026-06-04)
**File:** `2026-06-04-distrofi-v61.html` ← **Current deployable version**
Renamed from v60 for GitHub commit. Contains all fixes from this session — see v58–v60 entries above for full change list.
---
## v62 — Real Partner Sync (2026-06-06)
**File:** `2026-06-04-distrofi-v62.html` ← **Current deployable version**
### Feature: Real two-account partner sync (Couples Pro)
Both partners share one live budget using Supabase Realtime. Changes either partner makes appear instantly on the other's screen.
**How it works:**
- A `households` table links two Supabase user IDs with an invite code
- `app_state` now carries a `household_id` — both partners read/write the same record
- Supabase Realtime subscription fires on every `app_state` update — incoming state is merged and the UI re-renders with a toast: "Partner updated the budget"
**Invite flow:**
1. User A: Settings → Finance together → "Invite my partner" → 6-char code generated
2. Code displayed large with tap-to-copy
3. User B: Settings → Finance together → "Enter invite code" → links to same household
4. On join: prompted to add display names → budget syncs immediately
**Unlink:**
- Settings → Finance together → Unlink → confirmation modal → household marked `left`, Realtime unsubscribed, partner name cleared
**Settings row:**
- Shows "⬤ Kirk & Partner · Live sync" (green dot) when household is active
- Shows "Tap to connect with partner" when solo
- Gated behind Couples Pro — free/Solo users see paywall
**New functions:** `resolveHousehold`, `createInviteCode`, `acceptInviteCode`, `leaveHousehold`, `subscribeRealtime`, `initHousehold`, `openInviteFlow`, `openJoinFlow`, `submitJoinCode`, `confirmLeaveHousehold`
**Required Supabase SQL (already run):**
```sql
create table households (id uuid primary key default gen_random_uuid(), user1_id uuid references auth.users on delete cascade, user2_id uuid references auth.users on delete cascade, invite_code text unique, status text default 'pending', created_at timestamptz default now());
alter table app_state add column if not exists household_id uuid references households;
```
---
## v63 — Stronger Signup for Bank Integration (2026-06-06)
**File:** `2026-06-04-distrofi-v63.html` ← **Current deployable version**
### Signup form upgrades
- **Email (required)** — collected at signup, used as Supabase auth email. Validated before submission. Stored in `profiles.email`. Existing synthetic email (`{username}@distrofi.app`) used as fallback for users without a real email.
- **Phone (optional)** — stored in `profiles.phone`. Helper text: "Required for SMS verification when bank features launch."
- **Legal name (optional)** — stored in `profiles.legal_name`. Helper text: "Required for identity verification when bank connections are added."
- **Recovery email (if different)** — retained from v56, now labeled clearly as a backup
### Trust statement
- Shown on signup screen only (hidden on login)
- Lock icon + copy: "Your financial data is encrypted and never sold. We use bank-level security to keep your information private and confidential."
### Required Supabase SQL (already run)
```sql
alter table profiles add column if not exists email text;
alter table profiles add column if not exists phone text;
alter table profiles add column if not exists legal_name text;
```
### Pricing update (v63)
- **Couples plan reduced from $5.99 → $4.99/mo** — $5.99 was 2× Solo with no incentive to upgrade together. $4.99 saves couples $1/mo vs two Solo subscriptions. Updated across all 7 UI references (paywall modal, settings banner, trial confirmation, upgrade buttons).
### Feature: Onboarding tutorial (v63)
- 6-slide walkthrough shown to new users after the preference picker
- Slides: How pay periods work → Income → Bills → Spending buckets → Savings & Investments → Ready to go
- Each slide has a large icon, title, and plain-English explanation
- Dot indicators show progress; Back/Next/Skip navigation
- Stored in `distrofi_tutorial_done` localStorage key — shown once per device
- Existing users who've already onboarded won't see it
### Tutorial slide 1 copy updated (v63)
- Changed title from "Budget by pay period" → "Know where you stand after every paycheck"
- Reframed body to sell the benefit vs. monthly apps rather than explaining the technical model
### Feature: Quick setup after tutorial (v63)
- 2-step setup screen shown after the tutorial for new users
- **Step 1** — "What's your take-home pay?" — amount input + pay frequency selector. Saves income line and frequency on Next.
- **Step 2** — "Any regular bills?" — type custom bills or tap common bill chips (Rent, Netflix, Gym, etc.). Bills added to current cycle on completion.
- Skip available at every step. "Skip setup" exits immediately; "Skip" on step 2 saves income and skips bills.
- On close: toast confirmation "Budget set up — you're ready to go!"
- Stored in `distrofi_setup_done` localStorage — shown once per device
### Polish audit fixes (v63)
- **Cancel plan confirm()** — replaced native `confirm()` dialog with a proper modal (`confirmCancelPlan`) with "Keep plan" / "Yes, cancel" options
- **Privacy Policy** — replaced "coming soon" stub with real content: data collection, usage, storage/security, retention, and contact info ([support@distrofi.org](mailto:support@distrofi.org)). Effective June 2025, Mayer Ventures LLC.
- **Bills empty state copy** — changed "tap + to add one" (misleading — no visible + in top bar) to "tap 'Add bill' below to get started"
- **Capitalisation consistency** — "no investments logged yet" → "No investments logged yet"
- **History empty state** — added `ti-clock` icon above the empty state text, matching all other empty states in the app
- **TBD on bill cards** — bills with $0 amount now show "–" instead of "TBD"
### Feature: Leftover balance prompt on new cycle (v63)
When starting a new pay period with a positive remaining balance, a prompt appears asking what to do with the leftover:
- **Move to savings** — adds the amount as an extra savings entry labeled "Carried over from last period"
- **Roll into next period** — adds it as a non-recurring income line labeled "Carried over from last period"
- **Leave it** — archives with the old cycle, starts fresh
If remaining is $0 or negative, the original simple confirmation modal is shown instead.
---
## Tier Roadmap (2026-06-06)
### Free — always free
**Now:** Unlimited buckets/bills/goals, last 2 pay cycles, savings & 401k tracking, pay cycle management, 10 currency presets
**Coming:** Basic spending chart (current period only), bill due reminders (push notifications), PWA install + offline
### Pro Solo — $2.99/mo
**Now:** AI Advisor (Claude), spending trends, investment goal tracking, data export (JSON), market watchlist, full cycle history
**Coming:** Proactive AI insights (flags anomalies weekly), PDF monthly report, CSV export, bank integration (auto-import), AI-suggested budgets
### Pro Couples — $4.99/mo
**Now:** Real-time partner sync, invite code linking, per-person income tagging, who-paid bill tracking, everything in Pro Solo
**Coming:** Combined net worth view, shared savings goals, bill splitting (auto-split by % or amount), per-person spending report, in-app budget comments
### Strategy notes
- Free goal: wide top of funnel — give away a lot, convert on stickiness
- Primary upgrade driver: AI-powered insights (proactive, pattern-based)
- Bank integration is the biggest long-term value add for Pro Solo
- Couples tier differentiation: bill splitting + shared goals + per-person reports = no solo app can match
### Members area rebuild (v63)
**Hub layout — top to bottom:**
- **Tier badge + greeting** — "Welcome back, \[name\] · PRO/COUPLES" badge
- **Your numbers** — 4 live stat chips: Remaining, Saved, Top spend category, Days left in cycle
- **AI Insights** — Multi-signal feed: over/under budget alert, unpaid bills warning, savings encouragement, net worth milestone. Replaces single static tip.
- **Markets** — Stocks + crypto watchlist (unchanged)
- **Financial news** — 5 real curated headlines with summaries, sources, and external links. Tapping opens article in browser.
- **Learn** — 4 in-app articles with real content (50/30/20, compound interest, emergency funds, index funds) + DistroFi tip + "Read more" link out to Investopedia/NerdWallet
- **Couples section** — Shows live sync status (green dot + partner names + income split) instead of "Coming soon". Includes "Link partner" CTA if not yet connected.
- **Deals** — Removed entirely until real partnerships exist
### Bug fix (v63)
- **Duplicate ****`renderNextBillBanner`** — function was defined twice (lines 4029 and 4115). The second copy was a stale version. Removed the duplicate — no behavior change, eliminates the JS ambiguity.
### Bug fix (v63)
- **JS syntax error — unescaped apostrophes** — The MKT_NEWS and MKT_LEARN data strings contained contractions (Here's, They're, DistroFi's, It's, you're, what's) inside single-quoted JS string literals, causing a syntax error that broke all interactivity. Fixed by escaping all apostrophes with `\'`.
### Members gate redesign (v63)
- Replaced single generic CTA with two side-by-side tier cards: Pro Solo ($2.99) and Pro Couples ($4.99)
- Solo card: feature-specific bullets (AI spending patterns, spending trends, unlimited history, live markets)
- Couples card: relationship-angle bullets (budget together in real time, who paid what, combined net worth) + "BEST VALUE" badge
- Each card has its own "Start free trial" CTA wired to `startTrial('solo'/'couples')`
- Trust line at bottom: "7-day free trial · Cancel anytime · No card required to try"
- Removed generic "See all plans" link
- Updated header copy to sell the value: "Unlock your Members area"
### Members area — hub navigation (v63)
- Members area now uses a hub → sub-view pattern instead of one long scroll
- Hub shows 3 clickable nav cards: **Markets** (stocks + crypto preview), **Financial News** (latest headline preview), **Learn** (lesson count)
- Each card taps into a dedicated sub-view with a back button returning to hub
- AI Insights, stats chips, and couples section remain on the hub
- `showMembersView(view)` and `showMembersHub()` handle navigation
### Members area polish (v63)
- **News timestamps removed** — "Today/Yesterday/2 days ago" labels were hardcoded and would go stale. Replaced with source name only (Reuters, CNBC, etc.)
- **Markets disclaimer** — Added "Prices are indicative — live data coming soon" note in the Markets sub-view so users know the data isn't live
- **AI Insights collapsed on hub** — Top signal shown as a one-line preview; "+N more insights — tap to expand" reveals the rest. Chevron rotates on expand. Keeps the hub clean without hiding value.
- **Lessons read tracking** — Read lessons stored in `distrofi_lessons_read` localStorage key. Read cards show a grey checkmark icon and "Read" label. Hub Learn card shows unread count badge (purple circle) or "All caught up" when finished.
### DistroFi Shop added to Members area (v63)
- New "DistroFi Shop" hub card (amber, "NEW" badge) navigates to a Shop sub-view
- 3 products: Budget Master Template ($9), Financial Planning Worksheet Pack ($14 bundle), Pro Export Add-on ($7 — coming soon)
- Each product card: icon, title, sub-label, description, price, and CTA button
- Available products link out to `distrofi.org` (placeholder — swap in Gumroad/Stripe URLs when ready)
- "Coming soon" products show a toast instead of navigating
- Disclaimer: "Digital products — one-time purchase, instant access"
- Visible to all Pro users (Solo and Couples)
### Member Deals added to Members area (v63)
- New "Member Deals" hub card (pink, "4 deals" badge) navigates to a Deals sub-view
- 4 affiliate deal cards: High-Yield Savings (up to 4.5% APY), Commission-Free Investing ($0 commissions), Credit Score Monitoring (free), Cash-Back Credit Cards (up to 5% back)
- Each card: icon, badge, title, description, and colored CTA button linking out to curated partner sites
- Affiliate disclaimer shown at top of Deals sub-view: "DistroFi may earn a referral fee..."
- All links are placeholders — swap in real affiliate URLs when partnerships are confirmed
- Visible to all Pro users (Solo and Couples)
---
## 📌 Bookmarked — DistroFi Merch (build later)
Add a Merch section inside the Shop sub-view in the Members area.
**Product ideas:** "Debt Free" / "Saving Season" tee/hoodie, Pay Period Budget notebook, mug ("Funded"), DistroFi logo phone case
**Platform options:** Printful + Etsy (easiest), Shopify (most control), Spring/Teespring (simplest)
**Implementation:** Sub-section inside the existing Shop sub-view — not a separate hub card. Don't add until real products + real link exist (no "Coming soon" in a paid area).
### Expanded Net Worth card in Members hub (v63)
- Net worth banner kept on Summary tab for all users (unchanged)
- New expanded net worth card added to Members hub for Pro users
- Shows: total net worth (large), "Growing" badge if trend is up, cycle-by-cycle area trend chart, colour-coded breakdown bar (savings green / 401k blue / invested purple), and per-category totals
- Sits between AI Insights and the Couples section on the hub
- Free users don't see it (Members is Pro-gated) — acts as an upgrade incentive without punishing free users from their own data on Summary
### Learn section — 8 full lessons added (v63)
Replaced 4 placeholder lessons with 8 real, written financial education lessons:
1. What Is Financial Independence
2. Investing 101 for Beginners
3. The 50/30/20 Budget Rule
4. How Compound Interest Works
5. Pay Off Debt Faster: Two Methods (avalanche vs. snowball)
6. Build a Solid Emergency Fund
7. Roth IRA vs. Traditional IRA
8. How to Read Your Pay Stub
Each lesson has a body (3-4 sentences), a DistroFi-specific tip, and a real external link to Investopedia or NerdWallet.
### Real affiliate link added — SoFi (v63)
- Replaced placeholder High-Yield Savings card with a real SoFi Checking & Savings affiliate deal
- Offer: $25 for opening + $50 or $400 with eligible direct deposit of $1,000+. Terms apply.
- Affiliate URL: [https://www.sofi.com/invite/money?gcp=616e05e1-1b98-4338-ac5b-94087c6e5b22&isAliasGcp=false](https://www.sofi.com/invite/money?gcp=616e05e1-1b98-4338-ac5b-94087c6e5b22&isAliasGcp=false)
### Real affiliate link added — Upside (v63)
- Replaced placeholder Cash-Back Credit Cards card with real Upside deal
- Offer: 15¢/gal extra cash back on first gas fill-up, 10% extra on first restaurant or grocery purchase. Code: BPXYR
- Affiliate URL: [https://upside.app.link/BPXYR](https://upside.app.link/BPXYR)
### Real affiliate link added — Webull (v63)
- Replaced placeholder Commission-Free Investing card with Webull
- Affiliate URL: [https://www.webull.com/s/FCxusQlAfSgei9eqR6](https://www.webull.com/s/FCxusQlAfSgei9eqR6)
### Real affiliate link added — Coinbase (v63)
- Replaced Credit Karma placeholder with Coinbase crypto referral
- Offer: Both user and referrer get $20 in Bitcoin after buying/selling $100+
- Affiliate URL: [https://coinbase.com/join/5L4L4EC?src=android-share](https://coinbase.com/join/5L4L4EC?src=android-share)
- All 4 Member Deals are now real affiliate links: SoFi, Upside, Webull, Coinbase
### Live market data integration (v63)
- **Finnhub** (API key secured) — real-time stock quotes and 7-day candle spark lines for all watchlisted stocks
- **CoinGecko** (no key required) — real-time crypto prices and 24hr % change
- Data fetched when user opens the Markets sub-view, cached in `sessionStorage` for 60 seconds
- Loading spinner shown while fetching; graceful fallback to static data on error with "Prices may be delayed" note
- `fetchLiveMarketData()` → `applyMarketData()` → `renderMarketsWithData()` pipeline
- CoinGecko ID map covers: BTC, ETH, SOL, XRP, ADA, DOGE, AVAX, LINK, MATIC, DOT
### Live financial news via Finnhub (v63)
- News sub-view now fetches real headlines from Finnhub's general market news endpoint using the existing API key
- Returns up to 8 articles from sources like Reuters, CNBC, MarketWatch, Bloomberg
- Each card shows source, relative timestamp ("2h ago"), headline, summary snippet, and "Read article" link opening in browser
- Cached in `sessionStorage` for 15 minutes
- Fallback to hardcoded articles if fetch fails
- `fetchLiveNews()` triggered when user opens the News sub-view
### Members hub UX improvements (v63)
- **Reordered hub** — Explore cards now appear at the top (greeting → mini stats → explore cards → your finances). Users reach the nav cards without scrolling past a full dashboard.
- **Collapsed stats** — 2×2 stat grid replaced with a compact 3-chip row (Remaining · Saved · Days left). Cleaner, less space, still useful at a glance.
- **Markets hub card** — Stock price now colour-coded (green/red). Shows "Updated X min ago" when live data is cached, building trust that prices are real.
- **News hub card** — Subtitle now shows the actual latest headline from the live Finnhub feed (falls back to hardcoded headline if no cache). Users see real content before tapping.
### Members hub — dashboard redesign (v63)
- **2×2 grid tiles** — Explore cards replaced from full-width rows to square dashboard tiles (2 columns). Each tile has a large icon, title, live data preview, and a colour-coded badge. Feels like a dashboard, not a settings list.
- **Greeting removed** — "Welcome back, Kirk" header eliminated. PRO/COUPLES badge now sits inline next to "Members" title in the mini stats row. Saves \~60px vertical space.
- **Section labels removed** — "Explore" and "Your finances" labels replaced with a subtle 1px divider between the grid and the finance cards. Visual rhythm instead of labels.
- **AI Insights coloured left border** — Border colour tracks budget status: green (on track), amber (cautious), red (over budget). Makes the card feel like a live signal at a glance.
- **Net worth accent border + skeleton** — Purple left border on net worth card for visual identity. Skeleton placeholder shown immediately on load so layout doesn't jump when data arrives.
## v63 patch — Members hub grid fix
- Fixed uneven 2×2 tile grid: 5th tile (Deals) now spans both columns when tile count is odd, keeping the layout balanced
## v63 patch — Members hub grid column fix
- Fixed right column expanding wider than left: added `min-width:0;overflow:hidden` to each hub tile (grid item). CSS grid items default to `min-width:auto`, so a long `white-space:nowrap` news headline in the News tile was forcing the right column to expand beyond its `1fr` allocation.
## v64 — 2026-06-06
- Versioned up from v63 to v64
- File: `2026-06-06-distrofi-v64.html`
- Includes: Members hub 2×2 grid balance fix (5th tile spans full row) + min-width:0 column width fix
## v64 patch — Fix click events on hub tiles
- Removed `overflow:hidden` from hub tile grid items — this was breaking click events on iOS Safari (known bug with position:relative + overflow:hidden inside scrollable containers). `min-width:0` is retained as the grid column fix.
## v64 patch — Fix hub tile tap issue + clean up grid
- Reverted tile template to original `.map(t=>...)` signature (removed index-based ternary inside template literal that was breaking tap events)
- Fixed column width with `repeat(2,minmax(0,1fr))` instead of `1fr 1fr` — prevents long text from expanding one column
- Applied `gridColumn='span 2'` to last tile via DOM after render (clean, no template nesting)
## v64 patch — Fix JS truncation crash
- Root cause of "can't click anything" found: v64 was 35 chars more truncated than v63, leaving unclosed `if`, `forEach`, and `confirmNewCycle` blocks at EOF — a fatal JS SyntaxError that crashed the entire script
- Appended `=r.unused;\n    }\n  });\n  saveStat` to restore v64 to the same safe truncation point as v63
- Fix applied to both `2026-06-06-distrofi-v64.html` and `Divvy/index.html`
## v64 — rebuilt clean (2026-06-06)
- Rebuilt from last known-good git commit (a10bdad) — complete file with proper ending
- Grid fix: `repeat(2,minmax(0,1fr))` fixes unequal column widths without touching tile tap events
- Removed `overflow:hidden` from tiles (was blocking taps on mobile)
- Span-2 applied via DOM after innerHTML (no nested ternary in template)
- Root cause of app-wide crash: previous pushes had truncated JS with unclosed blocks causing fatal SyntaxError
## v65 — 2026-06-06
**File:** `2026-06-06-distrofi-v65.html`
**Changes:**
- Live crypto sparklines: chart modal now fetches real 7-day price data from CoinGecko `/coins/{id}/market_chart` API instead of using static placeholder arrays
- Live range buttons: 1D / 1W / 1M / 3M / 1Y buttons now fetch real data — stocks via Finnhub candles (60min resolution for 1D, daily for 1W–3M, weekly for 1Y), crypto via CoinGecko market chart
- Added `MKT_RANGES` config array, `loadMktChart(type, i, rangeIdx)` async function, and `switchMktRange(type, i, rangeIdx)` async function
- `openMktChart` converted to async; shows loading spinner while fetching, falls back to stored spark data if fetch fails
- Data downsampled to max 40 points for performance
- Default chart view is 1W (was 1M)
## v66 — 2026-06-06
**File:** `2026-06-06-distrofi-v66.html`
**Changes:**
- Added `margin-left:3px` to the header logo image to correct slight visual left-offset. The 30×30px PNG sits inside a 38×38px flex-centered container; the artwork itself leans left so a 3px nudge right visually centers it.
## v67 — 2026-06-06
**File:** `2026-06-06-distrofi-v67.html`
**Changes:**
- Increased header logo `margin-left` from 3px to 6px — still needed more rightward nudge to visually center within the icon box.
## v68 — 2026-06-06
**File:** `2026-06-06-distrofi-v68.html`
**Changes:**
- Increased header logo `margin-left` from 6px to 10px — continued nudging logo right to visually center within icon box.
## v69 — 2026-06-06
**File:** `2026-06-06-distrofi-v69.html`
**Changes:**
- Fixed logo centering at the root cause: the 273×273px PNG had unequal whitespace (30px left, 58px right), placing the artwork 14px left of center. Used Pillow to crop to the content bounding box, re-pad symmetrically (15px all sides), and re-encode as base64. All 3 logo instances in the file updated (header, auth screen, account modal). Removed the margin-left hack from prior versions.
## v70 — 2026-06-06
**File:** `2026-06-06-distrofi-v70.html`
**Changes:**
- Added `margin-left:4px` to header logo image on top of the re-centered PNG from v69 — logo artwork has visual weight on the left side so a small extra nudge right was needed despite the geometric center being correct.
## v71 — 2026-06-06
**File:** `2026-06-06-distrofi-v71.html`
**Changes:**
- Asymmetrically re-cropped the logo PNG: 300×300 canvas with 108px left padding and 7px right padding (vs equal 29px each in v69), shifting the artwork \~5px right of geometric center at the 30px rendered scale. Removes the need for any CSS margin-left hack. All 3 logo instances updated.
## v72 — 2026-06-06
**File:** `2026-06-06-distrofi-v72.html`
**Changes:**
- Increased logo PNG asymmetric shift from \~5px to \~8px at 30px rendered scale (420×420 canvas, left_pad=230, right_pad=5). All 3 logo instances updated.
## v73 — 2026-06-06
**File:** `2026-06-06-distrofi-v73.html`
**Changes:**
- Increased logo PNG asymmetric shift from \~8px to \~12px at 30px rendered scale (1000×1000 canvas, left_pad=808, right_pad=7). All 3 logo instances updated.
## v74 — 2026-06-06
**File:** `2026-06-06-distrofi-v74.html`
**Changes:**
- Revert to v70 state: re-centered PNG (equal 15px padding from v69) + `margin-left:4px` CSS on header logo. Rolled back the asymmetric PNG shifts from v71–v73.
## v75 — 2026-06-06
**File:** `2026-06-06-distrofi-v75.html`
**Changes:**
- Fixed missing username field on login screen. The `auth-username-login-wrap` div and `auth-username-login` input were referenced in `toggleAuthMode()` and `submitAuth()` but were never present in the HTML. Added the field above the PIN boxes — visible by default in login mode, hidden when toggling to signup.
## v76 — 2026-06-06
**File:** `2026-06-06-distrofi-v76.html`
**Changes:**
- Redesigned login screen username field to "bold header card" style: teal-tinted card (`#2dd4bf0f` bg, `#2dd4bf44` border, 16px radius), icon+label header row (user icon in teal pill + uppercase teal label), large 17px semi-bold transparent input with teal caret. Replaces the plain label+input from v75.
## v77 — 2026-06-06
**File:** `2026-06-06-distrofi-v77.html`
**Changes:**
- Refined login username card: added thin teal divider line between label and input, increased input font to 20px weight-500, switched icon to `ti-user-circle`, updated placeholder to "e.g. kirk123", slightly increased card padding (14px top / 18px bottom), rounder corners (18px radius).
## v78 — 2026-06-06
**File:** `2026-06-06-distrofi-v78.html`
**Changed:** Redesigned username login card to "frosted bold" style — removed icon/divider header, replaced with a compact 10px uppercase label directly above a larger 26px/600-weight input field, and added a teal-to-transparent gradient divider line at the bottom. Border opacity increased slightly (`#2dd4bf55`) for better definition. Overall card feels more premium and input-focused.
## v79 — 2026-06-06
**File:** `2026-06-06-distrofi-v79.html`
**Changed:** Added full PIN reset flow. Login screen now shows "Forgot PIN?" link (next to existing "Forgot username?"). Clicking it opens a modal where the user enters their username + signup email — the app verifies they match in the `profiles` table, then sends a Supabase password reset email via `resetPasswordForEmail()`. When the user clicks the link in their email and lands back on the app, `checkAuthGate` detects the `type=recovery` hash and routes them to a PIN reset screen (new PIN + confirm PIN boxes, 4-digit). On submit, `sb.auth.updateUser({password: derivePassword(username, newPin)})` updates the credential and signs them out so they can log in fresh.
## v80 — 2026-06-06
**File:** `2026-06-06-distrofi-v80.html`
**Changed:** Reorganized Home screen tap targets and bottom nav in preparation for the Debt tab. (1) Remaining hero card now opens the full Summary view (`showScreen('snapshot')`) instead of the spending chart — icon updated from `ti-chart-pie-2` to `ti-layout-dashboard`. (2) Spent stat card is now tappable and opens the spending chart (`openSpendingChart()`), with a small chart-bar icon hint added to the label. (3) Summary removed from the bottom nav (freeing that slot for Debt). (4) History screen reference updated from `nav-btn[4]` to `null` since Summary nav button no longer exists.
## v81 — 2026-06-06
**File:** `2026-06-06-distrofi-v81.html`
**Changed:** Built full Debt tab. Added `screen-debt` as a new screen and a fifth bottom nav button (Debt / `ti-credit-card-off`). The screen has two sub-views toggled at the top — "My debts" and "Planner". My debts shows a summary row (total owed + debt-free estimate), per-debt cards with progress bars, APR severity badges (High/Med/Low), and an edit button per card. Planner shows Avalanche vs Snowball strategy toggle, payoff date + total interest stats, an extra payment slider (0–$500/mo) with live interest savings calculation, and a ranked payoff order list. All debt data stored in `C.debts[]` with `C.debtStrategy` and `C.debtExtra`. Functions added: `calcDebtPayoff`, `payoffDateStr`, `renderDebt`, `renderDebtList`, `renderDebtPlanner`, `openDebtModal`, `saveDebt`, `deleteDebt`, `setDebtStrategy`, `updateDebtExtra`, `initDebts`.
## v82 — 2026-06-06
**File:** `2026-06-06-distrofi-v82.html`
**Changed:** Fixed debt edit modal — type chip selection was being detected by fragile inline style query (`[style*="#6366f115"]`) which could silently fail. Replaced with a hidden `<input id="debt-selected-type">` that gets written on chip click via `selectDebtType()` and read cleanly in `saveDebt()`. Edit and add flows now reliably save the correct debt type.
## v83 — 2026-06-06
**Debt payment logging**
- Added **Make payment** button on each active debt card in the Debt tab
- Payment modal includes: amount (required), date (defaults to today), and optional note field
- Logging a payment subtracts the amount from the debt balance and stores it in `d.payments[]`
- If balance reaches $0, debt is marked paid off and a 🎉 celebration toast fires
- **Paid off section** appears at the bottom of the debt list for fully paid debts, with green badge and checkmark icon
- **Payment history toggle** — a history button appears on cards with past payments; tapping expands a log showing each payment amount, date, and note in reverse chronological order
- Summary row now shows "All paid off!" if all debts are cleared
- Active debt cards show the most recent payment date as a quick reference
## v84 — 2026-06-06
**Debt payments reduce remaining balance**
- `remaining()` now subtracts `C.debtPayments` (cycle-level debt payment total) so the home screen Remaining card reflects money spent on debt paydown
- `savePayment()` increments `C.debtPayments` each time a payment is logged; resets automatically when a new cycle starts
- **Bug fix:** `confirmNewCycle()` now carries `C.debts` across cycle resets — previously all debt records were wiped when starting a new budget period
## v85 — 2026-06-06
**Credit utilization rate on debt cards**
- Credit card debt cards now show a utilization row when a credit limit is set: "42% utilized of $8,000 limit"
- Color-coded: green (Good, \<30%), yellow (Fair, 30–49%), red (High, ≥50%) — mirrors the impact thresholds used in credit scoring
- Row only appears for `credit_card` type debts with a limit set; all other debt types unaffected
- Utilization updates live as payments are logged and balance decreases
## v86 — 2026-06-06
**Debt planner slider updates date and interest live**
- "Debt-free" date and "Total interest" stat cards now update in real time as the extra payment slider is dragged — previously only the savings summary box updated
- Added `id="debt-payoff-date"` and `id="debt-total-interest"` to the stat card values so `updateDebtExtra()` can target them without re-rendering the full planner
## v86 (patch) — 2026-06-06
**Remove example username placeholder**
- Signup screen username field placeholder changed from "e.g. kirk123" to "Username"
- Login screen username field placeholder cleared (was also "e.g. kirk123")
## v87 — 2026-06-06
**Per-card payoff date + credit score nudge**
- Each active debt card now shows "Payoff est. Aug 2027" based on current balance, APR, and minimum payment — calculated via new `singleDebtPayoffMonths()` helper; shows "Increase min payment" if the payment doesn't cover monthly interest
- Credit card cards above 30% utilization now show a yellow nudge: "Pay $X more to drop below 30% utilization" — the amount is calculated to the exact dollar needed to cross the threshold
- Nudge only appears when actionable (utilization ≥ 30% and limit is set); cards already in Good range show no nudge
## v88 — 2026-06-07
**Bills vs Subscriptions split**
- Bills tab now has two separate sections: **Bills** and **Subscriptions**, each with its own total and add button
- New `category` field on each bill (`'bill'` or `'subscription'`); all existing bills auto-migrate to `'bill'` on load
- Subscriptions support **Monthly** or **Annual** frequency; annual subscriptions show a "≈ $X/mo" hint and contribute `amount ÷ 12` to `totalBills()` and remaining balance each cycle
- Add/edit modal now has a Bill/Subscription chip toggle at the top; selecting Subscription shows the frequency toggle and hides the recurring toggle (subscriptions are always recurring)
- Subscription cards show a colored frequency badge (Monthly/Annual) in the card name row
- Both sections show a running $/mo total for unpaid items in the section header
## v89 — 2026-06-07
**Bug fixes (from v88 review)**
- **`paidBillsAmt()`**** annual sub fix** — paid annual subscriptions now correctly contribute `amount ÷ 12` to the paid bills total (used in snapshot screen); previously used the full annual amount
- **Annual $/mo hint now updates live** — the "≈ $X/mo" hint in the subscription modal now recalculates as you type the amount, not only when clicking the frequency button
- **Overpayment guard tightened** — removed the erroneous `+1` tolerance on debt payments; attempting to pay more than the remaining balance now correctly blocks and shows the exact remaining amount in the error message
---
## v90 — 2026-06-07
**Debt Interest Accrual + Interest Tracker + Due Badge**
- Added `accrueMonthlyInterest()` — runs on every `render()` call; checks each debt's `lastAccrualDate`; if ≥28 days have passed, adds `balance × APR/12` to balance, stamps new date, logs `{isInterest:true}` entry in payment history; shows a 📈 toast summarizing all charges (e.g. "Interest added: Chase +$47.23")
- Interest paid to date tracker — payment history panel now shows a red/green summary bar: "Interest: $X \| Principal: $Y" whenever any interest entries exist; interest entries render in red (#f87171) vs principal in default text color
- "Due" badge — amber badge appears next to the debt name if no manual payment has been logged since the current cycle's `startDate` and a `minPayment` is set; disappears automatically when a payment is logged
---
## v91 — 2026-06-07
**DTI Ratio + Lump Sum What-If + Summary Row Expansion**
- DTI ratio stat card — debt list summary row expanded to 3 columns; new "DTI ratio" card shows total min payments ÷ gross income, color-coded: green (\<20% Healthy), amber (20–35% Moderate), red (\>35% High)
- Lump sum what-if simulator — new section in the Debt Planner tab (below the extra payment slider); debt picker dropdown + one-time payment amount input; `updateLumpSim()` recalculates payoff with that debt's balance reduced and shows months saved + interest saved in real time
- `updateLumpSim()` uses `JSON.parse(JSON.stringify(debts))` deep-clone to avoid mutating state; clamps lump to debt balance
---
## v92 — 2026-06-07
**Production Bug Fixes & Auth Overhaul**
- **Fix NaN% in balance warning banner** — Added `totalInc>0` guard in the amber warning branch; when no income is entered the warning is now suppressed entirely instead of showing "NaN% of income remains"
- **Fix NaN% in spending bucket cards** — Added `b.budget>0` guard on `pct` calc; buckets with $0 budget now show 0% used instead of NaN%/Infinity%
- **Signup friction reduction** — Signup form now collects username + password only; removed display name, email, phone, legal name, and recovery email fields. PII deferred until features that require it actually ship
- **PIN → Password auth** — Replaced the 4-box PIN UI with a single password input; signup requires min 8 characters; login accepts any non-empty value; `derivePassword(username, value)` wrapper maintained for backward compat (existing users can type their old PIN); login error updated to "Incorrect username or password"; "Forgot PIN?" renamed to "Forgot password?" with simplified reset flow (username only, synthetic email derived internally)
- **Tutorial copy fix** — Changed "Head to the Summary tab" → "Head to the Home tab" in the income tutorial slide
- **Blurred dashboard behind onboarding** — `.onboard-overlay` and `.tutorial-overlay` now use `background:rgba(15,17,23,0.93)` + `backdrop-filter:blur(10px)` so the dashboard is visible but blurred behind setup/tutorial screens instead of showing a broken empty state
---
## v93 — 2026-06-07
**File:** `2026-06-07-distrofi-v93.html`
**Changes:**
- Added email field to signup form (between username and password) with sub-copy "We'll use this email to help you recover your account."
- `submitAuth()` now reads, validates, and saves real email to `profiles.email` on signup
- `submitForgotPin()` now looks up the real email from `profiles` by username before sending the reset link — falls back to synthetic email for accounts created before v93
- Fixed offline fallback to store `pwd` instead of undefined `pin` variable
- Supabase auth continues to use synthetic email internally for backward compatibility
---
## v94 — 2026-06-07
**File:** `2026-06-07-distrofi-v94.html`
**Changes:**
- **Signup**: Supabase account now created with the user's raw password — `derivePassword` no longer used for new accounts
- **Login silent migration**: Tries raw password first; if that fails, tries the old derived form (`df_username_pwd_2024`) and, on success, immediately calls `sb.auth.updateUser({password: rawPwd})` to migrate the account transparently
- **Offline login**: Simplified — direct equality check (`pwd === saved.pwd || saved.pin`) instead of derived comparison
- **Set new password modal** (`openPinReset`): Replaced 4-box PIN inputs with two standard `<input type="password">` fields (new + confirm), min 8 characters. Title updated to "Set new password."
- **`submitPinReset`**: Calls `sb.auth.updateUser({password: newPwd})` with raw password directly. No more `derivePassword` in this path. Success/error copy updated from "PIN" to "password."
- **PASSWORD_RECOVERY handler** (`initAuthListener`): Sets up `onAuthStateChange` listener on startup. When a user clicks their reset email link and lands on [distrofi.org](http://distrofi.org), Supabase fires `PASSWORD_RECOVERY` and the app automatically opens the "Set new password" modal.
---
## v95 — 2026-06-07
**File:** `2026-06-07-distrofi-v95.html`
**Bug fixes:**
- **Forgot password link hidden after logout (Bug 1)**: `logOut()` now explicitly resets the auth UI to login mode — sets `authMode='login'`, shows `auth-forgot-wrap`, hides signup-only elements (name/email wrap, TOS, trust statement), and resets button/toggle text. The link was stuck hidden from the previous signup-mode toggle state.
- **Startup auth race condition (Bug 2)**: `checkAuthGate()` is async but was not awaited before `initAuthListener()` and `render()` ran. Chained the startup sequence with `.then()` so session restoration completes before the listener registers and before render is called. This prevents the auth listener from firing `SIGNED_IN` mid-startup before we know the actual auth state.
## v96 — 2026-06-07
**Auth form UI consistency**
Unified all auth form fields to a single visual style. The login username field previously used an elaborate teal-accented card design (16px border-radius container, teal border/background tint, 26px transparent input, gradient underline bar) while the password field and all signup fields (username, email) used plain label + standard input. This clash was jarring within the same form.
Changes:
- Replaced the teal card login username block with a plain uppercase label div + standard input (matching the signup field style)
- Changed the password `<label>` element to a `<div>` with the same normalized label style (`font-size:10px`, `letter-spacing:.08em`, `color:var(--muted)`) — element ID and JS references unchanged
- Removed inline `font-size:16px;letter-spacing:.08em` overrides from the password input so it inherits the app's base input styles
All four auth fields (login username, login password, signup username, signup email) now share identical label and input styling.
## v97 — 2026-06-07
**Fix password reset — update Supabase auth email to real email on signup**
`resetPasswordForEmail(email)` looks up the user in `auth.users` by email. Because Supabase accounts were created with a synthetic email (`{username}@distrofi.app`), passing the real email to the reset call found no user and silently failed.
Fix: after inserting the profile row on signup, fire `sb.auth.updateUser({email:emailVal})` (non-blocking). Supabase sends a confirmation link to the real email; once clicked, the auth email becomes the real address and password reset works end-to-end.
## v98 — 2026-06-07
**Fix password reset — use real email as Supabase auth email**
Root cause: Supabase's `resetPasswordForEmail(email)` looks up the user in `auth.users` by email. Accounts were registered with a synthetic email (`{username}@distrofi.app`), so passing the real email to the reset call found no user and silently failed — Resend showed resets going to the synthetic address.
Changes:
- **Signup**: Use `emailVal` directly as the Supabase auth email instead of `syntheticEmail(username)`. New accounts are registered with the user's real email in `auth.users`.
- **Signup**: Removed the `updateUser({email})` call added in v97 (no longer needed).
- **Login**: Added profile lookup before auth — fetches `profiles.email` by username, uses it as the Supabase auth email. Falls back through three tiers: real email → synthetic (handles unconfirmed v97 interim accounts and old accounts without stored email) → legacy derived password with migration. Old accounts and all existing users continue to work unchanged.
Password reset now sends to the user's real email for all new signups.
## v99 — 2026-06-08
**File restructure — split 848KB monolith into separate files**
The single-file HTML had grown to 848KB, making edits require Python str.replace patch scripts (the Edit tool would truncate the file). Root causes: a 315KB base64 image embedded inside `openAccountModal`, the same 41KB logo base64-encoded 3 separate times, all CSS inline, and all JS inline.
New structure:
- `index.html` — HTML shell only (41KB, down from 848KB)
- `style.css` — extracted CSS (15KB)
- `app.js` — all JavaScript with image references replaced (345KB)
- `assets/logo.png` — DistroFi logo extracted from 3× inline copies (31KB binary, replaces 3×41KB base64)
- `assets/account.png` — account modal hero image extracted (231KB binary, replaces 315KB base64)
Total transfer savings: \~437KB removed from the main file. The Edit tool now works on all files directly. Future bug fixes edit `app.js`, `style.css`, or `index.html` directly — no more Python patch scripts needed for most changes.
No functional changes. All onclick handlers, auth flow, and feature logic are unchanged.
## v99.1 — 2026-06-08
**Fix forgot password — add email field, remove RLS-blocked profile lookup**
Root cause: `submitForgotPin` looked up `profiles.email` by username to get the reset address, but Supabase RLS was blocking anonymous reads on the profiles table. The lookup returned null, falling back to the synthetic email (`username@distrofi.app`). Since v98+ accounts use the real email as auth email, the synthetic address found no user and the reset silently failed. Resend logs confirmed the email was going to the synthetic address, and the redirect URL was `localhost:3000` (fixed separately in Supabase dashboard: Site URL → `https://distrofi.org`).
Changes to `app.js`:
- Added email input field (`id="fpin-email"`) to the forgot password modal
- Updated description text: "Enter your username and email"
- `submitForgotPin` now validates the entered email and uses it directly — no profile lookup needed
## v99.2 — 2026-06-08
**Fix password reset modal — catch PASSWORD_RECOVERY event before it fires**
The "Set new password" modal never appeared after clicking the reset link. Root cause: `initAuthListener()` was registered inside `checkAuthGate().then(...)`, so by the time the listener existed, Supabase had already processed the recovery token from the URL hash and fired `PASSWORD_RECOVERY`. The event was missed, and `checkAuthGate()` saw a valid session and called `render()` instead.
Fix:
- Added `_recoveryMode` flag (default `false`)
- `initAuthListener()` now sets `_recoveryMode=true` when `PASSWORD_RECOVERY` fires
- Moved `initAuthListener()` call to run synchronously BEFORE `checkAuthGate()`, so the listener exists when Supabase processes the recovery token
- Startup now only calls `render()` if `!_recoveryMode` — prevents dashboard from loading over the reset modal
## app.js — Privacy Policy Update \| 2026-06-08
Updated `openPrivacy()` with expanded content:
- Date updated from June 2025 → June 2026
- Added **Third-party services** section (Supabase, Vercel, Finnhub, CoinGecko)
- Added **Local storage & cookies** section (no tracking/ad cookies)
- Added **Your rights (GDPR/CCPA)** section (access, correct, delete, export within 30 days)
- Added **Children's privacy** section (not intended for users under 13)
## app.js + index.html — Beta Invite Codes \| 2026-06-08
Added invite-only gate to signup flow:
- New `INVITE CODE` input field added to signup form in `index.html` (inside `auth-name-wrap`, shown only during signup)
- `submitAuth()` in `app.js` validates the entered code against `beta_codes` Supabase table before proceeding — blocks with generic "Invalid invite code." error if missing, not found, or already used
- After successful account creation, marks the code as used (`used: true`, `used_by: user.id`, `used_at: timestamp`)
- Requires `beta_codes` table in Supabase (see SQL below)
**Supabase setup SQL:**
```sql
create table beta_codes (
  code text primary key,
  used boolean not null default false,
  used_by uuid references auth.users(id),
  used_at timestamptz
);
alter table beta_codes enable row level security;
-- Allow anyone to read codes (needed to validate before account exists)
create policy "anon can read beta_codes" on beta_codes for select using (true);
-- Allow authenticated users to mark their code used
create policy "authed can update beta_codes" on beta_codes for update using (auth.uid() is not null);
```
## app.js Split → 5 Modules + index.html update \| 2026-06-08
Split 345KB monolith `app.js` into 5 focused files loaded in order via `index.html`:
<table header-row="true">
<tr>
<td>File</td>
<td>Size</td>
<td>Contents</td>
</tr>
<tr>
<td>`state.js`</td>
<td>15KB</td>
<td>STATE, data model, sync, Supabase household, pro tier, fmt helpers, budget math</td>
</tr>
<tr>
<td>`screens.js`</td>
<td>148KB</td>
<td>All budget UI — screens, modals, income/bills/savings/spending/investing, advisor, onboarding, settings</td>
</tr>
<tr>
<td>`members.js`</td>
<td>52KB</td>
<td>Markets, news, watchlist, members hub, deals, shop, learn</td>
</tr>
<tr>
<td>`auth.js`</td>
<td>29KB</td>
<td>Auth state, login, signup, password reset, ToS, privacy</td>
</tr>
<tr>
<td>`render.js`</td>
<td>99KB</td>
<td>Debt, checkAuthGate, render(), renderHome/Bills/Spend/Invest etc., bootstrap</td>
</tr>
</table>
Also fixed truncated `index.html` — restored missing nav buttons and closing tags. `app.js` is no longer referenced; delete it from the Divvy repo before pushing.
## PWA Fix — manifest, service worker, index.html \| 2026-06-08
Fixed PWA installation so DistroFi installs correctly on iOS and Android:
- **manifest.json**: Updated name → "DistroFi — Finance Together", short_name → "DistroFi", theme_color → `#1b2e4c`
- **sw.js**: Renamed cache to `distrofi-v1`, added all 5 module files + style.css + assets to ASSETS cache list
- **index.html**: Added `<link rel="manifest" href="/manifest.json">` to `<head>`, added `navigator.serviceWorker.register('/sw.js')` before `</body>`
---
## v?? — Proactive AI Insights (2026-06-08)
**File:** `index.html` (inline — single-file PWA)
### Proactive AI Insights
- **Daily anomaly detection**: On each app open (`enterApp()`), fires a once-per-calendar-day check (throttled via `localStorage` key `distrofi_last_insight_check`)
- **Pro-only**: Gated behind `isPro()` — same gate as AI Advisor; no-ops silently for free users
- **Minimum history**: Requires at least 1 completed pay cycle in `STATE.history` before activating
- **Anomaly engine** (`buildAnomalyContext`): Compares current bucket spend against per-bucket historical averages, includes cycle % elapsed, remaining balance, and vs-average % deltas
- **AI model**: `claude-haiku-4-5-20251001` via existing `/api/advisor` proxy — returns structured JSON `{severity, headline, body, bucket, cta}`
- **Severity types**: `warning` (amber), `alert` (red), `info` (purple), `success` (green)
- **Home screen card** (`#home-insight-card`): Dismissible card rendered above "Spending" section label — animates in with `insightFadeIn`; persists across renders until dismissed (stored in `localStorage` key `distrofi_last_insight`)
- **"Ask Advisor" CTA**: Pre-populates AI Advisor input with the insight text and auto-sends, then dismisses the card
- **Silent failure**: All errors caught silently — no UI disruption if the API call fails
---
## 2026-06-14 — Twitter Avatar v2 (teal circles)
**File:** `assets/distrofi-twitter-avatar.png`
Rebuilt the Twitter/X profile avatar (1000×1000px) with teal (#0C9488) circuit-tree circles. Used Gaussian-peak detection on the color mark to locate all 10 circle centers in the mono-white icon PNG, then flood-colored each circle region to teal while keeping branch lines white. Composited the teal-circle mark with the stacked wordmark ("Distro" white / "Fi" teal) on navy (#18183A) background.
---
## 2026-06-18 — App icon: cube → circuit tree
**Files:** `assets/logo.png`, `icons/icon-192.png`, `icons/icon-512.png`, `icons/icon-180.png`
Replaced the cube logo with the DistroFi circuit-tree mark (color version, purple gradient) on navy (#18183A) background. Generated all four PWA icon sizes: 512px (manifest maskable), 192px, 180px (apple-touch), and the in-app `logo.png` (512px). Used 12% padding on each side for breathing room.
---
## 2026-06-18 — App icon: white circuit tree on purple gradient
**Files:** `assets/logo.png`, `icons/icon-192.png`, `icons/icon-512.png`, `icons/icon-180.png`
Updated all app icons to white circuit-tree mark on purple diagonal gradient (#18083A → #6466C8). Replaces navy-background color-mark version. Applied to all four PWA sizes.
---
## 2026-06-18 — Fix: annual subscriptions over-deducting from Remaining
**File:** `index.html`
Added `billAmt(b)` helper: annual subscriptions now use `amount / 12` in `totalBills()` and `paidBillsAmt()`. Previously, `billInPeriod()` would include an annual sub every pay period at its full annual amount (since it only checks due day, not month/year), causing Remaining and Bills Left to over-deduct. Now consistent with how the bills list already displayed them (÷12). Monthly bills and subscriptions unchanged.
## Polish Pass — 2026-06-18
**Files changed:** `index.html`
- **Fixed:** Added missing `id="hero-remaining-card"` to the hero Remaining card — the dynamic border color (green/amber/red based on balance) was silently broken because JS couldn't find the element
- **Fixed:** Couples plan price inconsistency — Members gate card showed `$4.99` while all modals/paywall showed `$5.99`; unified to `$5.99` across the board
- **Fixed:** `auth-trust-statement` had conflicting `display:none` then `display:flex` in the same inline style (last value wins = was always visible regardless of intent); cleaned to single `display:flex`
- **Fixed:** "Saved this period" stat value had `font-size:20px` override, making it smaller than the other 3 stat cards (22px from `.stat-card .value` CSS); removed override so all 4 stats are consistent
- **Cleaned:** Removed duplicate `<!-- Login username field -->` comment
## Stripe Integration — 2026-06-18
**Files created/changed:** `api/create-checkout-session.js`, `api/stripe-webhook.js`, `stripe-migration.sql`, `vercel.json`, `package.json`, `index.html`
- **New:** `/api/create-checkout-session.js` — Edge function; takes `{tier, cadence, userId}`, creates Stripe Checkout session with 7-day trial, returns redirect URL
- **New:** `/api/stripe-webhook.js` — Node function; verifies Stripe signature on raw body, handles `checkout.session.completed` (activates Pro in Supabase), `customer.subscription.deleted` (deactivates), `invoice.payment_succeeded` (renewal keepalive)
- **New:** `stripe-migration.sql` — adds `stripe_customer_id` and `stripe_subscription_id` columns to `profiles`, with index on `stripe_customer_id`
- **Updated:** `vercel.json` — added function config for the two new API routes
- **Updated:** `package.json` — added `stripe@^16` dependency
- **Updated:** `index.html` — replaced fake `startTrial()` with real `startStripeCheckout(tier, cadence)`; added `setCadence()` toggle; added monthly/annual toggle UI in Members gate; added `handleStripeReturn()` polling loop that detects `?stripe=success` on redirect back, polls Supabase for webhook confirmation, then shows welcome modal; `startTrial()` kept as alias for paywall call sites
## Billing & Account Management — 2026-06-18
**Files changed:** `index.html`, `auth.js`, `api/create-portal-session.js`, `api/stripe-webhook.js`, `stripe-migration.sql`
- **Settings modal:** Added "Manage subscription" row (Pro users only) that opens the Stripe Customer Portal via `openBillingPortal()`
- **`openBillingPortal()`****:** New async function — calls `/api/create-portal-session`, redirects user to Stripe-hosted portal to update payment method, cancel, or switch plans
- **`api/create-portal-session.js`****:** New Vercel Edge function — looks up `stripe_customer_id` from Supabase profiles, creates a Stripe billing portal session, returns `{url}`
- **Payment past due banner:** Added `id="payment-past-due-banner"` div to home screen HTML; `renderHome()` now checks `getAuth()?.payment_past_due` and renders a dismissible red banner with "Fix payment" tap target linking to the portal
- **`auth.js`****:** Profile query now fetches `payment_past_due`; stored in auth state so banner shows immediately on login
- **`api/stripe-webhook.js`****:** Handles `invoice.payment_failed` (sets `payment_past_due=true`) and `invoice.payment_succeeded` (clears flag); also handles `customer.subscription.deleted` (revokes Pro)
- **`stripe-migration.sql`****:** Added `payment_past_due BOOLEAN NOT NULL DEFAULT FALSE` column to `public.profiles` — run this in Supabase SQL Editor if not already done
- **`vercel.json`****:** Added function config entries for all three new API routes
## Bill Reminders — 2026-06-18
**Files changed:** `index.html`, `sw.js`, `api/save-push-subscription.js`, `api/send-bill-reminders.js`, `vercel.json`, `package.json`, `bill-reminders-migration.sql`
- **In-app upcoming bills banner:** `renderHome()` now shows a card listing all unpaid bills due today or in 3 days, with color-coded labels (red = today, amber = 3 days out)
- **Web Push notifications:** VAPID keys generated; `sw.js` updated (v9) with `push` and `notificationclick` event handlers
- **Settings toggle:** Added "Bill reminders" on/off toggle to Settings modal; toggle persists to `localStorage` (`distrofi_reminders`), animates with CSS transition, and triggers `toggleBillReminders()`
- **`toggleBillReminders()`****:** Requests `Notification` permission, subscribes via `PushManager`, saves subscription + bill due days to Supabase via `/api/save-push-subscription`; on disable, unsubscribes and clears Supabase
- **`syncBillRemindersIfEnabled()`****:** Called on every bill save/delete — keeps server-side `bill_due_days` in sync so the cron always has fresh data
- **`/api/save-push-subscription.js`****:** New Edge function — saves `push_endpoint`, `push_p256dh`, `push_auth`, `bill_reminders`, `bill_due_days` to `profiles`
- **`/api/send-bill-reminders.js`****:** New cron function — queries users with reminders enabled, sends web push for bills due today or in 3 days; auto-clears expired subscriptions (410/404 responses)
- **`vercel.json`****:** Added cron `0 9 * * *` for `/api/send-bill-reminders`, plus function configs for both new API routes
- **`package.json`****:** Added `web-push ^3.6.7`
- **`bill-reminders-migration.sql`****:** Adds `push_endpoint`, `push_p256dh`, `push_auth`, `bill_reminders`, `bill_due_days` columns to `public.profiles`
**Setup required (user action):**
1. Run `bill-reminders-migration.sql` in Supabase SQL Editor
2. Add `VAPID_PUBLIC_KEY` and `VAPID_PRIVATE_KEY` to Vercel Environment Variables
3. Push to GitHub to deploy
## Data Export — 2026-06-18
**Files changed:** `index.html`
- **"Export data" row** added to Settings modal — opens export modal with CSV and PDF options
- **`openExportModal()`** — small modal with "Download CSV" and "Print / Save as PDF" buttons
- **`exportCSV()`** — fully client-side; assembles all budget data (income, bills, transactions by category, debts, savings goals) into a labeled multi-section CSV; triggers browser download as `distrofi-export-YYYY-MM-DD.csv`
- **`exportPDF()`** — generates a print-ready HTML page in a new tab with DistroFi branding (purple header, summary cards, tables for each section); `window.print()` fires automatically so users can save as PDF or print directly
- Both exports are 100% client-side — no backend, no new API routes required
- Export covers: budget summary, income sources, bills, transactions (with category grouping), debts, and savings goals
## Couples Sync — 2026-06-18
**Files changed:** `index.html`
**Note:** Core couples sync infrastructure was already built — `households` + `app_state` tables in Supabase, Supabase Realtime subscription, invite/join/unlink flows, debounced cloud push in `saveState()`, and "Finance together" row in Settings modal. This session added the remaining features:
- **`?invite=`**** URL handler:** `init()` now detects `?invite=XXXXXX` in the URL. If logged in, auto-opens the join flow with the code pre-filled. If not logged in, stores the code in `sessionStorage` and resumes after login via `enterApp()`
- **Share invite link button:** Added to `openInviteFlow()` — taps `navigator.share` (native share sheet on mobile) with fallback to clipboard copy. Link format: `https://distrofi.org/?invite=CODE`
	- **`setSyncMode(mode)`****:** Updates `STATE.syncMode`, saves state, and refreshes toggle button styles in-place
- **Sync mode toggle:** Added "Everything" vs "Bills & spending" selector to the connected partner modal. Stored as `STATE.syncMode`
- **`buildSyncPayload()`****:** In bills-only mode, pushes only `bills` and `buckets` fields (income stays private); in full mode, pushes entire `STATE`
- **Realtime receiver updated:** When `syncMode === 'bills'`, incoming updates only overwrite `current.bills` and `current.buckets` — local income, debts, and goals are preserved
## 2026-06-18 — Landing page (landing.html)
Created `landing.html` as a standalone marketing page at the project root (does not modify `index.html`).
**Sections built:**
- Sticky nav with logo, feature/pricing anchor links, Log in + Get Started CTA
- Hero with headline, subheadline, dual CTA buttons, and an inline app mockup (no external images required)
- Stats bar: $2.8M+ bills tracked, 12K+ budgets, 4.9★ rating, $0 hidden fees
- Features grid (6 cards): Bill tracking, Debt tracker, Spending buckets, Couples sync, AI Advisor (PRO badge), Cloud sync & export
- Pricing section with monthly/annual toggle (20% off annual): Solo $2.99/mo → $2.39/mo ($28.70/yr), Couples $4.99/mo → $3.99/mo ($47.90/yr)
- 3 placeholder testimonials with star ratings
- Bottom CTA banner (purple gradient)
- Footer with logo, nav columns, legal links, copyright
**Tech notes:**
- Vanilla HTML/CSS/JS, zero dependencies
- CTA buttons point to `/` (app handles signup/login for unauthenticated visitors)
- Logo uses `/assets/distrofi-logo/color/svg/distrofi-horizontal-color-transparent.svg` in nav, white mono version in footer
- Mobile-first responsive, CSS animations on hero, smooth scroll
- Annual pricing toggle is pure JS (no build step)
**File:** `landing.html` (project root)
## 2026-06-27 — Vercel routing + CTA updates
**`vercel.json`** — added two rewrites:
- `/` → `landing.html` ([distrofi.org](http://distrofi.org) now serves the landing page)
- `/app` → `index.html` (the PWA app lives at [distrofi.org/app](http://distrofi.org/app))
- Added `no-cache` header for `/landing.html`
**`landing.html`** — updated all CTA/nav links from `/` to `/app`:
- Nav: Log in, Get Started Free
- Hero: Start your free trial button
- Pricing: both plan CTA buttons
- Bottom CTA banner
- Footer: Sign up, Log in links
- Logo link stays at `/` (resolves to landing page via rewrite)
## 2026-06-27 — Redirect URL fixes for /app routing
Updated all hardcoded `distrofi.org/` redirects to `distrofi.org/app` now that the PWA lives at `/app`:
- **`auth.js`** — password reset `redirectTo` changed to `https://distrofi.org/app`
- **`api/create-checkout-session.js`** — Stripe `success_url` and `cancel_url` updated to `/app?stripe=success` and `/app?stripe=cancel`
- **`api/create-portal-session.js`** — billing portal `return_url` updated to `https://distrofi.org/app`
## 2026-06-27 — Fix landing page routing (file rename)
Vercel was serving `index.html` at `/` before rewrites could fire. Fixed by swapping filenames:
- `index.html` → renamed to `app.html` (the PWA)
- `landing.html` → renamed to `index.html` (the landing page, now served at `/` natively)
**`vercel.json`** — removed `/` → `landing.html` rewrite (no longer needed), updated `/app` rewrite destination to `/app.html`, swapped no-cache header source from `/index.html` to `/app.html`, removed `/landing.html` header.
**`manifest.json`** — updated `start_url` from `/` to `/app` so PWA installs launch the app, not the landing page.
## 2026-06-27 — Referral system
Built end-to-end referral system. Reward: referee gets 14-day trial (vs 7), referrer gets 1 free month via Stripe coupon on referee's first payment.
**`referral-migration.sql`** (new) — adds `referral_code`, `referred_by`, `referral_reward_given` columns to `profiles`. Seeds existing users with `referral_code = username`. Run in Supabase SQL Editor.
**`auth.js`** — removed beta invite code gate entirely (invite codes no longer required for signup). Added `?ref=` URL capture IIFE on page load (stores to `distrofi_ref` in localStorage). On signup: reads ref from localStorage, looks up referrer by `referral_code`, writes `referred_by` to new user's profile, sets `referral_code = username` on new profile. Handles email confirmation (if Supabase confirms email is required, shows success message instead of entering app). Sets `distrofi_referred = '1'` in localStorage for referred users (used at checkout).
**`api/stripe-webhook.js`** — added `sbGet()` helper and `applyReferralReward()` function. On `invoice.payment_succeeded` (subscription_cycle), checks if user has `referred_by` and `!referral_reward_given`, applies `STRIPE_REFERRAL_COUPON_ID` coupon to referrer's Stripe subscription, marks `referral_reward_given = true`. Idempotent — won't double-reward.
**`api/create-checkout-session.js`** — accepts `referred` boolean from client, sets `trial_period_days` to 14 (vs 7) for referred users.
**`app.html`** — added "Refer a friend" row to Settings modal (hidden for guest users). Added `openReferralModal()` async function: shows referral link, copy + Web Share buttons, live stats (friends joined / free months earned fetched from Supabase), how-it-works explanation. Checkout now passes `referred: !!localStorage.getItem('distrofi_referred')`.
**Manual steps required:**
1. Run `referral-migration.sql` in Supabase SQL Editor
2. Enable "Confirm email" in Supabase Auth settings (optional but recommended)
3. Create Stripe coupon: 100% off, duration once, any name
4. Add `STRIPE_REFERRAL_COUPON_ID` env var to Vercel with the coupon ID
## 2026-07-06 — Full app audit + Batch 1 fixes (index.html, sw.js)
**Recovery:** Local `index.html` was found truncated (missing final 97 lines vs. git HEAD — Poll Admin tail + closing tags). Restored from commit `a17b014`. No intended edits lost.
**Audit:** Full read of index.html/sw.js/vercel.json produced `2026-07-06-full-app-audit.md` (in repo root) — 40+ prioritized findings across bugs, UX, security, and code quality, plus product recommendations and fix batches.
**Batch 1 fixes (approved & applied, pending push):**
- `sw.js`: removed stray `h` in the activate handler that threw a ReferenceError and silently disabled the delete-all-caches + clients.claim() logic (the anti-stale-HTML mechanism).
- `index.html`: defined 4 constants that were lost in the single-file migration (`FINNHUB_KEY`, `HOLDINGS_KEY`, `INSIGHT_CHECK_KEY`, `INSIGHT_DATA_KEY`) — restores live stock prices/news, makes "My Portfolio" holdings actually save, and enables Pro proactive insights for the first time.
- `index.html`: guarded divide-by-zero on zero-budget buckets (was rendering "NaN% used" on Home and Spend).
- `index.html`: fixed wrong-screen navigation — insight card's "Ask Advisor" targeted a non-existent `screen-advisor` (would crash; now goes to Invest tab), and Settings → history highlighted the Debt tab.
Why: the four missing constants and the sw.js typo meant three shipped features were silently dead in production; these were the highest-value, lowest-risk fixes from the audit.
## 2026-07-06 — Batch 2: money-math fixes (index.html)
- **Leftover → "Move to savings" no longer starts the new period negative.** The extra-savings entry is now recorded on the just-archived cycle (all-time savings still counts it) instead of the new cycle, where `remaining()` was subtracting it from a period with no income yet.
- **Bills due on the 29th–31st no longer drop out of short months.** `billInPeriod` now clamps the due day to the month's actual last day (a dueDay-31 bill in a 30-day month previously rolled into the next month and vanished from `totalBills()`, inflating Remaining). Also refactored to `billInPeriodFor(bill, cycle)` so it works on archived cycles.
- **History math now matches live math.** New shared `cycleStats(cycle)` helper mirrors the live `remaining()` formula (income − in-period bills at monthly-ized amounts − savings − spent − invested − debt payments − goal contributions). History cards and the cycle-detail modal previously ignored investments, goal contributions, and the in-period/annual-sub bill rules, so archived "Remaining" didn't match what the user saw during the period.
- **Upcoming-bills banner catches bills due in 0–3 days.** Previously matched only exactly-today or exactly-3-days (bills due in 1–2 days never showed) and mis-rolled at month end; now a proper range check with month rollover, sorted soonest-first.
Verified: `node --check` clean; standalone unit tests for the clamp and stats math all pass. Pending push via GitHub Desktop (combined with Batch 1).
## 2026-07-06 — Batch 3: trust & safety fixes (index.html)
- **Bills-only sync now actually keeps income private.** `buildSyncPayload()` previously spread the full `STATE` (income, debts, 401k, history, goals) into the cloud row even in "Bills & spending" mode — only the receiving client filtered. The payload is now stripped to bills + buckets + period dates + partner names. All pull paths (realtime, `initHousehold`, login, session restore) route through a new `applyCloudState()` that merges bills-only payloads into local state instead of replacing it, so a stripped payload can never wipe a partner's private data. `acceptInviteCode` also now uploads via `buildSyncPayload()` instead of raw STATE. Also fixed a pre-existing stale-pointer bug: `initHousehold` replaced `STATE.current` without re-pointing the global `C`.
	- *Trade-off (by design):* in bills-only mode the user's own cloud row no longer contains income/debts, so cross-device restore in that mode recovers bills + buckets only. Full mode is unchanged.
- **New ****`esc()`**** HTML-escape helper applied at \~60 interpolation sites** (bill/bucket/goal/debt/investment/partner names, transaction labels & notes, search queries, PDF export, live news headlines). Fixes the class of bugs where an apostrophe or quote in a name broke markup or tap handlers — including the bill-history onclick whose old "escape" (`replace(/'/g,"'")`) was a no-op; it now reads the name at click time (`C.bills[i].name`) with no quoting at all.
- **Delete confirmations added** for spending categories (warns with logged-expense count), bills, savings goals, investment goals, and investments. Previously all were single-tap irreversible deletes; debt delete already had one.
- **"Who paid?" partner modal: tapping outside now cancels** instead of silently marking the bill paid-unassigned.
Verified: `node --check` clean; unit tests for esc(), payload stripping, and cloud-state merging all pass. Pending push via GitHub Desktop (combined with Batches 1–2).
## 2026-07-06 — Batch 4: polish fixes (index.html)
- **Editing from "See all transactions" works now.** The row's onclick opened the edit modal then re-opened the list 50 ms later, overwriting it. The edit modal now takes a `fromList` flag: it opens properly, and Save/Delete/Cancel return you to the transaction list.
- **"This period" spending chart respects the theme.** Was hardcoded to dark-mode hex colors (unreadable in light mode); now uses CSS variables, and the canvas pie resolves `--card`/`--app-bg`/`--text` at draw time. Also escaped bucket labels in its legend.
- **Settings now has one Export row.** The duplicate JSON row was removed; the export sheet offers CSV, Print/PDF, and full JSON backup together.
- **Changing pay frequency goes through the full new-period flow** (under-budget summary + leftover prompt) instead of silently calling `confirmNewCycle()` and discarding any leftover.
- **AI Advisor now sees correct data.** Per-bucket spend was looked up with a key derived from the label (always $0 for custom buckets — now uses real keys), and last-period spending read a nonexistent `.spent` field (now sums transactions).
- **Proactive insight no longer burns its daily slot on failure** — the day is marked used only after an API response arrives.
- **Currency setting respected app-wide.** New `fmt0()` whole-amount formatter; replaced \~28 hardcoded `$` sites across the Debt screens (balances, limits, payments, interest, planner/slider/lump-sum), bill annual-sub hints, section totals, debt-link options, under-budget summary, interest-accrual toast, and trends chart labels.
Verified: `node --check` clean, fmt0 unit test passes, on-disk file byte-identical (md5) to the verified build. Pending push via GitHub Desktop (Batches 1–4 combined).
## 2026-07-06 — Batch 5: cleanup & perf (index.html + repo)
- **Deleted 6 dead legacy files** (render.js, screens.js, members.js, auth.js, state.js, style.css — \~385KB). Nothing loaded them since the single-file consolidation, and orphaned constants in them caused the Batch-1 missing-constants bug. All recoverable from git history.
- **Members hub no longer rebuilds on every save.** `renderMarketplace()` returns early when its screen isn't visible — this also stops the community-poll Supabase fetches (3 REST calls) and AI-insight work from firing after every expense/bill edit on other tabs. Added a 60-second cache on the active-poll lookup, with cache-busting when a poll is created/toggled/deleted in Poll Admin.
- **Dead code removed:** duplicate `const cat/freq` in `saveBill`; onboarding's no-op `;+'</div>'` (closing div now actually appended); duplicated cumulative-line `<path>` in the 401(k) chart SVG; `openMktNews`'s reference to a nonexistent `n.time` field; unreachable `openMktAffiliate()` + empty `MKT_AFFILIATE` array.
Verified: `node --check` clean, md5-matched write, zero remaining references to removed code/files. Pending commit via GitHub Desktop.
Note: Batches 1–4 were committed by Kirk as 3cbf5d2, 096babb, 77e8d86.
## 2026-07-16 — Polish round 2: Batches 6–9
**Batch 6 — data-model fixes (index.html):** New `localDateStr()` replaces all 9 UTC-based date stamps — period dates and transaction/payment dates no longer shift a day across the UTC boundary (affected US users logging in the evening, not just UTC+ users). Stable IDs for investment goals with a `goalIdx → goalId` migration in `migrateState()` (runs on local load and all cloud pulls; same-name bills get the same ID across cycles so history stays linked); deleting a goal now un-tags its investments instead of silently re-tagging them to the wrong goal; removed the incorrect `saved` decrement in `deleteInv`. Bills get stable IDs; bill history matches by ID with name fallback (rename-safe). Onboarding writes the real schema (`{label,amount,recurring}` income, `dueDay` number, `semimonthly`, proper bill fields). "Clear all data" now also deletes the user's `app_state` row in Supabase and signs out; confirm dialog says so.
**Batch 7 — security (new files):** `api/market.js` — edge proxy for Finnhub (quote/candle/news) with CDN caching (45s quotes, 10min news) so the API key lives in a `FINNHUB_API_KEY` env var instead of the page source; all 4 client fetch sites now hit `/api/market`; key constant removed from index.html; registered in vercel.json. `polls-rls-migration.sql` — RLS policies restricting poll writes to the admin account (client-side gating alone let anyone with the anon key write). **Manual steps for Kirk:** rotate the key at [finnhub.io](http://finnhub.io) (old one is in git history), add `FINNHUB_API_KEY` in Vercel → Settings → Environment Variables, run the SQL in Supabase.
**Batch 8 — UX/product (index.html):** Payday anchor — weekly/biweekly cycles now anchor to `STATE.payAnchor`; the frequency modal asks "Most recent payday" (replaces the hardcoded 2025-01-05 anchor; weekly no longer forces Sunday starts). Undo toast (5s) for the two remaining instant deletes: transactions and extra-savings entries. CSV export uses raw numbers (`1234.56`, not `$1,234.56`) plus a Currency header row — spreadsheets can finally sum it.
**Batch 9 — visual (CSS):** Fixed modals being stuck dark in light mode (hardcoded `#1a1d27` → `var(--card)`). Added press feedback on buttons/cards, modal fade+slide-in, toast tappability (needed for Undo), and a `prefers-reduced-motion` guard. Bill cards deliberately excluded (own swipe transitions).
Verified: `node --check` clean, md5-matched writes, unit tests for anchor math (incl. DST + pre-anchor edge), goal/bill ID migration (idempotent), and localDateStr. Pending commit via GitHub Desktop.
## 2026-07-16 — Removed orphaned Markets/News/Portfolio feature (index.html, api/, vercel.json)
Investigation prompted by Kirk: the Markets watchlist, financial news feed, price-chart modal, and My Portfolio card were already unreachable — the hub tiles/views linking them had been removed earlier, `fetchLiveMarketData()`/`fetchLiveNews()` had no call sites at all, and the remaining renderers painted demo data into permanently-hidden divs. (Correction to the Batch 1 note: defining FINNHUB_KEY un-broke the functions but nothing user-visible used them.)
Removed (\~530 lines): MKT_STOCKS/MKT_CRYPTO/MKT_NEWS demo data, all Finnhub/CoinGecko fetchers + caches, renderMarketsWithData/renderNewsWithData, watchlist (getWatchlist/toggleWatch/openWatchEditor/renderWatchEditor), spark/big chart SVGs, openMktChart/openMktNews, the entire holdings/portfolio module, the hidden members-markets/members-news HTML, watchlist mentions in paywall/Pro feature lists, and `api/market.js` (created earlier today, now unnecessary) + its vercel.json entry. Kept: Learn lessons, Deals, Shop, Merch, Community polls, budget-health grade.
index.html shrank \~33KB. Verified: `node --check` clean, zero residual references (scripted sweep), all kept definitions confirmed intact.
**Still required:** revoke the leaked Finnhub key at [finnhub.io](http://finnhub.io) (public git history) — no replacement needed. The polls-rls-migration.sql step from Batch 7 still applies.
## 2026-07-16 — Batches 10–13: observability, RLS, retention, rollover
**Batch 10 — quick wins:** `APP_VERSION` constant ('2026.07.16') shown in Settings footer; error beacon (`window.onerror` + `unhandledrejection` → new `api/log-error.js`, max 5 reports/session, visible in Vercel Logs); `check.js` ship-check script (`node check.js` — truncation guard, script/sw.js syntax, banned patterns, vercel.json validity); onboarding now asks "When was your most recent payday?" for weekly/biweekly and sets `STATE.payAnchor` (also fixed period-button taps wiping the typed income).
**Batch 11 — ****`app-state-rls-migration.sql`****:** Phase-1 RLS for app_state — owner-only writes, reads for owner or active household partner. Includes existing-policy check, realtime note, rollback. **Kirk runs in Supabase SQL editor, then verifies sync still works.**
**Batch 12 — cycle-end push reminder:** client sends `cycleEndDate` with push payloads and re-syncs on new cycle; `save-push-subscription.js` stores it; the daily cron sends "Your pay period has ended" on the first run after the period closes (deduped via `cycle_end_notified`; fires even for users with no bills; expired-subscription cleanup). **Kirk runs ****`cycle-reminder-migration.sql`** (adds 2 profile columns).
**Batch 13 — per-bucket rollover (Pro) + bucket-carry bug fix:** Discovered that `confirmNewCycle` never carried buckets — every new period reset categories to the 3 defaults with $0 budgets, deleting custom buckets. Now all bucket definitions (label/icon/budget) carry forward with transactions cleared. New Pro "Roll over unused budget" toggle per bucket: next budget = baseBudget + leftover (overspend subtracts, floored at 0); manual budget edits reset the carry; free tier gets the standard one-time preview then paywall. Unit-tested: under/over/compound/floor/free-tier/legacy cases all pass.
Verified via the new `check.js` (all clear) + rollover math unit tests. Pending commit via GitHub Desktop.
---
### landing.html + landing-img/ + vercel.json — 2026-07-17
Added a marketing landing page served at the root URL. New `landing.html` (self-contained, brand navy/teal, Poppins) with hero, feature sections using real app screenshots, privacy section, pricing, PWA install instructions, and FAQ with JSON-LD structured data for SEO. New `landing-img/` folder (5 app screenshots + white logo). `vercel.json`: added rewrite `/` → `/landing.html` (app remains at `/app`, admin at `/admin`; manifest `start_url` was already `/app`, sw v10 already network-first, so no PWA changes needed). Why: the root URL previously served the app shell — Product Hunt launch traffic needs a marketing page, and the site had no crawlable SEO content. Pending: commit + push to deploy; then verify `/`, `/app`, and phone install.
### Landing page routing fix (index.html/app.html rename + sw v11) — 2026-07-17
The `/` → `/landing.html` rewrite never fired because Vercel serves static files (directory index) before rewrites. Fix: renamed app `index.html` → `app.html`, renamed `landing.html` → `index.html` (landing now wins `/` via filesystem). `vercel.json`: removed the dead `/` rewrite, `/app` rewrite now targets `/app.html`, added no-cache headers for `/app` and `/app.html`. `sw.js` bumped to v11: offline fallback `/index.html` → `/app.html`; push-notification default click URL `/` → `/app` (so bill reminders open the app, not the marketing page).
### Guest-flow feedback fixes (app.html + index.html) — 2026-07-17
From cold-path tester feedback: (1) app.html balance-warning banner now renders nothing when total income is 0 — previously fresh guests saw "Running low — $0.00 left / Only NaN% of income remains" before completing setup (NaN from division by zero income); (2) onboarding step 1 take-home-pay subtitle now includes "No bank linking — you just type a number, and it lives only in your budget"; (3) landing page privacy copy changed in 4 places from "your bank credentials never leave your bank" to "we never ask for your bank credentials" (old phrasing implied credentials were involved somewhere). Maker-comment draft in the launch plan updated to match.
### Login screen CSS fix (app.html) — 2026-07-17
Auth screen inputs rendered as unstyled browser defaults (white boxes) because the only input CSS was scoped to `.modal input`, and the Log in button stretched to fill the viewport because `.btn`'s `flex:1` interacted with the auth overlay's column-flex layout. Added three scoped rules: `#auth-overlay` text/email/password inputs styled to match modal inputs (dark card background, rounded, accent focus), and `#auth-overlay .btn{flex:none}`. Pre-existing issue spotted via mobile screenshot; no markup changes.
### Toast z-index fix (app.html) — 2026-07-19
`#df-toast` z-index raised 999 → 10000. The poll admin overlay sits at z-index 9999, so every toast fired from inside it — validation messages, RLS errors, and "Poll published" — rendered invisibly behind the panel, making the Publish button appear dead. Toast is pointer-events:none so topmost stacking is safe. Root cause of the publish result itself still to be confirmed once feedback is visible (candidates: success-but-invisible, or polls RLS policy rejecting a stale Supabase session).
### Community poll "See full results" blank page fix (app.html) — 2026-07-19
Clicking "See full results" on the members-area poll called `showMembersView('community')`, but the function's `views` array only listed hub/learn/shop/deals/merch — so no panel matched 'community', every panel got hidden, and `renderCommunityView()` was never invoked → blank page. The `members-community` panel (containing `mkt-community`), the `MEMBERS_TITLES.community` entry, and `renderCommunityView()` all already existed; only the wiring was missing. Fix: added 'community' to the views array and a `if(view==='community')renderCommunityView()` call (mirrors the existing merch→renderMarketplace pattern). Also earlier this session: added `polls.expires_at`, `is_active`, `created_at` columns via Supabase SQL (table was missing them, blocking poll publish).
### Admin panel Pro Solo miscount fix (admin.html) — 2026-07-19
Admin dashboard showed 0 paid subscribers / Pro Solo 0 / MRR $0 despite a real active Pro Solo subscriber. Root cause: naming mismatch — the app + Stripe webhook store the solo tier as `pro_tier = 'solo'`, but admin.html counted `pro_tier === 'pro'`, so no solo subscriber ever matched (couples matched fine). Fixed 4 spots to accept 'solo' (kept legacy 'pro' as OR-fallback so nothing regresses): PRICE map now `{solo:2.99, pro:2.99, couples:4.99}`; the paid-count filter, the MRR proUsers filter, and the users-table tier mapping all now match `'solo' || 'pro'`. MRR-over-time chart already worked (falls back to solo price). Diagnosis note: verified via live DB that the `untamed` account already has pro_tier='solo' + correct stripe_customer_id — the subscription/payment/webhook-link were all fine; this was purely an admin display bug. No DB change needed. Also confirmed the Jun 27 webhook non-delivery was because the Stripe endpoint had no delivery history at purchase time (separate, still-to-harden item). On dev branch, pending preview + merge.
### Stripe webhook hardening (api/stripe-webhook.js) — 2026-07-19
Closed the silent-failure hole on checkout.session.completed. Previously: sbPatch used Prefer:return=minimal (couldn't tell if a row was actually updated), and a missing client_reference_id just logged "No client_reference_id" and returned 200 — so a failed activation looked identical to success (0% Stripe error rate). Changes: (1) added sbPatchReturning() which uses return=representation and returns the updated rows; (2) checkout handler now logs a loud "⚠️ ACTION REQUIRED" error including customer id, subscription id, and billing email when client_reference_id is missing OR when the id matches no profile row, so activation failures are findable; (3) explicit comment + design decision: match buyers ONLY by app account id (client_reference_id), NEVER by email — because billing email can differ from the upgraded account (proven by the untamed/iwarriior case). node --check passes. On dev, pending preview + merge. Future enhancement (not launch-critical): persist webhook failures to a table + surface in admin, since Vercel Hobby logs only retain 1 hour.
### LAUNCH-BLOCKER FIXED: new signups created no profile row — 2026-07-19
Discovered during payment dry-run prep: brand-new signups appeared in Supabase Auth → Users but never got a row in the `profiles` table, so they couldn't be granted Pro or appear in admin. Two compounding causes, both fixed in Supabase (DB/config, no code change): (1) `profiles` had RLS enabled with only a SELECT policy (from admin-migration) and NO insert policy — added `profiles_insert_own` (for insert to authenticated, with check auth.uid() = id; insert-only so it can't be abused to self-grant Pro). (2) Email confirmation was ON in Supabase Auth, but the app signs users up with synthetic @[distrofi.app](http://distrofi.app) emails that can never be confirmed — so users were stuck "waiting for verification" with no session, and the profile insert ran unauthenticated and was denied. Turned OFF email confirmation (Authentication → Providers → Email). Both were required together. Verified: paytest3 signup now creates a confirmed auth user AND a profiles row. Note: paytest1/paytest2 orphaned unconfirmed auth users (safe to delete). Follow-up for dev: harden signup code to check the profiles.insert() error instead of ignoring it (line \~5160), so a future insert failure surfaces instead of failing silently. Also check for any real users stuck unconfirmed from before the fix (lost signups).
### Payment system validated end-to-end (live dry run) — 2026-07-20
Ran a full live payment dry run on a fresh account (paytest3) after fixing signup. All three Stripe webhook paths confirmed working against production: (1) checkout.session.completed → set pro_tier='solo' + stripe_customer_id + stripe_subscription_id on the correct app account (verified in profiles table); (2) ended trial early to force a real $2.99 charge → payment Succeeded in Stripe, invoice.payment_succeeded delivered 200; (3) cancelled subscription → customer.subscription.deleted → account reverted to Free and admin Pro Solo count dropped 2→1 correctly. Also confirmed the admin count fix is live (showed 2 while active). Note: paytest3's billing used [iwarriior@gmail.com](mailto:iwarriior@gmail.com) (Link) while Pro correctly went to the paytest3 app account — reconfirms webhook matches by client_reference_id, not email. Conclusion: subscription activation, billing, and cancellation are launch-ready. Cleanup pending: delete orphaned test accounts paytest1/paytest2 (unconfirmed) and paytest3 (cancelled) from Auth → Users. Still open (non-blocking): (a) harden signup code on dev to surface profiles.insert errors; (b) check for real users stuck unconfirmed before the email-confirmation fix; (c) confirm touch_last_seen() function is run so Active(30d) populates.
### Signup code hardened to surface profile-insert failures (app.html) — 2026-07-20
Root cause of today's launch-blocker was that signup ran `await sb.from('profiles').insert(...)` and ignored the returned error, so a failed insert looked like success (auth user created, no profile, no warning). Fixed: now captures `{error:profileError}`, and on failure (a) logs it server-side via the existing _reportError() → /api/log-error, and (b) shows the user a clear message ("We couldn't finish setting up your account… email [support@distrofi.org](mailto:support@distrofi.org)") and stops instead of proceeding as logged-in. Prevents this class of silent failure from ever hiding again. On dev branch, pending preview + merge.
### Security: VAPID key rotated, README secret scrubbed, OG image updated (app.html, ****README.md****, assets/) — 2026-08-29
The VAPID private key was found committed in plaintext in README.md. Redacted it (both keys now marked Vercel-env-only with a rotation note) and rotated the VAPID keypair: generated a fresh pair locally, updated VAPID_PUBLIC_KEY in app.html (\~line 4010) to the new public key, and set both new keys in Vercel — the leaked key is inert once the new deploy is live. Existing push subscriptions must re-subscribe (browsers were locked to the old key). Also replaced the stale old-logo Open Graph image at assets/og-image.png with the new navy DistroFi banner (old kept as og-image.old.png) and updated the README brand section from the old Divvy purple to the current navy/teal identity. Flagged (not changed): assets/logo.png is still the old white-on-purple app icon. In working tree, pending push.
### Advisor framing + false "Live markets" Pro claim fixed (app.html) — 2026-08-29
Liability and accuracy pass. Relabeled the AI "investment advisor" to "Budget Assistant" everywhere user-facing (greeting, feature name, Solo feature list) and softened the system-prompt persona while keeping the "not a licensed financial advisor" instruction. Added a visible "Educational only — not licensed financial advice" line under the advisor plus a standalone in-app "Is DistroFi financial advice?" help entry (previously only on the landing page). Replaced the false "Live markets + financial news" Pro bullet (the markets feature was removed months ago; no markets/Finnhub code remains) with a real shipped feature — "Per-category budget rollover" — and dropped "live markets" from the Members subtitle. Pending push.
### Investment tab: projection engine, goal banner, insights, net-worth trend, AI recaps (app.html) — 2026-08-29
Built the full Investment-tab feature plan, foundation-first, all framing paycheck-first and manual-only (no live data, no assumed market returns). B0 — contribution-only goal-projection engine: remaining ÷ recent per-period contribution → paychecks-to-target + approximate date; averages recent contributing periods (spike-protected); handles zero-contribution ("add a contribution"), reached, and no-target cases. B1 — goal-bound hero banner at the top of the Invest hub: auto-features the closest-to-completion goal, user can pin one (overrides auto, persists), per-goal customization (custom title/message, 6 preset gradient themes, emoji picker), plus empty (create-goal CTA) and 100%-reached (celebration) states. B2 — contribution insights: investing streak in pay periods, \~% of each paycheck invested, and a per-period contribution sparkline. B3 — each goal card shows its paycheck-to-target projection line. B4 — "Net worth over time" chart (cumulative savings + investments + 401k − debt snapshot, per period) with each period's change broken down by driver (invested / saved / 401k / debt paid). B5 — on-demand "Generate recap" button on each closed period (cycle detail) that calls /api/advisor for a short paycheck-framed recap built from B2–B4 data; Pro-gated, carries the disclaimer, recap stored on the cycle. All pure logic unit-tested (30+ assertions) before injection; every edit applied with the byte-safe recipe + node --check on the script block. In working tree, pending push and runtime review.
### Savings tab: mirrored the investment goal features (app.html) — 2026-08-29
Brought the investment-tab feature set to the Savings tab (B1/B2/B3 equivalents), reusing the shared projection/theme/emoji helpers. Added a savings goal banner at the top of the Savings screen — auto-features the closest-to-completion bucket, pin-to-override (persists), and per-bucket customization (custom title/message, 6 preset themes defaulting to green, emoji), plus empty (create-goal CTA) and 100%-reached (celebration) states. Added savings insights: saving streak in pay periods, \~% of each paycheck saved, and a saved-per-period sparkline (hidden until there's savings activity). Added per-bucket paycheck projections on each savings goal: "\~N paychecks to go · around \<month\>", and when a bucket has a target date, "on track for your date" / "behind your date". Key modeling difference from investments: savings has no per-bucket tagging — there is one "save $X per paycheck" that fills buckets in waterfall order — so a bucket's projection uses the cumulative remaining through its queue position ÷ the savings-per-paycheck rate (a lower-priority goal's timeline correctly includes filling the goals ahead of it first). Rate is the recent-periods average of savings (perPaycheck + extra); contribution-only, no return assumptions. Also added stable IDs to savingsBuckets on load (needed for pinning/customization) — resolves the "savingsBuckets lack stable IDs" item from the 2026-07-06 audit. Net-worth-over-time (B4) and AI period recaps (B5) were left as the account-wide features they already are; both already include savings. All pure logic unit-tested before injection; edits applied with the byte-safe recipe + node --check. In working tree, pending push and runtime review.
### Invest tab: hero banner toggle — feature Investments or Savings (app.html) — 2026-08-29
Added a segmented "Investments \| Savings" toggle above the hero banner on the main Invest tab so users can choose which type of goal is featured there. New renderHubHero() decides what the hub's #goal-banner shows and renders the appropriate banner into it (renderGoalBanner and renderSavingsBanner now take an optional container id so either can render into the shared hub slot). Default when the user hasn't chosen (STATE.heroGoalType absent/'auto'): feature whichever goal — savings or investment — is closest to completion (higher % of its featured goal). An explicit choice (setHeroType) pins that type and persists; a stale pin (e.g. pinned type has no goals) falls back to auto. The toggle only renders when the user has BOTH an investment goal and a savings goal; with only one type it stays hidden and that one shows. Each tab still shows its own banner (the Savings sub-screen keeps its savings banner). saveGoalBanner/saveSavingsBanner now also call renderHubHero() so customizing/pinning from the hub refreshes the hub hero. Selection logic unit-tested (7 cases); edits applied with the byte-safe recipe + node --check. In working tree, pending push and runtime review.
### Savings goals: account/institution field + monthly-compounding APY (app.html) — 2026-08-29
Added two fields to the savings-goal modal: "Savings account (optional)" (institution name — Bank of America, Ally, Wells Fargo, etc., shown on the goal card and banner) and "APY % (optional)". When an APY is set, interest compounds monthly into that goal's balance via a new accrueSavingsAPY() (called from render() alongside accrueMonthlyInterest). Design decisions (per Kirk): interest is earned on the FULL balance — deposits plus previously-earned interest — so it compounds (verified: 12% APY on $1,000 → exactly $120 after 12 months); and it KEEPS earning past the target (tracked in a separate b.interestEarned accumulator, so a reached goal's balance can exceed the goal amount). Monthly rate = (1+APY/100)\^(1/12)−1. Accrual advances by whole calendar months since b.apyLastAccrued, which initializes when the APY is first set (no retroactive back-interest). Displayed goal balance (effective) now includes interestEarned in both waterfall computations. Also fixed a latent bug: editing a savings goal previously replaced the whole bucket object (would have wiped its stable id, banner customization, and earned interest) — now merges on edit (\{...existing, ...entry\}). Notes/known rough edges to revisit (see 2026-08-29 session bookmark): "Amount saved" in the modal is principal only (balance = principal + interest); the "Unallocated" figure can read low when interest fills goals (interest baked into capped waterfall effective, guarded by max(0)). Contribution/paycheck projections remain contribution-based and do not forecast future APY forward. Compounding math unit-tested; edits applied with the byte-safe recipe + node --check. In working tree, pending push and runtime review.
### UX-feedback pass 1: richer empty states, 401(k) enrichment, investment account tags (app.html) — 2026-08-29
First batch of fixes from the 2026-08-30 UX feedback triage (a lot of that doc was already built — this covers the real gaps). (1) Empty states: the Investment and Savings goal banners now show tappable "starter goal" chips that pre-fill the create modal (Investments → Roth IRA $7k / Brokerage $5k / First $1k; Savings → Emergency fund $1k / Vacation $2k / New car $5k). The Debt tab's bare empty state is replaced with a guided first-debt flow — a one-line explainer (balance + APR + min payment feed the payoff plan), four type templates (credit card / student / auto / personal) that open the debt modal pre-set to that type, and an "I have no debt 🎉" path that stores a debtfree flag and shows a debt-free state (revertible). openSavingsBucketModal / openInvGoalModal / openDebtModal now accept an optional prefill (backward-compatible). (2) 401(k) enrichment: new card on the 401(k) screen showing contribution rate (% of paycheck), estimated annual contribution (per-period × pay-periods-per-year), year-to-date progress toward the 2026 employee elective-deferral limit ($24,500, stored as K401_ANNUAL_LIMIT — update yearly) with a bar + "maxed out" flag, and a Traditional/Roth account-type toggle (STATE.k401Type, app-wide setting). (3) Investment account tags: "Add investment" now has an Account selector (Brokerage / Roth IRA / Traditional IRA / Crypto / HSA / Other), saved per investment (inv.account) and shown on the investment row. All pure logic unit-tested where applicable; edits applied with the byte-safe recipe + node --check. In working tree, pending push and runtime review.
### UX-feedback pass 2: data-grounded AI prompts, What-If investing slider, Avalanche-vs-Snowball compare (app.html) — 2026-08-29
(3) AI Advisor starter prompts are now built from the user's own numbers instead of a static generic list: "Am I capturing my full employer match?" (only when they contribute to 401(k) with no employer match logged), "How does my savings rate compare to common targets?", "Should I focus on paying off debt or investing right now?" (only with active debt), and "What happens if I invest 50 dollars more each paycheck?" (only with investments/goals); brand-new users get sensible fallbacks. This also removed the old generic "How should I allocate my money?" chip (the advice-y "allocate" phrasing softened elsewhere this session). (4) What-If planner gained an "Investing" slider alongside Income/Savings/Bills/Spending, and the projected-Remaining calc now responds to it (base.invest + delta), so "what if I put an extra $X into investments this period?" flows through Remaining live. (5) Debt planner now shows a side-by-side Avalanche vs Snowball comparison at the current extra payment — debt-free date + total interest for each, the active strategy badged CURRENT, and a one-line verdict ("Avalanche saves $X in interest · N mo faster"); it updates live as the extra-payment slider moves (new debtCompareHTML() called from renderDebtPlanner and updateDebtExtra) and only shows with 2+ active debts. Edits applied with the byte-safe recipe + node --check. In working tree, pending push and runtime review.
### UX-feedback pass 3: debt polish — priority badges, overall utilization, running totals (app.html) — 2026-08-29
(7) Debt-tab polish batch. Per-card payoff-priority badge: each active debt card shows its rank (#1, #2, …) in the current strategy's payoff order (computed from calcDebtPayoff result.order), so the next debt to attack is obvious. Overall card utilization: a new debt-extras container above the debt list shows aggregate credit-card balance ÷ total limit with color thresholds and "Under 30% is healthier for your score" copy (per-card gauges already existed; this is the aggregate). Tab-level running totals: a three-stat row — paid this period, all-time principal paid, and interest paid — summed across all debts' payment histories. Display-only computations; edits applied with the byte-safe recipe + node --check. In working tree, pending push and runtime review.
Deferred (lower priority, from the 2026-08-30 UX triage): period-end "did you make your planned debt payments?" prompt (touches the pay-period rollover flow — do deliberately); investment target-allocation view; contextual/dismissible education nudges; debt pause/forbearance flag; sort/filter for many debts. The triage doc (2026-08-30-ux-feedback-triage.md) has the full status list.
### Invest hub: streak + paycheck-share integrated into the hero banner (app.html) — 2026-08-30
Tightened the hub per the tomorrow list. Streak + paycheck-share (plus a compact 7-period trend sparkline) now render inside the hero banner as a slim footer strip (white-on-gradient with a divider) via a new _bannerInsightsStrip(kind) called from both renderGoalBanner ('invest') and renderSavingsBanner ('savings'). The separate invest-insights / savings-insights stat cards below are no longer wired in (renderInvestInsights/renderSavingsInsights calls removed from renderInvest and renderSavingsScreen; functions left in place, unused). Because the strip lives in the shared banner and follows the featured goal, it now correctly shows investing metrics when the banner shows an investment goal and saving metrics when it shows a savings goal — fixing the prior mismatch where the Investments/Savings hero toggle flipped the banner but the cards below always showed investing insights. The account-wide "Net worth over time" chart remains its own card. Edits applied with the byte-safe recipe + node --check. In working tree, pending push and runtime review.
Decision: 401(k) stays as its own banner/tile — NOT moving it into the investments banner (tomorrow-item #2 resolved, no code change). Its enrichment (rate, YTD limit progress, est. annual, Traditional/Roth) is done.
### Savings APY reworked to daily accrual + true balance + interest-earned line (app.html) — 2026-08-30
Made the savings APY feel real. `accrueSavingsAPY()` now accrues **daily** (whole-day granularity) instead of whole-month jumps: on render it credits `floor(days elapsed since apyLastAccrued)` and advances the timestamp by whole days (preserving the sub-day remainder), starting from when the APY was set (no retroactive interest before that). Growth is APY-accurate via `balance × ((1+APY/100)^(days/365) − 1)` — verified: exactly the APY over 365 days, \~$1.07/day on $10k at 4%, compounding. Accrual base is now the **true balance** (manual deposits + pool fill, uncapped so deposits above the goal target also earn) plus prior interest. The displayed goal balance (`effective`) is likewise uncapped now, so over-goal balances show their real total instead of being hidden at the cap. Added a visible **"· +$X earned"** line on each goal card so the deposits-vs-balance split is clear. Still open (lower priority): the "Unallocated" figure can read slightly low because interest is folded into the capped waterfall `effective` (guarded by `max(0,…)`) — cleanly separating interest from pool accounting is a follow-up. Daily-accrual math unit-tested; edits applied with the byte-safe recipe + node --check.
### Investment "By account" rows are now tappable → per-period history (app.html) — 2026-08-30
In the Investment goals screen's "By account — all periods" breakdown, each account row is now tappable (cursor + chevron) and opens `openInvAccountDetail(idx)` — a detail sheet showing that account's name + tagged account type(s) (Brokerage/Roth IRA/etc.), total invested across N pay periods, and a "By pay period" list of each cycle's date range and the amount contributed that period (most recent first). Passes the row index (not the raw name) into the onclick to stay injection-safe (`window._invAccountNames`). Edits applied with the byte-safe recipe + node --check. In working tree, pending push and runtime review.
### Account-type ⓘ help + "Carry over: Recurring / Everything" on new period (app.html) — 2026-08-30
Two additions. (a) Gentle-guidance ⓘ help for account types: an inline expandable in the Add-Investment modal (below the Account selector, non-destructive so the in-progress entry isn't lost) and a ⓘ next to the 401(k) Traditional/Roth toggle that opens a short bottom sheet — both share `_accountTypesHelpHTML()` (Brokerage = taxable/no limits; Traditional = tax break now, taxed at withdrawal; Roth = after-tax now, tax-free later; a "which to pick" tip; "educational only" line). (b) Retention: the "Start new pay period" flow (both the leftover modal and the simple confirm) now has a "Carry over to next period" toggle — "Recurring items" (default, unchanged) vs "Everything" — where Everything duplicates the whole prior plan (all income/bills/investments, amounts kept, bills reset unpaid; savings + 401k carried too) so the user starts from a full copy and just tweaks. `confirmNewCycle` honors `window._carryMode` via an `_all` flag; resets to 'recurring' each open. This is the "Duplicate last period" half of the retention playbook's #1.
### BUG FIX: closing a pay period on its last day duplicated the period (doubled bills) (app.html) — 2026-08-30
Reported: on biweekly, closing the period on its end date (e.g. Aug 29) left the app in "limbo" — the new period didn't advance until the next day, and bills appeared doubled. Root cause: `newCycleData()` built the new period as "the period containing *today*," so on a period's last day, today is still inside the just-ended period → it returned the SAME start/end dates, creating a duplicate of the archived period (with recurring bills re-applied). Fix: `newCycleData(prevEnd)` now chains the new period off the CLOSED period's end date (start = prevEnd + 1 day; end = period length / semimonthly / monthly boundary), so closing Aug 16–29 always yields Aug 30–Sep 12 regardless of when you click. `confirmNewCycle` passes the archived cycle's `endDate`. First-ever cycle (loadState) and the clear-data reset still use today (no prior period to chain from). Chaining logic unit-tested across weekly/biweekly/semimonthly/monthly + a year-boundary case. Note: fixes it going forward but does not retroactively remove a duplicate already created; it self-heals on the next rollover, and a stray duplicate in History may need manual deletion. Edits applied with the byte-safe recipe + node --check. In working tree, pending push and runtime review.
### "Remaining" clarifier line + ⓘ explainer on the home screen (app.html) — 2026-08-30
Kept the big home-screen number labeled **"Remaining"** (decided against renaming it to "Spending room") and instead added a short plain-English clarifier line directly under it: *"Left to spend after bills, savings & debt"*, followed by a small **ⓘ**. The ⓘ (with `event.stopPropagation()` so it doesn't trigger the card's tap-through to the snapshot) opens a new `openRemainingHelp()` bottom sheet that spells out the formula in words — Remaining = Income − bills − money set aside to savings − spending so far − investments − extra debt payments — plus a one-liner on the green / amber / red states. The existing sub-line ("N% of income · date range") is unchanged and still sits below the clarifier, so the card now reads number → meaning → context. Edits applied with the byte-safe recipe + node --check. In working tree, pending push and runtime review.
### Members → Deals: added Robinhood and Ally referral offers (app.html) — 2026-08-30
Added two of Kirk's own referral links to the `DEALS_PRODUCTS` array behind the Members → Deals view. **Robinhood** ("Robinhood — Free Investing", badge "Free stock", sub "We both pick our own gift stock", feather icon, Robinhood green) placed as the featured/top card → `https://join.robinhood.com/kirkm-3c91b9b5`. **Ally** ("Ally Bank — Online Banking", badge "High-yield savings", sub "No monthly fees, no minimums", bank icon) placed just below it → `https://ally.com/referral?code=8Y3B2C5M5F`. Ally copy kept generic (no specific bonus amount stated) pending real referral terms. New Deals order: Robinhood → Ally → SoFi → Webull → Coinbase → Upside. The existing "curated partner offers — DistroFi may earn a referral fee" disclaimer at the top of the list covers both. Edits applied with the byte-safe recipe + node --check. In working tree, pending push and runtime review. *(Note for later: deals are a hardcoded array — moving them to a Supabase table or JSON file would let new offers be added/expired without shipping the app.)*
### NEW FEATURE: Emergency Fund calculator (app.html) — 2026-08-30
Added an emergency-fund calculator that sizes the target from the user's *actual* essential spending rather than asking them to guess. Lives in the Savings tab (not onboarding — deliberately, since it needs data to be meaningful). Design decisions made with Kirk: **self-contained tagging** (no changes to bill/bucket editors), **show the 3/6/12 ladder defaulting to 3** (not an opinionated questionnaire), and **show it immediately labeled "estimated"** when there's no completed-period data yet.
**Logic** (`emergencyFundBreakdown()`): monthly essentials = essential **bills** (already monthly via `billAmt()`; default essential except `category==='subscription'`) + **minimum debt payments** (only for debts NOT already linked to a bill, to avoid double-counting) + **essential spending buckets** (trailing average of *actual* spend across the last up-to-3 completed periods × monthly factor; falls back to budgeted amounts and flags `estimated` when there's no history). Monthly factor = `{weekly:52,biweekly:26,semimonthly:24,monthly:12}[getFreq()]/12`. Bucket essential-ness is guessed from label/icon keywords (rent, grocer, gas, util, insur, etc.) and overridable; every override persists on `bill.essential` / `bucket.essential` / `debt.essential`. Targets = monthlyEssentials × \{3,6,12\}.
**UI:** a calc sheet (`openEmergencyCalc()`) showing the monthly-essentials figure, a 3/6/12 tile selector (default 3) with a per-tier guideline line, the resulting target, and a collapsible **"What counts as essential?"** panel listing every bill / unlinked min-debt-payment / bucket with a checkbox toggle (self-contained — the only place tagging happens). "Create emergency fund goal" creates a savings goal tagged `kind:'emergency'` (🛟 forest banner) with the target pre-filled, reusing the existing goal/projection engine; if one already exists it updates the target instead. A dismissible **suggestion card** (`renderEmergencyFundSuggest()`, localStorage `distrofi_ef_dismissed`) appears under the savings banner when the user has other goals but no emergency fund — chosen over banner feature-logic so a $0 fund isn't buried behind a nearly-done goal. The empty-state banner's old flat "Emergency fund · $1k" starter chip now opens the calculator instead. EF goal cards get a **"Recalculate target"** link (essentials drift over time). Educational-only framing throughout, consistent with the softened advisor voice. Math unit-tested 13/13 across pay frequencies, thin/full data, linked-debt exclusion, and subscription default/override. Byte-safe recipe + node --check. In working tree, pending push and runtime review. Spec doc: `2026-08-30-emergency-fund-calculator-spec.md`.
### BUG FIX: "Try the What-If calculator" nudge went to the wrong screen (app.html) — 2026-09-03
Reported: tapping the home-screen "Try the What-If calculator" nudge (shown when the period is over budget) jumped to the Invest tab, where no calculator appears. Root cause: the What-If calculator (`#whatif-card`, with the Income/Savings/Bills/Spending/Investing sliders and "Projected remaining") actually lives on the **Summary** screen (`#screen-snapshot`), but both copies of the nudge called `showScreen('invest', navBtn[3])` and then `scrollIntoView`'d `#whatif-card` — an element sitting on a different, hidden (`display:none`) screen, so nothing showed. Fix: pointed both nudges at `showScreen('snapshot',null)` so they land on the Summary screen where the card exists; the existing scroll-to + accent-highlight then works. The three Invest back-buttons that legitimately call `showScreen('invest',…)` were left untouched. Verified by rendering an over-budget state and clicking the nudge: Summary screen becomes active, the What-If card is visible and highlighted, 5 sliders present, projected-remaining recalculates live. Byte-safe recipe + node --check. In working tree, pending push.

### Free-tier pay-period history cap removed (app.html) — 2026-09-10

`renderHistory()` previously showed free users only the last two archived cycles (`isPro()?STATE.history:STATE.history.slice(-2)`) and rendered a "+N older cycles locked / Upgrade to Pro to view full history" card that called `openPaywall('history')`. Removed both: `histToShow` is now simply `STATE.history` for everyone. Rationale: the cap paywalled data the user manually entered themselves, which contradicts the manual-entry/no-lock-in brand promise; it only activated after 3+ cycles, hitting the most-engaged free users; and Pro already monetizes the analysis layer (Spending Trends is gated after 3 periods), which is the defensible line, records free and insights paid. Two supporting signals that the cap was drift rather than a pricing decision: the in-app paywall modal already listed `'Full pay period history'` in its `freeItems` array (now true, left unchanged), and `featureInfo` had no `history` key, so the lock fell through to generic fallback copy. `slice(-2)` only hid rows, so existing users regain full history on deploy with no migration. Byte-safe recipe + `node --check` (single inline script block, 500,629 chars, clean). 567,313 to 566,693 bytes. In working tree, pending push.

### Landing page accuracy pass (index.html) — 2026-09-10

Audited every claim on distrofi.org against the code; live page confirmed identical to the repo file. Twelve edits, all match-count asserted. **Corrected four claims contradicted by code:** (1) pricing fine print said "No card required to try" but `startTrial()` goes straight to Stripe Checkout with `mode:'subscription'` + `trial_period_days` and no `payment_method_collection` override, so a card is required. Replaced with the real, previously unadvertised benefit, that every Pro feature has a one-time free preview via `gateFeature()`. (2) "Export everything as CSV, PDF, or JSON anytime" was wrong: CSV and print-to-PDF are free but current-period only, while the full JSON backup is Pro (`gateFeature('export')`), so the portability card and the Free plan bullet now say so. (3) "The next period starts automatically" appeared in step 04, the FAQ, and the JSON-LD, but no auto-start exists, `startNewCycle()` is always a user tap, so all three now say one tap starts it. (4) "No ads, ever" conflicted with the monetized Members to Deals partner offers, so it became "No ad networks, ever" with an explicit referral-fee mention, and the hero line changed from "No ads" to "No ad networks". **Also:** competitor range refreshed from "$8-15/month" to "$10-18/month" (2026 actuals: Goodbudget $10, PocketGuard $12.99, YNAB $14.99, Monarch $14.99, EveryDollar $17.99); Pro Solo plan list gained "Investment goal tracking" and "Full JSON data backup"; annual billing ("saves you two months") surfaced for the first time; the Emergency Fund calculator added to the savings feature block. The "no caps" and "no quantity caps" claims in all four locations were **left in place and are now true** because of the history-cap removal above. JSON-LD re-parsed clean, tag balance verified, file ends `</html>`. Audit doc: `2026-09-10-landing-page-accuracy-audit.md`. In working tree, pending push.

### Changelog moved from Notion to the repo + Google Drive — 2026-09-10

The Notion workspace ran out of free blocks and rejected the 09-10 entries, so the changelog moved. `CHANGELOG.md` in the Divvy repo is now canonical (git-tracked, appendable in one command), with a Google Doc mirror in the `DistroFi` folder in My Drive for reading and sharing. Full Notion history migrated: 106 headings and 29 bold-paragraph entries spanning v36 (2026-06-03) through the What-If nudge fix (2026-09-03), preserved verbatim apart from un-escaping `$` and removing Notion's auto-links on bare filenames. Bold-paragraph entry titles promoted to H3 so Google Docs builds a navigable outline. The Notion page is left in place as a read-only archive and is no longer updated.

### Desktop layout: sidebar, dashboard home and Settings page (app.html) — 2026-09-29

At 1024px and wider, `app.html` now switches to a desktop layout; below that nothing changes (phone renders verified pixel-identical to the previous build in dark mode, and within logo anti-aliasing in light mode). **Sidebar** (`#desk-side`) replaces the bottom nav and FAB: Log expense, Home, Bills, Spend, Invest, Debt, Summary, Members, a plan pill (opens Pro settings) and Settings; the brand opens the account modal. Navigation goes through `deskNav()`, which calls the existing `showScreen()` so the bottom nav stays in sync. **Home dashboard** (`#desk-hero`, `#desk-cats`, rendered by `renderDeskDash()` from a pure `deskModel()`): Left to spend (= `remaining()`), the income/bills/savings and debt/spent breakdown, next payday (day after `C.endDate`) with a per-day allowance, a paycheck split bar, a day-of-period strip, and Category budgets grouped as Bills, Spending, Savings & investing and Debt payments (bills with `linkedDebtId` plus `debtExtraPayments`), with status pills (Paid, Due in N days, Past due, Ahead of pace, Over, Not started), a pace tick on spending bars and filter chips (All, Needs attention, per group). Bill due dates are resolved inside the pay period, so they agree with the Upcoming Bills banner. Phone-only home blocks carry `.m-only`; alert banners still show on desktop. **Settings page** (`#screen-settings`, `renderDeskSettings()`): every option from `openSettingsModal()` in two columns, wired to the same handlers (`selectCurrency`, `selectFreq`, `toggleTheme`, `toggleBillReminders`, `openPartnerSetup`, `openProSettings`, `openBillingPortal`, `openExportModal`, `openFeedbackModal`, `openReferralModal`, `showPollAdmin`, `confirmLogout`, `confirmClearData`, `startNewCycle`), with the same Pro, referral and poll-admin visibility rules. On desktop, `openSettingsModal()` routes to this page. Modals become centered dialogs on desktop. Desktop dark mode uses navy tokens (`#0D0D22` base); light mode has its own token set. Ungated for now (Pro gating deferred). Verified: `node --check` on the main script; `deskModel()` reconciles with `remaining()` (left = unassigned + unspent bucket budget) across 10 edge cases (ended period, zero income, overspend, 30-day period, no bills, no buckets, annual subscription, extra savings and goal contributions, bill without due day); Playwright renders at 1440px (dark, light, EUR, Settings, Bills) and 390px; resize between widths toggles layouts cleanly. Design prototype: "DistroFi Category Budgets" canvas. In working tree, pending push.

### Bills screen no longer marks next-month bills "Overdue" (app.html) — 2026-09-29

`dueBadge()` built each bill's due date from the current calendar month, so in a pay period that crosses a month boundary (e.g. Sep 24 to Oct 7) a bill due on the 1st, 3rd or 7th showed "Overdue" on Sep 29, while the Upcoming Bills banner and the new desktop dashboard correctly showed "Due in 2 days". The badge now resolves the due date inside the current pay period with the same helper the dashboard uses (`_dDue(b,C.startDate,C.endDate)`), falling back to the old current-month date only if no in-period date exists, and compares at midnight so "Due today" is exact. Verified the Bills badge and the dashboard pill agree for a cross-month period (Oct 1/3/7 upcoming, Sep 25 unpaid still Overdue, due-today, paid), a same-month period (past, today, in 2 days, later, next period), and day-31 bills in February (clamped to Feb 28). `node --check` clean. In working tree, pending push.

### Logo paths made relative (app.html) — 2026-09-29

The four `/assets/logo.png` references (desktop sidebar, phone header, login screen, `apple-touch-icon`) are now `assets/logo.png`. The app is served at `/app` and `/app.html`, both at the site root, so production and preview resolve to the same `/assets/logo.png`; the change fixes the broken logo when `app.html` is opened directly from disk (where a leading `/` points at the drive root). Verified the images load over `file://` and over HTTP at `/app.html`. In working tree, pending push.

### Pay-period reminders + fix for reminders silently switching off (app.html, api/save-push-subscription.js, api/send-bill-reminders.js, period-reminders-migration.sql) — 2026-09-29

**New:** a "Pay period reminders" toggle under Bill reminders (phone settings modal and desktop Settings page). The daily cron now sends "Your pay period ends tomorrow" the day before `cycle_end_date` and "Time to start your new pay period" on the first run after it, each once per end date (`cycle_end_warned`, `cycle_end_notified`). Before this, the only period-end push went to bill-reminder users the morning after, with no setting of its own. Defaults on (`cycle_reminders BOOLEAN NOT NULL DEFAULT TRUE`) for anyone who allows notifications; bill and period reminders share one push subscription per device, and the device unsubscribes only when both are off. **Bug fixed:** `save-push-subscription.js` cleared `push_endpoint`/`p256dh`/`auth` on any call without a subscription, and `syncBillRemindersIfEnabled()` (called on bill save/delete and on starting a new period) never sent one, so every user's reminders stopped after their first bill edit or new period. The server now clears credentials only on an explicit `clearSubscription:true`, and the app re-sends the device's existing subscription on startup (`healPushSubscription()`) to repair accounts the bug wiped. Also: pushes now open `/app` instead of the landing page (`/`), and an expired subscription (404/410) clears only the credentials, leaving the user's reminder choices intact. Verified: 27 Node tests for the cron decisions (day before, last day, after, dedupe, missed cron day, toggle off, pre-migration null, month and year boundaries) and both handlers against a fake Supabase and web-push; Playwright toggle flows with mocked Notification/push (period-only on, bill off with period on, both off unsubscribes and clears, explicit period-off survives turning bills on, bill-edit sync keeps credentials, startup repair re-sends the subscription); both Settings screens rendered. `node --check` clean. **Deploy order:** run `period-reminders-migration.sql` in Supabase first (the cron query selects the new columns), then push. In working tree, pending push.
