/**
 * DistributionHistoryView.jsx
 *
 * View 2: ETF distribution (dividend) history for beginner investors.
 * Design spec: DESIGN_SPEC_BEGINNER_VIEWS.md § 5
 *
 * Sections:
 *  1. Header — ETF name + back button
 *  2. Plain-English summary card
 *  3. Animated bar chart (CPU per quarter, last 12 periods)
 *  4. Trend analysis card (Growing / Stable / Declining)
 *  5. Seasonal calendar — which months this fund pays
 *  6. "My Money" calculator — units owned → rand payout
 *  7. Legal disclaimer
 *
 * Props:
 *   etf    {Object}    Single ETF object from etfs.json
 *   onBack {Function}  () => void — return to comparison view
 *
 * Data shape used:
 *   etf.distributions = [{ period: "December 2025", cpu: 26.55 }, ...]
 *   Newest-first in JSON; we reverse for chronological chart display.
 */

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { ArrowLeft, TrendingUp, TrendingDown, Minus, Info, Calendar, DollarSign } from 'lucide-react';

// ---------------------------------------------------------------------------
// Constants & helpers
// ---------------------------------------------------------------------------

/** Map distribution period month names to quarter labels and month numbers */
const MONTH_TO_QUARTER = {
  January:   { quarter: 'Q1', monthNum: 1  },
  February:  { quarter: 'Q1', monthNum: 2  },
  March:     { quarter: 'Q1', monthNum: 3  },
  April:     { quarter: 'Q2', monthNum: 4  },
  May:       { quarter: 'Q2', monthNum: 5  },
  June:      { quarter: 'Q2', monthNum: 6  },
  July:      { quarter: 'Q3', monthNum: 7  },
  August:    { quarter: 'Q3', monthNum: 8  },
  September: { quarter: 'Q3', monthNum: 9  },
  October:   { quarter: 'Q4', monthNum: 10 },
  November:  { quarter: 'Q4', monthNum: 11 },
  December:  { quarter: 'Q4', monthNum: 12 },
};

const ALL_MONTHS = [
  { abbr: 'J', full: 'January',   num: 1  },
  { abbr: 'F', full: 'February',  num: 2  },
  { abbr: 'M', full: 'March',     num: 3  },
  { abbr: 'A', full: 'April',     num: 4  },
  { abbr: 'M', full: 'May',       num: 5  },
  { abbr: 'J', full: 'June',      num: 6  },
  { abbr: 'J', full: 'July',      num: 7  },
  { abbr: 'A', full: 'August',    num: 8  },
  { abbr: 'S', full: 'September', num: 9  },
  { abbr: 'O', full: 'October',   num: 10 },
  { abbr: 'N', full: 'November',  num: 11 },
  { abbr: 'D', full: 'December',  num: 12 },
];

/** Parse "December 2025" → { month: "December", year: "2025", quarter: "Q4" } */
const parsePeriod = (period) => {
  const parts = period.trim().split(' ');
  if (parts.length < 2) return null;
  const [month, year] = parts;
  const quarterInfo = MONTH_TO_QUARTER[month] || null;
  return { month, year, quarter: quarterInfo?.quarter || '?', monthNum: quarterInfo?.monthNum };
};

/** Format CPU (cents per unit) → "R0.27" */
const cpuToRands = (cpu) => `R${(cpu / 100).toFixed(2)}`;

/** Format a rand amount with thousand separators */
const formatRand = (amount) => {
  if (amount === 0) return 'R0.00';
  return `R${amount.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

/**
 * Determine distribution trend.
 * Compares average of last 4 quarters vs. previous 4.
 * Returns: 'growing' | 'stable' | 'declining' | 'insufficient'
 */
const getTrend = (distributions) => {
  // distributions are newest-first from JSON — take first 8
  if (!distributions || distributions.length < 6) return 'insufficient';
  const recent4 = distributions.slice(0, 4);
  const prev4   = distributions.slice(4, 8);
  if (prev4.length < 4) return 'insufficient';

  const avg = (arr) => arr.reduce((s, d) => s + d.cpu, 0) / arr.length;
  const avgRecent = avg(recent4);
  const avgPrev   = avg(prev4);
  if (avgPrev === 0) return avgRecent > 0 ? 'growing' : 'insufficient';
  const changePct = ((avgRecent - avgPrev) / avgPrev) * 100;

  if (changePct > 2)  return 'growing';
  if (changePct < -2) return 'declining';
  return 'stable';
};

/**
 * Detect which month numbers this fund consistently pays in.
 * Returns a Set<number> of month numbers (3, 6, 9, 12 for quarterly).
 */
const getPaymentMonths = (distributions) => {
  const months = new Set();
  (distributions || []).forEach((d) => {
    const parsed = parsePeriod(d.period);
    if (parsed?.monthNum) months.add(parsed.monthNum);
  });
  return months;
};

/**
 * Sum all distributions for a given year.
 * Returns total CPU (as number).
 */
const getAnnualCpu = (distributions, year) =>
  (distributions || [])
    .filter((d) => parsePeriod(d.period)?.year === String(year))
    .reduce((sum, d) => sum + d.cpu, 0);

/**
 * Determine the colour class for a bar based on its year vs. the latest year.
 */
const getBarColour = (barYear, latestYear) => {
  const diff = latestYear - parseInt(barYear, 10);
  if (diff === 0) return 'bg-lime';
  if (diff === 1) return 'bg-forest/40';
  return 'bg-forest/20';
};

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/** "In plain English" summary card */
const SummaryCard = ({ distributions }) => {
  if (!distributions || distributions.length === 0) return null;

  // Most recent 4 distributions for average
  const recent4 = distributions.slice(0, 4);
  const avgCpu = recent4.reduce((s, d) => s + d.cpu, 0) / recent4.length;

  // Latest year's total
  const latestYear = parsePeriod(distributions[0].period)?.year;
  const latestYearCpu = getAnnualCpu(distributions, latestYear);

  return (
    <div className="bg-forest rounded-2xl p-5 text-bone">
      <p className="text-[10px] font-black uppercase tracking-widest text-lime mb-3">
        📅 In Plain English
      </p>
      <p className="text-base font-bold leading-relaxed">
        The last 4 payouts averaged{' '}
        <span className="text-lime">{avgCpu.toFixed(2)} CPU</span> — that's{' '}
        <span className="text-lime">{cpuToRands(avgCpu)} per unit</span>, paid
        each quarter.
      </p>
      {latestYearCpu > 0 && (
        <p className="text-sm text-bone/70 mt-3 leading-relaxed">
          In {latestYear}, this fund paid out{' '}
          <strong className="text-bone">{cpuToRands(latestYearCpu)}/unit in total</strong>{' '}
          across all distributions.
        </p>
      )}
      <p className="text-[11px] text-bone/40 mt-3">
        CPU = Cents Per Unit. For every unit you own, you received this much in cash.
      </p>
    </div>
  );
};

/** Interactive bar chart (CSS + Framer Motion, no charting library) */
const DistributionBarChart = ({ distributions }) => {
  const prefersReducedMotion = useReducedMotion();
  const [hoveredIndex, setHoveredIndex] = useState(null);

  // Take last 12 periods, reverse to oldest-first for left→right timeline
  const chartData = useMemo(() => {
    const last12 = [...(distributions || [])].slice(0, 12).reverse();
    return last12.map((d) => ({
      ...d,
      parsed: parsePeriod(d.period),
    }));
  }, [distributions]);

  if (chartData.length === 0) return null;

  const maxCpu = Math.max(...chartData.map((d) => d.cpu), 0);
  const latestYear = chartData[chartData.length - 1]?.parsed?.year;

  // Y-axis reference values
  const yRefs = [
    { pct: 100, value: maxCpu },
    { pct: 50,  value: maxCpu * 0.5 },
    { pct: 0,   value: 0 },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[10px] font-black uppercase tracking-widest text-forest/40">
          Distribution Trend
        </h3>
        {/* Year legend */}
        <div className="flex items-center gap-3">
          {latestYear && (
            <span className="flex items-center gap-1 text-[10px] font-bold text-forest/60">
              <span className="w-3 h-3 bg-lime rounded-sm inline-block" aria-hidden="true" /> {latestYear}
            </span>
          )}
          <span className="flex items-center gap-1 text-[10px] font-bold text-forest/60">
            <span className="w-3 h-3 bg-forest/30 rounded-sm inline-block" aria-hidden="true" /> Earlier
          </span>
        </div>
      </div>

      <div
        className="bg-white rounded-2xl border-2 border-forest/5 p-4"
        role="img"
        aria-label={`Bar chart showing ${chartData.length} quarterly distributions. Most recent: ${chartData[chartData.length - 1]?.cpu} CPU in ${chartData[chartData.length - 1]?.period}`}
      >
        {/* Chart body */}
        <div className="relative flex items-end gap-1" style={{ height: '140px' }}>

          {/* Y-axis reference lines (behind bars) */}
          {yRefs.map((ref) => (
            <div
              key={ref.pct}
              className="absolute left-0 right-0 border-t border-forest/5 pointer-events-none flex items-end"
              style={{ bottom: `${ref.pct}%` }}
              aria-hidden="true"
            >
              <span className="absolute -left-1 text-[9px] text-forest/25 font-mono -translate-y-full pr-1">
                {ref.pct === 0 ? '' : ref.value.toFixed(0)}
              </span>
            </div>
          ))}

          {/* Bars */}
          {chartData.map((d, i) => {
            const heightPct = maxCpu > 0 ? (d.cpu / maxCpu) * 100 : 0;
            const colour = getBarColour(d.parsed?.year, latestYear);
            const isHovered = hoveredIndex === i;
            const isPartialPeriod = d.cpu < maxCpu * 0.6;

            return (
              <div
                key={`${d.period}-${i}`}
                className="flex-1 flex flex-col items-center justify-end group"
                style={{ height: '100%' }}
              >
                {/* Tooltip above bar */}
                <AnimatePresence>
                  {isHovered && (
                    <motion.div
                      initial={{ opacity: 0, y: 4, scale: 0.9 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 4, scale: 0.9 }}
                      transition={{ duration: 0.15 }}
                      className="absolute z-20 bg-forest text-bone text-[10px] font-bold rounded-lg px-2 py-1.5 whitespace-nowrap pointer-events-none"
                      style={{ bottom: `${heightPct + 8}%` }}
                      role="tooltip"
                    >
                      <p className="font-black">{d.cpu} CPU</p>
                      <p className="text-bone/60 font-normal">{cpuToRands(d.cpu)}/unit</p>
                      <p className="text-bone/40 font-normal text-[9px]">{d.period}</p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* The bar itself */}
                <motion.div
                  className={`
                    w-full rounded-t-sm cursor-pointer transition-opacity
                    ${colour}
                    ${isHovered ? 'opacity-100' : 'opacity-90'}
                    ${isPartialPeriod ? 'opacity-40' : ''}
                  `}
                  style={{ height: `${heightPct}%` }}
                  initial={prefersReducedMotion ? false : { scaleY: 0 }}
                  animate={{ scaleY: 1 }}
                  transition={
                    prefersReducedMotion
                      ? { duration: 0 }
                      : { delay: i * 0.05, duration: 0.4, ease: 'easeOut' }
                  }
                  // transformOrigin must be set via style (not Tailwind) for scaleY
                  // eslint-disable-next-line react/forbid-dom-props
                  onMouseEnter={() => setHoveredIndex(i)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  onTouchStart={() => setHoveredIndex(i)}
                  onTouchEnd={() => setTimeout(() => setHoveredIndex(null), 1500)}
                />
              </div>
            );
          })}
        </div>

        {/* X-axis labels */}
        <div className="flex gap-1 mt-2" aria-hidden="true">
          {chartData.map((d, i) => {
            const isYearStart = i === 0 || d.parsed?.year !== chartData[i - 1]?.parsed?.year;
            return (
              <div key={i} className="flex-1 text-center overflow-hidden">
                {isYearStart ? (
                  <p className="text-[9px] font-black text-forest/50 truncate">
                    {d.parsed?.year}
                  </p>
                ) : (
                  <p className="text-[9px] text-forest/25 truncate">
                    {d.parsed?.quarter}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        {/* Partial-period note if applicable */}
        {chartData.some((d) => d.cpu < Math.max(...chartData.map((x) => x.cpu)) * 0.6) && (
          <p className="text-[10px] text-forest/30 mt-3 flex items-start gap-1">
            <Info size={11} className="mt-0.5 shrink-0" aria-hidden="true" />
            Faded bars represent partial periods — the fund may have launched or changed mid-quarter.
          </p>
        )}
      </div>
    </div>
  );
};

/** Trend analysis card */
const TrendCard = ({ distributions }) => {
  const trend = getTrend(distributions);

  const TREND_CONFIG = {
    growing: {
      icon: TrendingUp,
      label: 'Growing ↑',
      labelClass: 'text-forest',
      bgClass: 'bg-lime/20 border-lime/40',
      body: () => {
        const recent4 = distributions.slice(0, 4);
        const prev4   = distributions.slice(4, 8);
        const avgR = recent4.reduce((s, d) => s + d.cpu, 0) / 4;
        const avgP = prev4.reduce((s, d) => s + d.cpu, 0) / 4;
        if (avgP === 0) return 'This fund has recently started paying distributions — a positive development for income-focused investors.';
        const pct  = (((avgR - avgP) / avgP) * 100).toFixed(1);
        return `Distributions have grown by ${pct}% compared to the same period last year. This fund has been paying more over time — a positive sign.`;
      },
    },
    stable: {
      icon: Minus,
      label: 'Stable →',
      labelClass: 'text-forest/70',
      bgClass: 'bg-bone border-forest/10',
      body: () => {
        const recent4 = distributions.slice(0, 4);
        const prev4   = distributions.slice(4, 8);
        const avgR = recent4.reduce((s, d) => s + d.cpu, 0) / 4;
        const avgP = prev4.reduce((s, d) => s + d.cpu, 0) / 4;
        if (avgP === 0) return 'Distributions have been remarkably consistent. Predictable, steady income.';
        const pct  = Math.abs(((avgR - avgP) / avgP) * 100).toFixed(1);
        return `Distributions have been remarkably consistent — within ${pct}% of last year's average. Predictable, steady income.`;
      },
    },
    declining: {
      icon: TrendingDown,
      label: 'Declining ↓',
      labelClass: 'text-danger',
      bgClass: 'bg-danger/5 border-danger/20',
      body: () => {
        const recent4 = distributions.slice(0, 4);
        const prev4   = distributions.slice(4, 8);
        const avgR = recent4.reduce((s, d) => s + d.cpu, 0) / 4;
        const avgP = prev4.reduce((s, d) => s + d.cpu, 0) / 4;
        if (avgP === 0) return 'Distribution amounts have decreased. This can happen due to market conditions and may recover — past payouts don\'t guarantee future ones.';
        const pct  = (((avgP - avgR) / avgP) * 100).toFixed(1);
        return `Distributions have decreased by ${pct}% compared to the same period last year. This can happen due to market conditions and may recover — past payouts don't guarantee future ones.`;
      },
    },
    insufficient: {
      icon: Info,
      label: 'Not enough data',
      labelClass: 'text-forest/40',
      bgClass: 'bg-bone border-forest/5',
      body: () => 'We need at least 8 quarters of history to identify a trend. Check back as more data becomes available.',
    },
  };

  const config = TREND_CONFIG[trend];
  const IconComponent = config.icon;

  return (
    <div className={`rounded-2xl border-2 p-4 ${config.bgClass}`} role="region" aria-label="Distribution trend">
      <div className="flex items-center gap-2 mb-2">
        <IconComponent size={18} className={config.labelClass} aria-hidden="true" />
        <span className={`font-black text-sm uppercase tracking-wider ${config.labelClass}`}>
          {config.label}
        </span>
      </div>
      <p className="text-sm text-forest/70 leading-relaxed">
        {config.body()}
      </p>
    </div>
  );
};

/** Seasonal payment calendar */
const PaymentCalendar = ({ distributions }) => {
  const paymentMonths = getPaymentMonths(distributions);

  return (
    <div>
      <h3 className="text-[10px] font-black uppercase tracking-widest text-forest/40 mb-3">
        📅 When Does It Pay?
      </h3>
      <div
        className="bg-white rounded-2xl border-2 border-forest/5 p-4"
        role="region"
        aria-label="Payment calendar showing which months distributions are paid"
      >
        <div className="grid grid-cols-12 gap-1" aria-hidden="true">
          {ALL_MONTHS.map((month) => {
            const isPaid = paymentMonths.has(month.num);
            return (
              <div
                key={month.num}
                className={`
                  flex flex-col items-center justify-center rounded-lg py-2
                  transition-colors
                  ${isPaid
                    ? 'bg-lime/30 border border-lime/50'
                    : 'bg-bone border border-transparent'
                  }
                `}
                title={`${month.full}: ${isPaid ? 'Distribution paid' : 'No distribution'}`}
              >
                <span className={`text-[10px] font-bold ${isPaid ? 'text-forest' : 'text-forest/30'}`}>
                  {month.abbr}
                </span>
                {isPaid && (
                  <span className="text-[10px] mt-0.5" aria-hidden="true">💰</span>
                )}
              </div>
            );
          })}
        </div>
        {/* Screen-reader accessible summary */}
        <p className="sr-only">
          This fund pays distributions in:{' '}
          {ALL_MONTHS.filter((m) => paymentMonths.has(m.num)).map((m) => m.full).join(', ')}
        </p>
        <p className="text-[11px] text-forest/40 mt-3 leading-relaxed">
          This fund pays you {paymentMonths.size === 4 ? 'quarterly (4 times a year)' :
            paymentMonths.size === 12 ? 'monthly (every month)' :
            paymentMonths.size === 2 ? 'twice a year' :
            `${paymentMonths.size} times a year`}.{' '}
          The cash lands in your brokerage account — you can reinvest it or keep it.
        </p>
      </div>
    </div>
  );
};

/** "My Money" calculator */
const MoneyCalculator = ({ distributions }) => {
  const [units, setUnits] = useState(100);

  // Derived values from input
  const calcValues = useMemo(() => {
    if (!distributions || distributions.length === 0) return null;

    const latestYear = parsePeriod(distributions[0].period)?.year;
    const latestYearCpu = getAnnualCpu(distributions, latestYear);
    const recentCpu = distributions[0].cpu; // Most recent single payout

    const annual  = latestYearCpu > 0 ? (latestYearCpu / 100) * units : null;
    const perPayout = (recentCpu / 100) * units;

    const avgQuarterlyCpu = distributions.slice(0, 4).reduce((s, d) => s + d.cpu, 0) / 4;
    const perQuarter = (avgQuarterlyCpu / 100) * units;

    return {
      latestYear,
      annual,
      perPayout,
      perQuarter,
      latestYearCpu,
    };
  }, [distributions, units]);

  if (!calcValues) return null;

  const handleUnitsChange = (e) => {
    const val = parseInt(e.target.value, 10);
    if (!isNaN(val) && val >= 0) setUnits(Math.min(val, 10_000_000));
  };

  return (
    <div>
      <h3 className="text-[10px] font-black uppercase tracking-widest text-forest/40 mb-3">
        💵 My Money Calculator
      </h3>
      <div
        className="bg-white rounded-2xl border-2 border-forest/5 p-5"
        role="region"
        aria-label="Distribution calculator"
        aria-live="polite"
      >
        {/* Units input */}
        <div className="flex items-center gap-3 mb-5">
          <label
            htmlFor="units-input"
            className="text-sm font-bold text-forest whitespace-nowrap"
          >
            I own
          </label>
          <div className="flex items-center gap-2 flex-1">
            <input
              id="units-input"
              type="number"
              value={units}
              onChange={handleUnitsChange}
              min={0}
              max={10000000}
              step={10}
              className="
                w-full max-w-[140px] text-2xl font-black text-forest
                border-b-2 border-forest bg-transparent
                focus:outline-none focus:border-lime
                text-center py-1 transition-colors
              "
              aria-label="Number of units owned"
            />
            <span className="text-sm font-bold text-forest/60">units</span>
          </div>
        </div>

        {/* Quick-set buttons */}
        <div className="flex gap-2 mb-5 flex-wrap" aria-label="Quick unit presets">
          {[50, 100, 500, 1000].map((preset) => (
            <button
              key={preset}
              onClick={() => setUnits(preset)}
              className={`
                text-xs font-bold px-3 py-1.5 rounded-full border transition-colors
                focus:outline-none focus-visible:outline-2 focus-visible:outline-lime
                ${units === preset
                  ? 'bg-forest text-lime border-forest'
                  : 'bg-bone text-forest/60 border-forest/10 hover:border-forest hover:text-forest'
                }
              `}
              aria-label={`Set units to ${preset}`}
              aria-pressed={units === preset}
            >
              {preset}
            </button>
          ))}
        </div>

        {/* Results */}
        <div className="space-y-3">

          {/* Annual result — the headline number */}
          {calcValues.annual !== null && (
            <motion.div
              key={`annual-${units}`}
              initial={{ scale: 0.97, opacity: 0.7 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.2 }}
              className="bg-lime/10 rounded-xl p-4"
            >
              <p className="text-[10px] font-black uppercase tracking-widest text-forest/50 mb-1">
                Last year ({calcValues.latestYear}) you would have received:
              </p>
              <p className="text-4xl font-black text-forest tracking-tighter" aria-live="polite">
                {formatRand(calcValues.annual)}
              </p>
              <p className="text-xs text-forest/50 mt-1">
                Based on {calcValues.latestYearCpu.toFixed(2)} CPU total in {calcValues.latestYear}
              </p>
            </motion.div>
          )}

          {/* Per-quarter breakdown */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-bone rounded-xl p-3">
              <p className="text-[10px] font-bold text-forest/40 uppercase tracking-widest mb-1">
                Per quarter (avg)
              </p>
              <motion.p
                key={`q-${units}`}
                initial={{ opacity: 0.7 }}
                animate={{ opacity: 1 }}
                className="text-xl font-black text-forest"
              >
                {formatRand(calcValues.perQuarter)}
              </motion.p>
            </div>
            <div className="bg-bone rounded-xl p-3">
              <p className="text-[10px] font-bold text-forest/40 uppercase tracking-widest mb-1">
                Most recent payout
              </p>
              <motion.p
                key={`r-${units}`}
                initial={{ opacity: 0.7 }}
                animate={{ opacity: 1 }}
                className="text-xl font-black text-forest"
              >
                {formatRand(calcValues.perPayout)}
              </motion.p>
            </div>
          </div>

          {/* Helpful context for default values */}
          {units === 100 && (
            <p className="text-[11px] text-forest/40 leading-relaxed text-center">
              Not sure how many units you have? Check your investment account on{' '}
              EasyEquities, FNB Share Investing, or your broker's app.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

const EmptyDistributionState = ({ etfName }) => (
  <div className="bg-white rounded-2xl border-2 border-dashed border-forest/10 p-12 text-center">
    <div className="w-16 h-16 bg-bone rounded-full flex items-center justify-center mx-auto mb-4">
      <Calendar size={28} className="text-forest/20" strokeWidth={1.5} aria-hidden="true" />
    </div>
    <h3 className="font-bold text-forest mb-2">No Distribution History</h3>
    <p className="text-sm text-forest/50 max-w-xs mx-auto leading-relaxed">
      No distribution records are available for {etfName} yet. Some funds (like growth-focused
      equity ETFs) reinvest income instead of paying it out, or data may not yet be available.
    </p>
  </div>
);

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

const DistributionHistoryView = ({ etf, onBack }) => {
  const hasDistributions = etf.distributions && etf.distributions.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="space-y-6"
    >
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div>
        <button
          onClick={onBack}
          className="
            flex items-center gap-2 text-sm font-bold text-forest/60
            hover:text-forest transition-colors mb-4
            focus:outline-none focus-visible:outline-2 focus-visible:outline-lime
            focus-visible:outline-offset-2 rounded-lg px-1
          "
          aria-label="Back to comparison"
        >
          <ArrowLeft size={16} strokeWidth={2} aria-hidden="true" />
          Back to comparison
        </button>

        {/* ETF identity */}
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-black bg-forest text-lime px-2 py-0.5 rounded uppercase tracking-widest">
                {etf.id}
              </span>
              {etf.is_tfsa_eligible && (
                <span className="text-[10px] font-bold text-forest bg-lime/30 px-2 py-0.5 rounded uppercase tracking-widest">
                  🛡️ TFSA
                </span>
              )}
            </div>
            <h1 className="font-black text-xl text-forest leading-tight tracking-tight max-w-sm">
              {etf.name}
            </h1>
            <p className="text-sm text-forest/50 mt-1">
              {etf.provider} · Distribution History
            </p>
          </div>
        </div>
      </div>

      {/* ── Content ─────────────────────────────────────────────────────── */}
      {hasDistributions ? (
        <>
          {/* 1. Plain-English summary */}
          <SummaryCard distributions={etf.distributions} />

          {/* 2. Bar chart */}
          <DistributionBarChart distributions={etf.distributions} />

          {/* 3. Trend */}
          <TrendCard distributions={etf.distributions} />

          {/* 4. Seasonal calendar */}
          <PaymentCalendar distributions={etf.distributions} />

          {/* 5. Calculator */}
          <MoneyCalculator distributions={etf.distributions} />
        </>
      ) : (
        <EmptyDistributionState etfName={etf.name} />
      )}

      {/* ── Legal footnote ───────────────────────────────────────────────── */}
      <div
        className="bg-bone rounded-2xl p-4 flex items-start gap-3"
        role="note"
        aria-label="Important disclaimer"
      >
        <Info size={16} className="text-forest/40 shrink-0 mt-0.5" aria-hidden="true" />
        <p className="text-[11px] text-forest/50 leading-relaxed">
          <strong className="text-forest/70 font-bold">Educational information only.</strong>{' '}
          Past distributions do not guarantee future payouts. The amount you receive depends on
          how many units you own and the fund's future performance. This is not financial advice.
          Please consult a licensed financial advisor for personalised guidance.
        </p>
      </div>

    </motion.div>
  );
};

export default DistributionHistoryView;
