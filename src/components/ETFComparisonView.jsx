/**
 * ETFComparisonView.jsx
 *
 * View 1: Side-by-side ETF metadata comparison for beginner investors.
 * Design spec: DESIGN_SPEC_BEGINNER_VIEWS.md § 4
 *
 * Features:
 *  - Sticky label column + horizontal-scrolling ETF columns (mobile-first)
 *  - 5 comparison rows: TFSA, Annual Fee, Fund Size, Market, Benchmark
 *  - Winner highlighting (lime accent) for cheapest fee, largest fund
 *  - GlossaryTooltip on every row label (one open at a time)
 *  - Auto-generated "Quick Take" insights in plain language
 *  - "View Distributions →" CTA per ETF
 *
 * Props:
 *   etfs                  {Array<ETF>}  2 or 3 ETF objects from etfs.json
 *   onViewDistributions   {Function}    (etfId: string) => void
 *   onBack                {Function}    () => void
 *
 * Data shape expected per ETF:
 *   { id, name, provider, market, benchmark, ter, fund_size,
 *     is_tfsa_eligible, holdings, distributions }
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, AlertTriangle, CheckCircle, XCircle,
  ChevronRight, ArrowLeft, Star, TrendingUp,
  Building2, Globe, BarChart2
} from 'lucide-react';
import GlossaryTooltip from './GlossaryTooltip';

// ---------------------------------------------------------------------------
// Formatting helpers
// ---------------------------------------------------------------------------

/** Format raw fund_size bytes → "R2.96B" / "R443M" */
const formatFundSize = (size) => {
  if (size === null || size === undefined) return null;
  if (size >= 1_000_000_000) return `R${(size / 1_000_000_000).toFixed(2)}B`;
  if (size >= 1_000_000) return `R${(size / 1_000_000).toFixed(0)}M`;
  return `R${size.toLocaleString('en-ZA')}`;
};

/** Return a label, Tailwind class string, and emoji for a given TER value */
const getTerProfile = (ter) => {
  if (ter === null || ter === undefined) {
    return { label: 'Data unavailable', classes: 'bg-sage text-forest/50', emoji: '' };
  }
  if (ter <= 0.25) {
    return { label: 'Excellent', classes: 'bg-lime text-forest', emoji: '⭐' };
  }
  if (ter <= 0.50) {
    return { label: 'Moderate', classes: 'bg-amber-100 text-amber-800', emoji: '👍' };
  }
  return { label: 'High fee', classes: 'bg-danger/10 text-danger', emoji: '⚠️' };
};

/** Return a label for a given fund size */
const getFundSizeLabel = (size) => {
  if (size === null || size === undefined) return null;
  if (size >= 1_000_000_000) return 'Large Fund';
  if (size >= 500_000_000) return 'Medium Fund';
  return 'Smaller Fund';
};

/** Market display: flag emoji + name */
const MARKET_META = {
  JSE:       { flag: '🇿🇦', label: 'JSE (South Africa)' },
  US:        { flag: '🇺🇸', label: 'US Markets' },
  Global:    { flag: '🌍', label: 'Global Markets' },
  Commodity: { flag: '⛏️', label: 'Commodities' },
  FX:        { flag: '💱', label: 'Foreign Exchange' },
};
const getMarketMeta = (market) =>
  MARKET_META[market] || { flag: '📊', label: market || 'Unknown' };

// ---------------------------------------------------------------------------
// Auto-generate "Quick Take" beginner insights from comparison data
// ---------------------------------------------------------------------------

const generateInsights = (etfs) => {
  const insights = [];

  // ── Fee insight ─────────────────────────────────────────────────────────
  const withTer = etfs.filter((e) => e.ter !== null && e.ter !== undefined);
  if (withTer.length >= 2) {
    const sorted = [...withTer].sort((a, b) => a.ter - b.ter);
    const cheapest = sorted[0];
    const priciest = sorted[sorted.length - 1];
    const diff = priciest.ter - cheapest.ter;
    const randDiff = (diff * 10000 / 100).toFixed(0); // ZAR on R10k invested

    if (diff >= 0.01) {
      const cheapName = cheapest.name.split(' ').slice(0, 3).join(' ');
      insights.push({
        id: 'fee',
        icon: '💰',
        headline: `${cheapName} costs less in fees`,
        body: `The annual fee difference is ${diff.toFixed(2)}%. On a R10,000 investment that's roughly R${randDiff} less per year — a small number now, but it compounds over time.`,
      });
    }
  }

  // ── TFSA insight ─────────────────────────────────────────────────────────
  const tfsaYes = etfs.filter((e) => e.is_tfsa_eligible === true);
  const tfsaNo  = etfs.filter((e) => e.is_tfsa_eligible === false);
  if (tfsaYes.length > 0 && tfsaNo.length > 0) {
    const eligibleNames = tfsaYes.map((e) => e.name.split(' ').slice(0, 4).join(' ')).join(' and ');
    insights.push({
      id: 'tfsa',
      icon: '🛡️',
      headline: 'TFSA eligibility differs — this matters',
      body: `${eligibleNames} can go in your Tax-Free Savings Account. Any income or growth inside a TFSA is never taxed. If you're building long-term savings, that's a significant advantage.`,
    });
  }

  // ── Market diversification insight ───────────────────────────────────────
  const markets = [...new Set(etfs.map((e) => e.market).filter(Boolean))];
  if (markets.length > 1) {
    insights.push({
      id: 'diversification',
      icon: '🌍',
      headline: 'Different markets — built-in diversification',
      body: `These funds invest in different regions (${markets.join(' and ')}). Holding both spreads your money across geographies, which reduces the risk of any single market dragging down your entire portfolio.`,
    });
  }

  // ── Same benchmark warning ────────────────────────────────────────────────
  const benchmarks = etfs.map((e) => e.benchmark).filter(Boolean);
  if (benchmarks.length >= 2 && new Set(benchmarks).size === 1) {
    insights.push({
      id: 'overlap',
      icon: '⚠️',
      headline: 'These funds track the same index!',
      body: `Both ETFs follow the "${benchmarks[0]}". Buying one gives you nearly identical exposure to the other. You likely don't need both — it adds cost without adding diversification.`,
    });
  }

  // ── Size / liquidity insight ──────────────────────────────────────────────
  const withSize = etfs.filter((e) => e.fund_size !== null && e.fund_size !== undefined);
  if (withSize.length >= 2) {
    const largest = withSize.reduce((max, e) => e.fund_size > max.fund_size ? e : max);
    const smallest = withSize.reduce((min, e) => e.fund_size < min.fund_size ? e : min);
    const ratio = largest.fund_size / smallest.fund_size;
    if (ratio >= 2) {
      insights.push({
        id: 'size',
        icon: '📊',
        headline: `${largest.id} is the bigger, more established fund`,
        body: `${largest.id} has ${formatFundSize(largest.fund_size)} invested in it — significantly more than the others. More assets usually means the fund is easier to buy and sell, and less likely to close down.`,
      });
    }
  }

  return insights;
};

// ---------------------------------------------------------------------------
// Glossary definitions (spec § 7)
// ---------------------------------------------------------------------------

const GLOSSARY = {
  tfsa: 'A Tax-Free Savings Account lets you invest up to R36,000 per year (R500,000 lifetime) without paying tax on your growth or income. Only TFSA-eligible funds can be held there — one of the best tax perks for South African investors.',
  ter:  'The annual fee, called TER or Total Expense Ratio, is deducted automatically from the fund — you never get a bill. Lower is always better. 0.25% means R25 per year on a R10,000 investment.',
  fundSize: 'The total money all investors have put into this fund. A bigger fund is generally more established and easier to buy and sell on the JSE. It doesn\'t directly affect your returns, but very small funds carry a risk of closing.',
  benchmark: 'The index this ETF copies. Think of it as a recipe — the fund buys the same shares or bonds, in the same proportions, as the index it follows. If the index goes up 10%, this ETF should too.',
  market: 'Where the investments in this fund come from. JSE = South African shares or bonds. US = American companies. Global = a mix of many countries. Spreading across markets reduces risk.',
  distributions: 'Some ETFs pay you a share of the income they earn (from dividends or interest). Tap "View Distributions" to see the full payout history for this fund.',
};

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/** ETF header "chip" shown at the top of each column */
const EtfHeaderChip = ({ etf, colourIndex }) => {
  const colours = [
    'border-forest bg-forest text-lime',
    'border-forest/60 bg-forest/10 text-forest',
    'border-lime bg-lime/30 text-forest',
  ];
  return (
    <div className={`rounded-xl border-2 p-3 ${colours[colourIndex % 3]}`}>
      <p className="text-[10px] font-bold uppercase tracking-widest opacity-60 mb-0.5">
        {etf.provider || 'Unknown provider'}
      </p>
      <p className="font-black text-sm leading-tight tracking-tight line-clamp-2">
        {etf.name}
      </p>
      <p className="text-[11px] font-mono font-bold mt-1 opacity-70">{etf.id}</p>
    </div>
  );
};

/** A single comparison row — label (sticky) + one cell per ETF */
const ComparisonRow = ({ label, emoji, glossaryTerm, glossaryDef, openTerm, onToggleTerm, children }) => {
  return (
    <div className="border-b border-forest/5 last:border-0">
      {/* Data row */}
      <div className="flex min-h-[72px]">

        {/* ── Label cell (sticky on mobile) ────────────────────────────── */}
        <div
          className="w-[108px] shrink-0 sticky left-0 z-10 bg-white py-4 pr-3 flex flex-col justify-center"
        >
          <GlossaryTooltip
            term={glossaryTerm}
            definition={glossaryDef}
            isOpen={openTerm === label}
            onToggle={() => onToggleTerm(label)}
          >
            <span className="text-[11px] font-bold text-forest/60 uppercase tracking-widest leading-tight flex items-center gap-1">
              <span aria-hidden="true">{emoji}</span>
              {label}
            </span>
          </GlossaryTooltip>
        </div>

        {/* ── ETF value cells ───────────────────────────────────────────── */}
        {children}
      </div>
    </div>
  );
};

/** TFSA eligibility cell */
const TfsaCell = ({ etf, isWinner }) => (
  <div className={`flex-1 min-w-[140px] py-4 px-3 flex items-center transition-colors ${isWinner ? 'bg-lime/15' : ''}`}>
    {etf.is_tfsa_eligible === true ? (
      <span className="flex items-center gap-2 font-bold text-forest text-sm">
        <CheckCircle size={18} className="text-forest shrink-0" strokeWidth={2.5} aria-hidden="true" />
        TFSA eligible
      </span>
    ) : etf.is_tfsa_eligible === false ? (
      <span className="flex items-center gap-2 text-forest/40 font-medium text-sm">
        <XCircle size={18} className="shrink-0" aria-hidden="true" />
        Not eligible
      </span>
    ) : (
      <span className="text-forest/30 text-sm">Unknown</span>
    )}
  </div>
);

/** TER / Annual fee cell */
const TerCell = ({ etf, isWinner }) => {
  const profile = getTerProfile(etf.ter);
  return (
    <div className={`flex-1 min-w-[140px] py-4 px-3 transition-colors ${isWinner ? 'bg-lime/15 border-l-2 border-lime' : ''}`}>
      {etf.ter !== null && etf.ter !== undefined ? (
        <div>
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="text-2xl font-black text-forest tracking-tighter">
              {etf.ter.toFixed(2)}%
            </span>
            {isWinner && (
              <motion.span
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3, duration: 0.3 }}
                className="text-[9px] font-black uppercase tracking-widest bg-forest text-lime px-1.5 py-0.5 rounded"
              >
                Cheapest
              </motion.span>
            )}
          </div>
          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full mt-1 inline-block ${profile.classes}`}>
            {profile.emoji} {profile.label}
          </span>
          {/* Plain-language fee in rands */}
          <p className="text-[11px] text-forest/40 mt-1">
            = R{(etf.ter * 100).toFixed(0)}/yr per R10k
          </p>
        </div>
      ) : (
        <span className="text-sm text-forest/30 font-medium">Fee data unavailable</span>
      )}
    </div>
  );
};

/** Fund size cell with relative bar */
const FundSizeCell = ({ etf, maxFundSize, isWinner }) => {
  const formatted = formatFundSize(etf.fund_size);
  const sizeLabel = getFundSizeLabel(etf.fund_size);
  const barPct = maxFundSize > 0 && etf.fund_size
    ? (etf.fund_size / maxFundSize) * 100
    : 0;

  return (
    <div className={`flex-1 min-w-[140px] py-4 px-3 transition-colors ${isWinner ? 'bg-lime/15 border-l-2 border-lime' : ''}`}>
      {formatted ? (
        <div>
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="text-xl font-black text-forest tracking-tighter">
              {formatted}
            </span>
            {isWinner && (
              <motion.span
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.35, duration: 0.3 }}
                className="text-[9px] font-black uppercase tracking-widest bg-forest text-lime px-1.5 py-0.5 rounded"
              >
                Largest
              </motion.span>
            )}
          </div>
          {/* Relative size bar */}
          <div className="mt-2 h-1.5 w-full bg-sage rounded-full overflow-hidden" aria-hidden="true">
            <motion.div
              className="h-full bg-forest/40 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${barPct}%` }}
              transition={{ delay: 0.4, duration: 0.6, ease: 'easeOut' }}
            />
          </div>
          <p className="text-[11px] text-forest/40 mt-1">{sizeLabel}</p>
        </div>
      ) : (
        <span className="text-2xl font-black text-forest/20">–</span>
      )}
    </div>
  );
};

/** Market cell */
const MarketCell = ({ etf }) => {
  const meta = getMarketMeta(etf.market);
  return (
    <div className="flex-1 min-w-[140px] py-4 px-3">
      <p className="text-lg font-bold text-forest">
        <span aria-hidden="true" className="mr-1.5">{meta.flag}</span>
        {etf.market || '–'}
      </p>
      <p className="text-[11px] text-forest/40 mt-0.5">{meta.label}</p>
    </div>
  );
};

/** Benchmark cell (truncated with tooltip on tap) */
const BenchmarkCell = ({ etf }) => {
  const [expanded, setExpanded] = useState(false);
  const bench = etf.benchmark;
  if (!bench) {
    return (
      <div className="flex-1 min-w-[140px] py-4 px-3">
        <span className="text-forest/30 text-sm">–</span>
      </div>
    );
  }

  // Shorten the benchmark name for display
  const shortBench = bench.length > 40 ? bench.slice(0, 38) + '…' : bench;
  return (
    <div className="flex-1 min-w-[140px] py-4 px-3">
      <button
        onClick={() => setExpanded((p) => !p)}
        className="text-left group"
        aria-label={expanded ? `Collapse benchmark name` : `Expand full benchmark: ${bench}`}
      >
        <p className="text-sm font-bold text-forest leading-snug group-hover:underline">
          {expanded ? bench : shortBench}
        </p>
        {bench.length > 40 && (
          <p className="text-[10px] text-forest/40 mt-0.5">
            {expanded ? 'Show less' : 'Tap to read full name'}
          </p>
        )}
      </button>
    </div>
  );
};

/** Distribution availability cell */
const DistributionCell = ({ etf }) => {
  const hasHistory = etf.distributions && etf.distributions.length > 0;
  return (
    <div className="flex-1 min-w-[140px] py-4 px-3">
      {hasHistory ? (
        <div>
          <span className="flex items-center gap-1.5 text-sm font-bold text-forest">
            <BarChart2 size={15} className="shrink-0" aria-hidden="true" />
            {etf.distributions.length} periods
          </span>
          <p className="text-[11px] text-forest/40 mt-0.5">History available</p>
        </div>
      ) : (
        <span className="text-forest/30 text-sm">No history</span>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

const ETFComparisonView = ({ etfs, onViewDistributions, onBack }) => {
  // Which glossary row is currently expanded (only one at a time)
  const [openTerm, setOpenTerm] = useState(null);

  const handleToggleTerm = (label) => {
    setOpenTerm((prev) => (prev === label ? null : label));
  };

  // ── Derived winner IDs ──────────────────────────────────────────────────
  const terWinnerId = useMemo(() => {
    const withTer = etfs.filter((e) => e.ter !== null && e.ter !== undefined);
    if (withTer.length < 2) return null;
    const min = Math.min(...withTer.map((e) => e.ter));
    // Only highlight if there's a clear winner (not tied)
    const winners = withTer.filter((e) => e.ter === min);
    return winners.length === 1 ? winners[0].id : null;
  }, [etfs]);

  const sizeWinnerId = useMemo(() => {
    const withSize = etfs.filter((e) => e.fund_size !== null && e.fund_size !== undefined);
    if (withSize.length < 2) return null;
    const max = Math.max(...withSize.map((e) => e.fund_size));
    const winners = withSize.filter((e) => e.fund_size === max);
    return winners.length === 1 ? winners[0].id : null;
  }, [etfs]);

  const maxFundSize = useMemo(() => {
    const sizes = etfs.map((e) => e.fund_size).filter(Boolean);
    return sizes.length ? Math.max(...sizes) : 0;
  }, [etfs]);

  const allTfsaEligible = etfs.every((e) => e.is_tfsa_eligible === true);
  const tfsaWinnerIds = useMemo(() => {
    if (allTfsaEligible) return []; // No winner when all eligible
    return etfs.filter((e) => e.is_tfsa_eligible === true).map((e) => e.id);
  }, [etfs, allTfsaEligible]);

  // ── Quick Take insights ────────────────────────────────────────────────
  const insights = useMemo(() => generateInsights(etfs), [etfs]);

  // ── Row definitions (ordered by beginner importance) ───────────────────
  const rows = [
    {
      label: 'Tax-Free Savings',
      emoji: '🛡️',
      glossaryTerm: 'Tax-Free Savings Account (TFSA)',
      glossaryDef: GLOSSARY.tfsa,
      renderCell: (etf) => (
        <TfsaCell
          key={etf.id}
          etf={etf}
          isWinner={tfsaWinnerIds.includes(etf.id)}
        />
      ),
    },
    {
      label: 'Annual Fee',
      emoji: '💰',
      glossaryTerm: 'Annual Fee (TER)',
      glossaryDef: GLOSSARY.ter,
      renderCell: (etf) => (
        <TerCell
          key={etf.id}
          etf={etf}
          isWinner={terWinnerId === etf.id}
        />
      ),
    },
    {
      label: 'Fund Size',
      emoji: '📊',
      glossaryTerm: 'Fund Size',
      glossaryDef: GLOSSARY.fundSize,
      renderCell: (etf) => (
        <FundSizeCell
          key={etf.id}
          etf={etf}
          maxFundSize={maxFundSize}
          isWinner={sizeWinnerId === etf.id}
        />
      ),
    },
    {
      label: 'Market',
      emoji: '🌍',
      glossaryTerm: 'Market',
      glossaryDef: GLOSSARY.market,
      renderCell: (etf) => <MarketCell key={etf.id} etf={etf} />,
    },
    {
      label: 'Tracks',
      emoji: '📈',
      glossaryTerm: 'What It Tracks (Benchmark)',
      glossaryDef: GLOSSARY.benchmark,
      renderCell: (etf) => <BenchmarkCell key={etf.id} etf={etf} />,
    },
    {
      label: 'Distributions',
      emoji: '💵',
      glossaryTerm: 'Distributions',
      glossaryDef: GLOSSARY.distributions,
      renderCell: (etf) => <DistributionCell key={etf.id} etf={etf} />,
    },
  ];

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="space-y-6"
    >

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm font-bold text-forest/60 hover:text-forest transition-colors focus:outline-none focus-visible:outline-2 focus-visible:outline-lime focus-visible:outline-offset-2 rounded-lg px-1"
          aria-label="Back to ETF selection"
        >
          <ArrowLeft size={16} strokeWidth={2} aria-hidden="true" />
          Change ETFs
        </button>
        <h2 className="text-sm font-black uppercase tracking-widest text-forest/40">
          Comparing {etfs.length} fund{etfs.length !== 1 ? 's' : ''}
        </h2>
      </div>

      {/* ── Comparison table card ────────────────────────────────────────── */}
      <div
        className="bg-white rounded-[2rem] border-2 border-forest/5 shadow-xl shadow-forest/5 overflow-hidden"
        role="region"
        aria-label="ETF feature comparison"
      >
        {/* ── ETF header chips (scroll with table) ──────────────────────── */}
        {/* Outer wrapper: overflow-x-auto lets the whole table + headers scroll together */}
        <div className="overflow-x-auto">
          {/* Min-width: 108px (label col) + 150px × n (ETF cols) */}
          <div style={{ minWidth: `${108 + etfs.length * 155}px` }}>

            {/* ETF header chips */}
            <div className="flex border-b-2 border-forest/5 bg-bone/40">
              {/* Spacer for label column */}
              <div className="w-[108px] shrink-0 sticky left-0 z-10 bg-bone/40 p-3 flex items-end">
                <span className="text-[9px] font-black uppercase tracking-widest text-forest/30">
                  FEATURE
                </span>
              </div>
              {/* ETF chips */}
              {etfs.map((etf, i) => (
                <div key={etf.id} className="flex-1 min-w-[155px] p-3">
                  <EtfHeaderChip etf={etf} colourIndex={i} />
                </div>
              ))}
            </div>

            {/* ── Comparison rows ────────────────────────────────────────── */}
            {rows.map((row) => (
              <ComparisonRow
                key={row.label}
                label={row.label}
                emoji={row.emoji}
                glossaryTerm={row.glossaryTerm}
                glossaryDef={row.glossaryDef}
                openTerm={openTerm}
                onToggleTerm={handleToggleTerm}
              >
                {etfs.map((etf) => row.renderCell(etf))}
              </ComparisonRow>
            ))}

          </div>
        </div>

        {/* ── Scroll hint overlay (mobile only) ─────────────────────────── */}
        {etfs.length >= 2 && (
          <div className="sm:hidden px-4 py-2 bg-bone/60 border-t border-forest/5">
            <p className="text-[10px] text-forest/40 font-medium text-center">
              ← Scroll to compare all funds →
            </p>
          </div>
        )}
      </div>

      {/* ── Quick Take insights ─────────────────────────────────────────── */}
      {insights.length > 0 && (
        <section aria-label="Plain-language comparison insights">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-forest/40 mb-3 px-1">
            📝 Quick Take
          </h3>
          <div className="space-y-3">
            {insights.map((insight, i) => (
              <motion.div
                key={insight.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.1, duration: 0.4 }}
                className={`
                  bg-white rounded-2xl border-2 p-4
                  ${insight.id === 'overlap' ? 'border-danger/20' : 'border-forest/5'}
                `}
              >
                <p className="font-black text-forest text-sm leading-tight mb-1">
                  <span aria-hidden="true" className="mr-2">{insight.icon}</span>
                  {insight.headline}
                </p>
                <p className="text-sm text-forest/60 leading-relaxed">
                  {insight.body}
                </p>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* ── "View Distributions" CTAs ────────────────────────────────────── */}
      <section aria-label="Distribution history actions" className="space-y-2">
        <p className="text-[10px] font-black uppercase tracking-widest text-forest/40 mb-3 px-1">
          💵 See the Payouts
        </p>
        {etfs.map((etf) => {
          const hasDistributions = etf.distributions && etf.distributions.length > 0;
          return (
            <button
              key={etf.id}
              onClick={() => hasDistributions && onViewDistributions(etf.id)}
              disabled={!hasDistributions}
              aria-label={
                hasDistributions
                  ? `View distribution history for ${etf.name}`
                  : `${etf.name} has no distribution history`
              }
              className={`
                w-full flex items-center justify-between
                bg-white rounded-2xl border-2 p-4
                transition-all duration-200 group
                focus:outline-none focus-visible:outline-2 focus-visible:outline-lime focus-visible:outline-offset-2
                ${hasDistributions
                  ? 'border-forest/5 hover:border-forest hover:shadow-lg hover:shadow-forest/5 cursor-pointer'
                  : 'border-dashed border-forest/10 cursor-not-allowed opacity-50'
                }
              `}
            >
              <div className="text-left">
                <p className="font-black text-forest text-sm tracking-tight">
                  {etf.id} Distribution History
                </p>
                <p className="text-xs text-forest/50 mt-0.5">
                  {hasDistributions
                    ? `${etf.distributions.length} quarterly records available`
                    : 'No distribution data available'
                  }
                </p>
              </div>
              {hasDistributions && (
                <ChevronRight
                  size={20}
                  className="text-forest/30 group-hover:text-forest group-hover:translate-x-1 transition-all"
                  aria-hidden="true"
                />
              )}
            </button>
          );
        })}
      </section>

      {/* ── Legal footnote ──────────────────────────────────────────────── */}
      <p className="text-[11px] text-forest/30 leading-relaxed text-center px-4">
        This is educational information only, not financial advice. Data sourced from JSE filings.
        Always consult a licensed financial advisor before investing.
      </p>

    </motion.div>
  );
};

export default ETFComparisonView;
