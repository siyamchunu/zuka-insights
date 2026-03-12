import React, { useState, useEffect } from 'react';
import { ArrowRight, Info, AlertTriangle, CheckCircle, BarChart2, TrendingUp, Layers, ArrowUpDown } from 'lucide-react';
import ETFSearch from './components/ETFSearch';
import VennDiagram from './components/VennDiagram';
import HoldingsTable from './components/HoldingsTable';
import SectorBreakdown from './components/SectorBreakdown';
import DisclaimerModal from './components/DisclaimerModal';
import CookieConsent from './components/CookieConsent';
import Footer from './components/Footer';
import ETFComparisonView from './components/ETFComparisonView';
import DistributionHistoryView from './components/DistributionHistoryView';

function App() {
  const [etfData, setEtfData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [etfAId, setEtfAId] = useState('');
  const [etfBId, setEtfBId] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [appView, setAppView] = useState('overlap'); // 'overlap' | 'compare' | 'distributions'
  const [distributionEtfId, setDistributionEtfId] = useState(null);

  useEffect(() => {
    fetch('/data/etfs.json')
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        return res.json();
      })
      .then(data => {
        setEtfData(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 bg-forest rounded-xl flex items-center justify-center text-lime font-black text-xl mx-auto mb-4 animate-pulse">Z</div>
          <p className="text-forest/60 font-medium">Loading ETF data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center text-red-600">
          <p className="font-bold mb-2">Failed to load data</p>
          <p className="text-sm">{error}</p>
          <button onClick={() => window.location.reload()} className="mt-4 px-4 py-2 bg-forest text-lime rounded-lg">Retry</button>
        </div>
      </div>
    );
  }

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

      // C2: Cross-market guard — only compute overlap for same-market ETFs
      const isCrossMarket = etfA.market && etfB.market && etfA.market !== etfB.market;

      const mapA = getAggregatedMap(etfA.holdings);
      const mapB = getAggregatedMap(etfB.holdings);
      
      let overlapScore = 0;
      const sharedHoldings = [];

      if (!isCrossMarket) {
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
      }

      // H1: Detect balanced fund involvement for warning
      const balancedWarnings = [];
      [etfA, etfB].forEach(etf => {
        if (etf.equity_weight_pct) {
          balancedWarnings.push(
            `${etf.name} is a balanced fund — overlap shown is relative to equity portion only (~${etf.equity_weight_pct}% of total fund).`
          );
        }
      });

      setResult({
        score: overlapScore.toFixed(1),
        shared: sharedHoldings,
        etfAName: etfA.name,
        etfBName: etfB.name,
        countA: etfA.holdings.length,
        countB: etfB.holdings.length,
        sectorA: getSectorBreakdown(etfA.holdings),
        sectorB: getSectorBreakdown(etfB.holdings),
        isCrossMarket,
        marketA: etfA.market,
        marketB: etfB.market,
        balancedWarnings,
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
      <header role="banner">
        <nav className="fixed top-0 w-full bg-white/90 backdrop-blur-md border-b border-forest/5 z-40 px-6 h-20 flex items-center justify-between" aria-label="Main navigation">
          <a href="/" className="flex items-center gap-3" aria-label="Zuka Insights — Home">
             <div className="w-10 h-10 bg-forest rounded-xl flex items-center justify-center text-lime font-black text-xl shadow-lg shadow-forest/10" aria-hidden="true">Z</div>
             <span className="font-bold text-forest tracking-tighter text-xl">ZUKA INSIGHTS</span>
          </a>
          <div className="flex items-center gap-6">
            <button className="hidden md:block text-xs font-bold uppercase tracking-widest text-forest/40 hover:text-forest transition-colors" aria-label="Tools">Tools</button>
            <button className="hidden md:block text-xs font-bold uppercase tracking-widest text-forest/40 hover:text-forest transition-colors" aria-label="Methodology">Methodology</button>
            <div className="hidden md:block w-px h-6 bg-forest/10" aria-hidden="true"></div>
            <button className="text-forest opacity-60 hover:opacity-100 transition-opacity p-2 hover:bg-bone rounded-full" aria-label="About Zuka Insights">
               <Info size={24} strokeWidth={1.5} />
            </button>
          </div>
        </nav>
      </header>

      <main className="pt-32 pb-20 px-6 max-w-[1400px] mx-auto" role="main">
        
        {/* Hero Section */}
        <section className="mb-16 md:mb-24 max-w-4xl" aria-label="Introduction">
          <h1 className="font-black text-5xl md:text-7xl lg:text-8xl text-forest leading-[0.9] tracking-tighter mb-8">
            South African ETF<br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-forest via-forest to-emerald-800">OVERLAP ANALYZER.</span>
          </h1>
          <p className="text-forest/60 text-lg md:text-xl max-w-xl leading-relaxed font-medium">
            Discover hidden redundancies in your investment portfolio. Compare any two JSE-listed ETFs to visualise asset overlap — with weight-based scoring, Venn diagrams, and sector breakdowns. Free for South African investors.
          </p>
        </section>

        {/* Comparison Engine */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-start" aria-label="ETF comparison tool">
          
          {/* Left Panel: Inputs */}
          <aside className="lg:col-span-4 bg-white rounded-[2rem] p-6 lg:p-8 border-2 border-forest/5 lg:sticky lg:top-28 h-fit shadow-xl shadow-forest/5 transition-all hover:shadow-2xl hover:shadow-forest/10" aria-label="ETF selection panel">
            <h2 className="font-bold text-forest mb-8 flex items-center gap-3 text-xl tracking-tight">
              <div className="p-2 bg-bone rounded-lg" aria-hidden="true">
                <Layers size={24} className="text-forest" strokeWidth={1.5} />
              </div>
              Select ETFs to Compare
            </h2>
            
            <div className="space-y-4">
              <ETFSearch 
                label="First ETF" 
                selectedId={etfAId} 
                onSelect={setEtfAId} 
                excludeId={etfBId}
                etfData={etfData}
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
                excludeId={etfAId}
                etfData={etfData}
              />

              <div className="pt-4">
                {/* Mode toggle */}
                <div className="flex rounded-lg overflow-hidden border border-sage mb-4" role="group" aria-label="View mode">
                  <button
                    type="button"
                    onClick={() => setAppView('overlap')}
                    aria-pressed={appView === 'overlap'}
                    className={`flex-1 py-2 text-sm font-medium transition-colors ${
                      appView === 'overlap'
                        ? 'bg-forest text-lime'
                        : 'bg-white text-forest hover:bg-sage'
                    }`}
                  >
                    📊 Overlap
                  </button>
                  <button
                    type="button"
                    onClick={() => setAppView('compare')}
                    aria-pressed={appView === 'compare' || appView === 'distributions'}
                    className={`flex-1 py-2 text-sm font-medium transition-colors ${
                      appView === 'compare' || appView === 'distributions'
                        ? 'bg-forest text-lime'
                        : 'bg-white text-forest hover:bg-sage'
                    }`}
                  >
                    📋 Compare
                  </button>
                </div>

                <button
                    type="button"
                    onClick={appView === 'compare' ? () => setAppView('compare') : handleAnalyze}
                    disabled={!etfAId || !etfBId || (appView !== 'compare' && isAnalyzing)}
                    aria-label={appView === 'compare' ? 'Compare selected ETFs' : 'Analyze overlap between selected ETFs'}
                    className="w-full h-16 bg-forest text-lime rounded-2xl font-bold text-lg hover:bg-forest/90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-lg shadow-forest/20 group"
                >
                    {appView === 'compare' ? (
                      <>📋 Compare Funds <ArrowRight size={24} className="group-hover:translate-x-1 transition-transform" /></>
                    ) : isAnalyzing ? (
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
          </aside>

          {/* Right Panel: Results */}
          <section className="lg:col-span-8 space-y-6 min-h-[50vh]" aria-label="Analysis results">

            {/* Distribution History View */}
            {appView === 'distributions' && distributionEtfId && (() => {
              const etf = etfData.find(e => e.id === distributionEtfId);
              if (!etf) return null;
              return (
                <DistributionHistoryView
                  etf={etf}
                  onBack={() => setAppView('compare')}
                />
              );
            })()}

            {/* Comparison View */}
            {appView === 'compare' && etfAId && etfBId && (
              <ETFComparisonView
                etfs={[etfData.find(e => e.id === etfAId), etfData.find(e => e.id === etfBId)].filter(Boolean)}
                onViewDistributions={(id) => {
                  setDistributionEtfId(id);
                  setAppView('distributions');
                }}
                onBack={() => setAppView('overlap')}
              />
            )}

            {/* Compare mode prompt when only one ETF selected */}
            {appView === 'compare' && (!etfAId || !etfBId) && (
              <div className="h-full flex flex-col items-center justify-center bg-white/40 rounded-[2rem] border-2 border-dashed border-forest/5 p-12 text-center" role="status">
                <div className="w-20 h-20 bg-bone rounded-full flex items-center justify-center mb-6" aria-hidden="true">
                    <BarChart2 size={40} className="text-forest/20" strokeWidth={1.5} />
                </div>
                <h2 className="text-forest font-bold text-lg mb-2">Select Two ETFs</h2>
                <p className="text-forest/40 font-medium max-w-xs mx-auto">Please select a second ETF to compare side-by-side.</p>
              </div>
            )}

            {/* Existing overlap view - only show when appView === 'overlap' */}
            {appView === 'overlap' && (
            <>
            {!result ? (
              <div className="h-full flex flex-col items-center justify-center bg-white/40 rounded-[2rem] border-2 border-dashed border-forest/5 p-12 text-center" role="status">
                <div className="w-20 h-20 bg-bone rounded-full flex items-center justify-center mb-6" aria-hidden="true">
                    <BarChart2 size={40} className="text-forest/20" strokeWidth={1.5} />
                </div>
                <h2 className="text-forest font-bold text-lg mb-2">Ready to Analyze</h2>
                <p className="text-forest/40 font-medium max-w-xs mx-auto">Select two South African ETFs from the panel to generate a detailed overlap report.</p>
              </div>
            ) : (
              <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 space-y-8">

                {/* C2: Cross-market warning banner */}
                {result.isCrossMarket && (
                  <div className="flex items-start gap-4 bg-amber-50 border-2 border-amber-200 rounded-2xl p-6" role="alert">
                    <AlertTriangle size={24} className="text-amber-600 shrink-0 mt-0.5" aria-hidden="true" />
                    <div>
                      <h3 className="font-bold text-amber-900 mb-1">Cross-market comparison not supported</h3>
                      <p className="text-amber-800 text-sm leading-relaxed">
                        These ETFs hold assets from different markets ({result.marketA} vs {result.marketB}).
                        Tickers may represent different companies — e.g. JSE ticker SPG (Super Group) vs
                        US ticker SPG (Simon Property Group). Overlap analysis is disabled for accuracy.
                      </p>
                    </div>
                  </div>
                )}

                {/* H1: Balanced fund warning */}
                {result.balancedWarnings.length > 0 && (
                  <div className="flex items-start gap-4 bg-blue-50 border-2 border-blue-200 rounded-2xl p-6" role="alert">
                    <Info size={24} className="text-blue-600 shrink-0 mt-0.5" aria-hidden="true" />
                    <div>
                      <h3 className="font-bold text-blue-900 mb-1">Balanced Fund Notice</h3>
                      {result.balancedWarnings.map((msg, i) => (
                        <p key={i} className="text-blue-800 text-sm leading-relaxed">{msg}</p>
                      ))}
                    </div>
                  </div>
                )}

                {/* Summary Card */}
                <article className="bg-forest text-bone rounded-[2.5rem] p-8 md:p-12 relative overflow-hidden shadow-2xl shadow-forest/20" aria-label="ETF overlap summary">
                  {/* Decorative mesh gradient */}
                  <div className="absolute top-0 right-0 w-[600px] h-[600px] opacity-50 blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(6, 78, 59, 0.4), transparent)' }} aria-hidden="true"></div>
                  
                  <div className="grid md:grid-cols-2 gap-12 items-center relative z-10">
                    <div>
                      <div className="flex items-center gap-2 mb-6">
                        <span className="w-2 h-2 rounded-full bg-lime animate-pulse" aria-hidden="true"></span>
                        <h2 className="text-lime/60 uppercase tracking-[0.2em] text-xs font-bold">Analysis Complete</h2>
                      </div>
                      
                      <h3 className="text-4xl md:text-5xl font-bold text-white mb-2 tracking-tight">
                        {result.isCrossMarket ? 'N/A' : <>{result.score}%</>} <span className="text-forest/50 text-2xl md:text-3xl ml-2">Overlap</span>
                      </h3>
                      <p className="text-bone/60 mb-8 max-w-md">
                        {result.isCrossMarket
                            ? "Cross-market comparison — overlap score is not available."
                            : result.score > 50 
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

                    <div className="flex flex-col items-center justify-center bg-white/5 rounded-3xl p-8 border border-white/10 backdrop-blur-sm aspect-square md:aspect-auto" aria-label="Venn diagram showing ETF overlap">
                      <VennDiagram score={result.score} theme="dark" />
                    </div>
                  </div>
                </article>

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
            </>
            )}
          </section>

        </section>

        {/* SEO: Supplementary content for crawlers and AI — hidden visually but present in DOM */}
        <section className="mt-20 max-w-3xl mx-auto" aria-label="About ETF overlap analysis">
          <h2 className="font-bold text-forest text-2xl tracking-tight mb-6">Understanding ETF Overlap for South African Investors</h2>
          <div className="space-y-4 text-forest/60 text-sm leading-relaxed">
            <p>
              <strong className="text-forest">What is ETF overlap?</strong> ETF overlap occurs when two or more Exchange-Traded Funds in your portfolio hold the same underlying stocks. For South African investors using platforms like EasyEquities or Standard Bank Online Trading, this is a common risk — many JSE-listed ETFs track similar large-cap stocks like Naspers, Anglo American, and FirstRand.
            </p>
            <p>
              <strong className="text-forest">Why check ETF overlap?</strong> High overlap reduces diversification. If your <abbr title="Tax-Free Savings Account">TFSA</abbr> holds both the Satrix Top 40 (STX40) and the Satrix ALSI (STXALS), you may have 70%+ overlap — meaning you're paying two sets of fees for nearly identical exposure. The Zuka Insights ETF Overlap Analyzer helps you spot this.
            </p>
            <p>
              <strong className="text-forest">How does the overlap score work?</strong> We use weight-based overlap, not a simple count. For each stock held in both ETFs, we take the minimum weight and sum them. This gives a more accurate picture than counting shared holdings because it accounts for how much of each fund is allocated to each stock.
            </p>
            <p>
              <strong className="text-forest">Supported ETFs:</strong> The tool currently covers Satrix Top 40, Satrix 500, Satrix Capped All Share, Satrix ALSI, Satrix Balanced, Satrix Money Market, Satrix Industrial, Satrix MSCI World, CoreShares S&P 500, and Satrix Nasdaq 100. Data is sourced from public factsheets and updated periodically.
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

export default App;
