/**
 * Homepage / Landing Page Component
 * Modeled after AquaLens AI design (Image 3 reference).
 * Features dark grid background, live pipeline badge, hero section, interactive session preview, and Start Monitoring CTA.
 */
import React, { useState } from 'react';
import { 
  Globe, 
  ArrowRight, 
  Droplet, 
  Flame, 
  Activity, 
  Network, 
  Bot, 
  Sun, 
  Moon, 
  ShieldCheck, 
  Layers, 
  Search,
  ChevronRight,
  Sparkles
} from 'lucide-react';

export const Homepage = ({ onStartMonitoring }) => {
  const [selectedCell, setSelectedCell] = useState(4);
  const [theme, setTheme] = useState('dark');

  // Simulated grid cells for preview card
  const cells = Array.from({ length: 24 }, (_, i) => ({
    id: i,
    risk: i % 7 === 0 ? 'high' : i % 3 === 0 ? 'medium' : 'low',
    val: (0.2 + (i * 0.03) % 0.7).toFixed(2)
  }));

  return (
    <div className="min-h-screen bg-[#060911] text-slate-100 font-sans selection:bg-cyan-500 selection:text-slate-950 overflow-x-hidden">
      
      {/* Top Header Navbar */}
      <header className="sticky top-0 z-50 bg-[#060911]/90 backdrop-blur-md border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          
          {/* Brand Logo */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={onStartMonitoring}>
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 via-teal-400 to-emerald-400 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-cyan-500/20">
              <Globe className="w-5 h-5 text-slate-950 animate-pulse" />
            </div>
            <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-white via-cyan-100 to-teal-300 bg-clip-text text-transparent">
              ClimaLenz
            </span>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-xs font-medium text-slate-400">
            <a href="#methodology" className="hover:text-cyan-400 transition-colors">Methodology</a>
            <a href="#limitations" className="hover:text-cyan-400 transition-colors">Limitations</a>
            <a href="#changelog" className="hover:text-cyan-400 transition-colors">Changelog</a>
            <a href="#about" className="hover:text-cyan-400 transition-colors">About</a>
          </nav>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
              className="p-2 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-900 transition-colors cursor-pointer"
              title="Toggle Theme"
            >
              <Sun className="w-4 h-4" />
            </button>

            <button
              onClick={onStartMonitoring}
              className="px-4 py-1.5 rounded-lg border border-slate-700 text-xs font-semibold text-slate-200 hover:bg-slate-800 transition-all cursor-pointer hidden sm:block"
            >
              Open app
            </button>

            <button
              onClick={onStartMonitoring}
              className="px-4 py-2 rounded-full bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-400/20 hover:shadow-cyan-400/40 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <span>Start monitoring</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>
      </header>

      {/* Hero Section with Grid Background */}
      <section className="relative pt-20 pb-16 px-6 max-w-7xl mx-auto text-center flex flex-col items-center">
        
        {/* Subtle Background Grid overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b12_1px,transparent_1px),linear-gradient(to_bottom,#1e293b12_1px,transparent_1px)] bg-[size:3.5rem_3.5rem] pointer-events-none -z-10" />

        {/* Live Pipeline Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-slate-800 text-[11px] font-mono text-slate-300 shadow-xl mb-8">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
          <span className="uppercase tracking-wider font-semibold text-[10px]">LIVE REMOTE-SENSING PIPELINE</span>
          <span className="text-slate-600">·</span>
          <span className="text-slate-400">ADVISORY ONLY</span>
        </div>

        {/* Main Hero Headline */}
        <h1 className="text-4xl sm:text-6xl font-black tracking-tight max-w-4xl leading-[1.1] mb-6">
          The climate you can{' '}
          <span className="bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400 bg-clip-text text-transparent">
            actually monitor.
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-slate-400 max-w-2xl text-sm sm:text-base leading-relaxed mb-10 font-normal">
          ClimaLenz pulls recent Sentinel-2 & Landsat-8 imagery, computes hydrological & thermal indices, fuses optional field evidence, and writes grounded risk briefs — so field teams know where to sample first.
        </p>

        {/* CTA Buttons */}
        <div className="flex items-center justify-center gap-4 flex-wrap mb-16">
          <button
            onClick={onStartMonitoring}
            className="px-6 py-3 rounded-full bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-extrabold text-sm shadow-xl shadow-cyan-400/25 hover:shadow-cyan-400/40 transition-all flex items-center gap-2 cursor-pointer group"
          >
            <span>Start monitoring</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>

          <a
            href="#methodology"
            className="px-6 py-3 rounded-full bg-slate-900/80 border border-slate-800 text-slate-200 font-semibold text-sm hover:bg-slate-800 transition-all"
          >
            View methodology
          </a>
        </div>

        {/* Interactive Dashboard Session Preview Card (AquaLens Image 3 reference) */}
        <div className="w-full max-w-4xl bg-[#090d16] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden select-none text-left">
          
          {/* Preview Window Header */}
          <div className="px-4 py-3 bg-[#0d121f] border-b border-slate-800 flex items-center justify-between text-xs font-mono">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block" />
              <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
              <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
              <span className="ml-3 text-slate-400 font-semibold">CLIMALENZ · SESSION 8599F3 · 19.076°N · 72.877°E</span>
            </div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              SAMPLE PIPELINE
            </div>
          </div>

          {/* Preview Content Grid */}
          <div className="p-6 grid grid-cols-1 md:grid-cols-12 gap-6 items-start bg-[#080c14]">
            
            {/* Left Side: Microclimate Sensor Grid Cells */}
            <div className="md:col-span-7 bg-slate-950/80 border border-slate-800/80 rounded-xl p-4">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center justify-between">
                <span>Raster Heatmap & Moisture Matrix</span>
                <span>24 Satellite Sub-Grids</span>
              </div>
              <div className="grid grid-cols-6 gap-2">
                {cells.map((cell) => {
                  const isSelected = selectedCell === cell.id;
                  const bgClass = cell.risk === 'high' 
                    ? 'bg-amber-900/60 border-amber-600/60 text-amber-300' 
                    : cell.risk === 'medium'
                    ? 'bg-teal-900/60 border-teal-600/60 text-teal-300'
                    : 'bg-emerald-950/60 border-emerald-700/50 text-emerald-300';
                  
                  return (
                    <button
                      key={cell.id}
                      onClick={() => setSelectedCell(cell.id)}
                      className={`h-12 rounded-lg border transition-all flex flex-col items-center justify-center text-[10px] font-mono cursor-pointer ${bgClass} ${
                        isSelected ? 'ring-2 ring-cyan-400 scale-105 shadow-lg' : 'hover:opacity-80'
                      }`}
                    >
                      <span className="font-bold">{cell.val}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right Side: Risk Assessment Brief */}
            <div className="md:col-span-5 space-y-4">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                  ENVIRONMENTAL RISK SCORE
                </span>
                <div className="text-2xl font-black text-amber-400 font-mono mt-1">
                  Medium · 0.46
                </div>
                <p className="text-xs text-slate-400 mt-0.5 font-medium">Routine sampling urgency</p>
              </div>

              {/* Spectral Indices Table */}
              <div className="space-y-1.5 font-mono text-xs">
                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900/90 border border-slate-800">
                  <span className="text-slate-400">NDCI (Chlorophyll)</span>
                  <span className="text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">+0.122</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900/90 border border-slate-800">
                  <span className="text-slate-400">NDVI SHORE (Vegetation)</span>
                  <span className="text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">+0.326</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900/90 border border-slate-800">
                  <span className="text-slate-400">MNDWI (Water Index)</span>
                  <span className="text-rose-400 font-bold bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">-0.174</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900/90 border border-slate-800">
                  <span className="text-slate-400">NDTI (Turbidity)</span>
                  <span className="text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">-0.048</span>
                </div>
              </div>

              {/* AI Brief Excerpt */}
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 text-[11px] text-slate-300 leading-relaxed">
                "Given the conflicting spectral signals and indication of elevated chlorophyll-a, field teams should prioritize sampling along the central catchment boundary."
              </div>
            </div>

          </div>

        </div>

      </section>

      {/* 5 Engine Architecture Overview Cards Section */}
      <section id="methodology" className="py-16 px-6 max-w-7xl mx-auto border-t border-slate-800/60">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-black text-slate-100">
            Powered by 5 Climate Engine Layers
          </h2>
          <p className="text-slate-400 text-xs sm:text-sm mt-2 max-w-xl mx-auto">
            Unified remote sensing computation from satellite telemetry to ground risk briefs.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          
          <div className="bg-[#090d16] border border-slate-800 rounded-2xl p-6 hover:border-cyan-500/50 transition-all">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mb-4">
              <Droplet className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-200 mb-2">Water Engine</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Calculates soil moisture retention, evapotranspiration rates, catchment water levels, and surface runoff using Sentinel-2 L2A feeds.
            </p>
          </div>

          <div className="bg-[#090d16] border border-slate-800 rounded-2xl p-6 hover:border-rose-500/50 transition-all">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 mb-4">
              <Flame className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-200 mb-2">Heat Engine</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Processes Land Surface Temperature (LST) anomalies from Landsat-8 TIRS sensors and maps urban heat island (UHI) intensity.
            </p>
          </div>

          <div className="bg-[#090d16] border border-slate-800 rounded-2xl p-6 hover:border-emerald-500/50 transition-all">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4">
              <Activity className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-200 mb-2">Continuity Engine</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Evaluates multi-year ecological stability (ESI), land degradation trends, and vegetation continuity over 10-year timelines.
            </p>
          </div>

          <div className="bg-[#090d16] border border-slate-800 rounded-2xl p-6 hover:border-purple-500/50 transition-all">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-4">
              <Network className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-200 mb-2">Bridge Data Pipeline</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              High-throughput data bridge ingesting NASA STAC feeds, satellite orbits, and live stream telemetry at under 80ms latency.
            </p>
          </div>

          <div className="bg-[#090d16] border border-slate-800 rounded-2xl p-6 hover:border-amber-500/50 transition-all sm:col-span-2 lg:col-span-2">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-4">
              <Bot className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-200 mb-2">Vertex AI & Gemini Agents</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Automated AI copilot analyzing multi-spectral anomaly reports, writing field brief recommendations, and answering GIS queries in real-time.
            </p>
          </div>

        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-slate-800/80 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            © 2026 ClimaLenz Climate Intelligence Platform
          </div>
          <div className="flex items-center gap-6">
            <button onClick={onStartMonitoring} className="text-cyan-400 hover:underline cursor-pointer">
              Launch Dashboard →
            </button>
          </div>
        </div>
      </footer>

    </div>
  );
};
