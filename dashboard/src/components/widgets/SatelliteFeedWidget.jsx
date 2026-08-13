/**
 * SatelliteFeedWidget Component
 * Displays real-time satellite data feed parameters.
 */
import React from 'react';
import { Radio } from 'lucide-react';

export const SatelliteFeedWidget = ({ waterEngineData }) => {
  const data = waterEngineData || {
    precipitationRate: 1.35,
    cloudCover: 0.20,
    surfaceMoistureTemp: 4.1,
    ambientTemp: -23.0
  };

  return (
    <div className="bg-[#0e1424] border border-slate-800/80 rounded-2xl p-4 shadow-xl select-none flex flex-col justify-between">
      
      <div>
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-xs font-bold text-slate-200">
            Satellite Data Feed
          </h3>
          <span className="flex items-center gap-1.5 text-[10px] font-semibold text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            Live
          </span>
        </div>
        <p className="text-[10px] text-slate-400 mb-3">
          Live parameters for formula use
        </p>

        <div className="space-y-2 text-xs">
          <div className="flex items-center justify-between border-b border-slate-800/60 pb-1.5">
            <span className="text-slate-400">Precipitation Rate</span>
            <span className="font-mono font-bold text-slate-200">{data.precipitationRate} mm/h</span>
          </div>

          <div className="flex items-center justify-between border-b border-slate-800/60 pb-1.5">
            <span className="text-slate-400">Cloud Cover</span>
            <span className="font-mono font-bold text-slate-200">{data.cloudCover}%</span>
          </div>

          <div className="flex items-center justify-between border-b border-slate-800/60 pb-1.5">
            <span className="text-slate-400">Temperature</span>
            <span className="font-mono font-bold text-slate-200">{data.surfaceMoistureTemp}mm</span>
          </div>

          <div className="flex items-center justify-between pb-1">
            <span className="text-slate-400">Temperature</span>
            <span className="font-mono font-bold text-slate-200">{data.ambientTemp} °C</span>
          </div>
        </div>
      </div>

      <div className="pt-2 text-[10px] text-slate-500 font-medium">
        Normalized for formula use
      </div>

    </div>
  );
};
