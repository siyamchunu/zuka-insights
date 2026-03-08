import React, { useState } from 'react';
import { PieChart, Info } from 'lucide-react';

// GICS-aligned sector colour palette
const SECTOR_COLORS = {
  'Information Technology':   '#3B82F6',
  'Financials':               '#10B981',
  'Health Care':              '#F43F5E',
  'Healthcare':               '#F43F5E',
  'Consumer Discretionary':   '#F59E0B',
  'Industrials':              '#F97316',
  'Energy':                   '#EF4444',
  'Materials':                '#8B5CF6',
  'Utilities':                '#14B8A6',
  'Real Estate':              '#6366F1',
  'Consumer Staples':         '#84CC16',
  'Communication Services':   '#06B6D4',
  'Communication':            '#06B6D4',
};

const FALLBACK_COLORS = [
  '#64748B','#78716C','#A8A29E','#71717A','#737373',
  '#6B7280','#9CA3AF','#94A3B8','#A1A1AA','#D6D3D1',
];

function getSectorColor(sector, index) {
  return SECTOR_COLORS[sector] || FALLBACK_COLORS[index % FALLBACK_COLORS.length];
}

// Merge two sector arrays into a unified sector list for comparison
function mergeSectors(sectorA, sectorB) {
  const all = new Set([
    ...(sectorA || []).map(s => s.sector),
    ...(sectorB || []).map(s => s.sector),
  ]);
  return Array.from(all)
    .map(sector => ({
      sector,
      weightA: sectorA?.find(s => s.sector === sector)?.weight ?? null,
      weightB: sectorB?.find(s => s.sector === sector)?.weight ?? null,
    }))
    .sort((a, b) => {
      const maxA = Math.max(a.weightA ?? 0, a.weightB ?? 0);
      const maxB = Math.max(b.weightA ?? 0, b.weightB ?? 0);
      return maxB - maxA;
    });
}

// Horizontal stacked bar
function SectorBar({ sectors }) {
  return (
    <div className="flex h-5 rounded-full overflow-hidden w-full gap-px">
      {sectors.map(({ sector, weight }, i) => (
        <div
          key={sector}
          style={{
            width: `${weight}%`,
            backgroundColor: getSectorColor(sector, i),
            minWidth: weight > 0.5 ? '2px' : '0',
          }}
          title={`${sector}: ${weight.toFixed(1)}%`}
        />
      ))}
    </div>
  );
}

// Single ETF sector breakdown panel
function SinglePanel({ name, sectors, label }) {
  const colors = sectors.map((s, i) => getSectorColor(s.sector, i));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <span className="text-[10px] font-bold text-forest/40 uppercase tracking-[0.2em]">{label}</span>
          <p className="font-bold text-forest text-sm leading-tight mt-0.5 truncate max-w-[200px]">{name}</p>
        </div>
        <span className="text-xs font-semibold text-forest/40">{sectors.length} sectors</span>
      </div>
      <SectorBar sectors={sectors} />
      <div className="space-y-2 mt-2">
        {sectors.map((s, i) => (
          <div key={s.sector} className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <span
                className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
                style={{ backgroundColor: colors[i] }}
              />
              <span className="text-xs text-forest/70 truncate">{s.sector}</span>
            </div>
            <span className="text-xs font-bold text-forest tabular-nums flex-shrink-0">{s.weight.toFixed(1)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function SectorBreakdown({ sectorA, sectorB, nameA, nameB }) {
  const [view, setView] = useState('compare'); // 'compare' | 'table'

  const hasA = sectorA && sectorA.length > 0;
  const hasB = sectorB && sectorB.length > 0;
  const hasBoth = hasA && hasB;
  const hasAny = hasA || hasB;

  if (!hasAny) {
    return (
      <div className="bg-white rounded-[2rem] border-2 border-forest/5 p-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-bone rounded-lg">
            <PieChart size={20} className="text-forest/40" strokeWidth={1.5} />
          </div>
          <h3 className="font-bold text-forest text-lg tracking-tight">Sector Analysis</h3>
        </div>
        <div className="flex items-start gap-3 bg-bone rounded-2xl p-5">
          <Info size={16} className="text-forest/40 mt-0.5 flex-shrink-0" strokeWidth={1.5} />
          <p className="text-sm text-forest/60 leading-relaxed">
            Sector data is not available for these ETFs. Sector analysis is currently
            supported for <span className="font-semibold text-forest/80">international index ETFs</span> (e.g.
            S&amp;P 500, MSCI World). Local SA equity ETFs track the JSE, where
            sector classification is being added.
          </p>
        </div>
      </div>
    );
  }

  const merged = hasBoth ? mergeSectors(sectorA, sectorB) : null;

  return (
    <div className="bg-white rounded-[2rem] border-2 border-forest/5 overflow-hidden">
      {/* Header */}
      <div className="px-8 pt-8 pb-6 flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-bone rounded-lg">
            <PieChart size={20} className="text-forest" strokeWidth={1.5} />
          </div>
          <div>
            <h3 className="font-bold text-forest text-lg tracking-tight">Sector Analysis</h3>
            {!hasBoth && (
              <p className="text-xs text-forest/40 mt-0.5">
                Sector data available for {hasA ? nameA : nameB} only
              </p>
            )}
          </div>
        </div>

        {/* View toggle — only show when both have data */}
        {hasBoth && (
          <div className="flex items-center gap-1 bg-bone rounded-xl p-1">
            <button
              onClick={() => setView('compare')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                view === 'compare'
                  ? 'bg-forest text-lime shadow-sm'
                  : 'text-forest/50 hover:text-forest'
              }`}
            >
              Visual
            </button>
            <button
              onClick={() => setView('table')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                view === 'table'
                  ? 'bg-forest text-lime shadow-sm'
                  : 'text-forest/50 hover:text-forest'
              }`}
            >
              Compare
            </button>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="px-8 pb-8">
        {/* Only one ETF has sector data */}
        {!hasBoth && (
          <div className="space-y-6">
            {hasA && <SinglePanel name={nameA} sectors={sectorA} label="ETF A" />}
            {hasB && <SinglePanel name={nameB} sectors={sectorB} label="ETF B" />}
            <div className="flex items-start gap-3 bg-bone rounded-2xl p-4 mt-2">
              <Info size={14} className="text-forest/40 mt-0.5 flex-shrink-0" strokeWidth={1.5} />
              <p className="text-xs text-forest/50 leading-relaxed">
                Sector data is not available for {hasA ? nameB : nameA}.
                Comparison requires sector data for both ETFs.
              </p>
            </div>
          </div>
        )}

        {/* Both ETFs — Visual view: two stacked bars */}
        {hasBoth && view === 'compare' && (
          <div className="space-y-10">
            {/* Shared legend */}
            <div className="flex flex-wrap gap-x-5 gap-y-2">
              {merged.map(({ sector }, i) => (
                <div key={sector} className="flex items-center gap-1.5">
                  <span
                    className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
                    style={{ backgroundColor: getSectorColor(sector, i) }}
                  />
                  <span className="text-xs text-forest/60">{sector}</span>
                </div>
              ))}
            </div>

            {/* ETF A bar */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-forest/40 uppercase tracking-[0.2em]">ETF A</span>
                  <p className="font-bold text-forest text-sm leading-tight">{nameA}</p>
                </div>
                <span className="text-xs text-forest/40">{sectorA.length} sectors</span>
              </div>
              <SectorBar sectors={sectorA} />
            </div>

            {/* ETF B bar */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-forest/40 uppercase tracking-[0.2em]">ETF B</span>
                  <p className="font-bold text-forest text-sm leading-tight">{nameB}</p>
                </div>
                <span className="text-xs text-forest/40">{sectorB.length} sectors</span>
              </div>
              <SectorBar sectors={sectorB} />
            </div>

            {/* Largest sector difference */}
            {(() => {
              const diffs = merged
                .filter(r => r.weightA !== null && r.weightB !== null)
                .map(r => ({ ...r, diff: Math.abs(r.weightA - r.weightB) }))
                .sort((a, b) => b.diff - a.diff);
              const top = diffs[0];
              if (!top) return null;
              const idx = merged.findIndex(r => r.sector === top.sector);
              return (
                <div className="flex items-start gap-3 bg-bone rounded-2xl p-5">
                  <span
                    className="w-3 h-3 rounded-sm flex-shrink-0 mt-0.5"
                    style={{ backgroundColor: getSectorColor(top.sector, idx) }}
                  />
                  <div>
                    <p className="text-xs font-bold text-forest mb-0.5">Biggest divergence: {top.sector}</p>
                    <p className="text-xs text-forest/50 leading-relaxed">
                      {nameA} allocates <span className="font-bold text-forest">{top.weightA.toFixed(1)}%</span> vs{' '}
                      {nameB} at <span className="font-bold text-forest">{top.weightB.toFixed(1)}%</span> —
                      a <span className="font-bold text-forest">{top.diff.toFixed(1)}pp</span> difference.
                    </p>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* Both ETFs — Table view: side-by-side comparison */}
        {hasBoth && view === 'table' && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-forest/5">
                  <th className="text-left py-3 pr-4 text-[10px] font-bold text-forest/40 uppercase tracking-[0.15em] w-5/12">Sector</th>
                  <th className="text-right py-3 px-3 text-[10px] font-bold text-forest/40 uppercase tracking-[0.15em] w-3/12">{nameA.split(' ').slice(0,2).join(' ')}</th>
                  <th className="text-right py-3 px-3 text-[10px] font-bold text-forest/40 uppercase tracking-[0.15em] w-3/12">{nameB.split(' ').slice(0,2).join(' ')}</th>
                  <th className="text-right py-3 pl-3 text-[10px] font-bold text-forest/40 uppercase tracking-[0.15em] w-1/12">Δ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-forest/5">
                {merged.map(({ sector, weightA, weightB }, i) => {
                  const diff = weightA !== null && weightB !== null
                    ? (weightA - weightB).toFixed(1)
                    : null;
                  const color = getSectorColor(sector, i);
                  return (
                    <tr key={sector} className="hover:bg-bone/50 transition-colors group">
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: color }} />
                          <span className="font-medium text-forest text-xs">{sector}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-right">
                        {weightA !== null ? (
                          <div className="flex items-center justify-end gap-2">
                            <div className="w-12 h-1.5 bg-forest/5 rounded-full overflow-hidden hidden sm:block">
                              <div className="h-full rounded-full" style={{ width: `${Math.min(weightA, 40) * 2.5}%`, backgroundColor: color }} />
                            </div>
                            <span className="font-bold text-forest tabular-nums text-xs">{weightA.toFixed(1)}%</span>
                          </div>
                        ) : (
                          <span className="text-forest/20 text-xs">—</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right">
                        {weightB !== null ? (
                          <div className="flex items-center justify-end gap-2">
                            <div className="w-12 h-1.5 bg-forest/5 rounded-full overflow-hidden hidden sm:block">
                              <div className="h-full rounded-full" style={{ width: `${Math.min(weightB, 40) * 2.5}%`, backgroundColor: color }} />
                            </div>
                            <span className="font-bold text-forest tabular-nums text-xs">{weightB.toFixed(1)}%</span>
                          </div>
                        ) : (
                          <span className="text-forest/20 text-xs">—</span>
                        )}
                      </td>
                      <td className="py-3 pl-3 text-right">
                        {diff !== null ? (
                          <span className={`font-bold tabular-nums text-xs ${
                            parseFloat(diff) > 0 ? 'text-emerald-600' :
                            parseFloat(diff) < 0 ? 'text-rose-500' :
                            'text-forest/30'
                          }`}>
                            {parseFloat(diff) > 0 ? '+' : ''}{diff}pp
                          </span>
                        ) : (
                          <span className="text-forest/20 text-xs">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <p className="text-[10px] text-forest/30 mt-4 text-right">
              Δ = ETF A minus ETF B (percentage points). Positive = ETF A has higher allocation.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
