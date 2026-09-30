# DistroFi Landing Page Audit — 2026-09-30

**Page:** https://distrofi.org (live) · **Source:** `index.html` (repo copy is identical to live, 16,392 characters, so the 2026-09-10 accuracy fixes are already live)
**Scope:** conversion & messaging, accuracy vs the app, SEO & technical, design & accessibility
**Method:** live page loaded in a real browser at 1366px (desktop) and 375px (phone); source, resources, headings, links and supporting files checked; colour contrast computed (WCAG 2.1); every feature claim checked against `app.html` and `api/create-checkout-session.js`.

---

## Summary

The page is fast, readable and mostly honest. Load time is 0.4s to interactive and 0.8s fully loaded, the HTML is 6 KB, nothing overflows on phones, and the main button sits above the fold. The biggest problems are what happens *after* the click and what's missing around it:

1. **"Start budgeting free" lands on a login screen.** The promise is "free, start now"; the first thing a visitor sees is a sign-in form with "Continue as guest" as a small grey link.
2. **No Privacy Policy or Terms.** `/privacy` and `/terms` return 404, and the footer links to neither. That matters for a money app with accounts, Stripe subscriptions, push notifications and analytics.
3. **"Periods anchor to your actual payday" isn't true for everyone.** Monthly periods are calendar months and twice-a-month periods are fixed to the 1st–15th and 16th–end. Until today's fix is pushed, it also isn't true for weekly/every-2-weeks users without a saved payday.
4. **The hero screenshot shows the payday bug.** Its "Jul 5 – Jul 18" is a Sunday-to-Saturday period.
5. **No favicon**, so the browser tab and Google results show a blank icon.

---

## Findings by priority

### P1 — fix first (conversion and trust)

| # | Area | Finding | Recommendation | Who |
|---|---|---|---|---|
| 1 | Conversion | All three CTAs go to `/app`, which opens on a login form. "Continue as guest" is a small grey link. The page says "Start budgeting free" and "Set up your first pay period in under five minutes"; the first step is an account wall. (Also on the funnel backlog.) | Make "try it without an account" the default path: CTAs link to `/app?start=guest` (or similar) and the app skips the login form into setup for that link, with "Create an account to sync" offered after setup. Add "No account needed to try" under the hero button. | App change + copy (needs your OK) |
| 2 | Trust / legal | No Privacy Policy or Terms of Service (`/privacy`, `/terms`, `.html` variants all 404; nothing in the footer). The app collects accounts, budget data (Supabase), payments (Stripe), push subscriptions and analytics, and shows referral offers. | Publish a Privacy Policy and Terms, link both in the footer and in the app's Settings. I can draft plain-language versions from what the app actually does, but they need your review, and ideally a lawyer's, before going live. | Draft by me, approval by you |
| 3 | Accuracy | "Periods anchor to your actual payday" (FAQ, and the JSON-LD "Each pay period is anchored to your actual payday"), plus "Your plan is anchored to your real payday — not the 1st of the month" (How it works, step 01). In the app, **monthly** periods run 1st to end of month and **twice-a-month** are fixed at 1st–15th and 16th–end. Weekly/every-2-weeks are anchored only once today's fix ships (and only for users who've saved a payday). | Either (a) make monthly and twice-a-month periods follow the user's paydays in the app (backlog), or (b) reword to: "Weekly and every-2-weeks periods start on your actual payday. Twice-a-month and monthly follow the calendar." Don't claim it for everyone until it's true. | Copy now; app later |
| 4 | Accuracy / visuals | Hero screenshot (`screen-home.png`) shows **"Jul 5 – Jul 18"**, a Sunday–Saturday period (the payday bug), "2 days left", and a PRO badge. The other screenshots are from the same July capture. None show the desktop dashboard. | After the pending push, re-capture with `render.js` using a payday-aligned demo period and a free account, and add one desktop dashboard shot. | Me, after push |
| 5 | Technical | **No favicon.** `/favicon.ico` is 404 and there's no `<link rel="icon">`, so tabs, bookmarks and Google search results show a blank globe. | Add `<link rel="icon">` (SVG/PNG from the brand kit), `apple-touch-icon`, and a `favicon.ico`. The `/icons/` set already exists. | Me (quick win) |

### P2 — should fix

| # | Area | Finding | Recommendation | Who |
|---|---|---|---|---|
| 6 | Accessibility | Main button: white text on teal `#0C9488` is **3.75:1**, and **2.93:1** on hover. WCAG AA needs 4.5:1 for 16px text. | Button background `#0A857A` (4.52:1), hover `#0A7D73` (5.01:1). Same brand teal, slightly deeper; the outline button is unaffected. | Me (quick win) |
| 7 | Measurement | Landing page has **no analytics tag**, so landing visits and landing→app conversion aren't measured (the app now is). | Add `<script defer src="/_vercel/insights/script.js"></script>`. (Already on today's list.) | Me (quick win) |
| 8 | SEO | FAQ structured data doesn't match the visible FAQ: "How do I install DistroFi on my phone?" is only in JSON-LD, and "What happens when my pay period ends?" is only on the page. Google requires them to match. Google also shows FAQ rich results only for government and health sites since 2023, so this markup earns nothing anyway. | Make the JSON-LD mirror the visible FAQ, and add `SoftwareApplication` markup (name, category "FinanceApplication", operating system "Web", offers $0 / $2.99 / $4.99) so search engines understand it's an app and what it costs. Google only shows the app rich result (stars and price) once there are real ratings or reviews, so that part waits for genuine reviews. | Me (quick win) |
| 9 | SEO | No `robots.txt`, no `sitemap.xml` (both 404), no `<link rel="canonical">`. | Add all three (sitemap lists `/`). | Me (quick win) |
| 10 | Messaging | This week's features aren't on the page: payday-aligned periods (after push), pay-period and bill reminders that work, the desktop dashboard, and sync between phone and computer. | Add to the trust row and a short "Phone and computer, always in sync" feature block with the desktop screenshot. Ship after the push so every claim is true. | Me, after push |
| 11 | Accuracy | "Couples privacy" card says your income *stays* on your device. That's only true in the bills-only sharing mode; full sync shares income. The pricing card already calls it an "Income-privacy option". | Reword: "…while your income **can** stay on your device." | Me (quick win) |
| 12 | Trust | No social proof: no quotes, user counts or reviews. | Collect a few real quotes from beta users and add them with permission. Don't invent any. A short founder note ("I built this because monthly budgets never matched my paychecks") is honest and works well for this audience. | You supply |
| 13 | Conversion / clarity | Pricing cards have no buttons. The fine print says "7-day free trial" but checkout requires a card and auto-renews (`trial_period_days` 7, or 14 with a referral). | Add a button under each plan. Make the fine print: "7-day free trial, card required, cancel anytime before it ends and you won't be charged." Say it plainly on the page, not only at checkout. | Me (quick win) |

### P3 — nice to have

| # | Area | Finding | Recommendation |
|---|---|---|---|
| 14 | Performance | Five PNG screenshots total ~750 KB. No `width`/`height` (causes layout shift) and no lazy-loading for the four below the fold. The logo is an 1800×644 PNG (41 KB) shown at 123×44. | Convert to WebP (roughly 70% smaller), add `width`/`height`, `loading="lazy"` below the fold, and a right-sized logo. Load is already fast; this mainly helps slow mobile connections. |
| 15 | Security | Only HSTS is set. No Content-Security-Policy, `X-Frame-Options`/`frame-ancestors`, `Referrer-Policy`, `X-Content-Type-Options` or `Permissions-Policy`. | Add in `vercel.json` for the whole site. Roll out CSP carefully (report-only first), because the app loads Supabase, Google Fonts, jsDelivr and Stripe. |
| 16 | Semantics | No `<main>` landmark; empty `<p class="sub"></p>` in the FAQ; nav has no label. | Wrap content in `<main>`, remove the empty paragraph, add `aria-label="Primary"`. |
| 17 | Messaging | "No tracking pixels" is still true (Vercel Web Analytics is cookieless and doesn't identify people), but you now run analytics. | Optional: "Privacy-friendly analytics only. No cookies, no ad trackers." |
| 18 | Social sharing | Missing `og:site_name`, `og:image:alt`, `twitter:image:alt`. The og image itself is good and on brand. | Add the three tags. |

---

## What's working

- **Speed:** 0.4s to interactive, 0.8s fully loaded, 6 KB HTML.
- **Phone layout:** no horizontal overflow at 375px, and the main button is above the fold.
- **Headline:** "Budget by paycheck, not by calendar month" is clear and differentiated.
- **Page structure:** one H1 and a clean H2/H3 outline; every image has meaningful alt text.
- **Contrast:** body text passes comfortably (grey on navy 7.8:1, mint 11.5:1).
- **Accuracy:** the Sep 10 fixes are live, and the remaining feature claims check out in the code: avalanche/snowball, swipe-to-pay, transaction search, What-If calculator, CSV/PDF export, annual billing and the 7-day trial.
- **Visual identity:** the og share image is clean and on brand.

---

## Suggested fix order

1. **Quick wins now (no app changes):** favicon (#5), button contrast (#6), landing analytics tag (#7), structured data (#8), robots/sitemap/canonical (#9), couples wording (#11), pricing buttons and trial wording (#13), semantics and share tags (#16, #18), image dimensions and lazy-loading (#14, partial).
2. **Payday wording (#3):** reword now; revisit if monthly/twice-a-month get payday alignment.
3. **After the pending push:** new screenshots including desktop (#4), new-features block (#10).
4. **Needs your decision or input:** guest-first entry (#1), Privacy Policy and Terms (#2), testimonials (#12), security headers (#15).

---

## Status (updated 2026-09-30)

**Done in the working tree, pending push:** #3 payday wording (step 01, FAQ and structured data), #5 favicon (new multi-size `favicon.ico` at the site root built from the app icon, plus icon, apple-touch-icon and manifest links; the old `/icons/favicon.ico` was a blank placeholder), #6 button contrast (`#0A857A`, hover `#0A7D73`, plus a visible keyboard focus ring), #7 analytics tag, #8 structured data (FAQ matches the page; `SoftwareApplication` added), #9 `robots.txt`, `sitemap.xml` and canonical, #11 couples wording, #13 pricing buttons ("Start free", "Try Pro free", "Try Couples free") and plain trial terms, #14 partial (image dimensions, lazy-loading below the fold, reserved space so nothing jumps; WebP conversion not done), #16 `<main>`, nav label, empty paragraph removed, #18 share tags.

**Round 2, done in the working tree, pending push:** #1 guest-first entry (website "Start" buttons open `/app?start=guest`, straight into setup; "Create free account" offered in Account, Settings and after setup, keeping everything entered), #2 Privacy Policy and Terms at `/privacy` and `/terms`, linked from the footer, the sign-up checkbox and Settings (**needs Kirk's review, ideally a lawyer's, before pushing**), #4 new screenshots (payday-aligned Sep 25 to Oct 8, free account, 2x), #10 "New" block with the desktop dashboard screenshot, #14 WebP (about 310 KB total, was about 810 KB), #15 security headers (CSP in report-only mode for now), #17 analytics wording.

**Still open:** #12 real testimonials (Kirk to supply quotes from beta users, with permission). Later: switch the CSP from report-only to enforcing once preview and production show no console reports.
