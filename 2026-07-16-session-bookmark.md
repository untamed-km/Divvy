# DistroFi Session Bookmark — 2026-07-16 (supersedes 2026-07-06 bookmark)

Paste this + the original project context into a new chat to resume. Full history: Notion "DistroFi — App Changelog" and `2026-07-06-full-app-audit.md` / `2026-07-16-recommendations.md`.

## State of the repo

**Committed & deployed:** Batches 1–5 (audit fixes), 6–9 (data-model, security files, UX, visual), Markets/News/Portfolio removal (~530 lines — the feature was orphaned; Finnhub no longer used anywhere).

**In worktree, NOT pushed (Kirk's next action):** Batches 10–13:
- B10: error beacon → `api/log-error.js` (+vercel.json entry), `APP_VERSION='2026.07.16'` in Settings, `check.js` ship-check script, onboarding payday-anchor question.
- B11: `app-state-rls-migration.sql` (owner writes, household-partner reads).
- B12: cycle-end push — client sends `cycleEndDate`, `api/save-push-subscription.js` stores it, `api/send-bill-reminders.js` cron sends "pay period ended" once per period (needs `cycle-reminder-migration.sql`).
- B13: **bucket-carry bug fix** (new cycles used to wipe custom buckets/budgets to defaults — now definitions carry, transactions clear) + Pro per-bucket rollover toggle (next = baseBudget + leftover, overspend subtracts, floor 0, manual edit resets carry, `gateFeature('rollover')`).

## Kirk's checklist (blocking)
1. `node check.js` → verify diff in GitHub Desktop → push.
2. Supabase SQL editor, in order: `cycle-reminder-migration.sql` (required for B12), `polls-rls-migration.sql`, `app-state-rls-migration.sql` (test sync immediately after; rollback line inside).
3. Revoke old Finnhub key at finnhub.io (leaked in git history; app no longer needs any key).
4. Fix `.gitattributes`/`icons/.gitkeep` line-ending churn once (discard, re-save with LF, commit).
5. Post-deploy smoke test: onboarding payday question, bucket edit (rollover toggle w/ PRO badge), new-cycle keeps buckets, Settings shows version, force an error in console → appears in Vercel Logs.

## Next code items (agreed order)
1. **Guest-login data guard** — logging in on a device holding guest data silently overwrites local with cloud (`applyCloudState` replace branch). Add keep-local / use-cloud / merge-bills prompt at login when meaningful local data exists.
2. **Budget grade chip on Home** — surface `calcBudgetGrade()` (free) as engagement hook + Pro funnel.
3. **CSV import** — column-mapped transaction import; start fresh session.
4. RLS Phase 2 (`profiles`, `households` — mind the policy subquery note in app-state migration), Phase 3 (split private/shared state rows; removes bills-only backup trade-off).
5. Housekeeping: inline `checkLimit()` away, archive `2026-06-09-merch-marketplace-guide.md`, audit `admin.html`, trial-nudge timing rework (preview burns on first tap).

## Working rules for the next session (hard-won)
- **Never use Edit/Write on existing repo files** — the mount pads/truncates to the old byte length. Recipe: copy to /tmp, python replacements with `assert count(old)==expected`, `cat /tmp/fixed > file && truncate -s <bytes> file`, `md5sum` both, then `node check.js` (script exists now — use it, it encodes the old manual checks).
- New files via Write are fine. Deletion needs `mcp__cowork__allow_cowork_file_delete` once per session.
- If git diffs look impossible, compare `git hash-object file` vs `git rev-parse HEAD:file` — Kirk commits mid-session (as "fable"-style messages) and stale mount reads happen.
- Notion changelog entry after every code batch (page ID in project CLAUDE.md).
- Big block removals: anchor-based slicing with KEEP-definition guards + residual-reference sweep (see Markets removal in history).
- Escape all user text with `esc()`; dates with `localDateStr()`; whole-money `fmt0()`, exact `fmt()` — check.js bans the UTC date patterns.
