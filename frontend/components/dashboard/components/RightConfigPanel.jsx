/**
 * Right Configuration Panel Component
 * Climalenz Dark-Themed Uncluttered Side Panel.
 * Features Satellite Source Selector, Tunable Formula Coefficients (C1, C2, C3), and Project Team context.
 * All API key UI elements removed per user instructions.
 */
import React from 'react';
import { ChevronLeft, ChevronRight, SlidersHorizontal, Radio, Cpu } from 'lucide-react';

export const RightConfigPanel = ({
  activeEngine = 'water',
  selectedSatellite,
  setSelectedSatellite,
  satelliteSources,
  coefficients,
  handleCoefficientChange,
  isCollapsed = false,
  onToggleCollapse,
  colocationState,
  colocationError,
  intervention,
  setIntervention,
  runColocation
}) => {
  const engineTitle = activeEngine.toUpperCase();

  if (isCollapsed) {
    return <aside className="flex w-11 shrink-0 items-start justify-center border-l border-slate-800/80 bg-[#0c101d] pt-4"><button type="button" onClick={onToggleCollapse} title="Expand configuration panel" aria-label="Expand configuration panel" className="rounded-lg border border-slate-700 bg-slate-900 p-2 text-cyan-400 transition hover:border-cyan-400 hover:bg-slate-800"><ChevronLeft className="h-4 w-4" /></button></aside>;
  }

  return (
    <aside className="w-80 bg-[#0c101d] border-l border-slate-800/80 flex flex-col justify-between p-4 overflow-y-auto text-xs space-y-5 select-none shrink-0 shadow-2xl">
      
      {/* Header */}
      <div>
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 mb-4">
          <h2 className="font-bold text-xs uppercase tracking-wider text-slate-200 flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-cyan-400" />
            ENGINE CONFIG ({engineTitle})
          </h2>
          <button type="button" onClick={onToggleCollapse} title="Collapse panel and expand map workspace" aria-label="Collapse panel and expand map workspace" className="rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-800 hover:text-cyan-400"><ChevronRight className="h-4 w-4" /></button>
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

        {/* Co-Location Assessment Config */}
        <div className="space-y-3.5 mb-6 bg-slate-950/70 p-4 rounded-2xl border border-slate-800/80 shadow-lg">
          <div>
            <label className="block text-xs font-bold text-slate-200 flex items-center gap-2">
              <Cpu className="w-3.5 h-3.5 text-purple-400" />
              Co-Location Assessment
            </label>
            <p className="text-[10px] text-slate-400 mt-0.5">
              Simulate interventions across Bridge API.
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Intervention Type</label>
              <select
                value={intervention?.type || 'tree_canopy'}
                onChange={(e) => setIntervention({ ...intervention, type: e.target.value })}
                disabled={colocationState === 'ANALYZING'}
                className="w-full bg-slate-900 border border-slate-800 text-slate-200 text-xs rounded-lg p-2 focus:border-purple-400 focus:outline-none"
              >
                <option value="CANOPY">Tree Canopy (Vegetation)</option>
                <option value="COOL_ROOF">White Roofs (Cool Roofs)</option>
                <option value="ALBEDO_CHANGE">Permeable Pavement (Albedo)</option>
                <option value="CANOPY">Green Roofs</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase">
                <span>Intervention Delta</span>
                <span className="text-purple-400">{intervention?.delta || 25}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={intervention?.delta || 25}
                onChange={(e) => setIntervention({ ...intervention, delta: Number(e.target.value) })}
                disabled={colocationState === 'ANALYZING'}
                className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-400"
              />
            </div>

            <button
              onClick={runColocation}
              disabled={colocationState === 'ANALYZING'}
              className="w-full py-2 mt-2 rounded-xl bg-purple-500 hover:bg-purple-400 text-slate-950 font-bold text-xs shadow-lg shadow-purple-500/20 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              {colocationState === 'ANALYZING' ? (
                <>
                  <span className="w-3 h-3 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  Analyzing...
                </>
              ) : (
                'Run Co-Location Assessment'
              )}
            </button>
            {colocationState === 'ERROR' && colocationError && (
              <div className="text-[10px] text-rose-400 bg-rose-950/30 border border-rose-500/20 p-2 rounded-lg break-words">
                Failed: {colocationError}
              </div>
            )}
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

      <div className="rounded-lg border border-slate-800 bg-slate-900/80 p-3 text-xs text-slate-400">
        <div className="mb-1 flex items-center gap-2 font-mono font-semibold text-cyan-400"><span className="h-2 w-2 animate-pulse rounded-full bg-cyan-400" />CLIMALENZ ENGINE v2.4</div>
        <p>Satellite Orbital Ingestion: Operational</p>
      </div>

    </aside>
  );
};
