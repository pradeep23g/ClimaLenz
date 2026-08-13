/**
 * Right Configuration Panel Component
 * Climalenz Dark-Themed Uncluttered Side Panel.
 * Features Satellite Source Selector, Tunable Formula Coefficients (C1, C2, C3), and Project Team context.
 * All API key UI elements removed per user instructions.
 */
import React from 'react';
import { X, Sparkles, SlidersHorizontal, Users, Radio, Cpu } from 'lucide-react';

export const RightConfigPanel = ({
  activeEngine = 'water',
  selectedSatellite,
  setSelectedSatellite,
  satelliteSources,
  coefficients,
  handleCoefficientChange,
  onClose
}) => {
  const engineTitle = activeEngine.toUpperCase();

  return (
    <aside className="w-80 bg-[#0c101d] border-l border-slate-800/80 flex flex-col justify-between p-4 overflow-y-auto text-xs space-y-5 select-none shrink-0 shadow-2xl">
      
      {/* Header */}
      <div>
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 mb-4">
          <h2 className="font-bold text-xs uppercase tracking-wider text-slate-200 flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-cyan-400" />
            ENGINE CONFIG ({engineTitle})
          </h2>
          {onClose && (
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-200 p-1 rounded-md hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Satellite Source Dropdown */}
        <div className="space-y-2 mb-6">
          <label className="block text-xs font-bold text-slate-300 flex items-center justify-between">
            <span>Satellite Source</span>
            <span className="text-[10px] text-cyan-400 font-mono font-semibold">Live Feed</span>
          </label>
          <p className="text-[10px] text-slate-400">
            Select remote sensing satellite provider.
          </p>
          <select
            value={selectedSatellite}
            onChange={(e) => setSelectedSatellite(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 text-slate-200 text-xs rounded-xl p-2.5 focus:outline-none focus:border-cyan-400 transition-all cursor-pointer font-medium shadow-inner"
          >
            {satelliteSources.map((src, idx) => (
              <option key={idx} value={src}>{src}</option>
            ))}
          </select>
        </div>

        {/* Formula Parameters (Tunable Coefficients C1, C2, C3) */}
        <div className="space-y-3.5 mb-6 bg-slate-950/70 p-4 rounded-2xl border border-slate-800/80 shadow-lg">
          <div>
            <label className="block text-xs font-bold text-slate-200 flex items-center gap-2">
              <Cpu className="w-3.5 h-3.5 text-cyan-400" />
              Formula Parameters
            </label>
            <p className="text-[10px] text-slate-400 mt-0.5">
              Tunable coefficients modulating formula outputs.
            </p>
          </div>

          <div className="space-y-3">
            {/* Coefficient C1 */}
            <div className="flex items-center justify-between gap-3 bg-slate-900/80 p-2 rounded-xl border border-slate-800/60">
              <div className="flex flex-col">
                <span className="font-mono text-cyan-400 font-bold text-xs">C₁ Weight</span>
                <span className="text-[9px] text-slate-500">Runoff / LST factor</span>
              </div>
              <input
                type="number"
                step="0.05"
                min="0"
                max="2"
                value={coefficients.c1}
                onChange={(e) => handleCoefficientChange('c1', e.target.value)}
                className="w-20 bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg px-2.5 py-1 text-right font-mono focus:border-cyan-400 focus:outline-none font-bold"
              />
            </div>

            {/* Coefficient C2 */}
            <div className="flex items-center justify-between gap-3 bg-slate-900/80 p-2 rounded-xl border border-slate-800/60">
              <div className="flex flex-col">
                <span className="font-mono text-teal-400 font-bold text-xs">C₂ Weight</span>
                <span className="text-[9px] text-slate-500">Evapotranspiration</span>
              </div>
              <input
                type="number"
                step="0.05"
                min="0"
                max="2"
                value={coefficients.c2}
                onChange={(e) => handleCoefficientChange('c2', e.target.value)}
                className="w-20 bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg px-2.5 py-1 text-right font-mono focus:border-cyan-400 focus:outline-none font-bold"
              />
            </div>

            {/* Coefficient C3 */}
            <div className="flex items-center justify-between gap-3 bg-slate-900/80 p-2 rounded-xl border border-slate-800/60">
              <div className="flex flex-col">
                <span className="font-mono text-emerald-400 font-bold text-xs">C₃ Weight</span>
                <span className="text-[9px] text-slate-500">Catchment Level</span>
              </div>
              <input
                type="number"
                step="0.05"
                min="0"
                max="2"
                value={coefficients.c3}
                onChange={(e) => handleCoefficientChange('c3', e.target.value)}
                className="w-20 bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg px-2.5 py-1 text-right font-mono focus:border-cyan-400 focus:outline-none font-bold"
              />
            </div>
          </div>
        </div>

        {/* Live Satellite Feed Telemetry Panel */}
        <div className="bg-slate-950/70 p-3.5 rounded-2xl border border-slate-800/80 space-y-2 text-slate-300">
          <div className="flex items-center justify-between text-xs font-bold">
            <span className="flex items-center gap-1.5 text-slate-200">
              <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              Live Sensor Stream
            </span>
            <span className="text-[10px] text-emerald-400 font-mono font-semibold">● Active</span>
          </div>
          <p className="text-[10px] text-slate-400 leading-relaxed">
            Multi-spectral orbital passes streaming live to computation formula processors.
          </p>
        </div>

      </div>

      {/* Footer Section: Team Context */}
      <div className="pt-4 border-t border-slate-800/80 bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800/60">
        <div className="flex items-start gap-2.5">
          <Users className="w-4 h-4 text-cyan-400 mt-0.5" />
          <div>
            <div className="font-bold text-xs text-slate-200">
              Project Team:
            </div>
            <div className="text-[11px] text-slate-400 font-medium">
              Dharshan, Pradeep, Advik
            </div>
            <div className="text-[10px] text-cyan-400 font-semibold mt-1 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-cyan-400" />
              Panimalar Hackathon 19th
            </div>
          </div>
        </div>
      </div>

    </aside>
  );
};
