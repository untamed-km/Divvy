# DistroFi Session Bookmark — 2026-07-06

Paste this (with the original project context) into a new chat to resume.

## What happened this session

Full app audit + 5 fix batches. Findings doc: `2026-07-06-full-app-audit.md` (repo root) — read it for details on any item below.

**Committed by Kirk** (3cbf5d2 "fable", 096babb, 77e8d86): Batches 1–4.
- Batch 1: sw.js stray `h` fix (cache purge works again); defined 4 missing constants (FINNHUB_KEY, HOLDINGS_KEY, INSIGHT_CHECK/DATA_KEY) — revived live stock prices, My Portfolio saves, Pro proactive insights; NaN guards on zero-budget buckets; nav-index fixes (incl. would-crash `screen-advisor` target → Invest tab).
- Batch 2: leftover→savings lands on archived cycle (new period no longer starts negative); dueDay 29–31 clamped to month length; new `cycleStats()`/`billInPeriodFor()` — history math now matches live `remaining()`; upcoming-bills banner does a real 0–3 day range.
- Batch 3: bills-only sync payload actually stripped (income/debts/401k/history never uploaded in that mode; new `applyCloudState()` on all 4 pull paths; acceptInviteCode uses stripped payload; fixed stale-C bug in initHousehold). **Trade-off:** bills-only users' cloud backup now holds bills+buckets only. New `esc()` helper applied at ~60 sites (apostrophes/quotes in names no longer break UI). Delete confirmations on buckets/bills/goals/investments. Who-paid overlay outside-click cancels.
- Batch 4: edit-from-"See all transactions" works (fromList flag, returns to list); spend chart theme-aware; single Export row (CSV/PDF/JSON in one sheet); freq-change runs full leftover flow; advisor gets real bucket data; insight daily-slot only burned on API success; `fmt0()` + ~28 hardcoded `$` sites now respect currency.

**In worktree, NOT yet committed** (verify diff in GitHub Desktop, then push):
- Batch 5: deleted 6 dead legacy files (render.js, screens.js, members.js, auth.js, state.js, style.css — recoverable from git); renderMarketplace early-returns when Members screen not visible (kills per-save poll fetches); 60s active-poll cache (Poll Admin busts it); dead code removed (saveBill dup consts, onboarding `;+'</div>'`, dup 401k chart path, `n.time`, openMktAffiliate/MKT_AFFILIATE).
- Plus line-ending noise on `.gitattributes` / `icons/.gitkeep` — safe to discard.

Notion changelog "DistroFi — App Changelog" has entries for the audit + all 5 batches.

## Open items (need Kirk's design input before implementing)
- **H6** timezone: `newCycleData()` uses `toISOString()` on local dates → period dates shift a day for UTC+ users.
- **H7** goals referenced by index (`goalIdx`) — deleting a goal mis-tags investments; `deleteInv` also wrongly decrements `goal.saved`. Needs stable goal IDs.
- **H8** onboarding writes wrong schema (income `{id,source,period}` vs `{label,amount}`; `dueDate:'1'` vs `dueDay`; `'twicemonthly'` vs `'semimonthly'`).
- **M13** bill history matches by name → renaming orphans history. Needs bill IDs.
- **M14** "Clear all data" wipes localStorage but not cloud → next login restores. Decide semantics.

## Security follow-ups (do soon)
1. **Rotate the Finnhub API key** — the old one is in git history (screens.js, public repo) and now also in index.html. Better: proxy via `/api/market` serverless fn like `/api/advisor`.
2. **RLS policy on `polls`** — admin gating is client-side only; anon key can write. Restrict writes to user_id `25be4a45-d04a-4f3b-a308-abd3d0c7ee55` until Supabase Auth migration.
3. Supabase Auth migration remains the big structural item (real RLS for app_state, proper shared/private rows for partner sync).

## Sandbox gotchas learned (important for next session)
- The mount **pads/truncates writes to the old byte length** — never trust Edit/Write for index.html. Recipe that works: build fixed file in `/tmp` with python (assert `count(old)==expected` per replacement), then `cat /tmp/fixed > file && truncate -s <exact-bytes> file`, then `md5sum` both and `node --check` the extracted script (lines 758 → last `^</script>`).
- File deletion needs `mcp__cowork__allow_cowork_file_delete` first; `git checkout --` can't unlink (use `git show HEAD:file > file`).
- If git reports stale/odd diffs, compare `git hash-object file` vs `git rev-parse HEAD:file` before panicking — Kirk may have committed mid-session.
- Product ideas from the audit (payday anchor, undo toasts, CSV import, cycle-end push notification) are in `2026-07-06-full-app-audit.md` §Product suggestions.
