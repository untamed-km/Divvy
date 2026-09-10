# DistroFi Session Bookmark — 2026-09-05

Continuation of the 2026-08-29/30 session. Full per-change detail is in Notion "DistroFi — App Changelog".
**Everything below is in the working tree, NOT pushed** — Kirk pushes from GitHub Desktop.

## Shipped this session (all in `app.html`, unpushed)

- **"Remaining" clarifier (home screen)** — kept the big label **Remaining** (decided *against* renaming to "Spending room"); added a plain-English subtitle under the number, *"Left to spend after bills, savings & debt,"* plus a small **ⓘ** that opens `openRemainingHelp()` (spells out Remaining = Income − bills − savings − spending − investments − extra debt payments, and the green/amber/red states). The existing "% of income · date range" line stays below it.
- **Members → Deals: two referral offers** — added to the `DEALS_PRODUCTS` array. **Robinhood** (featured/top card, "Free stock", feather icon) → `https://join.robinhood.com/kirkm-3c91b9b5`. **Ally** ("High-yield savings", bank icon, generic copy pending real terms) → `https://ally.com/referral?code=8Y3B2C5M5F`. Order: Robinhood → Ally → SoFi → Webull → Coinbase → Upside. Existing "may earn a referral fee" disclaimer covers both.
- **NEW FEATURE — Emergency Fund calculator** — Savings tab. Sizes the target from *actual* essential spending. `emergencyFundBreakdown()`: essential bills (monthly via `billAmt()`; default essential except subscriptions) + unlinked min debt payments + essential buckets (trailing avg of actual spend over last ≤3 completed periods × monthly factor; budgeted fallback flagged **estimated** when no history). Monthly factor = `{weekly:52,biweekly:26,semimonthly:24,monthly:12}[getFreq()]/12`. 3/6/12 targets, default 3. `openEmergencyCalc()` sheet with a self-contained **"What counts as essential?"** toggle panel (the only place tagging happens; persists on `bill.essential`/`bucket.essential`/`debt.essential`). Creates a savings goal tagged `kind:'emergency'` (🛟) reusing the goal/projection engine; updates target if one exists. Dismissible suggestion card under the savings banner (`renderEmergencyFundSuggest()`, localStorage `distrofi_ef_dismissed`) when the user has other goals but no EF. Old flat "$1k" starter chip now opens the calculator. EF goal cards get a **"Recalculate target"** link. Math unit-tested 13/13. Spec: `2026-08-30-emergency-fund-calculator-spec.md`.
- **BUG FIX — "Try the What-If calculator" nudge** — the home over-budget nudge called `showScreen('invest',…)` then scrolled to `#whatif-card`, which actually lives on the **Summary** screen (`#screen-snapshot`), so nothing showed. Fixed both nudge copies to `showScreen('snapshot',null)`. Verified end-to-end (Summary active, card visible + highlighted, 5 sliders, live projected-remaining). The 3 legit Invest back-buttons untouched.

## Marketing assets produced (in container, delivered to Kirk)

- **X launch thread** — `distrofi-x-thread.md`. 9-tweet thread, launch/hype tone, CTA + distrofi.org. **No em dashes** (Kirk's request — reads as AI). Each tweet mapped to a screenshot.
- **App screenshots** — rendered from the real `app.html` via Playwright with seeded demo data. `render.js` (container) builds a realistic biweekly STATE + captures 9 phone-sized shots (home, bills, spending, savings, emergency-fund modal, investments, 401k, debt, debt-planner). Light set in `/home/claude/shots/`, **dark set** (final, what Kirk wanted) in `/home/claude/shots-dark/`. Reusable for future screenshots.

## Open / next

- **Push** — everything above is unpushed; Kirk pushes from GitHub Desktop.
- **Live-data cleanup** — still offered: inspect Kirk's browser localStorage for a stray duplicate pay period left by the earlier doubling-bug fix (forward-looking fix; won't retro-remove an existing dup).
- **Ally deal copy** — generic pending Ally's real referral terms.
- **Couples price** — README says $4.99/mo, changelog v39 said $5.99. Confirm before the X post (thread currently says "from $2.99/mo" to sidestep it).
- **EF follow-ups** — bucket essential-ness is keyword-guessed (mis-tag risk; the toggle panel is the fix). Possible later: `essential` toggles in the bill/bucket editors too; "Unallocated" APY accounting cleanup (still open from APY rework).
- **What-If discoverability** — the calculator is a bit buried on the Summary screen; consider a more obvious entry point if users don't find it.
- **Deals are a hardcoded array** — moving them to a Supabase table or JSON would let offers be added/expired without shipping the app.

## Working rules (unchanged)

- **Never Edit/Write existing repo files through the mount** (byte padding). Recipe: stage → python replace with match-count asserts → `node --check` the `<script>` block + confirm ends with `</html>` → SendUserFile → `device_commit_files` with `expectedMtimeMs` guard → re-grep on device to verify.
- **`check.js` is STALE** — validates `index.html` (now just the landing page), not `app.html`. All app.html edits hand-validated with the same logic. Fix pending: point it at `app.html`.
- Notion changelog entry after each change. Page id: `375005e2-bce7-8126-85b3-e7e6226ce731`.
