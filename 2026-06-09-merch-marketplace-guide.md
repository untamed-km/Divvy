# DistroFi Merch Shop & Marketplace — Implementation Guide

## What Was Added to index.html

Eight targeted edits — all inline, no new files, no frameworks.

| # | What changed | Location |
|---|---|---|
| 1 | `MERCH_PRODUCTS` array (4 items) | Before `DEALS_PRODUCTS` |
| 2 | 2 new items in `SHOP_PRODUCTS` (guide + debt plan) | Inside `SHOP_PRODUCTS` |
| 3 | `merch` added to `MEMBERS_TITLES` | `MEMBERS_TITLES` const |
| 4 | `'merch'` added to `showMembersView` views list | `showMembersView()` |
| 5 | Merch hub tile added to hub cards grid | `renderMarketplace()` |
| 6 | Merch rendering section (Pro-gated) | `renderMarketplace()` |
| 7 | `openMerchProduct(i)` + `copyMerchCode()` functions | After `openShopProduct` |
| 8 | `#members-merch` + `#mkt-merch` divs | HTML structure |

---

## Gating Logic

| Plan | Merch view | Discount code |
|---|---|---|
| Free | Blurred teaser + "Upgrade to unlock" CTA | None |
| Pro Solo | Full shop | `DISTROFI10` (10% off) |
| Pro Couples | Full shop | `DISTROFI15` (15% off) |

The discount code is copyable via `navigator.clipboard.writeText()` with a toast fallback.

---

## Print-on-Demand Recommendation: **Printful**

For a PWA with no dedicated backend, Printful is the right call.

**Why Printful over Printify/Gelato:**

- **Hosted storefront** — Printful's free pop-up store (`your-brand.printful.me`) works as the checkout destination. Zero server needed. You just link out from the app.
- **No inventory** — every product is made on demand; you pay only when a customer orders.
- **Discount codes** — Printful supports store-wide percentage-off codes natively. Set `DISTROFI10` and `DISTROFI15` in your Printful dashboard → Promotions.
- **Reliable quality** — higher average quality floor than Printify's network of third-party printers.
- **Gelato** is worth considering if you have a global audience (better EU/APAC delivery), but its discount code system is less flexible.

**Setup steps (15 minutes):**

1. Create a free account at printful.com
2. Go to Stores → Create a pop-up store → set your URL (e.g., `distrofi.printful.me`)
3. Add products, upload designs, set prices
4. Go to Promotions → Create a discount code → add `DISTROFI10` (10%, no minimum) and `DISTROFI15` (15%, no minimum)
5. Update `url:` in each `MERCH_PRODUCTS` entry to point to your Printful store URL

**For deeper integration later** (without a backend): Printful has a public API and supports Stripe webhook-based order fulfillment. A Vercel Edge Function can relay orders — no persistent server needed.

---

## Marketplace (Shop + Deals tabs)

The `shop` view now contains 5 items:

| Product | Type | Price |
|---|---|---|
| Budget Master Template | Excel/Sheets | $9 |
| Financial Planning Worksheet Pack | 5-sheet bundle | $14 |
| Pro Export Add-on | Future feature | $7 (coming soon) |
| Zero-Based Budget Guide | PDF | Free |
| Debt Payoff Masterplan | PDF + Excel | $12 |

**Recommended hosting for digital products:** [Gumroad](https://gumroad.com) — free tier, instant payouts, handles VAT, no backend needed. Update `url:` fields to your Gumroad product links.

The `deals` view already has 4 affiliate offers (SoFi, Webull, Coinbase, Upside). These are wired and live.

---

## Branding Concepts

### 1. "Budget Like a Boss" Tee — `$28`
**Colorway:** Dark heather gray body / Indigo `#6366f1` wordmark  
**Slogan:** *Budget Like a Boss*  
**Design direction:** Clean sans-serif wordmark centered on chest. Small DistroFi "D" monogram on sleeve. The indigo matches the app's `--accent` exactly — wearable brand consistency.

### 2. "Pay Period Player" Hoodie — `$52`
**Colorway:** Charcoal `#1e1e2e` / Purple `#a855f7` embroidery  
**Slogan:** *Pay Period Player*  
**Design direction:** Subtle chest logo, large back type. References the pay-period-first mental model that makes DistroFi different. Speaks to the user who's "in the game" financially.

### 3. "Zero-Based Living" Cap — `$32`
**Colorway:** Black structured / Green `#22c55e` embroidery  
**Slogan:** *Zero-Based Living*  
**Design direction:** Small embroidered "distrofi" in green on the front panel. Clean, minimal — the hat your users wear without explaining it. Green signals "on budget."

### 4. Finance Goals Sticker Pack — `$8`
**Colorway:** Full color on white or transparent backing  
**Slogans on stickers:** *Build Wealth*, *Pay Period Mindset*, *Zero Out*, *Distro the Bag*, DistroFi wordmark, DistroFi "D" logo  
**Design direction:** Mix of bold type stickers and icon stickers. High-contrast indigo/green/purple palette. Low price point = easy first purchase + high brand impressions per dollar.

---

## Next Steps

- [ ] Create Printful account and build the store
- [ ] Upload designs (or use Printful's design tool for mockups)
- [ ] Set `DISTROFI10` and `DISTROFI15` codes in Printful → Promotions
- [ ] Update `url:` fields in `MERCH_PRODUCTS` to your real store URLs
- [ ] Create Gumroad account and list digital products — update `url:` in `SHOP_PRODUCTS`
- [ ] Consider a Claude Skill for "auto-populate new merch products from a Printful API call" if you expand the catalog

> **Skill idea:** This is a strong candidate for a repeatable Claude Skill — "Sync DistroFi merch catalog from Printful" — that fetches your live product list via the Printful API and updates `MERCH_PRODUCTS` automatically. Worth building once your store is live.
