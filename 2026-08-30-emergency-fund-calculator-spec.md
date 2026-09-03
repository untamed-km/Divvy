# DistroFi — Emergency Fund Calculator (logic sketch)

*Draft spec — 2026-08-30. Lives in the Savings banner, not onboarding.*

## The core idea
Every generic EF calculator asks you to guess your monthly expenses. DistroFi doesn't
have to — after a period or two it knows your bills and your real spending. So the pitch is:
**"Based on what you actually spend, here's your cushion."** The whole feature is just a
smart create-flow behind the "Emergency fund" starter chip on the Savings banner.

The one rule that makes it trustworthy: **base the target on *essential* expenses**, not total
spending and not income. An emergency fund covers you if income stops, so it's rent, utilities,
groceries, insurance, minimum debt payments — not takeout, subscriptions, or fun-money.

---

## Step 1 — Tag what's essential
Two small data-model additions:

- `bill.essential` (bool) — **default `true`**, except **default `false` when `type === 'subscription'`**.
- `bucket.essential` (bool) — default guessed from the label/icon (groceries, gas, utilities,
  rent → essential; dining, shopping, entertainment → not), always user-overridable.

Minimum debt payments count as essential too — but if a debt is already linked to a bill
(`linkedDebtId`), don't double-count it. Only add `debt.minPayment` for debts with no linked bill.

The calculator sheet shows a "What counts?" expandable listing exactly which bills/buckets it
used, each with a toggle, so the number is never a black box.

---

## Step 2 — Normalize everything to a MONTHLY figure
DistroFi is per-pay-period; EF targets are in months. Convert with the pay frequency:

```js
const PP = { weekly:52, biweekly:26, semimonthly:24, monthly:12 };
const periodsPerYear = PP[STATE.payFrequency] || 26;
const monthlyFactor  = periodsPerYear / 12;   // biweekly ≈ 2.1667
```

**Bills** — use the current plan (forward-looking, stable). Normalize each bill to a per-period
amount first (respecting its own `frequency`), then scale to monthly:

```js
const essBillsPerPeriod = C.bills
  .filter(b => b.essential !== false)
  .reduce((s,b) => s + billPerPeriodAmount(b), 0);      // per-period, freq-aware
const monthlyEssBills = essBillsPerPeriod * monthlyFactor;

const monthlyMinDebt = (C.debts||[])
  .filter(d => !billIsLinkedTo(d.id))                   // avoid double-count
  .reduce((s,d) => s + (d.minPayment||0), 0) * monthlyFactor;
```

**Spending buckets** — use the trailing average of *actual* spend across completed periods
(this is the "what you really spend" part), not the budget number:

```js
const completed = STATE.history.slice(-3);              // up to 3 periods for a stable avg
const essBucketAvgPerPeriod = completed.length
  ? avg(completed.map(cyc => essentialBucketSpend(cyc)))
  : essentialBucketBudget(C);                           // fallback: budgeted, if no history
const monthlyEssBuckets = essBucketAvgPerPeriod * monthlyFactor;
```

**Total:**
```js
const monthlyEssentials = monthlyEssBills + monthlyEssBuckets + monthlyMinDebt;
```

> Why bills-from-plan but buckets-from-history: bills are fixed commitments that are more
> reliable forward than backward (and history can carry one-off annual charges that inflate an
> average). Bucket spend is recurring and variable, so a trailing average reflects reality better
> than the budgeted cap. Optionally trim obvious outliers from the bucket average.

---

## Step 3 — The 3 / 6 / 12 targets
```js
const targets = {
  3:  monthlyEssentials * 3,
  6:  monthlyEssentials * 6,
  12: monthlyEssentials * 12,
};
```

Present it as a **ladder they choose from**, not a prescription. Educational voice (keep it out
of "advice" territory, consistent with the softened advisor copy):

> "A common guideline is **3–6 months** of essential expenses — closer to 3 if you have steady,
> dual income, and 6+ if you're the sole earner or your income varies."

Default the selector to **3 months** as the starter (least intimidating first goal). Optionally
nudge the recommendation with one or two questions (single vs dual income; steady vs variable pay),
but even without them, letting them pick their own multiplier is safe and honest.

---

## Step 4 — Progress + time-to-goal (reuse the goal engine)
Once a target is chosen, this is just a savings goal — reuse everything already built:

```js
const current   = efGoal ? efGoal.saved : 0;            // 0 for a brand-new fund
const gap       = Math.max(0, target - current);
const perPeriod = STATE.current.savings?.perPaycheck || recentAvgContribution(efGoal);
const paychecks = perPeriod > 0 ? Math.ceil(gap / perPeriod) : null;
// → feed paychecks into the existing "~N paychecks · around <month>" projection line
```

"Create goal" pre-fills a savings goal with `name:'Emergency Fund'`, `goal:target`, and a
`kind:'emergency'` flag so we can give it a distinct icon and a **"Recalculate"** affordance.

---

## Step 5 — Banner behavior
- **Empty / no EF goal:** show the "Emergency fund" starter chip; tapping it opens the calc sheet.
  Every *other* starter chip stays a plain create-modal — only this one runs the calculator.
- **Dismissible:** a quiet `localStorage['distrofi_ef_dismissed']` flag so someone who already
  has a fund elsewhere isn't re-nagged every period (same pattern as the "🎉 I have no debt" path).
- **After creation:** it's a normal goal in the rotation. Add a small **"Recalculate"** link on
  the EF goal, because essential expenses drift (rent rises, a bill is added) and the right target
  moves with them.
- **Feature logic caveat:** the banner auto-features the goal *closest to completion*. A new EF at
  $0 is the *furthest* from completion, so it'd get buried. Make the empty/low state intentionally
  surface the EF suggestion rather than defaulting to a nearly-done vacation fund.

---

## Edge cases
- **No history yet** → use budgeted/planned amounts and label the number **"estimated"**.
- **Nothing tagged essential** → prompt to tag at least bills before showing a target.
- **Existing EF goal** → skip the suggestion, offer Recalculate instead.
- **Linked debts** → don't double-count min payments already represented as bills.
- **Variable income** → target is built on essentials (not income), which is exactly right for
  irregular earners; the guideline copy nudges them toward the higher end.

---

## Data-model summary
| Field | Where | Default |
|---|---|---|
| `bill.essential` | each bill | `true` (subscriptions `false`) |
| `bucket.essential` | each bucket | guessed from label/icon, editable |
| `goal.kind = 'emergency'` | the created goal | marks EF for icon + recalc |
| `distrofi_ef_dismissed` | localStorage | unset |

## Placement / gating
Savings tab, in the banner. **Free feature** — emergency funds are the most universally
recommended thing in personal finance; giving it away builds trust and the savings habit, which is
the behavior you want to reward.

## Effort note
Most of this reuses machinery you already shipped (savings goals, waterfall, per-goal projections,
starter chips, dismissible states). The genuinely new parts are: the two `essential` flags + their
UI toggles, the monthly-normalization helper, and the calc sheet itself. Medium-small, low risk.
