/**
 * SettingsView Component
 * Dashboard configurations & system settings.
 */
import React, { useState } from 'react';
import { Sliders, Layers, RefreshCw, Key, Shield, Sparkles } from 'lucide-react';

export const SettingsView = ({ selectedSatellite, setSelectedSatellite, satelliteSources }) => {
  const [autoSync, setAutoSync] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState('30s');

  return (
    <div className="flex-1 p-4 space-y-4 overflow-y-auto bg-[#0b0f19] text-slate-100 select-none">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-black tracking-tight flex items-center gap-2">
          <Sliders className="w-5 h-5 text-slate-300" />
          Climalenz Platform Settings
        </h1>
      </div>

      <div className="max-w-3xl space-y-4">
        
        {/* Card 1: Map Basemap & GIS Configuration */}
        <div className="bg-[#0e1424] border border-slate-800 rounded-2xl p-4 space-y-3">
          <h3 className="text-xs font-bold text-slate-200 flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-400" />
            GIS Engine & Satellite Source Settings
          </h3>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-400 font-medium mb-1">
                Default Active Satellite Source
              </label>
              <select
                value={selectedSatellite}
                onChange={(e) => setSelectedSatellite(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl p-2.5 focus:outline-none focus:border-cyan-500"
              >
                {satelliteSources.map((src, i) => (
                  <option key={i} value={src}>{src}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Card 2: Pipeline Refresh & Auto Sync */}
        <div className="bg-[#0e1424] border border-slate-800 rounded-2xl p-4 space-y-3">
          <h3 className="text-xs font-bold text-slate-200 flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-teal-400" />
            Data Pipeline Stream Frequency
          </h3>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-bold text-slate-200">Real-time Satellite Stream Auto-Sync</div>
                <div className="text-[10px] text-slate-400">Fetch live satellite parameters automatically</div>
              </div>
              <input
                type="checkbox"
                checked={autoSync}
                onChange={(e) => setAutoSync(e.target.checked)}
                className="w-4 h-4 accent-cyan-500 cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-medium mb-1">
                Sync Interval
              </label>
              <select
                value={refreshInterval}
                onChange={(e) => setRefreshInterval(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl p-2.5 focus:outline-none focus:border-cyan-500"
              >
                <option value="10s">10 Seconds (High-frequency mode)</option>
                <option value="30s">30 Seconds</option>
                <option value="60s">1 Minute</option>
              </select>
            </div>
          </div>
        </div>

        {/* Card 3: System Information */}
        <div className="bg-[#0e1424] border border-slate-800 rounded-2xl p-4 space-y-2">
          <h3 className="text-xs font-bold text-slate-200 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            Climalenz System Information
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Climalenz uses configurable satellite source selection and a MapLibre-powered GIS canvas for operational climate analysis.
          </p>
        </div>

      </div>
    </div>
  );
};
