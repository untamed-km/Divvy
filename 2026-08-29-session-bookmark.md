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

## Tomorrow / open

**Investment-tab IA cleanup (original):**
1. Move streak + paycheck-share **into** the investments banner — mirror the savings-side read; tighten the hub so insights live with/in the banner, not as separate cards below.
2. Consider moving **401(k) into the investments banner** — it's a retirement investment; may belong under Investments rather than its own hub tile. (Note: 401k *enrichment* is done; this is the IA/placement question.)

**Savings APY — make it work better:**
- Accrual timing: currently whole-months since `b.apyLastAccrued`, initialized when APY is set (no back-interest). Consider daily accrual or back-dating to `createdAt`.
- Principal vs balance: modal "Amount saved" = deposits; displayed balance = deposits + `interestEarned`. Consider a labeled "interest earned" line.
- "Unallocated" can read low when interest fills goals (interest baked into capped waterfall `effective`, guarded by `max(0,…)`). Consider separating interest from pool accounting.
- Over-funded accounts: interest accrues on capped `effective` + `interestEarned`; manual deposits above the goal aren't in the accrual base — revisit.

**Deferred UX-feedback items (lower priority):**
- Period-end **"did you make your planned debt payments?"** prompt — touches the pay-period rollover flow (`confirmNewCycle`); do deliberately.
- Investment **target-allocation** view; contextual/dismissible **education nudges**; debt **pause/forbearance** flag; **sort/filter** for many debts.

## Working rules (unchanged — see 2026-07-16 bookmark for the rest)
- **Never Edit/Write existing repo files through the mount** (byte padding). Recipe used all session: stage → python replace with match-count asserts → `node --check` the `<script>` block + confirm ends with `</html>` → SendUserFile → `device_commit_files` with `expectedMtimeMs` guard → re-grep on device to verify.
- **`check.js` is STALE:** validates `index.html` (now just the landing page, no inline `<script>`) not `app.html`, so it fails "could not locate the main `<script>` block". Not caused by this session. Fix pending: point it at `app.html` (or both). All app.html edits hand-validated with the same logic.
- Notion changelog entry after each change (page id in `CLAUDE.md`).
