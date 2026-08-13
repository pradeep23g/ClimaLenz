/**
 * AnalyticsPanel Component
 * Recharts visualizations for Temperature Anomaly, 10-Year Time Series, and Microclimate stat cards.
 */
import React from 'react';
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { 
  Thermometer, 
  Wind, 
  Droplets, 
  Sun, 
  TrendingUp, 
  Clock, 
  Building, 
  Trees 
} from 'lucide-react';
import { classifySeverity } from '../utils/uhiCalculator';

export const AnalyticsPanel = ({ city, activeZone, liveMetrics, isDarkMode }) => {
  const currentLst = activeZone ? activeZone.lst : (liveMetrics?.lstAvg || city.lstAvg);
  const ambientTemp = liveMetrics?.ambientTemp || city.ambientTemp;
  const humidity = liveMetrics?.humidity || city.humidity;
  const windSpeed = liveMetrics?.windSpeed || city.windSpeed;
  const ndvi = activeZone ? activeZone.ndvi : (liveMetrics?.ndviAvg || city.ndviAvg);
  const builtup = activeZone ? activeZone.builtup : (liveMetrics?.builtupDensity || city.builtupDensity);

  const severity = classifySeverity(currentLst);

  return (
    <div className="space-y-6">
      
      {/* Microclimate Quick Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        
        {/* Land Surface Temperature */}
        <div className={`p-4 rounded-2xl border transition-all ${
          isDarkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200'
        }`}>
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span className="font-bold">Land Surface Temp</span>
            <Thermometer className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-black text-rose-500 flex items-baseline gap-1">
            {currentLst} <span className="text-xs font-semibold text-slate-400">°C</span>
          </div>
          <div className={`mt-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full inline-block ${severity.bg} ${severity.text}`}>
            {severity.name}
          </div>
        </div>

        {/* Ambient Air Temp */}
        <div className={`p-4 rounded-2xl border transition-all ${
          isDarkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200'
        }`}>
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span className="font-bold">Ambient Air Temp</span>
            <Sun className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-500 flex items-baseline gap-1">
            {ambientTemp} <span className="text-xs font-semibold text-slate-400">°C</span>
          </div>
          <div className="mt-1.5 text-[10px] text-slate-400 font-medium">
            Open-Meteo Sensor
          </div>
        </div>

        {/* Relative Humidity */}
        <div className={`p-4 rounded-2xl border transition-all ${
          isDarkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200'
        }`}>
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span className="font-bold">Humidity</span>
            <Droplets className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-black text-cyan-400 flex items-baseline gap-1">
            {humidity} <span className="text-xs font-semibold text-slate-400">%</span>
          </div>
          <div className="mt-1.5 text-[10px] text-slate-400 font-medium">
            Moisture baseline
          </div>
        </div>

        {/* Wind Speed */}
        <div className={`p-4 rounded-2xl border transition-all ${
          isDarkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200'
        }`}>
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span className="font-bold">Wind Speed</span>
            <Wind className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-2xl font-black text-sky-400 flex items-baseline gap-1">
            {windSpeed} <span className="text-xs font-semibold text-slate-400">km/h</span>
          </div>
          <div className="mt-1.5 text-[10px] text-slate-400 font-medium">
            Urban ventilation
          </div>
        </div>

        {/* NDVI Vegetation Score */}
        <div className={`p-4 rounded-2xl border transition-all col-span-2 sm:col-span-1 ${
          isDarkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200'
        }`}>
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span className="font-bold">NDVI Canopy Index</span>
            <Trees className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400 flex items-baseline gap-1">
            {ndvi} <span className="text-xs font-semibold text-slate-400">/ 1.0</span>
          </div>
          <div className="mt-1.5 text-[10px] text-emerald-500 font-medium">
            Built-up: {builtup}%
          </div>
        </div>

      </div>

      {/* Visual Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Chart 1: Temperature Anomaly Profile (Daytime vs Nighttime Delta) */}
        <div className={`p-5 rounded-2xl border ${
          isDarkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-sm flex items-center gap-2">
                <Clock className="w-4 h-4 text-rose-500" />
                Diurnal Temperature Anomaly (Urban vs. Rural)
              </h3>
              <p className="text-xs text-slate-400">
                Hourly Land Surface Temperature delta highlighting nocturnal heat retention
              </p>
            </div>
            <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-rose-500/10 text-rose-400 border border-rose-500/20">
              Max Delta: +{Math.max(...city.anomalyProfile.map(p => p.delta))}°C
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={city.anomalyProfile}>
                <defs>
                  <linearGradient id="urbanGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="ruralGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#334155' : '#e2e8f0'} />
                <XAxis dataKey="hour" stroke={isDarkMode ? '#94a3b8' : '#64748b'} fontSize={11} />
                <YAxis stroke={isDarkMode ? '#94a3b8' : '#64748b'} fontSize={11} unit="°C" domain={['dataMin - 2', 'dataMax + 2']} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: isDarkMode ? '#0f172a' : '#ffffff', 
                    borderColor: isDarkMode ? '#334155' : '#cbd5e1',
                    borderRadius: '0.75rem',
                    color: isDarkMode ? '#f8fafc' : '#0f172a'
                  }} 
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Area type="monotone" dataKey="urban" name="Urban Core Temp (°C)" stroke="#f43f5e" strokeWidth={2.5} fillOpacity={1} fill="url(#urbanGrad)" />
                <Area type="monotone" dataKey="rural" name="Rural Fringe Temp (°C)" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#ruralGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: 10-Year Historical LST Trend vs Green Cover Decline */}
        <div className={`p-5 rounded-2xl border ${
          isDarkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-sm flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                10-Year LST Expansion vs Green Canopy Decline
              </h3>
              <p className="text-xs text-slate-400">
                Satellite earth observation timeline (2016 - 2026)
              </p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={city.historicalTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#334155' : '#e2e8f0'} />
                <XAxis dataKey="year" stroke={isDarkMode ? '#94a3b8' : '#64748b'} fontSize={11} />
                <YAxis yAxisId="left" stroke="#ef4444" fontSize={11} unit="°C" domain={['dataMin - 2', 'dataMax + 2']} />
                <YAxis yAxisId="right" orientation="right" stroke="#10b981" fontSize={11} unit="%" domain={[0, 100]} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: isDarkMode ? '#0f172a' : '#ffffff', 
                    borderColor: isDarkMode ? '#334155' : '#cbd5e1',
                    borderRadius: '0.75rem'
                  }} 
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Line yAxisId="left" type="monotone" dataKey="lstMax" name="Max LST (°C)" stroke="#ef4444" strokeWidth={3} dot={{ r: 4 }} />
                <Line yAxisId="right" type="monotone" dataKey="greenCover" name="Green Cover %" stroke="#10b981" strokeWidth={2.5} dot={{ r: 4 }} />
                <Line yAxisId="right" type="monotone" dataKey="builtupPercent" name="Built-Up Concrete %" stroke="#f97316" strokeWidth={2} strokeDasharray="5 5" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

    </div>
  );
};
