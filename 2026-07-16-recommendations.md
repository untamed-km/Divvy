# DistroFi — Final Recommendations & Suggestions
*2026-07-16 · follows the full audit (2026-07-06) and fix batches 1–9 + Markets removal*

## Where the app stands

In the last ten days: two production-breaking bugs fixed, three silently-dead features found (and one deliberately removed), the money math made consistent everywhere, the privacy promise made true, ~60 injection-prone interpolation sites escaped, stable IDs and migrations added, currency support completed, and ~900 lines of dead code deleted. The codebase is meaningfully healthier than when the audit started. What follows is forward-looking — no rehash of completed work.

---

## 1. This week (janitorial, ~30 minutes total)

1. **Revoke the Finnhub key** at finnhub.io. It's in public git history and now serves nothing. No replacement needed.
2. **Run `polls-rls-migration.sql`** in the Supabase SQL editor (step 0 in the file first).
3. **Push the pending commit** (Markets removal) if you haven't.
4. **Kill the line-ending noise permanently:** `.gitattributes` and `icons/.gitkeep` show as modified in every session. Run once in GitHub Desktop's terminal-free flow: discard them, then commit a `.gitattributes` saved with LF endings. This stops the churn.
5. **Smoke-test after deploy:** Members tab (hub/Learn/Deals/Merch), Invest tab, light-mode modals, an expense delete (Undo pill), biweekly frequency change (payday field).

## 2. Make silent breakage impossible (highest-leverage engineering)

The audit's biggest lesson: three features were dead in production for weeks and nothing told you. Two cheap defenses:

**a. A 20-line error beacon.** Add `window.onerror`/`unhandledrejection` handlers that POST `{message, source, line, version}` to a tiny `/api/log-error` (or even Formspree, which you already use). The missing-constants bug would have surfaced the first day. Include an `APP_VERSION` constant bumped on each deploy and shown in Settings — it also lets you correlate user bug reports with deploys.

**b. A pre-push check script.** Everything I ran by hand each batch, in one file (`check.js`, run with `node check.js`): extract the script block, `node --check` it, verify the file ends with `</html>`, grep for a small list of banned patterns (undefined-constant style references). Half the incidents this month were write-truncation or drift — this catches both in two seconds. *This is also a strong candidate for a Claude Skill* — "DistroFi ship check" — so any future session automatically verifies before you commit; consider adding it to your Skills.

**c. Feature-flag instead of unlinking.** Markets rotted because the UI was unlinked while the code stayed. Next time a feature comes out of rotation, delete it in the same commit (git keeps it), or gate it behind a single `FEATURES={markets:false}` object so dead code is impossible to miss.

## 3. Architecture: the Supabase Auth/RLS milestone

This stays the most important structural item, and it's smaller than your notes assume: your "custom auth" already creates real Supabase sessions (synthetic email + derived password), so `auth.uid()` works today — the polls migration proves it. A phased path with no big-bang rewrite:

1. **Phase 1 (one evening):** RLS on `app_state` — `user_id = auth.uid()` for writes; reads allowed for owner OR members of the same active household (a `households` join in the policy). Guests lose nothing (they never had cloud rows).
2. **Phase 2:** RLS on `profiles` and `households` similarly.
3. **Phase 3 (enables real partner privacy):** split `app_state` into a private row and a `shared_state` row per household. This removes the bills-only-mode backup trade-off from Batch 3 — private data backs up fully while only the shared row syncs to the partner.

One user-facing edge to fix alongside: **logging in on a device that has guest data overwrites the local budget with the cloud copy.** Detect meaningful local data at login and ask ("Keep this device's budget / Use cloud copy / Merge bills").

## 4. Product roadmap (ordered by impact ÷ effort)

1. **Payday anchor in onboarding.** The picker exists now (Batch 8), but new users never see it. Add "When was your last payday?" to onboarding step 1 for weekly/biweekly — periods line up correctly from day one. ~20 lines.
2. **Cycle-end push notification.** You already have push infra + a daily cron (`send-bill-reminders`). Include `endDate` in the subscription payload and send "Your pay period ended — start a new one?" This is your cheapest retention lever: the app's value resets every cycle, and users who miss the rollover drift away.
3. **Per-bucket rollover option.** "Unused Food budget rolls into next period" is the most-requested feature in every budgeting-app review section, fits your cycle model naturally (a `rollover` flag consumed by `confirmNewCycle`), and is a credible Pro feature.
4. **CSV import.** You export clean CSV now; a small importer (label/amount/date/category mapping) removes the biggest switching cost for users coming from spreadsheets or other apps.
5. **Trial→paid nudge timing.** `gateFeature` burns the single free preview on first tap, possibly weeks before the user is invested. Consider: free previews reset monthly, or trigger the paywall at moments of demonstrated value (3rd advisor question, 4th period tracked) instead of first touch.
6. **Budget grade on the Home screen.** `calcBudgetGrade()` is nice work that only Pro users see in the Members hub. A compact grade chip on Home (free, with "see why → " going to Members for Pro detail) is a daily engagement hook and an organic Pro funnel.
7. **If Markets ever returns:** rebuild lean — one `/api/market` proxy (the deleted file is in git history), CDN-cached, rendered only on tab open, behind a feature flag. Don't resurrect the old always-rendered version.

## 5. Housekeeping (someday, low priority)

`checkLimit()` is a no-op kept for call-site compatibility — inline it away next time you're in those functions. `savingsBuckets` lack stable IDs (harmless today; add if they ever get cross-referenced like invGoals). The `merch-marketplace-guide.md` doc in the repo root references the old marketplace structure — update or archive. Onboarding never sets `payAnchor` (see roadmap #1). `admin.html` (38KB) wasn't audited this round — worth a pass if you actively use it, since it shares the Supabase anon key.

## 6. Process notes

The changelog discipline (Notion entry per change) held up well across ~15 changes and made the "wait, who committed what?" moments instantly resolvable — keep it. The sandbox gotchas (write-padding, deletion permission, stale git reads) are documented in the session bookmark; fold them plus the ship-check into a skill and future sessions start at full speed. And when you next paste project context into a fresh chat, include `2026-07-06-session-bookmark.md` and this file — together they're the complete current state.

*Standard caveat: the monetization/pricing thoughts above are product observations, not financial advice.*
