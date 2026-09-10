# DistroFi Session Bookmark — 2026-09-10

Status refresh. **No code changes since 2026-09-05** — `app.html` on the device is still 567,313 bytes (the What-If fix version). Everything from the 08-29 → 09-05 run is in the working tree, **still unpushed**. Full per-change detail is in Notion "DistroFi — App Changelog" and the `2026-09-05-session-bookmark.md`. Canonical project context now lives in **`DistroFi-Project-Kickoff.md`** (use that to start a new project).

## Shipped this session (all in `app.html`, unpushed)
- "Remaining" clarifier line + ⓘ explainer (home screen); kept the label, added "Left to spend after bills, savings & debt".
- Members → Deals: Robinhood (featured) + Ally referral cards added to `DEALS_PRODUCTS`.
- NEW: Emergency Fund calculator (Savings tab) — sizes target from actual essential spending; 3/6/12; self-contained "what counts" toggles; `kind:'emergency'` goal; dismissible suggestion; recalc link. Math unit-tested 13/13. Spec: `2026-08-30-emergency-fund-calculator-spec.md`.
- BUG FIX: home "Try the What-If calculator" nudge now opens the Summary screen (`snapshot`) where the calculator lives, not the Invest tab.

## Marketing assets (container + delivered)
- `distrofi-x-thread.md` — 9-tweet X launch thread, no em dashes, CTA to distrofi.org, each tweet mapped to a screenshot.
- `render.js` — Playwright screenshot tool (seeds realistic demo STATE, captures 9 phone-sized screens). Dark set: `/home/claude/shots-dark/`; light set: `/home/claude/shots/`.

## Still to do (Kirk)
- **Push** from GitHub Desktop — nothing above is live yet.
- **Confirm couples price** ($4.99 vs $5.99 in different places) before posting the X thread.

## Open (whenever)
- Inspect live localStorage for a stray duplicate pay period from the old doubling-bug fix.
- Ally deal copy pending real referral terms.
- EF: keyword-guess mis-tag risk (toggles are the fix); optional editor toggles; "Unallocated" APY accounting cleanup.
- What-If discoverability (buried on Summary); Deals hardcoded array → Supabase/JSON later.

## Working rules
- **Never Edit/Write repo files through the mount** (byte padding). Recipe: stage → python replace w/ match-count asserts → `node --check` the `<script>` block + confirm ends `</html>` → SendUserFile → `device_commit_files` with `expectedMtimeMs` → re-grep on device.
- `check.js` is STALE (checks `index.html`, not `app.html`). Notion changelog page id: `375005e2-bce7-8126-85b3-e7e6226ce731`.

> **Correction (2026-09-10, later):** the working tree WAS pushed. `main` is level with `origin/main` at 5605169, so everything listed above is live. Couples price resolved to $4.99 (the $5.99 figure appears only in notes, never in shipped code). Current status now lives in `DistroFi-Status-and-Backlog.md`.
