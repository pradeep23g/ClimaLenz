/**
 * OverviewDashboard Component
 * Combined High-Level Executive Summary of all 5 Climalenz Engine Layers.
 */
import React from 'react';
import { 
  Droplet, 
  Flame, 
  Activity, 
  Network, 
  Bot, 
  ArrowRight, 
  Globe, 
  ShieldCheck 
} from 'lucide-react';
import { MapLibreView } from '../MapLibreView';

export const OverviewDashboard = ({
  currentCity,
  onLocationChange,
  activeEngine,
  setActiveEngine,
  activeZone,
  onSelectZone,
  livePredictions,
  pipelineStatus,
  selectedSatellite
}) => {
  return (
    <div className="flex-1 p-4 space-y-4 overflow-y-auto bg-[#060911] text-slate-100">
      
      {/* Title Bar */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-black tracking-tight flex items-center gap-2">
          <Globe className="w-5 h-5 text-cyan-400" />
          Overview Dashboard (All 5 Engine Layers)
        </h1>
        <span className="text-xs font-semibold px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
          📍 {currentCity.name}, {currentCity.country}
        </span>
      </div>

      {/* 5 Engine Stat Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        
        {/* Water Engine Quick Card */}
        <div 
          onClick={() => setActiveEngine('water')}
          className="bg-[#0b0f19] border border-slate-800 hover:border-cyan-500/50 p-3.5 rounded-2xl cursor-pointer transition-all hover:scale-[1.02] group shadow-lg"
        >
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span className="font-bold text-[10px] uppercase">Water Engine</span>
            <Droplet className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-xl font-black text-cyan-400 font-mono mt-1">
            {livePredictions.soilMoisture}%
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Soil Moisture | Runoff {livePredictions.predictedRunoff}</div>
        </div>

        {/* Heat Engine Quick Card */}
        <div 
          onClick={() => setActiveEngine('heat')}
          className="bg-[#0b0f19] border border-slate-800 hover:border-rose-500/50 p-3.5 rounded-2xl cursor-pointer transition-all hover:scale-[1.02] group shadow-lg"
        >
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span className="font-bold text-[10px] uppercase">Heat Engine</span>
            <Flame className="w-4 h-4 text-rose-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-xl font-black text-rose-500 font-mono mt-1">
            {currentCity.heatEngine.lstAvg} °C
          </div>
          <div className="text-[10px] text-slate-400 mt-1">LST Avg | Delta +{currentCity.heatEngine.uhiDelta}°C</div>
        </div>

        {/* Continuity Engine Quick Card */}
        <div 
          onClick={() => setActiveEngine('continuity')}
          className="bg-[#0b0f19] border border-slate-800 hover:border-emerald-500/50 p-3.5 rounded-2xl cursor-pointer transition-all hover:scale-[1.02] group shadow-lg"
        >
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span className="font-bold text-[10px] uppercase">Continuity</span>
            <Activity className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-xl font-black text-emerald-400 font-mono mt-1">
            {currentCity.continuityEngine.stabilityIndex}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Stability ESI | {currentCity.continuityEngine.riskProjection}</div>
        </div>

        {/* Bridge Pipeline Quick Card */}
        <div 
          onClick={() => setActiveEngine('bridge')}
          className="bg-[#0b0f19] border border-slate-800 hover:border-purple-500/50 p-3.5 rounded-2xl cursor-pointer transition-all hover:scale-[1.02] group shadow-lg"
        >
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span className="font-bold text-[10px] uppercase">Bridge</span>
            <Network className="w-4 h-4 text-purple-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-xl font-black text-purple-400 font-mono mt-1">
            98.6%
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Pipeline Health | Latency 78ms</div>
        </div>

        {/* Agents AI Quick Card */}
        <div 
          onClick={() => setActiveEngine('agents')}
          className="bg-[#0b0f19] border border-slate-800 hover:border-amber-500/50 p-3.5 rounded-2xl cursor-pointer transition-all hover:scale-[1.02] group col-span-2 sm:col-span-1 shadow-lg"
        >
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span className="font-bold text-[10px] uppercase">Agents</span>
            <Bot className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-xl font-black text-amber-400 font-mono mt-1">
            Gemini 1.5
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Vertex AI Copilot Active</div>
        </div>

      </div>

      {/* Main Grid: GIS Map View & Engine Quick Navigation */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* GIS Canvas */}
        <div className="lg:col-span-8 min-h-[420px]">
          <MapLibreView
            city={currentCity}
            onLocationChange={onLocationChange}
            activeEngine="overview"
            activeZone={activeZone}
            onSelectZone={onSelectZone}
            livePredictions={livePredictions}
            satelliteFeedNotice={selectedSatellite}
          />
        </div>

        {/* Engine Navigation & Action Cards */}
        <div className="lg:col-span-4 space-y-3 flex flex-col justify-between">
          <div className="bg-[#0b0f19] border border-slate-800 rounded-2xl p-4 space-y-3 shadow-xl">
            <h3 className="text-xs font-bold text-slate-200">
              Modular Engine Navigation
            </h3>

            <div className="space-y-2 text-xs">
              <button
                onClick={() => setActiveEngine('water')}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-cyan-500/50 text-slate-200 font-medium transition-all group cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <Droplet className="w-4 h-4 text-cyan-400" />
                  <span>Water Engine Dashboard</span>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                onClick={() => setActiveEngine('heat')}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-rose-500/50 text-slate-200 font-medium transition-all group cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <Flame className="w-4 h-4 text-rose-400" />
                  <span>Heat Engine Dashboard</span>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                onClick={() => setActiveEngine('continuity')}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-emerald-500/50 text-slate-200 font-medium transition-all group cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <Activity className="w-4 h-4 text-emerald-400" />
                  <span>Continuity Engine Dashboard</span>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                onClick={() => setActiveEngine('bridge')}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-purple-500/50 text-slate-200 font-medium transition-all group cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <Network className="w-4 h-4 text-purple-400" />
                  <span>Bridge Data Pipeline</span>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>

          <div className="bg-[#0b0f19] border border-slate-800 rounded-2xl p-4 text-xs text-slate-400 shadow-xl">
            <div className="font-bold text-slate-200 mb-1 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" /> Remote Sensing Pipeline
            </div>
            Ingesting live satellite telemetry via Sentinel-2 & Landsat-8 APIs for ground climate analytics.
          </div>
        </div>

      </div>

    </div>
  );
};
