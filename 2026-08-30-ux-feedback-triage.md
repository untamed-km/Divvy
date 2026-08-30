# DistroFi — UX Feedback Triage (2026-08-30)

Status of each recommendation in `DistroFi_UX_Feedback_Summary.docx`, checked against the current `app.html`.
**Legend:** ✅ Done · 🟡 Partial (foundation exists, gap noted) · ⬜ To-do

> Headline: The **Debt tab already implements most of this document's recommendations**, and much of the Invest-tab "progress visualization" ask is exactly what we built this session. The genuine remaining work is smaller than the doc implies — mostly **empty states, 401(k) richness, investment account tags, side-by-side strategy compare, data-grounded AI prompts, and a What-If investments slider.**

---

## Invest tab — recommended improvements

**Empty / zero state feels thin**
- 🟡 Goal & savings banners now show a "Create a goal" CTA (added this session), but there are **no starter templates** ("Emergency fund – 1 month", "401(k) max match", "First brokerage contribution") or guided first-goal flow. → **To-do: starter templates.**

**401(k) richer without complexity** — currently shows contributions, employer match, **match-rate %**, and a growth chart (good foundation). Missing:
- ⬜ Contribution as % of income / paycheck
- ⬜ Progress toward annual contribution limits
- ⬜ Traditional vs Roth toggle (a Learn article exists; no per-account toggle)
- ⬜ Estimated annual contribution from current per-period amount

**Investments tracking — light structure**
- ⬜ Account-type / category tags (brokerage, IRA, crypto) — only a free-text "ticker" exists today
- 🟡 Target allocation / visual "by account" view — a **"by account – all periods" breakdown already exists**; target-allocation view is to-do
- ✅ Log a contribution that auto-updates goal progress — **done** (investments tagged to a goal via `goalId` credit it live)

**Motivation & progress visualization** (bars, % complete, projected completion date)
- ✅ **Done this session** for investments *and* savings — goal banner + per-goal paycheck projections ("~N paychecks · around \<month\>") + progress bars. 401(k) still lacks goal-style progress (ties to the 401k items above).

**AI Advisor surface area**
- 🟡 Starter-prompt chips exist but are **generic** ("Analyze my investments", "How should I allocate my money?"). Doc wants **data-grounded** prompts ("Am I capturing the full employer match?", "How does my savings rate compare to targets?"). → To-do: grounded prompts.
- ✅ Pro vs free boundary — advisor is Pro-gated.
- ⚠️ Note: the "How should I allocate my money?" chip still uses the advice-y "allocate" phrasing we softened elsewhere this session — worth updating for consistency.

**What-If ↔ Remaining connection**
- 🟡 What-If has **Income / Savings / Bills / Spending** sliders (savings already covered). → To-do: add an **Investments** slider / "extra into investments this period" scenario.

**Education & gentle guidance**
- 🟡 A Learn library exists (emergency-fund sizing, Roth vs Traditional, avalanche vs snowball) plus an AI spending-anomaly insight. → To-do: **contextual, dismissible** nudges in-flow (capture full match, treat investing like a bill).

**Navigation / IA polish**
- 🟡 In progress — this session added the **Investments | Savings hero toggle**; the 2026-08-29 bookmark already lists moving 401(k) and the insights into the banner to tighten this.

---

## Debt tab — recommended improvements (mostly already built)

**Empty / first-debt state**
- ⬜ Current empty state is basic ("No debts tracked · Tap Add debt"). → To-do: guided first-debt flow, example templates (card / student loan / car / personal), one-line "why APR + min payment are needed", and an "I have no debt" celebrate path. **(This is the main Debt gap.)**

**Scannable, actionable debt cards**
- ✅ Balance + progress bar + % paid
- ✅ APR highlighted when high (color-coded APR badge)
- ✅ Minimum payment + "Due" badge relative to the current pay period
- 🟡 Strategy priority badge (#1 Avalanche) — a **"Payoff order" list exists** in the planner; a per-card #1/#2 badge is to-do
- ✅ Quick actions — Make payment, Edit (per-card)
- ✅ Compact card + expandable detail (payment history expands)
- ✅ Bonus not in the doc: **DTI ratio** summary

**Planner as the emotional center**
- ✅ Live **Debt-free date** driven by the extra-payment slider
- 🟡 "Interest you'll save" — computed; could be made more **prominent/persistent** next to the debt-free date
- ⬜ **Side-by-side Avalanche vs Snowball** comparison — today it's a strategy *selector*, not a side-by-side trade-off view
- ✅ Visual payoff order (numbered "Payoff order" list)
- ✅ "If I add $X extra…" preview that also reduces this period's **Remaining** live (`debtExtraPayments` feeds `remaining()`)

**Tighter paycheck integration**
- 🟡 Minimum payments as planned outflows — supported via linking a debt to a bill; not automatic for every debt
- ✅ "Extra this period" reduces Remaining in real time
- 🟡 Due-date awareness — a "Due" badge exists; the "due in 3 days – still inside this period" copy is to-do
- ⬜ Period-end "Did you make the planned debt payments?" one-tap prompt

**Credit utilization**
- ✅ Per-card utilization gauge + color thresholds + friendly "Good/Fair/High"
- ✅ Actionable nudge ("Pay $X more to drop below 30% utilization")
- 🟡 Overall utilization + an "under 30%" goal — per-card is done; an aggregate is to-do

**Logging & celebrating**
- ✅ Fast "Make payment" flow (amount, note, principal/interest)
- ✅ Celebration on payoff (🎉 toast) + automatic re-ordering of remaining debts
- 🟡 Running totals — per-debt interest/principal totals exist; a tab-level "paid this period / all-time principal / interest avoided" roll-up is to-do
- 🟡 A "debt-free timeline" that fills as balances drop — date shown; a filling visual is to-do

**What-If depth**
- 🟡 Lump-sum + slider exist. To-do: recurring-vs-one-time toggle, "free up $X from a spending bucket", and a both-strategies-same-extra compare

**Small polish (nice-to-haves)** — mostly ⬜: clearer min-vs-extra visual distinction, pause/forbearance flag, sort/filter for many debts, swipe-to-log, cross-app styling consistency.

**Doc's suggested Debt priority order:** #1 empty state → ⬜; #2 scannable cards → ✅ (add priority badge); #3 live debt-free/interest-saved → ✅ (make interest-saved prominent); #4 one-tap logging updates balances + Remaining → ✅; #5 utilization gauges w/ actions → ✅.

---

## Suggested to-do shortlist (highest impact ÷ effort)

1. **Empty states, both tabs** — starter goal templates (Invest) + guided first-debt flow with example templates (Debt). Biggest "feels thin" fix, low risk.
2. **401(k) enrichment** — % of income, annual-limit progress, estimated annual contribution, Roth/Traditional tag. Self-contained.
3. **Data-grounded AI starter prompts** — replace the 5 generic chips with prompts built from the user's numbers (and fix the "allocate my money" wording).
4. **What-If investments slider** — one more scenario in the existing What-If card.
5. **Side-by-side Avalanche vs Snowball** in the Debt planner — the one substantive Debt gap.
6. **Investment account-type tags** (brokerage / IRA / crypto) + optional target allocation.
7. Polish batch: per-card debt priority badge, prominent "interest saved", period-end payment prompt, overall utilization, tab-level debt running totals.

*(Nothing here changes the manual-only, no-bank-link, paycheck-first philosophy.)*
