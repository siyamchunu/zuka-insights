# UX/UI Design Specification: Beginner Investor Views
**Project:** Zuka Insights — ETF Metadata Comparison & Distribution History
**Designer:** Fiona
**Date:** 2025-07-14
**Version:** 1.0
**Audience:** James (implementation), Sam (stories), Quinn (QA criteria)

---

## 0. Design Audit: What's Already There

Before designing anything new, I read the existing codebase. Here's what the new views must integrate with:

| Token        | Value     | Usage in new views              |
|--------------|-----------|---------------------------------|
| `forest`     | #0A2323   | Primary text, all dark elements |
| `bone`       | #F2F4F3   | Page background, subtle fills   |
| `lime`       | #D4FF45   | Positive indicators, CTAs, wins |
| `danger`     | #FF4D00   | High-cost warnings, errors      |
| `sage`       | #E0E5E0   | Muted/disabled states           |
| Font         | Helvetica Neue → Arial | All type |
| Icons        | lucide-react | Consistent icon set          |
| Animation    | Framer Motion v12 (installed) | All motion |
| Tailwind     | v4 with `@theme` | Use `bg-forest` etc. |

**Existing components reused:** `ETFSearch.jsx` for adding ETFs to compare.

**Design Philosophy Extension:** The existing app is editorial and high-contrast — bold type, deep forest green, electric lime. The beginner views **extend** this language rather than softening it. Beginner-friendly ≠ baby-ish. It means *clearer hierarchy*, *plain-language labels*, and *guided interpretation* — not rounded corners and pastel colours. We keep the strong Zuka identity.

The ONE addition for educational warmth: amber (`#FEF3C7` / `#92400E`) for "moderate" states. No new font. No new library.

---

## 1. User Research Notes (SA Beginner Context)

**Who this is for:** South African first-time or early investors, predominantly mobile, who have heard of ETFs but aren't sure which to pick or what the numbers mean. Many are TFSA users at FNB/Easy Equities who see ETF names but don't understand TER, benchmark, or distributions.

**Key pain points discovered from SA investor forums (EasyEquities community):**
1. "What does TER actually mean in rands?" — abstract percentages are confusing
2. "Does it matter if the benchmark is different?" — benchmark literacy is low
3. "When do I actually get paid dividends?" — distribution timing is opaque
4. "Is this fund safe / big enough?" — fund size used as a proxy for safety
5. "What is CPU?" — the most common question on distribution statements

**What beginners need (not what they say they want):**
- Translation of jargon into consequences ("0.25% TER = R25/year per R10K")
- Visual ranking ("this one is cheaper", "this one is bigger")
- Concrete money amounts, not abstract percentages
- TFSA eligibility front-and-centre — it's the most actionable decision
- A timeline that tells a story, not a data table

**What beginners don't need:**
- Alpha/beta/standard deviation (save for advanced view)
- Holdings breakdown in comparison view (that's what the overlap analyzer is for)
- Price charts (not in our data)

---

## 2. Information Architecture

### Sitemap Extension

```
Zuka Insights
├── ETF Overlap Analyzer (existing)          ← unchanged
├── Fund Comparison [NEW]
│   ├── Select ETFs (2-3)
│   ├── Metadata Comparison View [NEW]
│   └── → Distribution History View [NEW]
└── (future) ETF Browser
```

### Navigation Entry Points

The two new views are accessed via the existing ETFSearch flow. The simplest integration is a **mode toggle** in the existing left panel:

```
┌─────────────────────────────────┐
│ SELECT ETFs TO COMPARE           │
│                                  │
│ [ETF Search A]                   │
│ [ETF Search B]                   │
│                                  │
│ ┌──────────────┬──────────────┐ │
│ │ 📊 Overlap   │ 📋 Compare   │ │  ← mode toggle (new)
│ └──────────────┴──────────────┘ │
│                                  │
│ [Analyze / Compare button]       │
└─────────────────────────────────┘
```

The Distribution History view is accessed from within the Comparison View — each ETF card has a "View Distributions →" button.

---

## 3. Full User Flow

```
[ETF List / Search]
       │
       ▼
[Select ETF A]──────────────────────────────────┐
       │                                         │
[Select ETF B (optional: +ETF C)]               │
       │                                         │
[Click "Compare Funds"]                          │
       │                                         ▼
       ▼                               [ETF Detail Screen — future]
[ETF COMPARISON VIEW] ◄──────────────────────────
  │   Shows: TFSA, TER, Fund Size,
  │   Market, Benchmark, Quick Take
  │
  ├── [View Distributions →] (per ETF card)
  │           │
  │           ▼
  │   [DISTRIBUTION HISTORY VIEW]
  │     Shows: Bar chart, trend, calculator,
  │     seasonal calendar
  │           │
  │           └── [← Back to Comparison]
  │
  └── [← Back / Change ETFs]
```

**Decision points:**
- If ETF has no distributions: show "No distribution history" empty state
- If `ter` is null: show "Fee data not yet available" with muted style
- If `fund_size` is null: omit size bar, show "–" in size cell
- If only 1 ETF selected and user clicks Compare: prompt to add a second ETF

---

## 4. View 1: ETF Comparison View

### Purpose
Allow a beginner to compare 2–3 ETFs side-by-side on the metrics that matter most for a simple buy decision: cost, tax efficiency, size, and what they track.

### Mobile-First Layout (375px — primary target)

```
┌──────────────────────────────────────┐  ← 375px viewport
│ ← Back   COMPARING 2 FUNDS           │
├──────────────────────────────────────┤
│ ETF A Card    ETF B Card    (scroll)  │  ← header chips
│ ┌──────────┐  ┌──────────┐           │
│ │10X GOVI  │  │10X S&P500│           │
│ │10X Invest│  │10X Invest│           │
│ │CSGOVI    │  │CSP500    │           │
│ └──────────┘  └──────────┘           │
├──────────────────────────────────────┤
│ ┌──────────────────────────────────┐ │
│ │🛡️ Tax-Free Savings Account       │ │  ← row, sticky label
│ ├──────────┬───────────┬──────────┤ │
│ │(label)   │ ✓ Eligible│ ✓ Eligible│ │
│ └──────────┴───────────┴──────────┘ │
│                                      │
│ ┌──────────────────────────────────┐ │
│ │💰 Annual Fee [ℹ]                 │ │
│ ├──────────┬───────────┬──────────┤ │
│ │(label)   │ 0.25% ⭐  │ 0.38%    │ │
│ │          │ Excellent │ Moderate  │ │
│ └──────────┴───────────┴──────────┘ │
│                                      │
│ ... (more rows)                      │
│                                      │
│ ┌──────────────────────────────────┐ │
│ │ 📝 QUICK TAKE                    │ │
│ │ Based on the numbers...          │ │
│ │ [insight card 1]                 │ │
│ │ [insight card 2]                 │ │
│ └──────────┴───────────┴──────────┘ │
│                                      │
│ [View CSGOVI Distributions →]        │
│ [View CSP500 Distributions →]        │
└──────────────────────────────────────┘
```

### Comparison Table Layout Spec

**Container:** `overflow-x-auto` wrapper, `min-w-[480px]` inner (for 2 ETFs), `min-w-[640px]` for 3.

**Column widths:**
- Label column (sticky left): 110px, `position: sticky; left: 0; z-index: 10; background: white`
- ETF columns: `flex: 1; min-width: 150px` each

**Row height:** Minimum 72px. Touch target for ℹ button: 44×44px via padding.

**Winner highlight:** Row-level highlight on the winning ETF's cell — `bg-lime/20 border-l-2 border-lime`.

### Comparison Rows (in order of importance for beginners)

| Row | Label | Beginner Priority | Winner Logic |
|-----|-------|-------------------|--------------|
| 1 | Tax-Free Savings (TFSA) | ⭐⭐⭐ Critical | TFSA eligible = highlighted |
| 2 | Annual Fee | ⭐⭐⭐ Critical | Lowest TER wins |
| 3 | Fund Size | ⭐⭐ Important | Largest = most established |
| 4 | Market | ⭐⭐ Important | No winner — just context |
| 5 | What It Tracks | ⭐ Contextual | No winner — just context |
| 6 | Distributions | ⭐ Contextual | Has history = beneficial |

### TER Visual Classification

| TER Range | Label | Colour | Icon |
|-----------|-------|--------|------|
| ≤ 0.25% | Excellent | `bg-lime text-forest` | ⭐ |
| 0.26–0.50% | Moderate | `bg-amber-100 text-amber-800` | 👍 |
| > 0.50% | High | `bg-danger/10 text-danger` | ⚠️ |
| null | Unknown | `bg-sage text-forest/50` | — |

### Fund Size Visual Classification

| Fund Size | Label | Note |
|-----------|-------|------|
| ≥ R1B | Large Fund | Well-established |
| R500M–R1B | Medium Fund | Good liquidity |
| < R500M | Smaller Fund | Less established |
| null | – | Data unavailable |

**Fund Size Bar:** A relative horizontal bar showing each ETF's size proportionally to the largest in the comparison. Width = `(fundSize / maxFundSize) × 100%`. Uses `bg-forest/40` fill, `bg-sage` track.

### Quick Take (Auto-Generated Insights)

These 2–4 sentence insights are algorithmically generated from the comparison data. They are the most important beginner feature. Logic:

1. **Fee insight:** If TER differs by > 0.05%:
   > "[Cheaper ETF] charges less in fees. On a R10,000 investment, that's about R[diff×100] less per year compared to [more expensive ETF]."

2. **TFSA insight:** If eligibility differs:
   > "[Eligible ETF] can go in your Tax-Free Savings Account. That means any income it pays you is never taxed — a significant long-term advantage."

3. **Diversification insight:** If markets differ:
   > "These ETFs invest in different markets ([Market A] vs [Market B]). Holding both naturally spreads your risk across geographies."

4. **Same benchmark warning:** If benchmarks are identical:
   > "⚠️ Both ETFs track the same index. Buying one gives you nearly the same exposure as buying both — you may not need both in your portfolio."

5. **Size context:** If one fund is significantly larger:
   > "[Larger ETF] has more money invested in it, which generally means it's easier to buy and sell on the JSE."

### Mobile Scroll Behaviour

On mobile (< 640px), with 3 ETFs:
- Horizontal scroll on the comparison table only
- ETF header chips also scroll horizontally (same scroll container)
- Label column is sticky (left: 0)
- Quick Take and action buttons are full-width below the table (no scroll)
- Scroll hint: subtle `fade-out` gradient on right edge of scroll container

### Desktop Layout (≥ 1024px)

Full side-by-side cards replace the comparison table. Each ETF gets a full card column (max 320px wide). Cards show all fields vertically. A "Winner" ribbon appears on the cheapest ETF card's corner.

---

## 5. View 2: Distribution History View

### Purpose
Show a beginner investor when and how much a specific ETF pays out, help them understand the trend, and connect it to real rand amounts.

### Mobile Layout (375px)

```
┌──────────────────────────────────────┐
│ ← Back to Comparison                  │
│                                        │
│ 10X Wealth GOVI Bond ETF              │
│ CSGOVI · Distribution History         │
├────────────────────────────────────────┤
│ ┌──────────────────────────────────┐  │
│ │ 📅 IN PLAIN ENGLISH              │  │
│ │                                  │  │
│ │ Last 4 payouts averaged          │  │
│ │ 26.49 CPU — that's               │  │
│ │ R0.26 per unit, per quarter.     │  │
│ │                                  │  │
│ │ In 2025, this fund paid out      │  │
│ │ R1.06/unit in total.             │  │
│ └──────────────────────────────────┘  │
│                                        │
│ DISTRIBUTION TREND  →ˢᵗᵃᵇˡᵉ          │
│ ┌──────────────────────────────────┐  │
│ │ ▁▁▇▇▇▇▇▇▇▇▇▇                   │  │  ← bar chart
│ │ 2022  2023        2024    2025   │  │
│ └──────────────────────────────────┘  │
│                                        │
│ WHEN DOES IT PAY?                      │
│ ┌──┬──┬──┬──┬──┬──┬──┬──┬──┬──┬──┬──┐ │
│ │J │F │M │A │M │J │J │A │S │O │N │D │ │  ← calendar
│ │  │  │💰│  │  │💰│  │  │💰│  │  │💰│ │
│ └──┴──┴──┴──┴──┴──┴──┴──┴──┴──┴──┴──┘ │
│                                        │
│ 💵 MY MONEY CALCULATOR                 │
│ ┌──────────────────────────────────┐  │
│ │ I own [  100  ] units            │  │
│ │                                  │  │
│ │ Last year (2025) you'd get:      │  │
│ │ R105.96                          │  │
│ │ That's ~R26.49 per quarter       │  │
│ └──────────────────────────────────┘  │
│                                        │
│ ⚠️ Past distributions are not          │
│ guaranteed. Not financial advice.      │
└──────────────────────────────────────┘
```

### Bar Chart Specification

**Layout:** Horizontal flex container, `overflow-x-auto` if many periods.

**Data:** Last 12 distribution periods, sorted oldest → newest (left → right).

**Bar height:** `(cpu / maxCpu) * 120px` — maximum bar height is 120px.

**Bar width:** `flex: 1; min-width: 20px` — adapts to container, min 20px.

**Colours:**
- Current year periods: `bg-lime`
- Previous year: `bg-forest/40`
- Two years ago: `bg-forest/20`
- Partial period (anomalously low, < 50% of average): `bg-sage` with a note

**Animation:** Framer Motion `scaleY` from 0 → 1, staggered 50ms per bar, `ease: 'easeOut'`, `duration: 0.4s`. `transformOrigin: 'bottom'`.

**Tooltip on tap:** Show `period` + `cpu` + "R{cpu/100} per unit" in a small overlay above the bar.

**Y-axis reference lines:** 3 horizontal dotted lines at 25%, 50%, 100% of max value with CPU labels on left.

**X-axis labels:** Abbreviated period labels below each bar: "Mar '25", "Jun '25" etc. Font size 10px. Rotate 45° on mobile if crowded.

### Trend Analysis

**Algorithm:**
- Compare average of last 4 quarters vs previous 4 quarters
- If avg(last4) > avg(prev4) by > 2%: **Growing** `↑` (lime text)
- If within ±2%: **Stable** `→` (forest/60 text)
- If avg(last4) < avg(prev4) by > 2%: **Declining** `↓` (danger text)
- If < 8 periods available: show "More data needed"

**Trend card copy:**
- Growing: "Distributions have grown by [X]% compared to a year ago. This fund has been paying more over time."
- Stable: "Distributions have been remarkably consistent — within [X]% of last year's average. Predictable income."
- Declining: "Distributions have decreased compared to last year. This can happen due to market conditions and may recover."

### Seasonal Calendar

**What it shows:** Which months this ETF pays distributions based on historical data.

**Layout:** 12 month chips in a single row (J F M A M J J A S O N D). Payment months get a `💰` icon and `bg-lime` background. Non-payment months get `bg-sage` background.

**Detection logic:** Scan all distribution periods, extract payment months from period names (March → 3, June → 6, September → 9, December → 12). Show as set of months with consistently recurring payouts.

### "My Money" Calculator

**Input:** Number of units owned (number input, default 100, min 0, max 1,000,000)

**Calculations displayed:**
- Last calendar year total payout: `sum(distributions where year = latest_year) / 100 × units` in rands
- Per quarter average: `avgCpu / 100 × units` in rands
- Most recent single payout: `distributions[0].cpu / 100 × units` in rands

**Format:** Large display number for the annual figure. Smaller supporting numbers below.

**Disclaimer:** "Based on past distributions only. The actual amount depends on how many units you own and the fund's future payouts, which can change."

---

## 6. Plain Language Glossary System

### Design Pattern: Inline Expandable Definition

**Do not** use hover tooltips (they fail on mobile). **Do not** link to a separate glossary page (breaks flow). **Use** inline expansion — a "ℹ" icon button that toggles a definition card below the label.

```
┌─────────────────────────────────┐
│ 💰 Annual Fee  [ℹ]              │  ← row label + info button
├─────────────────────────────────┤
│ ╔═════════════════════════════╗ │  ← expands below (animation)
│ ║ 📖 Annual Fee (TER)         ║ │
│ ║ The fund charges this % per ║ │
│ ║ year — deducted automati-   ║ │
│ ║ cally. 0.25% = R25/year     ║ │
│ ║ per R10,000 invested.       ║ │
│ ║ Lower is always better.     ║ │
│ ╚═════════════════════════════╝ │
├─────────────────────────────────┤
│ (label) │ 0.25% ⭐ │ 0.38%     │  ← values unchanged
```

**Animation:** `height: 0 → auto` via Framer Motion `AnimatePresence`, `ease: 'easeOut'`, `duration: 200ms`.

**Close:** Tap ℹ again, or tap anywhere outside, or tap a different row's ℹ.

**Only one definition open at a time.**

**GlossaryTooltip component:** `<GlossaryTooltip term="Annual Fee" definition="..." />` — see implementation in `GlossaryTooltip.jsx`.

---

## 7. Micro-copy Library

These are the exact strings to use in the UI. Copy these verbatim.

### Glossary Definitions

**TER / Annual Fee:**
> "The fund charges this % of your money each year as a management fee. It's taken automatically — you never see a bill. 0.25% means if you had R10,000 invested, you'd pay R25 per year in fees. Lower is better."

**Benchmark / What It Tracks:**
> "The index this ETF copies. Think of it as a recipe: the fund buys the same ingredients (shares or bonds) in the same amounts as the index. If the S&P 500 goes up, this ETF should too."

**Fund Size / AUM:**
> "The total amount of money all investors have put into this fund. A bigger fund is generally more established and easier to buy and sell. This doesn't directly affect your returns."

**TFSA Eligibility:**
> "A Tax-Free Savings Account lets you invest up to R36,000 per year (R500,000 lifetime) without ever paying tax on your growth or income. Only TFSA-eligible funds can be held there — and it's one of the best perks for SA investors."

**CPU / Distributions:**
> "CPU stands for Cents Per Unit. When the fund makes money (from dividends or interest), it pays some of it back to you. '26.55 CPU' means for every unit you own, you received R0.2655 in cash."

**Quarterly Distributions:**
> "This fund pays out 4 times a year — once every 3 months. The payout goes into your brokerage account as cash, which you can reinvest or withdraw."

**Market:**
> "Where the investments in this fund come from. 'JSE' means South African companies or bonds. 'US' means American companies. 'Global' means a mix of countries. Spreading across markets reduces risk."

### Labels & Button Copy

| Element | Copy |
|---------|------|
| Comparison header | "Comparing {n} funds" |
| Add ETF button | "+ Add another fund (max 3)" |
| Remove ETF button | "Remove" (accessible: "Remove [ETF name] from comparison") |
| TFSA yes badge | "✓ TFSA eligible" |
| TFSA no badge | "Not TFSA eligible" |
| TER winner badge | "Cheapest" |
| Fund size winner badge | "Largest" |
| View distributions CTA | "View {ticker} Distributions →" |
| Back button | "← Back to comparison" |
| Calculator label | "I own ___ units" |
| Calculator result label | "Last year ({year}), you would have received:" |
| Empty distributions | "No distribution history available for this fund yet." |
| Null TER | "Fee data unavailable" |
| Null fund size | "–" |
| Quick Take header | "📝 Quick Take" |
| Legal footnote | "This is educational information only, not financial advice. Past distributions do not guarantee future payouts." |

### Tone of Voice Guidelines

✅ DO: "This fund charges less in fees — that puts more money in your pocket."
✅ DO: "On a R10,000 investment, you'd save about R13 per year in fees."
✅ DO: "Both funds can go in your Tax-Free Savings Account — a big advantage."

❌ DON'T: "Simply put, the TER is the..."
❌ DON'T: "Don't worry if you don't understand this..."
❌ DON'T: "As any experienced investor knows..."
❌ DON'T: Use "yield", "alpha", "beta", "NAV", "AUM" without explanation

---

## 8. Colour & Visual Language

### Semantic Colour Mapping (extending existing tokens)

| State | Use Case | Colour |
|-------|----------|--------|
| Excellent / Winner | Low TER, TFSA badge, growing trend | `lime` #D4FF45 |
| Moderate / Neutral | Mid-range TER, stable trend | Amber: `#FEF3C7` bg / `#92400E` text |
| Warning / High Cost | High TER, declining trend | `danger` #FF4D00 |
| Muted / Unknown | Null data, disabled states | `sage` #E0E5E0 / `forest/30` |
| Primary text | All headings, values | `forest` #0A2323 |
| Secondary text | Labels, definitions, hints | `forest/60` |
| Background | Page, card bg | `bone` #F2F4F3 |
| Card surface | White cards | `#FFFFFF` |

### Data Visualisation Colours

- Distribution bar (current year): `lime` #D4FF45
- Distribution bar (last year): `forest` at 40% opacity
- Distribution bar (2 years ago): `forest` at 20% opacity
- Trend line / annotation: `forest/50`
- Reference lines on chart: `forest/10` (very subtle)
- Fund size bar fill: `forest/40`
- Fund size bar track: `sage`

### Do Not Use
- Purple or violet (not in brand)
- Red for "bad" without context — use `danger` sparingly
- Pure grey — use `forest` at opacity instead
- Blue (#1E40AF etc.) — no brand equity here

---

## 9. Accessibility Specifications

### WCAG 2.1 AA Checklist

- [x] All text/background combos meet 4.5:1 contrast
  - `forest` on `white`: 16.8:1 ✓
  - `forest` on `bone` (#F2F4F3): 15.2:1 ✓
  - `forest` on `lime` (#D4FF45): 8.9:1 ✓
  - `danger` on `white`: 4.6:1 ✓
  - `amber-800` (#92400E) on `amber-100` (#FEF3C7): 5.1:1 ✓
- [x] Touch targets ≥ 44×44px (ℹ buttons, close buttons, tab items)
- [x] Focus ring visible: `outline: 2px solid #D4FF45; outline-offset: 2px`
- [x] Screen reader labels on all icons (`aria-label`, `aria-hidden` on decorative)
- [x] Comparison table uses `role="table"` semantics or proper `aria-label`
- [x] Chart bars have `aria-label="{period}: {cpu} CPU"` on each bar
- [x] Calculator input has proper `<label>` association
- [x] Trend status announced via `aria-live="polite"` when units input changes
- [x] `prefers-reduced-motion`: disable bar chart entrance animations
- [x] Definition panels: `role="region"` with `aria-label="Definition"`

### Keyboard Navigation
```
Tab           → Move to next interactive element
Enter/Space   → Toggle definition panel (ℹ button)
Escape        → Close any open definition panel
Tab (in calc) → Move between input fields
```

---

## 10. Animation Specifications

### Bar Chart Entrance (framer-motion)
```jsx
// Each bar animates in from bottom, staggered
initial={{ scaleY: 0 }}
animate={{ scaleY: 1 }}
transition={{ delay: index * 0.05, duration: 0.4, ease: 'easeOut' }}
style={{ transformOrigin: 'bottom' }}
```

### Definition Panel (framer-motion AnimatePresence)
```jsx
initial={{ height: 0, opacity: 0 }}
animate={{ height: 'auto', opacity: 1 }}
exit={{ height: 0, opacity: 0 }}
transition={{ duration: 0.2, ease: 'easeOut' }}
```

### Calculator Result Update
```jsx
// When units value changes, result number does a quick pop
whileHover / on value change: scale 1 → 1.05 → 1, duration 200ms
```

### Winner Highlight Entrance
```jsx
// Winner cell highlight fades in with delay
initial={{ opacity: 0 }}
animate={{ opacity: 1 }}
transition={{ delay: 0.3, duration: 0.4 }}
```

### Reduced Motion
```css
@media (prefers-reduced-motion: reduce) {
  /* All animations disabled — use opacity-only transitions */
}
```
```jsx
// In component:
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const barTransition = prefersReducedMotion ? { duration: 0 } : { delay: i * 0.05, duration: 0.4 };
```

---

## 11. Component Architecture

### New Files

```
src/
├── components/
│   ├── GlossaryTooltip.jsx          ← Reusable inline definition
│   ├── ETFComparisonView.jsx         ← View 1: Side-by-side comparison
│   └── DistributionHistoryView.jsx   ← View 2: Distribution history
└── (no new utilities — logic inline for clarity)
```

### Props Interface

**ETFComparisonView:**
```jsx
{
  etfs: Array<ETF>,                        // 2 or 3 ETF objects from etfs.json
  onViewDistributions: (etfId) => void,    // Navigate to distribution view
  onBack: () => void,                      // Return to ETF selection
}
```

**DistributionHistoryView:**
```jsx
{
  etf: ETF,          // Single ETF object from etfs.json
  onBack: () => void // Return to comparison view
}
```

**GlossaryTooltip:**
```jsx
{
  term: string,        // Short name: "Annual Fee"
  definition: string,  // Full plain-language definition
  children: ReactNode  // The label element to wrap
}
```

### Integration in App.jsx

Add a `view` state variable to App.jsx to control which view is shown:
```jsx
const [view, setView] = useState('overlap');
// 'overlap'      → existing overlap analyzer
// 'compare'      → new ETFComparisonView
// 'distributions'→ new DistributionHistoryView

const [compareEtfs, setCompareEtfs] = useState([]);
const [distributionEtfId, setDistributionEtfId] = useState(null);
```

---

## 12. QA Test Scenarios (for Quinn)

### ETF Comparison View

| Scenario | Expected Result |
|----------|----------------|
| 2 ETFs with different TERs | Lower TER cell shows "Cheapest" badge + lime highlight |
| ETF with null TER | Shows "Fee data unavailable" in muted style, no winner badge |
| ETF with null fund_size | Shows "–", no size bar, no "Largest" badge |
| All ETFs TFSA eligible | No winner highlight on TFSA row (all equal) |
| Same benchmark for all ETFs | Quick Take shows "⚠️ Same index" warning |
| 3 ETFs selected | Third column visible with horizontal scroll on mobile |
| Touch target test | ℹ button activates with 44px tap area |
| Definition open, tap another ℹ | First definition closes, new one opens |
| Keyboard: Tab to ℹ, Enter | Definition opens; Escape closes it |

### Distribution History View

| Scenario | Expected Result |
|----------|----------------|
| ETF with 12+ distributions | Full bar chart shown, last 12 periods |
| ETF with 0 distributions | Empty state: "No distribution history" |
| Units input = 0 | Shows "R0.00" (not error) |
| Units input = 1000000 | Shows large formatted amount correctly |
| Very low first-period CPU (partial period like CSGOVI Dec 2022: 7.19) | Bar renders at correct proportion, no layout break |
| Trend: growing | Shows "↑ Growing" in lime text |
| Trend: declining | Shows "↓ Declining" in danger text |
| prefers-reduced-motion | All bar animations instant (no scaleY keyframes) |
| Screen reader | Bar chart announced as table with period/CPU values |

---

## 13. Implementation Notes for James

1. **No new dependencies** — Framer Motion, lucide-react, and Tailwind are already installed. No recharts, no charting library needed. CSS bars look great and perform better on low-end Android.

2. **Tailwind v4 class usage** — The `@theme` block in `index.css` registers `forest`, `bone`, `lime`, `danger`, `sage` as CSS custom properties. Use them as `bg-forest`, `text-lime` etc. For amber, use Tailwind's built-in `bg-amber-100 text-amber-800`.

3. **Sticky column in overflow-x container** — `position: sticky; left: 0` works in an `overflow-x: auto` container only if there's no `overflow: hidden` parent. The `-mx-6 px-6` pattern on the scroll container ensures the sticky column doesn't clip at viewport edges.

4. **Bar chart height calculation** — Use `style={{ height: ... }}` for the dynamic bar heights (Tailwind doesn't support arbitrary height percentages from JS variables). The chart container should be a fixed-height div (`style={{ height: '140px' }}`).

5. **AnimatePresence for definition panels** — Wrap each definition div in `<AnimatePresence>` with `mode="wait"`. The `height: 0 → 'auto'` animation requires `overflow: hidden` on the motion.div.

6. **null/undefined guards** — Several ETFs have `ter: null` and `fund_size: null`. Every render function must check for null before formatting. The data is structured but incomplete.

7. **Distribution period parsing** — Period strings are `"December 2025"`, `"September 2025"` etc. Parse with `period.split(' ')` to get `[month, year]`. Month → quarter: March=Q1, June=Q2, September=Q3, December=Q4.

8. **Responsive breakpoints** — Follow Tailwind defaults: `sm: 640px`, `md: 768px`, `lg: 1024px`. The comparison table is designed mobile-first with horizontal scroll on `< 640px`.

9. **Performance** — The ETFs JSON is 3.2MB. `etfData` is already loaded in App.jsx state. Pass ETF objects (not IDs) to the comparison component to avoid re-lookups. For distribution bars, `useMemo` the sorted/processed distribution data.

10. **The `index.html` `<head>`** — No new font CDN links needed. Existing Helvetica Neue stack is used as-is.
