/**
 * SatelliteNoticeBar Component
 * Bottom fixed notice bar displaying live satellite data feed telemetry, active sensors, and cloud cover metrics.
 */
import React from 'react';
import { Satellite, Radio, CheckCircle2, ShieldCheck, ChevronUp, ChevronDown } from 'lucide-react';

export const SatelliteNoticeBar = ({ selectedSatellite = 'Sentinel-2, Landsat-8' }) => {
  const [isExpanded, setIsExpanded] = React.useState(true);

  return (
    <div className="w-full bg-[#080c16]/95 border-t border-slate-800 text-slate-300 px-4 py-2 text-xs flex items-center justify-between z-40 shadow-2xl font-mono">
      
      {/* Notice Bar Header / Content */}
      <div className="flex items-center gap-4 overflow-x-auto select-none">
        
        {/* Live Satellite Status Indicator */}
        <div className="flex items-center gap-2 font-bold text-cyan-400 shrink-0">
          <Satellite className="w-4 h-4 text-cyan-400 animate-pulse" />
          <span className="uppercase text-[11px] tracking-wider">ACTIVE SATELLITE FEED:</span>
        </div>

        {/* Current Active Satellite Sensor Description */}
        <div className="flex items-center gap-3 text-[11px] text-slate-200 font-semibold shrink-0">
          <span className="bg-slate-900 border border-slate-700 px-2 py-0.5 rounded text-cyan-300">
            {selectedSatellite}
          </span>
          <span className="text-slate-500">|</span>
          <span className="text-slate-300">
            Sentinel-2 L2A (10m Multi-Spectral) · Landsat-8 TIRS (Thermal IR)
          </span>
        </div>

        {/* Live Metrics Telemetry */}
        <div className="hidden lg:flex items-center gap-3 text-[10px] text-slate-400 shrink-0">
          <span className="text-slate-600">|</span>
          <span>Cloud Cover: <strong className="text-emerald-400">&lt; 12%</strong></span>
          <span className="text-slate-600">|</span>
          <span>Orbital Pass: <strong className="text-slate-200">Live Telemetry</strong></span>
          <span className="text-slate-600">|</span>
          <span className="flex items-center gap-1 text-emerald-400 font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            STAC Stream Active
          </span>
        </div>

      </div>

      {/* Advisory Badge */}
      <div className="hidden sm:flex items-center gap-2 text-[10px] text-slate-400 font-sans font-medium">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
        <span>Live Remote-Sensing Pipeline</span>
      </div>

    </div>
  );
};
