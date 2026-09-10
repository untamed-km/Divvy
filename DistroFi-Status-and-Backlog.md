# DistroFi — Status & Backlog (living)

*The one place for "where things stand." Update at the end of every session. Evergreen architecture/rules live in **DistroFi-Project-Kickoff.md**.*

**Last updated:** 2026-09-10
**`app.html`:** 567,313 bytes, last modified 2026-09-03
**Git:** `main` is level with `origin/main` at `5605169` — **everything below is pushed and live.** Working tree has only untracked `.md` notes plus whitespace noise in `.gitattributes` and `icons/.gitkeep`.

---

## Shipped and live (08-29 → 09-05 run)

- **Emergency Fund calculator** (Savings tab) — sizes a 3/6/12-month target from actual essential spending; self-contained "what counts as essential?" toggles; creates a `kind:'emergency'` savings goal; dismissible suggestion card; recalc link. Math unit-tested 13/13. Spec: `2026-08-30-emergency-fund-calculator-spec.md`.
- **"Remaining" clarifier** — kept the label, added "Left to spend after bills, savings & debt" plus an ⓘ explainer on the home screen.
- **Members → Deals** — Robinhood (featured) + Ally referral cards added to `DEALS_PRODUCTS`.
- **Bug fix** — the home "Try the What-If calculator" nudge now opens the Summary screen (`snapshot`) where the calculator lives, instead of the Invest tab.

Per-change detail: Notion "DistroFi — App Changelog" (page id `375005e2-bce7-8126-85b3-e7e6226ce731`).

## Marketing assets produced

- `distrofi-x-thread.md` — 9-tweet X launch thread, no em dashes, CTA to distrofi.org, each tweet mapped to a screenshot.
- `render.js` — Playwright screenshot tool; 9 phone-sized screens, dark and light sets.
- Thread currently says "from $2.99/mo," which is safe. Couples is **$4.99** across every shipped surface; the $5.99 figure only ever existed in old session notes. Worth one look at the Stripe price object before quoting a hard number publicly.

---

## Backlog

### Security (highest priority on this list)
- **App password scheme is brute-forceable.** `derivePassword(username,pin)` returns `'df_'+username+'_'+pin+'_2024'` and the PIN is 4 digits, so every user's real Supabase password is a deterministic function of a public username and one of 10,000 values. The anon key ships in the page source. Supabase's built-in auth rate limiting is the only mitigation. Does not affect the standalone `/admin` account (real random password) — see `2026-09-10-admin-account-setup.md`.
- **`polls` writes are gated client-side only.** `POLL_ADMIN_IDS` hides the UI; with the anon key, anyone can insert/update/delete rows via REST. Needs an RLS policy restricting writes to the owner id.

### Data hygiene
- Inspect live `localStorage` for a stray duplicate pay period left by the old "closing a period on its last day" doubling bug. The fix was forward-looking and won't retro-remove an existing duplicate.

### Emergency Fund follow-ups
- Bucket "essential" detection is keyword-guessed, so mis-tagging is possible. The toggle panel is the mitigation; adding real `essential` toggles to the bill and bucket editors is the fix.
- Clean up "Unallocated" APY accounting.

### Discoverability
- What-If calculator is buried on the Summary screen. Needs a clearer entry point.

### Content ops
- Deals are a hardcoded `DEALS_PRODUCTS` array. Moving them to Supabase or a JSON file would let offers be added and expired without shipping the app.
- Ally deal copy is generic, pending real referral terms.

### Larger roadmap (from README)
- Referral rewards system.
- Wrap the PWA as native iOS/Android.
- Deferred/uncertain: live market data and news feed.
