# DistroFi — Status & Backlog (living)

*The one place for "where things stand." Update at the end of every session. Evergreen architecture/rules live in **DistroFi-Project-Kickoff.md**.*

**Last updated:** 2026-09-10
**`app.html`:** 566,693 bytes · **`index.html`:** 16,449 bytes — both edited 2026-09-10, **NOT yet pushed**
**Git:** the 08-29 → 09-05 run is live at `5605169`. The two files above are newer than that and need a push from GitHub Desktop.

---

## Shipped and live (08-29 → 09-05 run)

- **Emergency Fund calculator** (Savings tab) — sizes a 3/6/12-month target from actual essential spending; self-contained "what counts as essential?" toggles; creates a `kind:'emergency'` savings goal; dismissible suggestion card; recalc link. Math unit-tested 13/13. Spec: `2026-08-30-emergency-fund-calculator-spec.md`.
- **"Remaining" clarifier** — kept the label, added "Left to spend after bills, savings & debt" plus an ⓘ explainer on the home screen.
- **Members → Deals** — Robinhood (featured) + Ally referral cards added to `DEALS_PRODUCTS`.
- **Bug fix** — the home "Try the What-If calculator" nudge now opens the Summary screen (`snapshot`) where the calculator lives, instead of the Invest tab.

Per-change detail: `CHANGELOG.md` in the repo root (canonical), mirrored as an index-only Google Doc in the `DistroFi` folder in Drive. Notion is retired.

## Marketing assets produced

- `distrofi-x-thread.md` — 9-tweet X launch thread, no em dashes, CTA to distrofi.org, each tweet mapped to a screenshot.
- `render.js` — Playwright screenshot tool; 9 phone-sized screens, dark and light sets.
- Thread currently says "from $2.99/mo," which is safe. Couples is **$4.99** across every shipped surface; the $5.99 figure only ever existed in old session notes. Worth one look at the Stripe price object before quoting a hard number publicly.

---

## Changelog

Canonical: **`CHANGELOG.md`** in the repo root. Git-tracked, appended at the bottom, newest last. Migrated in full from Notion on 2026-09-10 (201 headings, v36 through today), preserved verbatim apart from un-escaping `$` and stripping Notion auto-links.

Drive mirror: **DistroFi — App Changelog** in the `DistroFi` folder in My Drive (file id `1r2G9ELEy_MwN7jcx1NXdG65LdDftvKiRMwaROm6TCas`). Index only, not full text. The Drive connector cannot append to a document, so every republish means passing the whole thing through the conversation, which is why the mirror stays small. Regenerate it when the index has drifted, not every session.

Notion is retired and read-only. The `_superseded/` folder holds the parked entry from before the move.

---

## Backlog

### Security (highest priority on this list)
- **App password scheme is brute-forceable.** `derivePassword(username,pin)` returns `'df_'+username+'_'+pin+'_2024'` and the PIN is 4 digits, so every user's real Supabase password is a deterministic function of a public username and one of 10,000 values. The anon key ships in the page source. Supabase's built-in auth rate limiting is the only mitigation. Does not affect the standalone `/admin` account (real random password) — see `2026-09-10-admin-account-setup.md`.
- **`polls` writes are gated client-side only.** `POLL_ADMIN_IDS` hides the UI; with the anon key, anyone can insert/update/delete rows via REST. Needs an RLS policy restricting writes to the owner id.

### Landing page accuracy — FIXED 2026-09-10 (unpushed)
Audit: `2026-09-10-landing-page-accuracy-audit.md`. Both entries are logged in `CHANGELOG.md`.
- **History cap removed.** `renderHistory()` now shows all archived cycles to everyone. Decision: records are free, the analysis layer (Spending Trends, gated after 3 periods) is what Pro sells. This made the "no caps" claims true, so they stayed on the page.
- **index.html: 12 copy edits.** Fixed the false "no card required", export, auto-start and "no ads, ever" claims; refreshed the competitor range to $10–18; added investment goals + JSON backup to the Pro list, annual billing, and the Emergency Fund calculator. JSON-LD updated to match.

### Still open from that audit
- **`payment_method_collection`** is unset in `create-checkout-session.js`, so trials require a card. Copy now describes the `gateFeature()` free preview instead, which is accurate. Revisit a genuine no-card trial as a post-launch growth experiment once there is a trial-to-paid baseline; it needs `payment_method_collection:'if_required'` plus `subscription_data[trial_settings][end_behavior][missing_payment_method]`.
- **`stripe-webhook.js` does not handle `customer.subscription.updated`** — fine today, but it is the first gap to close before changing trial mechanics.

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
