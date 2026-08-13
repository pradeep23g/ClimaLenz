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
  livePredictions
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
          <div className="text-[10px] text-slate-400 font-bold uppercase">Land Surface Temp (LST)</div>
          <div className="text-2xl font-black text-rose-500 font-mono mt-1">{heatData.lstAvg} °C</div>
          <div className="text-[10px] text-rose-400 mt-1">Satellite TIRS Band 10</div>
        </div>

        <div className="bg-[#0e1424] border border-slate-800 p-3.5 rounded-2xl">
          <div className="text-[10px] text-slate-400 font-bold uppercase">UHI Microclimate Delta</div>
          <div className="text-2xl font-black text-amber-500 font-mono mt-1">+{heatData.uhiDelta} °C</div>
          <div className="text-[10px] text-amber-400 mt-1">Urban vs Rural Delta</div>
        </div>

        <div className="bg-[#0e1424] border border-slate-800 p-3.5 rounded-2xl">
          <div className="text-[10px] text-slate-400 font-bold uppercase">Thermal Anomalies</div>
          <div className="text-2xl font-black text-cyan-400 font-mono mt-1">{heatData.thermalAnomalies}</div>
          <div className="text-[10px] text-cyan-400 mt-1">Active Heat Hotspots</div>
        </div>

        <div className="bg-[#0e1424] border border-slate-800 p-3.5 rounded-2xl">
          <div className="text-[10px] text-slate-400 font-bold uppercase">Urban Albedo Index</div>
          <div className="text-2xl font-black text-emerald-400 font-mono mt-1">{heatData.albedoIndex}</div>
          <div className="text-[10px] text-emerald-400 mt-1">Reflectivity Ratio</div>
        </div>
      </div>

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
