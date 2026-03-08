import React, { useState } from 'react';
import { ArrowUpDown, AlertTriangle } from 'lucide-react';

const HoldingsTable = ({ holdings }) => {
  const [sortField, setSortField] = useState('overlap');
  const [sortDirection, setSortDirection] = useState('desc');

  const sortedHoldings = [...holdings].sort((a, b) => {
    if (sortDirection === 'asc') {
      return a[sortField] > b[sortField] ? 1 : -1;
    }
    return a[sortField] < b[sortField] ? 1 : -1;
  });

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  return (
    <div className="w-full bg-white rounded-3xl border border-forest/10 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-forest/5 flex justify-between items-center bg-bone/30">
        <h3 className="font-bold text-forest">Shared Holdings Detail</h3>
        <span className="text-xs font-bold text-forest/40 uppercase tracking-widest">{holdings.length} Assets</span>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-bone/50 text-forest/50 font-bold text-xs uppercase tracking-widest">
            <tr>
              <th className="px-4 md:px-6 py-4 cursor-pointer hover:bg-bone transition-colors" onClick={() => handleSort('name')}>
                Asset <ArrowUpDown size={12} className="inline ml-1" />
              </th>
              <th className="px-4 md:px-6 py-4 text-right cursor-pointer hover:bg-bone transition-colors" onClick={() => handleSort('overlap')}>
                Overlap Impact <ArrowUpDown size={12} className="inline ml-1" />
              </th>
              <th className="hidden sm:table-cell px-6 py-4 text-right cursor-pointer hover:bg-bone transition-colors" onClick={() => handleSort('weightA')}>
                Weight (A) <ArrowUpDown size={12} className="inline ml-1" />
              </th>
              <th className="hidden sm:table-cell px-6 py-4 text-right cursor-pointer hover:bg-bone transition-colors" onClick={() => handleSort('weightB')}>
                Weight (B) <ArrowUpDown size={12} className="inline ml-1" />
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-forest/5">
            {sortedHoldings.map((h) => (
              <tr key={h.ticker} className="hover:bg-bone/30 transition-colors">
                <td className="px-4 md:px-6 py-4">
                  <div className="font-bold text-forest text-sm md:text-base">{h.name}</div>
                  <div className="text-[10px] md:text-xs text-forest/40 font-mono">{h.ticker}</div>
                </td>
                <td className="px-4 md:px-6 py-4 text-right">
                  <div className="inline-flex flex-col items-end w-full">
                    <span className="font-bold text-forest">{h.overlap.toFixed(2)}%</span>
                    <div className="w-16 h-1 bg-forest/10 rounded-full mt-1 overflow-hidden">
                      <div className="h-full bg-lime" style={{ width: `${Math.min(h.overlap * 10, 100)}%` }}></div>
                    </div>
                  </div>
                </td>
                <td className="hidden sm:table-cell px-6 py-4 text-right font-mono text-forest/70">{h.weightA.toFixed(2)}%</td>
                <td className="hidden sm:table-cell px-6 py-4 text-right font-mono text-forest/70">{h.weightB.toFixed(2)}%</td>
              </tr>
            ))}
            {holdings.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-forest/40 italic">
                  No overlapping holdings found between these two funds.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default HoldingsTable;
