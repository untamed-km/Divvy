# distrofi.org Landing Page — Accuracy Audit

*2026-09-10. Every claim on the live landing page checked against `app.html`, `/api/`, and current competitor pricing. Live page confirmed identical to local `index.html`.*

**Headline:** the page is well written and most of it checks out. But **four claims are contradicted by your own code**, and two of them sit in the pricing block, which is the worst place to be wrong.

Three of the four also appear in the page's **JSON-LD structured data**, which means Google can surface the incorrect text directly in search results.

---

## 🔴 Fix before any launch push

### 1. "No caps" and "Full history" on the Free tier — not true

**On the page (four places):**
- Free plan: "Full history & exports" · "Forever. No caps."
- Pricing sub: "DistroFi's core is free with no caps"
- FAQ + JSON-LD: "Core tracking — pay periods, bills, spending buckets, savings, debt, history — is free forever with no quantity caps."

**In the code** (`renderHistory()`):

```js
const histToShow = isPro() ? STATE.history : STATE.history.slice(-2);
if (!isPro() && STATE.history.length > 2) {
  // "+N older cycles locked" → "Upgrade to Pro to view full history"
}
```

Free users see **the last 2 archived periods**. Everything older is behind a lock icon.

There's a second, separate problem: your **in-app paywall modal** lists `'Full pay period history'` in its `freeItems` array. So the app tells users the same wrong thing the landing page does. Both need to change, or the cap does.

**Decision to make:** is the 2-period cap intentional? If yes, the copy has to say so. If no, delete the cap and the copy becomes true for free.

- If keeping the cap → Free bullet becomes "Last 2 pay periods of history", drop "No caps" everywhere, and fix `freeItems` in `app.html`.
- If dropping the cap → one-line change to `renderHistory()`, and all four page claims become accurate as written.

### 2. "No card required to try" — not true

**On the page:** pricing fine print, "7-day free trial · Cancel anytime · **No card required to try.**"

**In the code:** `startTrial()` goes straight to Stripe Checkout.

```js
function startTrial(tier){ startStripeCheckout(tier,_checkoutCadence); }
```

```js
mode: 'subscription',
'subscription_data[trial_period_days]': referred ? '14' : '7',
```

`payment_method_collection` is never set anywhere in `/api/`. Stripe's default for a subscription is `always`, so **Checkout asks for a card.** The 7-day figure is correct; the no-card part isn't.

There *is* a real no-card try in the app — `gateFeature()` grants one free preview of each Pro feature before the paywall. That's a genuinely good thing, and it's what the fine print should describe.

**Two ways to fix:**
- **Copy fix (safe, today):** "7-day free trial · Cancel anytime · Try every Pro feature once, free, before you subscribe."
- **Product fix:** add `payment_method_collection: 'if_required'` to the checkout session, and the current sentence becomes true. Be aware this materially lowers trial-to-paid conversion, so it's a business call, not just a code change.

Of everything here, this is the one I'd fix first. "No card required" next to a checkout that requires a card is the kind of claim that generates chargebacks and app-store complaints.

### 3. "Export everything as CSV, PDF, or JSON anytime. No lock-in." — overstated

**In the code:**

| Export | Gated? | Scope |
|---|---|---|
| CSV | Free | Current period only |
| Print / Save as PDF | Free | Current period only |
| JSON backup | **Pro** (`gateFeature('export')`) | Full data |

The export modal's own subtitle reads "Download your full budget for **the current period**." And your paywall lists `'Data export (JSON)'` under Pro Solo.

So the only export that is actually "everything" is the one behind the paywall — which makes "No lock-in" the weakest sentence on the page.

**Suggested:** "Export your budget as CSV or print to PDF anytime. Full JSON backup on Pro. No lock-in." Also drop "exports" from the Free plan bullet, or qualify it.

### 4. "The next period starts automatically" — not true

**On the page (three places):** step 04 "The next period starts automatically on your payday." · FAQ "the next period starts automatically." · JSON-LD, same.

**In the code:** there is no auto-start. Every path calls `startNewCycle()` from a user tap, and the app itself says so:

> "Pay period has ended — **Tap to start a new pay period**"

**Suggested:** "When your period ends, DistroFi archives it and prompts you to start the next one — one tap, and you choose what happens to any leftover money." That's accurate and arguably a better sell, since the leftover prompt is a real feature.

---

## 🟡 Worth changing

### 5. "No ads, ever" vs. Members → Deals

The privacy card says: "No ads, ever. You are the customer, not the product. **The free tier is funded by Pro subscriptions**, not by selling your attention or your data."

The app now ships a **Deals** screen of monetized partner offers (Robinhood, Webull, Ally), described in-app as "partner offers," with copy like "Sign up for Robinhood with this link and we'll both get to pick our own free gift stock."

**Credit where due:** the app *does* disclose this — "may earn a referral fee if you sign up. We only feature products we…" That's the right thing and it keeps you clear of FTC endorsement problems inside the app.

But the landing page claim is absolute and the funding sentence is now incomplete: the free tier is funded by Pro subscriptions **and referral fees**. No ad network, no data selling, no behavioral targeting — all still true and all still worth saying. The absolute isn't.

**Suggested:** "No ad networks, no tracking, no data selling. We don't sell your attention or your information. Some partner offers in the app earn us a referral fee, and we label them."

That's a stronger claim than "no ads, ever," because it survives scrutiny.

### 6. "Comparable apps run $8–15/month" — stale on both ends

Current 2026 monthly pricing: EveryDollar Premium **$17.99**, YNAB **$14.99**, Monarch **$14.99**, PocketGuard **$12.99**, Goodbudget Premium **$10**.

Nothing mainstream is at $8 anymore, and the top has moved past $15. The current range **understates** your competitors, which weakens your own pitch.

**Suggested:** "Comparable apps run $10–18/month."

---

## 🟢 Smaller notes

- **Investment goals are Pro** (`gateFeature('invgoals')`), but step 02 lists "investments" as part of the normal planning flow with no Pro tag. You tag rollover honestly ("Rollover is a Pro feature") — do the same here.
- **Annual billing isn't mentioned.** The app has a monthly/annual toggle with a "2 months free" badge. That's roughly $29.90/yr solo and $49.90/yr couples, and it makes the page's headline price look better, not worse. Free win.
- **Referred users get 14 days,** not 7 (`referred ? '14' : '7'`). Not wrong to say 7, but the referral program is invisible on this page.
- **The Emergency Fund calculator isn't mentioned anywhere.** It's your newest and most concrete feature and it's live. It deserves a slot in the features section.

---

## ✅ Verified accurate

Checked against code and confirmed correct: weekly / biweekly / semi-monthly / monthly pay frequencies · savings waterfall filling top to bottom · target dates showing on-track vs behind · avalanche and snowball strategies · extra-payment slider and lump-sum what-ifs · credit-utilization display with the 30% nudge · swipe-to-pay on bills · push reminders at 3 days out and day-of · annual subscriptions amortized monthly (`billAmt()`) · transaction search across history · who-paid-what for couples (`paidBy`) · income-privacy option (`syncMode='bills'`) · leftover money choice when a period closes · rollover correctly tagged Pro · spending trends correctly tagged Pro (free gets 3 periods) · AI advisor correctly tagged Pro and correctly disclaimed as not financial advice · $0 / $2.99 / $4.99 pricing · 7-day trial length · PWA install steps for iOS, Android and desktop · no bank linking, no Plaid, no aggregators.

---

## Suggested order of work

1. Decide the history cap question — it's the only one that's a product decision, and it changes what the copy should say.
2. Fix the "no card required" line (copy fix takes two minutes; the Stripe change is a business call).
3. Fix the export and auto-start sentences.
4. Reword the ads card and update the competitor range.
5. Update the JSON-LD block to match — it currently repeats three of the four wrong claims.
6. Add the Emergency Fund calculator and annual pricing.

Items 2–6 are all `index.html` copy edits I can make in one pass whenever you want. Item 1 needs your call first.
