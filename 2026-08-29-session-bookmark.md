# DistroFi Session Bookmark — 2026-08-29

Big session. Full per-change detail is in Notion "DistroFi — App Changelog" (entries dated 2026-08-29).
**Everything below is in the working tree, NOT pushed** — Kirk pushes from GitHub Desktop.

## Shipped today (all in app.html unless noted, unpushed)
- **Security** — VAPID keypair rotated (new pair generated, Vercel env updated, client public key updated ~line 4010); `README.md` secret scrubbed + brand section refreshed to navy/teal; OG image swapped to the new navy banner (`assets/og-image.png`, old kept as `og-image.old.png`). `assets/logo.png` is still the old white-on-purple app icon (not changed).
- **A1 / A2** — advisor relabeled "Budget Assistant" + visible disclaimer + in-app "Is DistroFi financial advice?" entry; false "Live markets + financial news" Pro bullet replaced with a real feature.
- **Investment tab B0–B5** — contribution-only projection engine; goal banner (auto-feature closest-to-completion, pin, per-goal title/theme/emoji, empty + reached states); insights (streak, ~% of paycheck invested, contribution sparkline); per-goal paycheck projections; "Net worth over time" chart + driver breakdown; on-demand AI period recaps in cycle detail (Pro-gated, /api/advisor).
- **Savings tab mirror** — savings banner + insights + per-bucket projections (waterfall-order aware, target-date on-track/behind); added stable IDs to `savingsBuckets`.
- **Invest-tab hero toggle** — feature Investments or Savings in the hub banner; default = whichever goal is closest to completion.
- **Savings account + APY** — institution field + APY that compounds monthly into the goal balance (`accrueSavingsAPY`), keeps earning past target; edit now merges (preserves id/banner/interest).

## Tomorrow — cleanup on the Investment tab
1. **Move streak + paycheck-share into the investments banner** — mirror how they read on the savings side; tighten the hub so those insights live with/in the banner instead of as separate cards below it.
2. **Consider moving 401(k) into the investments banner** — it's a retirement investment, so it may belong under Investments rather than as its own separate hub tile/screen.
3. **Make the savings APY work better** — open questions:
   - **Accrual timing:** currently whole-months-elapsed since `b.apyLastAccrued`, initialized when the APY is first set (no back-interest). Consider daily accrual, or back-dating to `createdAt`.
   - **Principal vs balance clarity:** modal "Amount saved" = deposits (principal); displayed balance = deposits + `interestEarned`. Decide if that split is clear or needs a labeled "interest earned" line on the goal.
   - **"Unallocated" figure** can read low when interest fills goals (interest is baked into the capped waterfall `effective`, guarded by `max(0,…)`). Consider separating interest from pool accounting for an exact unallocated number.
   - **Over-funded accounts:** interest accrues on capped `effective` (pool+manual capped at goal) + `interestEarned`. If manual deposits exceed the goal, the excess isn't in the accrual base — revisit.

## Working rules (unchanged — see 2026-07-16 bookmark for the rest)
- **Never Edit/Write existing repo files through the mount** (byte padding). Recipe used all session: stage → python replace with match-count asserts → `node --check` the `<script>` block + confirm ends with `</html>` → SendUserFile → `device_commit_files` with `expectedMtimeMs` guard → re-grep on device to verify.
- **`check.js` is STALE:** it validates `index.html` (now just the landing page, no inline `<script>`) not `app.html`, so it fails with "could not locate the main `<script>` block". Not caused by today's work. Fix pending: point it at `app.html` (or both). All app.html edits this session were hand-validated with the same logic.
- Notion changelog entry after each change (page id in `CLAUDE.md`).
