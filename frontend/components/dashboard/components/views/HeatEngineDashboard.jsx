/**
 * HeatEngineDashboard Component
 * Thermal Anomaly & Land Surface Temperature (LST) Processor View.
 */
import React from 'react';
import { 
  AreaChart, 
  Area, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { Flame, Thermometer, Sun, Wind, ShieldAlert, Cpu } from 'lucide-react';
import { MapLibreView } from '../MapLibreView';
import { FormulaProcessorWidget } from '../widgets/FormulaProcessorWidget';

export const HeatEngineDashboard = ({
  currentCity,
  onLocationChange,
  activeEngine,
  activeZone,
  onSelectZone,
  livePredictions,
  colocationResult,
  colocationState
}) => {
  const heatData = currentCity.heatEngine;

  return (
    <div className="flex-1 p-4 space-y-4 overflow-y-auto bg-[#060911] text-slate-100">
      
      {/* Title Bar */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-black tracking-tight flex items-center gap-2">
          <Flame className="w-5 h-5 text-rose-500" />
          Heat Engine Dashboard
        </h1>
        <div className="flex items-center gap-2 text-xs font-semibold text-rose-400">
          <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
          <span>Thermal Anomaly & LST Processing Engine</span>
        </div>
      </div>

      {/* Metric Cards Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-[#0b0f19] border border-slate-800 p-3.5 rounded-2xl">
          <div className="text-[10px] text-slate-400 font-bold uppercase">Mean ΔT Prediction</div>
          <div className="text-2xl font-black text-rose-500 font-mono mt-1">
            {colocationResult?.heat_delta_summary ? `${colocationResult.heat_delta_summary.mean > 0 ? '+' : ''}${colocationResult.heat_delta_summary.mean.toFixed(2)}` : `+${heatData.uhiDelta}`} °C
          </div>
          <div className="text-[10px] text-rose-400 mt-1">Mean Area Change</div>
        </div>

        <div className="bg-[#0e1424] border border-slate-800 p-3.5 rounded-2xl">
          <div className="text-[10px] text-slate-400 font-bold uppercase">Max Cooling Effect</div>
          <div className="text-2xl font-black text-amber-500 font-mono mt-1">
            {colocationResult?.heat_delta_summary ? `${colocationResult.heat_delta_summary.min > 0 ? '+' : ''}${colocationResult.heat_delta_summary.min.toFixed(2)}` : heatData.lstAvg} °C
          </div>
          <div className="text-[10px] text-amber-400 mt-1">Maximum Temperature Drop</div>
        </div>

        <div className="bg-[#0e1424] border border-slate-800 p-3.5 rounded-2xl">
          <div className="text-[10px] text-slate-400 font-bold uppercase">Guardrail Status</div>
          <div className="text-2xl font-black text-cyan-400 font-mono mt-1">
            {colocationResult?.heat_guardrail_status || 'N/A'}
          </div>
          <div className="text-[10px] text-cyan-400 mt-1">Physics Constraints</div>
        </div>

        <div className="bg-[#0e1424] border border-slate-800 p-3.5 rounded-2xl">
          <div className="text-[10px] text-slate-400 font-bold uppercase">Intervention Type</div>
          <div className="text-2xl font-black text-emerald-400 font-mono mt-1 text-sm pt-2">
            {colocationResult?.heat_intervention_type || heatData.albedoIndex}
          </div>
          <div className="text-[10px] text-emerald-400 mt-1">Simulated Action</div>
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
              Bridge Co-Location Assessment (Heat)
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
              <div className="text-[10px] text-slate-400 uppercase">Guardrail Status</div>
              <div className={`text-lg font-bold ${
                colocationResult.execution_mode === 'CACHED' ? 'text-amber-300' : 'text-purple-300'
              }`}>{colocationResult.heat_guardrail_status}</div>
            </div>
            <div>
              <div className="text-[10px] text-slate-400 uppercase">Intervention</div>
              <div className={`text-lg font-bold ${
                colocationResult.execution_mode === 'CACHED' ? 'text-amber-300' : 'text-purple-300'
              }`}>{colocationResult.heat_intervention_type}</div>
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

      {/* Main Grid: GIS Map Canvas & Thermal Anomaly Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* GIS Thermal Map Canvas */}
        <div className="lg:col-span-7 min-h-[380px]">
          <MapLibreView
            city={currentCity}
            onLocationChange={onLocationChange}
            activeEngine="heat"
            activeZone={activeZone}
            onSelectZone={onSelectZone}
            livePredictions={livePredictions}
          />
        </div>

        {/* Thermal Diurnal Anomaly Chart */}
        <div className="lg:col-span-5 bg-[#0b0f19] border border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold text-slate-200 mb-1">
              Diurnal Temperature Anomaly (Urban vs. Rural)
            </h3>
            <p className="text-[10px] text-slate-400 mb-3">
              Hourly LST delta highlighting nocturnal heat retention
            </p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={heatData.diurnalTrend}>
                <defs>
                  <linearGradient id="urbanHeatGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.5}/>
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="hour" stroke="#64748b" fontSize={10} />
                <YAxis stroke="#64748b" fontSize={10} unit="°C" />
                <Tooltip contentStyle={{ backgroundColor: '#090d16', borderColor: '#334155', fontSize: '10px' }} />
                <Area type="monotone" dataKey="urban" name="Urban Core" stroke="#f43f5e" strokeWidth={2} fillOpacity={1} fill="url(#urbanHeatGrad)" />
                <Area type="monotone" dataKey="rural" name="Rural Fringe" stroke="#10b981" strokeWidth={2} fill="none" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Bottom Row: Formula Processor Widget */}
      <FormulaProcessorWidget 
        formulaText={heatData.formula}
        activeEngine="heat"
      />

    </div>
  );
};
