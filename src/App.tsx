import { useState, useEffect, useMemo } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area
} from 'recharts';
import { 
  BarChart3, Box, AlertTriangle, TrendingUp, RefreshCcw, 
  ChevronDown, Search, Download, Package, Activity, Info
} from 'lucide-react';
import { SaleRow, AnalysisResult } from './lib/types';
import { cn } from './lib/utils';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [data, setData] = useState<SaleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStore, setSelectedStore] = useState<string>('');
  const [selectedItem, setSelectedItem] = useState<string>('');
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Initialize data
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/data/generate');
      const json = await res.json();
      setData(json);
      if (json.length > 0) {
        setSelectedStore(json[0].storeId);
        setSelectedItem(json[0].itemId);
      }
    } catch (err) {
      console.error('Failed to fetch data', err);
    } finally {
      setLoading(false);
    }
  };

  const regenerateData = async () => {
    setIsGenerating(true);
    await fetchData();
    setIsGenerating(false);
  };

  // List unique stores and items
  const stores = useMemo(() => Array.from(new Set(data.map(d => d.storeId))), [data]);
  const items = useMemo(() => Array.from(new Set(data.map(d => d.itemId))), [data]);

  // Run analysis when selection changes
  useEffect(() => {
    if (selectedStore && selectedItem && data.length > 0) {
      const history = data.filter(d => d.storeId === selectedStore && d.itemId === selectedItem);
      runAnalysis(selectedStore, selectedItem, history);
    }
  }, [selectedStore, selectedItem, data]);

  const runAnalysis = async (storeId: string, itemId: string, history: SaleRow[]) => {
    try {
      const res = await fetch('/api/analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storeId, itemId, history })
      });
      const result = await res.json();
      setAnalysis(result);
    } catch (err) {
      console.error('Analysis failed', err);
    }
  };

  const filteredHistory = useMemo(() => {
    return data.filter(d => d.storeId === selectedStore && d.itemId === selectedItem)
      .slice(-30) // Last 30 days for display
      .map(d => ({
        date: d.date,
        demand: d.qtySold,
        isForecast: false
      }));
  }, [data, selectedStore, selectedItem]);

  const historicalChartData = useMemo(() => {
    if (!analysis) return filteredHistory;
    return filteredHistory;
  }, [filteredHistory, analysis]);

  const forecastChartData = useMemo(() => {
    if (!analysis) return [];
    // Include the last historical point to connect the lines
    const lastHistory = filteredHistory[filteredHistory.length - 1];
    return lastHistory ? [lastHistory, ...analysis.forecast] : analysis.forecast;
  }, [filteredHistory, analysis]);

  const alerts = useMemo(() => {
    // Highly simplified: in real app, we'd run this for all item/store pairs in backend
    // For demo, we just show if the current one is an alert or a few others
    return data.filter(d => d.date === data[data.length - 1].date && d.stockOnHand < 50)
      .slice(0, 10);
  }, [data]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#E4E3E0] font-mono">
        <div className="text-center">
          <Activity className="w-12 h-12 animate-spin mx-auto mb-4 text-[#141414]" />
          <p className="text-sm uppercase tracking-widest text-[#141414]/60 italic font-serif">Initializing Mission Control...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#E4E3E0] text-[#141414] font-sans selection:bg-[#141414] selection:text-[#E4E3E0]">
      {/* Header */}
      <header className="border-b border-[#141414] p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tighter uppercase flex items-center gap-2">
            <RefreshCcw className={cn("w-6 h-6", isGenerating && "animate-spin")} />
            System Control: Inventory Optimizer
          </h1>
          <p className="font-serif italic text-xs tracking-wider opacity-60 uppercase mt-1">
            Real-time Demand Forecasting & Replenishment Pipeline • v1.0.4
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={regenerateData}
            disabled={isGenerating}
            className="px-4 py-2 border border-[#141414] hover:bg-[#141414] hover:text-[#E4E3E0] transition-colors text-xs font-mono flex items-center gap-2"
          >
            {isGenerating ? 'PROCESSING...' : 'REGENERATE UNIVERSE'}
          </button>
          <div className="px-4 py-2 bg-[#141414] text-[#E4E3E0] text-xs font-mono cursor-default">
            LIVE_STATUS: OPTIMAL
          </div>
        </div>
      </header>

      <main className="grid grid-cols-1 lg:grid-cols-12 min-h-[calc(100vh-100px)]">
        {/* Sidebar / Controls */}
        <aside className="lg:col-span-3 border-r border-[#141414] p-6 flex flex-col gap-8">
          <section>
            <h2 className="font-serif italic text-[11px] opacity-50 uppercase tracking-widest mb-4">Object Selection</h2>
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-mono uppercase opacity-70">Store Node</label>
                <div className="relative group">
                  <select 
                    value={selectedStore}
                    onChange={(e) => setSelectedStore(e.target.value)}
                    className="w-full appearance-none bg-transparent border border-[#141414] px-3 py-2 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-[#141414] cursor-pointer"
                  >
                    {stores.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none group-hover:translate-y-[-40%] transition-transform" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono uppercase opacity-70">SKU Identifier</label>
                <div className="relative group">
                  <select 
                    value={selectedItem}
                    onChange={(e) => setSelectedItem(e.target.value)}
                    className="w-full appearance-none bg-transparent border border-[#141414] px-3 py-2 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-[#141414] cursor-pointer"
                  >
                    {items.map(i => <option key={i} value={i}>{i}</option>)}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none group-hover:translate-y-[-40%] transition-transform" />
                </div>
              </div>
            </div>
          </section>

          <section className="flex-grow">
            <h2 className="font-serif italic text-[11px] opacity-50 uppercase tracking-widest mb-4">Technical Specs</h2>
            <div className="space-y-3 font-mono text-[11px]">
              <div className="flex justify-between border-b border-[#141414]/10 pb-1">
                <span className="opacity-60 italic">Pattern Detection:</span>
                <span className="font-bold">{analysis?.inventory.eoq ? 'HYBRID_RF' : 'UNKNOWN'}</span>
              </div>
              <div className="flex justify-between border-b border-[#141414]/10 pb-1">
                <span className="opacity-60 italic">Service Level:</span>
                <span className="font-bold">95.0% (P=1.645)</span>
              </div>
              <div className="flex justify-between border-b border-[#141414]/10 pb-1">
                <span className="opacity-60 italic">Lead Time Window:</span>
                <span className="font-bold">07 DAYS</span>
              </div>
              <div className="flex justify-between border-b border-[#141414]/10 pb-1">
                <span className="opacity-60 italic">Annual Holding:</span>
                <span className="font-bold">20.0%</span>
              </div>
            </div>
          </section>

          <section className="pt-6 border-t border-[#141414]">
            <div className="bg-[#141414] text-[#E4E3E0] p-4 scale-95 transition-transform hover:scale-100 cursor-help group">
              <div className="flex items-center gap-2 mb-2">
                <Info className="w-4 h-4 text-[#E4E3E0]/70" />
                <span className="text-[10px] font-mono uppercase tracking-widest">Model Note</span>
              </div>
              <p className="text-[10px] leading-relaxed opacity-80 font-serif italic">
                System utilizes Hybrid ensemble logic. RandomForest handles high-density demand while Croston (SBA) accommodates intermittent volatility.
              </p>
            </div>
          </section>
        </aside>

        {/* Main Content Area */}
        <div className="lg:col-span-9 p-6 space-y-8">
          {/* KPI Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-px bg-[#141414] border border-[#141414]">
            <KPICard 
              label="Safety Stock" 
              value={analysis?.inventory.safetyStock ?? 0} 
              unit="units"
              icon={<Box className="w-4 h-4" />}
            />
            <KPICard 
              label="Reorder Point" 
              value={analysis?.inventory.reorderPoint ?? 0} 
              unit="units"
              icon={<TrendingUp className="w-4 h-4" />}
            />
            <KPICard 
              label="EOQ" 
              value={analysis?.inventory.eoq ?? 0} 
              unit="units"
              icon={<BarChart3 className="w-4 h-4" />}
            />
            <KPICard 
              label="Order Queue" 
              value={analysis?.inventory.orderQty ?? 0} 
              unit="units"
              icon={<Package className="w-4 h-4" />}
              highlight={analysis?.inventory.reorderAlert}
            />
          </div>

          {/* Forecasting Chart */}
          <section className="border border-[#141414] bg-white p-6 relative overflow-hidden">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-widest">Temporal Demand sensing</h3>
                <p className="font-serif italic text-xs opacity-50">30-Day Resolution + 28-Day Extrapolation</p>
              </div>
              <div className="flex items-center gap-4 text-[10px] font-mono uppercase">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-[#141414]/10 rounded-sm" />
                  <span>Historical</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-1 bg-[#141414] dashed" style={{ borderBottom: '2px dashed black' }} />
                  <span>Forecast</span>
                </div>
              </div>
            </div>

            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart>
                  <defs>
                    <linearGradient id="colorDemand" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#141414" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#141414" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#14141420" />
                  <XAxis 
                    dataKey="date" 
                    type="category"
                    allowDuplicatedCategory={false}
                    axisLine={false}
                    tickLine={false}
                    style={{ fontSize: '10px', fontFamily: 'monospace' }}
                    tickFormatter={(val) => val.split('-').slice(1).join('/')}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    style={{ fontSize: '10px', fontFamily: 'monospace' }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#141414', 
                      color: '#E4E3E0', 
                      borderRadius: '0', 
                      border: 'none',
                      fontFamily: 'monospace',
                      fontSize: '10px'
                    }}
                    itemStyle={{ color: '#E4E3E0' }}
                  />
                  <Area 
                    data={historicalChartData}
                    type="monotone" 
                    dataKey="demand" 
                    stroke="#141414" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorDemand)" 
                    activeDot={{ r: 4, strokeWidth: 0, fill: '#141414' }}
                    isAnimationActive={false}
                  />
                  {analysis && (
                    <Area 
                      data={forecastChartData}
                      type="monotone" 
                      dataKey="demand" 
                      stroke="#141414" 
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      fillOpacity={0} 
                      activeDot={{ r: 4, strokeWidth: 0, fill: '#141414' }}
                      isAnimationActive={false}
                    />
                  )}
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </section>

          {/* Table Area */}
          <section className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-orange-600" />
              Critical Replenishment Nodes (Current Alerts)
            </h3>
            <div className="border border-[#141414] bg-white overflow-hidden overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#141414] text-[#E4E3E0]">
                    <th className="p-4 font-serif italic text-[11px] uppercase tracking-widest border-r border-[#E4E3E0]/20">ID_NODE</th>
                    <th className="p-4 font-serif italic text-[11px] uppercase tracking-widest border-r border-[#E4E3E0]/20">CAT_DEPT</th>
                    <th className="p-4 font-serif italic text-[11px] uppercase tracking-widest border-r border-[#E4E3E0]/20">ON_HAND</th>
                    <th className="p-4 font-serif italic text-[11px] uppercase tracking-widest border-r border-[#E4E3E0]/20">RECL_ORDER</th>
                    <th className="p-4 font-serif italic text-[11px] uppercase tracking-widest">STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {alerts.map((alert, idx) => (
                    <tr key={idx} className="border-b border-[#141414]/10 hover:bg-[#141414] hover:text-[#E4E3E0] transition-colors group cursor-pointer">
                      <td className="p-4 font-mono text-[11px] border-r border-[#141414]/10 group-hover:border-[#E4E3E0]/20">{alert.storeId}::{alert.itemId}</td>
                      <td className="p-4 font-mono text-[11px] border-r border-[#141414]/10 group-hover:border-[#E4E3E0]/20">{alert.category}</td>
                      <td className="p-4 font-mono text-[11px] border-r border-[#141414]/10 group-hover:border-[#E4E3E0]/20">{alert.stockOnHand.toString().padStart(3, '0')}</td>
                      <td className="p-4 font-mono text-[11px] border-r border-[#141414]/10 group-hover:border-[#E4E3E0]/20">142</td>
                      <td className="p-4 font-mono text-[10px] uppercase">
                        <span className="px-2 py-0.5 bg-orange-600/20 text-orange-600 group-hover:bg-white/20 group-hover:text-white inline-block">CRITICAL_LEVEL</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#141414] p-4 text-center">
        <p className="text-[10px] font-mono uppercase opacity-40">
          Terminal Session 0x{Math.floor(Math.random() * 10000).toString(16)} • Automated Supply Chain Matrix
        </p>
      </footer>
    </div>
  );
}

function KPICard({ label, value, unit, icon, highlight }: { label: string, value: number, unit: string, icon: any, highlight?: boolean }) {
  return (
    <div className={cn(
      "bg-white p-6 flex flex-col justify-between transition-colors",
      highlight && "bg-orange-50 border-l-[4px] border-l-orange-600"
    )}>
      <div className="flex items-center justify-between mb-4">
        <span className="font-serif italic text-[11px] opacity-50 uppercase tracking-widest">{label}</span>
        <div className={cn("text-[#141414]/30", highlight && "text-orange-600/50")}>{icon}</div>
      </div>
      <div className="flex items-baseline gap-2">
        <span className={cn("text-3xl font-mono tracking-tighter", highlight && "text-orange-600")}>
          {value.toString().padStart(3, '0')}
        </span>
        <span className="text-[10px] uppercase font-mono opacity-40 tracking-widest">{unit}</span>
      </div>
    </div>
  );
}

