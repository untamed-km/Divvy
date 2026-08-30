# DistroFi Session Bookmark — 2026-08-29 → 08-30

Big session (spanned into 08-30). Full per-change detail is in Notion "DistroFi — App Changelog".
**Everything below is in the working tree, NOT pushed** — Kirk pushes from GitHub Desktop.

## Shipped — part 1 (foundation + investment/savings features)
- **Security** — VAPID keypair rotated (new pair, Vercel env updated, client public key ~line 4010); `README.md` secret scrubbed + brand section refreshed to navy/teal; OG image swapped to the new navy banner (`assets/og-image.png`, old kept as `og-image.old.png`). `assets/logo.png` is still the old white-on-purple app icon (not changed).
- **A1 / A2** — advisor relabeled "Budget Assistant" + visible disclaimer + in-app "Is DistroFi financial advice?" entry; false "Live markets + financial news" Pro bullet replaced with a real feature.
- **Investment tab B0–B5** — contribution-only projection engine; goal banner (auto-feature closest-to-completion, pin, per-goal title/theme/emoji, empty + reached states); insights (streak, ~% of paycheck invested, contribution sparkline); per-goal paycheck projections; "Net worth over time" chart + driver breakdown; on-demand AI period recaps in cycle detail (Pro-gated, /api/advisor).
- **Savings tab mirror** — savings banner + insights + per-bucket projections (waterfall-order aware, target-date on-track/behind); added stable IDs to `savingsBuckets`.
- **Invest-tab hero toggle** — feature Investments or Savings in the hub banner; default = whichever goal is closest to completion.
- **Savings account + APY** — institution field + APY that compounds monthly into the goal balance (`accrueSavingsAPY`), keeps earning past target; edit now merges (preserves id/banner/interest).

## Shipped — part 2 (UX-feedback triage, from `2026-08-30-ux-feedback-triage.md`)
Most of the feedback doc was already built (esp. the Debt tab). These were the real gaps:
- **Empty states** — starter-goal chips on the Investment & Savings banners (pre-fill the create modal); guided first-debt state with type templates (credit card / student / auto / personal) + "🎉 I have no debt" path (localStorage `distrofi_debtfree`). All three create-modals now take an optional prefill.
- **401(k) enrichment** — new card: contribution rate (% of paycheck), est. annual (per-period × pay-periods/yr), YTD progress toward the **2026 employee limit `K401_ANNUAL_LIMIT=24500`** (update yearly), Traditional/Roth toggle (`STATE.k401Type`).
- **Investment account tags** — "Add investment" now has an Account selector (Brokerage / Roth IRA / Traditional IRA / Crypto / HSA / Other), saved as `inv.account`, shown on the row.
- **AI starter prompts** — now data-grounded (built from the user's numbers); removed the old generic list incl. the "allocate my money" chip.
- **What-If** — added an "Investing" slider; projected Remaining now responds to it.
- **Avalanche vs Snowball** — live side-by-side comparison in the debt planner (`debtCompareHTML`), updates with the extra-payment slider, shows with 2+ debts.
- **Debt polish** — per-card payoff-priority badge (#1/#2 from `result.order`); overall card-utilization bar; tab-level running totals (paid this period / principal paid / interest paid) in a new `debt-extras` container.
- **Hub tighten** — streak + paycheck-share + a mini 7-period trend moved *into* the hero banner (`_bannerInsightsStrip`, used by both invest & savings banners); separate insight cards removed. Strip follows the hero toggle (invest vs savings), fixing the prior mismatch. Net-worth-over-time chart stays its own card.
- **Savings APY rework** — daily accrual (from when APY set), true-balance base, "interest earned" line (see APY section below). Unallocated separation still open.
- **Tappable "By account" rows** — the Investment "By account — all periods" breakdown rows now open `openInvAccountDetail(idx)` → that account's per-pay-period contribution history (index-based onclick, injection-safe).

## Tomorrow / open

**Investment-tab IA cleanup:**
1. ✅ DONE — streak + paycheck-share (+ mini trend) moved into the hero banner (invest & savings); separate insight cards removed; strip follows the hero toggle.
2. ✅ DECIDED — keep **401(k) as its own banner/tile** (not moving it into the investments banner). No change. (Enrichment is done.)

**Savings APY — make it work better:**
- ✅ DONE — **daily accrual** (whole-day granularity, from when APY is set), APY-accurate compounding `(1+APY/100)^(days/365)`.
- ✅ DONE — **"interest earned" line** on each goal card; displayed balance (`effective`) is now the true (uncapped) balance.
- ✅ DONE — accrues on the **true balance** (manual + pool fill, uncapped for above-goal deposits) + prior interest.
- ⬜ OPEN — "Unallocated" can still read low (interest folded into the capped waterfall `effective`, guarded by `max(0,…)`). Cleanly separating interest from pool accounting is the follow-up.

**Deferred UX-feedback items (lower priority):**
- Period-end **"did you make your planned debt payments?"** prompt — touches the pay-period rollover flow (`confirmNewCycle`); do deliberately.
- Investment **target-allocation** view; contextual/dismissible **education nudges**; debt **pause/forbearance** flag; **sort/filter** for many debts.

## Working rules (unchanged — see 2026-07-16 bookmark for the rest)
- **Never Edit/Write existing repo files through the mount** (byte padding). Recipe used all session: stage → python replace with match-count asserts → `node --check` the `<script>` block + confirm ends with `</html>` → SendUserFile → `device_commit_files` with `expectedMtimeMs` guard → re-grep on device to verify.
- **`check.js` is STALE:** validates `index.html` (now just the landing page, no inline `<script>`) not `app.html`, so it fails "could not locate the main `<script>` block". Not caused by this session. Fix pending: point it at `app.html` (or both). All app.html edits hand-validated with the same logic.
- Notion changelog entry after each change (page id in `CLAUDE.md`).
