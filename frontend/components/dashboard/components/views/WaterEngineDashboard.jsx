/**
 * WaterEngineDashboard Component
 * Core Water Engine Dashboard View matching AquaLens AI design.
 * Features Satellite Data Feed, MapLibre GIS Map, Formula Processor Node diagram, and Ground Predictions graphs.
 * API key widgets removed per user instructions.
 */
import React from 'react';
import { SatelliteFeedWidget } from '../widgets/SatelliteFeedWidget';
import { FormulaProcessorWidget } from '../widgets/FormulaProcessorWidget';
import { GroundDataPredictionWidget } from '../widgets/GroundDataPredictionWidget';
import { MapLibreView } from '../MapLibreView';
import { Droplet, Layers } from 'lucide-react';

export const WaterEngineDashboard = ({
  currentCity,
  onLocationChange,
  activeEngine,
  activeZone,
  onSelectZone,
  livePredictions,
  coefficients,
  selectedSatellite,
  colocationResult,
  colocationState
}) => {
  return (
    <div className="flex-1 p-4 space-y-4 overflow-y-auto bg-[#060911] text-slate-100">
      
      {/* Title Bar */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-black text-slate-100 tracking-tight flex items-center gap-2">
          <Droplet className="w-5 h-5 text-cyan-400" />
          Water Engine Dashboard
        </h1>
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Active Pipeline: Hydrologic Formula Processor</span>
        </div>
      </div>

      {/* CoLocation Assessment Results Banner */}
      {colocationResult && (
        <div className={`border p-4 rounded-2xl ${
          colocationResult.execution_mode === 'CACHED' 
            ? 'bg-amber-900/20 border-amber-500/50' 
            : 'bg-purple-900/20 border-purple-500/50'
        }`}>
          <div className="flex justify-between items-center mb-2">
            <h2 className={`text-xs font-bold uppercase tracking-wider ${
              colocationResult.execution_mode === 'CACHED' ? 'text-amber-400' : 'text-purple-400'
            }`}>
              Bridge Co-Location Assessment (Water)
            </h2>
            <div className="flex gap-2 text-[10px] font-bold">
              {colocationResult.execution_mode === 'CACHED' && (
                <span className="bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded border border-amber-500/30">
                  LATEST FAILED. SHOWING LKG: {new Date(colocationResult.computed_at).toLocaleTimeString()}
                </span>
              )}
              {colocationResult.provenance === 'continuity_reconstructed' && (
                <span className="bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/30">
                  RECONSTRUCTED VIA CONTINUITY
                </span>
              )}
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-[10px] text-slate-400 uppercase">Water Score</div>
              <div className={`text-lg font-bold ${
                colocationResult.execution_mode === 'CACHED' ? 'text-amber-300' : 'text-purple-300'
              }`}>
                {colocationResult.water_score}/100 
                <span className={`text-xs ml-1 ${
                  colocationResult.execution_mode === 'CACHED' ? 'text-amber-400/70' : 'text-purple-400/70'
                }`}>({colocationResult.water_confidence_band})</span>
              </div>
            </div>
            <div>
              <div className="text-[10px] text-slate-400 uppercase">Water Tier</div>
              <div className={`text-lg font-bold ${
                colocationResult.execution_mode === 'CACHED' ? 'text-amber-300' : 'text-purple-300'
              }`}>{colocationResult.water_tier}</div>
            </div>
            <div className="col-span-2">
              <div className="text-[10px] text-slate-400 uppercase flex items-center justify-between">
                <span>Narrative Context</span>
                {colocationResult.critic_audit?.verdict === 'FAIL' && (
                  <span className="text-rose-400 font-bold bg-rose-500/10 px-1.5 py-0.5 rounded flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-ping"/> Critic Audit Failed
                  </span>
                )}
              </div>
              <div className={`text-xs font-semibold line-clamp-2 ${
                colocationResult.critic_audit?.verdict === 'FAIL' ? 'text-rose-300' :
                colocationResult.execution_mode === 'CACHED' ? 'text-amber-300' : 'text-purple-300'
              }`}>
                {colocationResult.reporter_narrative?.executive_summary || colocationResult.narrative}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Top Grid: Satellite Data Feed (Left) + MapLibre GIS Canvas (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* Left Column Box: Satellite Data Feed */}
        <div className="lg:col-span-4 flex flex-col justify-between">
          <SatelliteFeedWidget 
            waterEngineData={currentCity.waterEngine} 
            colocationResult={colocationResult} 
          />
        </div>

        {/* Right Column: MapLibre GIS Map View */}
        <div className="lg:col-span-8 min-h-[420px]">
          <MapLibreView
            city={currentCity}
            onLocationChange={onLocationChange}
            activeEngine={activeEngine}
            activeZone={activeZone}
            onSelectZone={onSelectZone}
            livePredictions={livePredictions}
            satelliteFeedNotice={selectedSatellite}
            colocationResult={colocationResult}
          />
        </div>

      </div>

      {/* Bottom Grid: Formula Processor & Ground Data Predictions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* Left Widget: Formula Processor Flow Node Diagram */}
        <div className="lg:col-span-5 flex flex-col justify-between">
          <FormulaProcessorWidget 
            formulaText={currentCity.waterEngine.formula}
            activeEngine="water"
          />
        </div>

        {/* Right Widget: Ground Data Prediction Charts */}
        <div className="lg:col-span-7">
          <GroundDataPredictionWidget 
            predictions={livePredictions}
            timeSeries={currentCity.waterEngine.timeSeries}
          />
        </div>

      </div>

    </div>
  );
};
