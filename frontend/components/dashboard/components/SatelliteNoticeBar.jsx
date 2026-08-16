/**
 * SatelliteNoticeBar Component
 * Bottom fixed notice bar displaying live satellite data feed telemetry, active sensors, and cloud cover metrics.
 */
import React from 'react';
import { Satellite, Radio, CheckCircle2, ShieldCheck, ChevronUp, ChevronDown } from 'lucide-react';

export const SatelliteNoticeBar = ({ selectedSatellite = 'Sentinel-2, Landsat-8', colocationResult, colocationState }) => {
  
  // Determine execution status
  let status = 'IDLE';
  if (colocationState === 'ANALYZING') {
    status = 'ANALYZING';
  } else if (colocationResult) {
    if (colocationResult.execution_mode === 'CACHED') {
      status = 'CACHED';
    } else if (colocationResult.provenance === 'continuity_reconstructed') {
      status = 'RECONSTRUCTED';
    } else if (colocationResult.execution_mode === 'SYNTHETIC' || colocationResult.provenance === 'synthetic_fallback') {
      status = 'SYNTHETIC';
    } else if (colocationResult.execution_mode === 'LIVE') {
      status = 'LIVE';
    }
  }

  // Derive UI copy based on status
  let indicatorText = 'AWAITING ANALYSIS';
  let indicatorColor = 'text-slate-400';
  let badgeColor = 'bg-slate-900 border-slate-700 text-slate-300';
  let descText = 'No current assessment available';
  let showPulse = false;

  switch (status) {
    case 'LIVE':
      indicatorText = 'LIVE SATELLITE FEED';
      indicatorColor = 'text-purple-400';
      badgeColor = 'bg-slate-900 border-slate-700 text-purple-300';
      descText = 'Live remote-sensing data';
      showPulse = true;
      break;
    case 'RECONSTRUCTED':
      indicatorText = 'RECONSTRUCTED';
      indicatorColor = 'text-emerald-400';
      badgeColor = 'bg-emerald-950 border-emerald-800 text-emerald-300';
      descText = 'Continuity recovery was used';
      break;
    case 'CACHED':
      indicatorText = 'CACHED ANALYSIS';
      indicatorColor = 'text-amber-400';
      badgeColor = 'bg-amber-950 border-amber-800 text-amber-300';
      descText = 'Showing the last successful analysis';
      break;
    case 'SYNTHETIC':
      indicatorText = 'SYNTHETIC FALLBACK';
      indicatorColor = 'text-rose-400';
      badgeColor = 'bg-rose-950 border-rose-800 text-rose-300';
      descText = 'Analysis generated using fallback data';
      break;
    case 'ANALYZING':
      indicatorText = 'ANALYZING...';
      indicatorColor = 'text-cyan-400';
      badgeColor = 'bg-slate-900 border-slate-700 text-cyan-300';
      descText = 'Requesting live telemetry';
      showPulse = true;
      break;
  }

  return (
    <div className="w-full bg-[#080c16]/95 border-t border-slate-800 text-slate-300 px-4 py-2 text-xs flex items-center justify-between z-40 shadow-2xl font-mono">
      
      {/* Notice Bar Header / Content */}
      <div className="flex items-center gap-4 overflow-x-auto select-none">
        
        {/* Status Indicator */}
        <div className={`flex items-center gap-2 font-bold ${indicatorColor} shrink-0`}>
          <Satellite className={`w-4 h-4 ${indicatorColor} ${showPulse ? 'animate-pulse' : ''}`} />
          <span className="uppercase text-[11px] tracking-wider">{indicatorText}:</span>
        </div>

        {/* Current Active Satellite Sensor Description */}
        <div className="flex items-center gap-3 text-[11px] text-slate-200 font-semibold shrink-0">
          <span className={`px-2 py-0.5 rounded border ${badgeColor}`}>
            {selectedSatellite}
          </span>
          <span className="text-slate-500">|</span>
          <span className="text-slate-300">
            {descText}
          </span>
        </div>

        {/* Live Metrics Telemetry */}
        <div className="hidden lg:flex items-center gap-3 text-[10px] text-slate-400 shrink-0">
          <span className="text-slate-600">|</span>
          {colocationResult?.water_scene_cloud_cover !== undefined ? (
            <span>Cloud Cover: <strong className="text-emerald-400">{(colocationResult.water_scene_cloud_cover * 100).toFixed(1)}%</strong></span>
          ) : (
            <span>Cloud Cover: <strong className="text-slate-500">N/A</strong></span>
          )}
          <span className="text-slate-600">|</span>
          <span>Orbital Pass: <strong className="text-slate-200">{status === 'LIVE' ? 'Live Telemetry' : 'Archived/Synthetic'}</strong></span>
          <span className="text-slate-600">|</span>
          {status === 'LIVE' ? (
            <span className="flex items-center gap-1 text-purple-400 font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-ping" />
              STAC Stream Active
            </span>
          ) : (
            <span className="flex items-center gap-1 text-slate-500 font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-600" />
              Stream Offline
            </span>
          )}
        </div>

      </div>

      {/* Advisory Badge */}
      <div className="hidden sm:flex items-center gap-2 text-[10px] text-slate-400 font-sans font-medium">
        <ShieldCheck className={`w-3.5 h-3.5 ${status === 'LIVE' ? 'text-purple-400' : 'text-slate-500'}`} />
        <span>{status === 'LIVE' ? 'Live Remote-Sensing Pipeline' : 'Historical/Offline Pipeline'}</span>
      </div>

    </div>
  );
};
