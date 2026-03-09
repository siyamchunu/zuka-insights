import React, { useState } from 'react';
import etfData from './data/etfs.json';
import { ArrowRight, Info, AlertTriangle, CheckCircle, BarChart2, TrendingUp, Layers, ArrowUpDown } from 'lucide-react';
import ETFSearch from './components/ETFSearch';
import VennDiagram from './components/VennDiagram';
import HoldingsTable from './components/HoldingsTable';
import SectorBreakdown from './components/SectorBreakdown';
import DisclaimerModal from './components/DisclaimerModal';
import CookieConsent from './components/CookieConsent';
import Footer from './components/Footer';

function App() {
  const [etfAId, setEtfAId] = useState('');
  const [etfBId, setEtfBId] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState(null);

  const handleAnalyze = () => {
    if (!etfAId || !etfBId) return;
    
    setIsAnalyzing(true);
    
    // Simulate calculation delay for effect
    setTimeout(() => {
      const etfA = etfData.find(e => e.id === etfAId);
      const etfB = etfData.find(e => e.id === etfBId);
      
      if (!etfA || !etfB) {
        setIsAnalyzing(false);
        return;
      }

      const getAggregatedMap = (holdings) => {
        const map = new Map();
        holdings.forEach(h => {
          const ticker = (h.ticker || '').trim().toUpperCase();
          const weight = h.weight ?? 0;
          if (!ticker) return;
          const currentWeight = map.get(ticker) || 0;
          map.set(ticker, currentWeight + parseFloat(weight));
        });
        return map;
      };

      // Compute sector breakdown for a given holdings array (returns null if no sector data)
      const getSectorBreakdown = (holdings) => {
        const map = new Map();
        let hasSector = false;
        holdings.forEach(h => {
          const sector = h.sector;
          if (sector) {
            hasSector = true;
            const weight = parseFloat(h.weight ?? 0);
            map.set(sector, (map.get(sector) || 0) + weight);
          }
        });
        if (!hasSector) return null;
        return Array.from(map.entries())
          .map(([sector, weight]) => ({ sector, weight: parseFloat(weight.toFixed(2)) }))
          .sort((a, b) => b.weight - a.weight);
      };

      const mapA = getAggregatedMap(etfA.holdings);
      const mapB = getAggregatedMap(etfB.holdings);
      
      let overlapScore = 0;
      const sharedHoldings = [];

      // Iterate through unique tickers from both
      const allTickers = new Set([...mapA.keys(), ...mapB.keys()]);

      allTickers.forEach(ticker => {
        const weightA = mapA.get(ticker) || 0;
        const weightB = mapB.get(ticker) || 0;
        
        // Overlap is the intersection (minimum weight held in both)
        const overlap = Math.min(weightA, weightB);
        
        if (overlap > 0) {
          overlapScore += overlap;
          const findName = (holdings, tick) => {
            const h = holdings.find(h => (h.ticker || '').trim().toUpperCase() === tick);
            return h ? (h.name || tick) : tick;
          };
          sharedHoldings.push({
            ticker,
            name: findName(etfA.holdings, ticker) || findName(etfB.holdings, ticker),
            weightA: parseFloat(weightA.toFixed(2)),
            weightB: parseFloat(weightB.toFixed(2)),
            overlap: parseFloat(overlap.toFixed(2))
          });
        }
      });

      // Sort shared holdings by overlap weight desc
      sharedHoldings.sort((a, b) => b.overlap - a.overlap);

      setResult({
        score: overlapScore.toFixed(1),
        shared: sharedHoldings,
        etfAName: etfA.name,
        etfBName: etfB.name,
        countA: etfA.holdings.length,
        countB: etfB.holdings.length,
        sectorA: getSectorBreakdown(etfA.holdings),
        sectorB: getSectorBreakdown(etfB.holdings),
      });
      
      setIsAnalyzing(false);
    }, 600);
  };

  const getScoreColor = (score) => {
    if (score < 20) return 'text-forest';
    if (score < 50) return 'text-yellow-600';
    return 'text-danger';
  };

  return (
    <div className="min-h-screen bg-neutral-50 font-sans text-forest selection:bg-lime selection:text-forest">
      
      {/* Legal Modal */}
      <DisclaimerModal />
      <CookieConsent />
      
      {/* Navbar */}
      <nav className="fixed top-0 w-full bg-white/90 backdrop-blur-md border-b border-forest/5 z-40 px-6 h-20 flex items-center justify-between">
        <div className="flex items-center gap-3">
           <div className="w-10 h-10 bg-forest rounded-xl flex items-center justify-center text-lime font-black text-xl shadow-lg shadow-forest/10">Z</div>
           <span className="font-bold text-forest tracking-tighter text-xl">ZUKA INSIGHTS</span>
        </div>
        <div className="flex items-center gap-6">
          <button className="hidden md:block text-xs font-bold uppercase tracking-widest text-forest/40 hover:text-forest transition-colors">Tools</button>
          <button className="hidden md:block text-xs font-bold uppercase tracking-widest text-forest/40 hover:text-forest transition-colors">Methodology</button>
          <div className="hidden md:block w-px h-6 bg-forest/10"></div>
          <button className="text-forest opacity-60 hover:opacity-100 transition-opacity p-2 hover:bg-bone rounded-full">
             <Info size={24} strokeWidth={1.5} />
          </button>
        </div>
      </nav>

      <main className="pt-32 pb-20 px-6 max-w-[1400px] mx-auto">
        
        {/* Header Section */}
        <div className="mb-16 md:mb-24 max-w-4xl">
          <h1 className="font-black text-5xl md:text-7xl lg:text-8xl text-forest leading-[0.9] tracking-tighter mb-8">
            ETF PORTFOLIO <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-forest via-forest to-emerald-800">OVERLAP.</span>
          </h1>
          <p className="text-forest/60 text-lg md:text-xl max-w-xl leading-relaxed font-medium">
            Discover hidden redundancies in your investment portfolio. Compare any two JSE-listed ETFs to visualize asset intersection.
          </p>
        </div>

        {/* Comparison Engine */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-start">
          
          {/* Left Panel: Inputs */}
          <div className="lg:col-span-4 bg-white rounded-[2rem] p-6 lg:p-8 border-2 border-forest/5 lg:sticky lg:top-28 h-fit shadow-xl shadow-forest/5 transition-all hover:shadow-2xl hover:shadow-forest/10">
            <h2 className="font-bold text-forest mb-8 flex items-center gap-3 text-xl tracking-tight">
              <div className="p-2 bg-bone rounded-lg">
                <Layers size={24} className="text-forest" strokeWidth={1.5} />
              </div>
              Select Funds
            </h2>
            
            <div className="space-y-4">
              <ETFSearch 
                label="First ETF" 
                selectedId={etfAId} 
                onSelect={setEtfAId} 
              />
              
              <div className="flex justify-center -my-5 z-10 relative">
                <div className="bg-white p-2 rounded-full border-2 border-forest/5 shadow-sm text-forest/20">
                  <ArrowUpDown size={20} strokeWidth={1.5} />
                </div>
              </div>

              <ETFSearch 
                label="Second ETF" 
                selectedId={etfBId} 
                onSelect={setEtfBId} 
              />

              <div className="pt-4">
                <button 
                    onClick={handleAnalyze}
                    disabled={!etfAId || !etfBId || isAnalyzing}
                    className="w-full h-16 bg-forest text-lime rounded-2xl font-bold text-lg hover:bg-forest/90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-lg shadow-forest/20 group"
                >
                    {isAnalyzing ? (
                    <span className="animate-pulse">Analyzing...</span>
                    ) : (
                    <>Analyze Overlap <ArrowRight size={24} className="group-hover:translate-x-1 transition-transform" /></>
                    )}
                </button>
              </div>
            </div>

            {/* Quick Stats Placeholder if selected */}
            {(etfAId || etfBId) && (
               <div className="mt-8 pt-8 border-t-2 border-forest/5 grid grid-cols-2 gap-4">
                 {etfAId && (
                   <div>
                     <div className="text-[10px] font-bold text-forest/40 uppercase tracking-[0.2em] mb-2">ETF A</div>
                     <div className="font-bold text-forest text-sm truncate leading-tight">{etfData.find(e => e.id === etfAId)?.name}</div>
                   </div>
                 )}
                 {etfBId && (
                   <div className="text-right">
                     <div className="text-[10px] font-bold text-forest/40 uppercase tracking-[0.2em] mb-2">ETF B</div>
                     <div className="font-bold text-forest text-sm truncate leading-tight">{etfData.find(e => e.id === etfBId)?.name}</div>
                   </div>
                 )}
               </div>
            )}
          </div>

          {/* Right Panel: Results */}
          <div className="lg:col-span-8 space-y-6 min-h-[50vh]">
            {!result ? (
              <div className="h-full flex flex-col items-center justify-center bg-white/40 rounded-[2rem] border-2 border-dashed border-forest/5 p-12 text-center">
                <div className="w-20 h-20 bg-bone rounded-full flex items-center justify-center mb-6">
                    <BarChart2 size={40} className="text-forest/20" strokeWidth={1.5} />
                </div>
                <h3 className="text-forest font-bold text-lg mb-2">Ready to Analyze</h3>
                <p className="text-forest/40 font-medium max-w-xs mx-auto">Select two ETFs from the panel to generate a detailed overlap report.</p>
              </div>
            ) : (
              <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 space-y-8">
                
                {/* Summary Card */}
                <div className="bg-forest text-bone rounded-[2.5rem] p-8 md:p-12 relative overflow-hidden shadow-2xl shadow-forest/20">
                  {/* Decorative mesh gradient */}
                  <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-radial from-emerald-900/40 to-transparent opacity-50 blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
                  
                  <div className="grid md:grid-cols-2 gap-12 items-center relative z-10">
                    <div>
                      <div className="flex items-center gap-2 mb-6">
                        <span className="w-2 h-2 rounded-full bg-lime animate-pulse"></span>
                        <h3 className="text-lime/60 uppercase tracking-[0.2em] text-xs font-bold">Analysis Complete</h3>
                      </div>
                      
                      <h2 className="text-4xl md:text-5xl font-bold text-white mb-2 tracking-tight">
                        {result.score}% <span className="text-forest/50 text-2xl md:text-3xl ml-2">Overlap</span>
                      </h2>
                      <p className="text-bone/60 mb-8 max-w-md">
                        {result.score > 50 
                            ? "High concentration risk detected. These funds share significant underlying assets." 
                            : "Moderate to low overlap. These funds offer good diversification benefits."}
                      </p>
                      
                      <div className="space-y-3">
                         <div className="flex justify-between items-center p-4 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10">
                           <span className="text-sm font-medium text-bone/80">{result.etfAName}</span>
                           <span className="font-bold text-lime">{result.countA} <span className="text-xs text-white/40 font-normal uppercase tracking-wider ml-1">Holdings</span></span>
                         </div>
                         <div className="flex justify-between items-center p-4 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10">
                           <span className="text-sm font-medium text-bone/80">{result.etfBName}</span>
                           <span className="font-bold text-lime">{result.countB} <span className="text-xs text-white/40 font-normal uppercase tracking-wider ml-1">Holdings</span></span>
                         </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-center justify-center bg-white/5 rounded-3xl p-8 border border-white/10 backdrop-blur-sm aspect-square md:aspect-auto">
                      <VennDiagram score={result.score} theme="dark" />
                    </div>
                  </div>
                </div>

                {/* Detailed Table */}
                <div className="bg-white rounded-[2rem] border-2 border-forest/5 p-1 overflow-hidden">
                    <HoldingsTable holdings={result.shared} />
                </div>

                {/* Sector Analysis */}
                <SectorBreakdown
                  sectorA={result.sectorA}
                  sectorB={result.sectorB}
                  nameA={result.etfAName}
                  nameB={result.etfBName}
                />
              </div>
            )}
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}

export default App;
