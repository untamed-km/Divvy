# DistroFi Full App Audit — 2026-07-06

Scope: complete read of `index.html` (7,228 lines, commit `a17b014`), plus `sw.js`, `vercel.json`, and repo structure. Syntax verified clean via `node --check` on the extracted script.

**Already handled today:** your local `index.html` was truncated (missing the last 97 lines vs. git HEAD — would have broken the entire app if committed). Restored from HEAD with your approval. Worktree is clean again.

Severity key: 🔴 Critical (broken in production) · 🟠 High (wrong money math / privacy / data loss) · 🟡 Medium (UX & correctness) · ⚪ Code quality

---

## 🔴 Critical — broken right now in production

**C1. `sw.js` — stray `h` breaks the cache-purge design.**
Line 14: `self.addEventListener('activate', event => {h` — that lone `h` throws a ReferenceError the moment the activate handler runs, so `caches.delete(...)` and `clients.claim()` never execute. The whole "old caches are wiped on every SW update" guarantee is silently dead. This is committed and deployed. Fix: delete one character.

**C2. Four constants used but never defined — three features silently dead.**
When the app was consolidated into `index.html`, these definitions were left behind in the old (unloaded) `screens.js`/`members.js`:
- `FINNHUB_KEY` (defined only in screens.js:2259) → every stock quote/spark/news fetch throws → **live stock prices and live news never load**. Users see the hardcoded demo prices (SPY $548.20 etc.) under a label that says "Live data · refreshes every 60s". Crypto still works (CoinGecko needs no key).
- `HOLDINGS_KEY` (only in members.js:11) → `getHoldings()` swallows the error and returns `[]`, but `saveHoldings()` throws → **"My Portfolio" can never save a holding**. Add Holdings appears to do nothing.
- `INSIGHT_CHECK_KEY` / `INSIGHT_DATA_KEY` (defined nowhere) → `checkProactiveInsights()` throws on its first line → **the Pro proactive-insight card never runs**.
Fix: define all four constants in index.html (and consider proxying Finnhub through `/api` instead of shipping the key client-side — the key is also sitting in the public GitHub repo).

**C3. "See all transactions" → tap to edit is broken.**
Line 1753: `onclick="openEditTxnModal(...);setTimeout(()=>openAllTransactions(...),50)"` — the edit modal renders, then 50 ms later the list modal overwrites it. Editing from the all-transactions view is impossible. The reopen should happen after save/close, not on click.

---

## 🟠 High — money math, privacy, data loss

**H1. "Bills & spending" sync mode still uploads income and debts.**
`buildSyncPayload()` (line 943) spreads `...STATE` and `...STATE.current`, so the full state — income, debts, 401(k) — is pushed to `app_state` even in bills-only mode. Only the *receiving* client filters. The UI promise "Income stays private — only bills and spending are shared" is false; the partner (or anyone with the anon key, given permissive RLS) can read it. Fix: strip non-shared fields before upload.

**H2. Leftover → "Move to savings" makes the new period start negative.**
`confirmNewCycle('savings')` pushes the leftover as `savings.extra` on the **new** cycle, and `remaining()` subtracts extra savings — so a $300 leftover starts the new period at −$300 before any income. The entry belongs on the archived cycle (all-time savings still counts history), or should be excluded from `remaining()`. "Roll into next period" (income line) is fine; the two options are inconsistent.

**H3. Bills due on the 29th–31st can drop out of the totals.**
`billInPeriod()` builds `new Date(y, m, 31)`, which rolls into the next month for short months, so a dueDay-31 bill in a 30-day month is excluded from `totalBills()` — Remaining quietly inflates. Clamp dueDay to the month's last day.

**H4. History math disagrees with live math.**
`renderHistory()` and `openCycleDetail()` compute remaining as `income − bills − savings − spent` (± debt), ignoring investments, goal contributions, and 401(k), and count all bills at face value (no `billInPeriod` filter, no annual-subscription ÷12). The archived "Remaining" badge won't match what the user saw during the period. Reuse one shared cycle-remaining helper.

**H5. Unescaped user text breaks the UI (self-XSS class).**
User-entered names are interpolated raw into `innerHTML` and inline `onclick`s in ~179 places. An apostrophe in a bill name ("Mom's rent") breaks `openBillHistory('${b.name...}')` — the existing "escape" on line 6553 is `.replace(/'/g,"'")`, a no-op. A double quote in a bucket label breaks `value="${b.label}"`. Fix: one `esc()`/`escAttr()` helper applied at interpolation sites; pass indexes instead of names to onclick handlers.

**H6. Period dates shift a day for UTC+ timezones.**
`newCycleData()` builds local-midnight Dates then calls `.toISOString().slice(0,10)` (UTC). In Europe/Asia the start/end dates come out one day early. Use a local `yyyy-mm-dd` formatter.

**H7. Goal indexes go stale.**
Investments reference goals by `goalIdx`; `deleteInvGoal()` splices the array without remapping, so tagged investments silently point at the wrong goal. Separately, `deleteInv()` decrements `goal.saved` by the investment amount, but tagged investments are credited *live* (never added to `saved`) — deleting one double-penalizes the goal. Give goals stable ids, or remap on delete and drop the `saved` decrement.

**H8. Onboarding writes the wrong schema.**
`_obComplete()` (line 3093) creates income as `{id,source,period}` (app expects `{label,amount,recurring}` → the income row renders "undefined"), bills with `dueDate:'1'` (app expects `dueDay` number), and the frequency id `'twicemonthly'` (app expects `'semimonthly'` — falls through by luck). A brand-new user's first experience is a half-broken budget. Align fields with the real schema.

**H9. Deleting a bucket (with all its transactions) has no confirmation.**
`deleteBucket()` is instant, from a modal button that's easy to hit. Same for `deleteInvGoal`/`deleteSavingsBucket`/`deleteBill`. Debt delete has a `confirm()`; the others should too (or an undo toast).

---

## 🟡 Medium — UX and correctness

**M1. Zero-budget buckets show "NaN% used".** `renderHome` divides by `b.budget` (default buckets ship with budget 0). Guard the division.

**M2. Upcoming-bills banner misses bills due in 1–2 days.** Line 6238 matches only `dueDay===today || dueDay===today+3` (and `getDate()` mis-rolls at month end). Should be a range check.

**M3. Spending-chart modal is dark-theme-only.** `openSpendingChart()` hardcodes `#2a2e42/#e2e8f0/#1a1d27` etc. — unreadable in light mode. Use the CSS variables like everywhere else.

**M4. Two different "Export data" rows in Settings.** One (JSON, Pro-gated) and one (CSV/PDF, free). Merge into one export sheet.

**M5. Wrong nav tab highlighted.** `showScreen('history', nav[4])` lights up **Debt** (nav is home/bills/spend/invest/debt); the advisor shortcut also passes `nav[4]`. Pass `null` or the right button.

**M6. Pay-frequency change bypasses the leftover flow.** `selectFreq()`'s "Start new period" calls `confirmNewCycle()` directly — no under-budget summary, no leftover prompt, leftover defaults to "leave".

**M7. The AI advisor gets wrong numbers.** `buildFinancialContext()` derives bucket keys from labels (`b.label.toLowerCase().replace(' ','')`) — custom buckets are keyed `b<timestamp>`, so per-bucket spend reads $0; last-period spend reads `b.spent`, a field that doesn't exist. The advisor confidently analyzes wrong data. Also everything is hardcoded `$` regardless of currency setting.

**M8. Poll fetches fire on every render.** `render()` → `renderMarketplace()` → `renderMiniPoll()` runs three Supabase REST calls after *every* save action. Render polls only when the Members tab opens (plus a short cache).

**M9. Proactive insight burns its daily slot before the API call.** `setLastInsightCheck()` runs before the fetch; a network failure means no insight until tomorrow. Set it after success.

**M10. Partner "who paid?" overlay commits on outside-click.** Tapping outside the modal marks the bill paid (unassigned) instead of cancelling. Outside-click should cancel.

**M11. Currency setting ignored across the app.** Hardcoded `$` in: debt screens, freq hints, annual-sub hints, onboarding, trends chart labels, section totals, "under budget" rows, AI context. Route through `fmt()`.

**M12. Goal "Add funds" accepts negative amounts** (typed minus sign bypasses `min="0"`); `confirmAddToSavings` checks only `!amt`.

**M13. Bill history matches by name.** Renaming a bill orphans its payment history. Give bills stable ids (you already do for debts).

**M14. `clearAllData()` wipes localStorage but not cloud state.** After "Clear all data", a signed-in user's next login restores everything from Supabase — surprising both ways. Decide and make it explicit.

**M15. Biweekly cycles anchor to a hardcoded date** (`2025-01-05`). Users paid on the alternate week get periods offset by 7 days, permanently. Needs an anchor-payday picker (also fits the product ideas below).

---

## ⚪ Code quality & security

**Q1. Delete the dead legacy files.** `render.js`, `screens.js`, `state.js`, `members.js`, `auth.js`, `style.css` aren't loaded by anything — and they're exactly why C2 happened (constants lived there). Archive them out of the repo to prevent future drift. (Verify admin.html/api don't reference them first — my grep says they don't.)

**Q2. Finnhub API key is committed to a public repo** (screens.js). Rotate it and proxy market calls through a `/api/market` function like you do for the advisor.

**Q3. Poll admin is client-side-only gating.** With permissive RLS and the anon key in the page source, anyone can insert/update/delete `polls` rows via REST — `POLL_ADMIN_IDS` only hides the UI. Until Supabase Auth + real RLS lands, at minimum add an RLS policy restricting `polls` writes to your user id.
**Note (unprompted but related):** the same applies to `app_state` — any visitor can read/write any row. This is your known backlog item; the audit just confirms it's the single biggest security gap.

**Q4. Minor dead/odd code:** `checkLimit()` is a no-op; duplicate `const cat/freq` in `saveBill()`; `_renderObStep()` ends with `;+'</div>'` (the closing div is never appended — browser auto-close saves it); duplicated 401k line in the SVG chart (5642–5643); `updateHiddenPin`/pin-box functions are vestigial; `MKT_AFFILIATE=[]` + `openMktAffiliate` unreachable; `openMktNews` references `n.time` which no MKT_NEWS entry has.

**Q5. Full re-render on every save.** `render()` runs all 11 screen renderers on any change. Fine at this size, but rendering only the active screen (plus home) would cut jank and the M8 network chatter in one move.

---

## Product suggestions

1. **Payday anchor setting** (fixes M15 and is a real onboarding win): "When was your last payday?" → anchors weekly/biweekly cycles correctly.
2. **Auto cycle rollover prompt as notification** — you already know `endDate` and have push infrastructure; a "Your pay period ended — start a new one?" push would drive retention.
3. **Undo toast pattern** — one `showUndoToast(label, undoFn)` covers H9/M12-class destructive actions cheaply.
4. **CSV import** — you export CSV; small importer for transactions would ease migration from other apps (and free-tier users would use export more if numbers were raw, not `$1,234.56` strings — current CSV is hard to spreadsheet).
5. **Proxy market data + honest labels** — after C2, either wire Finnhub via `/api/market` (hides key, shares cache across users) or relabel the stocks section "delayed/sample". Note Finnhub's free tier no longer serves `/stock/candle` (charts will 403 even with a key) — CoinGecko-style fallback needed for stock sparklines.
6. **Supabase Auth migration** stays the top structural item (unlocks Q3, real RLS, and safe partner sync). Your instinct that it's a bigger project is right; everything above is shippable before it.

---

## Suggested fix batches (conservative, each independently shippable)

- **Batch 1 — one-character & constants (ship today):** C1 (sw.js `h`), C2 (define 4 constants), M1 (NaN guard), M5 (nav index). Zero risk, all localized.
- **Batch 2 — money math:** H2 (leftover), H3 (dueDay clamp), H4 (shared remaining helper), M2 (upcoming range).
- **Batch 3 — trust & safety:** H1 (sync payload strip), H5 (escape helper), H9 (delete confirms), M10 (overlay cancel).
- **Batch 4 — polish:** C3 (edit-from-list), M3 (chart theming), M4 (merge exports), M6, M7, M9, M11.
- **Batch 5 — cleanup:** Q1 (remove dead files), Q4 (dead code), M8/Q5 (render scoping).

H6 (timezone), H7 (goal ids), H8 (onboarding schema), M13 (bill ids), M14 (clear-data semantics) each need a small design decision from you before implementing.
