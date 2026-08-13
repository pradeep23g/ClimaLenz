/**
 * ContinuityEngineDashboard Component
 * Ecological Stability & Temporal Trendlines Engine View.
 */
import React from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';
import { Activity, ShieldCheck, TrendingUp, AlertTriangle } from 'lucide-react';
import { MapLibreView } from '../MapLibreView';
import { FormulaProcessorWidget } from '../widgets/FormulaProcessorWidget';

export const ContinuityEngineDashboard = ({
  currentCity,
  onLocationChange,
  activeEngine,
  activeZone,
  onSelectZone,
  livePredictions
}) => {
  const continuityData = currentCity.continuityEngine;

  return (
    <div className="flex-1 p-4 space-y-4 overflow-y-auto bg-[#060911] text-slate-100">
      
      {/* Title Bar */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-black tracking-tight flex items-center gap-2">
          <Activity className="w-5 h-5 text-emerald-400" />
          Continuity Engine Dashboard
        </h1>
        <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Ecological Stability & Temporal Trendline Processor</span>
        </div>
      </div>

      {/* Metric Cards Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-[#0b0f19] border border-slate-800 p-3.5 rounded-2xl">
          <div className="text-[10px] text-slate-400 font-bold uppercase">Ecological Stability Index</div>
          <div className="text-2xl font-black text-emerald-400 font-mono mt-1">{continuityData.stabilityIndex}</div>
          <div className="text-[10px] text-emerald-400 mt-1">Scale 0.0 - 1.0 (Optimum)</div>
        </div>

        <div className="bg-[#0b0f19] border border-slate-800 p-3.5 rounded-2xl">
          <div className="text-[10px] text-slate-400 font-bold uppercase">Vegetation Continuity</div>
          <div className="text-2xl font-black text-cyan-400 font-mono mt-1">{continuityData.vegetationContinuity}</div>
          <div className="text-[10px] text-cyan-400 mt-1">Canopy Connectivity</div>
        </div>

        <div className="bg-[#0b0f19] border border-slate-800 p-3.5 rounded-2xl">
          <div className="text-[10px] text-slate-400 font-bold uppercase">Continuity Score</div>
          <div className="text-2xl font-black text-teal-400 font-mono mt-1">{continuityData.continuityScore} / 100</div>
          <div className="text-[10px] text-teal-400 mt-1">Ecosystem Health</div>
        </div>

        <div className="bg-[#0b0f19] border border-slate-800 p-3.5 rounded-2xl">
          <div className="text-[10px] text-slate-400 font-bold uppercase">Risk Projection</div>
          <div className="text-2xl font-black text-emerald-300 font-mono mt-1">{continuityData.riskProjection}</div>
          <div className="text-[10px] text-slate-400 mt-1">Soil Degradation: {continuityData.soilDegradationRisk}</div>
        </div>
      </div>

      {/* Main Grid: GIS Map Canvas & 10-Year Trend Graph */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* GIS Map View */}
        <div className="lg:col-span-6 min-h-[380px]">
          <MapLibreView
            city={currentCity}
            onLocationChange={onLocationChange}
            activeEngine="continuity"
            activeZone={activeZone}
            onSelectZone={onSelectZone}
            livePredictions={livePredictions}
          />
        </div>

        {/* 10-Year Historical Continuity Trend Chart */}
        <div className="lg:col-span-6 bg-[#0b0f19] border border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold text-slate-200 mb-1 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              10-Year Temporal Trend (2016 - 2026 Earth Observation)
            </h3>
            <p className="text-[10px] text-slate-400 mb-3">
              Correlation between LST expansion, green canopy decline, and ecological stability
            </p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={continuityData.historicalTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="year" stroke="#64748b" fontSize={10} />
                <YAxis stroke="#64748b" fontSize={10} />
                <Tooltip contentStyle={{ backgroundColor: '#090d16', borderColor: '#334155', fontSize: '10px' }} />
                <Legend wrapperStyle={{ fontSize: '10px' }} />
                <Line type="monotone" dataKey="lstMax" name="Max LST (°C)" stroke="#ef4444" strokeWidth={2.5} />
                <Line type="monotone" dataKey="greenCover" name="Green Cover %" stroke="#10b981" strokeWidth={2.5} />
                <Line type="monotone" dataKey="builtupPercent" name="Built-Up Concrete %" stroke="#f97316" strokeWidth={2} strokeDasharray="4 4" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Bottom Row: Formula Processor */}
      <FormulaProcessorWidget 
        formulaText={continuityData.formula}
        activeEngine="continuity"
      />

    </div>
  );
};
