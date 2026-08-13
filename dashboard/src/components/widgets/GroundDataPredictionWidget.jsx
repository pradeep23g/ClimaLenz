/**
 * GroundDataPredictionWidget Component
 * Displays ground data prediction metrics and interactive charts for Soil Moisture, Evapotranspiration, and Catchment Level.
 */
import React from 'react';
import { 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  ResponsiveContainer,
  XAxis,
  Tooltip
} from 'recharts';
import { TrendingUp } from 'lucide-react';

export const GroundDataPredictionWidget = ({ predictions, timeSeries }) => {
  const data = timeSeries || [
    { time: 'Jan', soilMoisture: 45, evapotranspiration: 2.1, catchment: 85 },
    { time: 'Feb', soilMoisture: 40, evapotranspiration: 2.8, catchment: 80 },
    { time: 'May', soilMoisture: 28, evapotranspiration: 5.2, catchment: 65 },
    { time: 'Jul', soilMoisture: 82, evapotranspiration: 6.8, catchment: 92 },
    { time: 'Aug', soilMoisture: 75, evapotranspiration: 5.9, catchment: 88 },
    { time: 'Sep', soilMoisture: 62, evapotranspiration: 4.1, catchment: 75 }
  ];

  const soilMoistureVal = predictions?.soilMoisture || 32;
  const evapotranspirationVal = predictions?.evapotranspiration || 4.1;
  const catchmentVal = predictions?.catchmentLevel || 75;

  return (
    <div className="bg-[#0e1424] border border-slate-800/80 rounded-2xl p-4 shadow-xl select-none">
      
      {/* Widget Header */}
      <h3 className="text-xs font-bold text-slate-200 mb-3 flex items-center justify-between">
        <span className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-cyan-400" />
          Ground Data Prediction
        </span>
      </h3>

      {/* Grid of 3 Prediction Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Metric 1: Soil Moisture Area Chart */}
        <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3 flex flex-col justify-between">
          <div>
            <span className="text-[10px] text-slate-400 font-semibold block">
              Soil Moisture
            </span>
            <div className="text-xl font-extrabold text-cyan-400 font-mono mt-0.5">
              {soilMoistureVal}%
            </div>
          </div>

          <div className="h-16 w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="cyanGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.5}/>
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="time" hide />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#090d16', borderColor: '#1e293b', fontSize: '10px' }}
                />
                <Area type="monotone" dataKey="soilMoisture" stroke="#06b6d4" strokeWidth={2} fillOpacity={1} fill="url(#cyanGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Metric 2: Evapotranspiration Bar Chart */}
        <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3 flex flex-col justify-between">
          <div>
            <span className="text-[10px] text-slate-400 font-semibold block">
              Evapotranspiration
            </span>
            <div className="text-xl font-extrabold text-teal-400 font-mono mt-0.5">
              {evapotranspirationVal}mm
            </div>
          </div>

          <div className="h-16 w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <XAxis dataKey="time" hide />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#090d16', borderColor: '#1e293b', fontSize: '10px' }}
                />
                <Bar dataKey="evapotranspiration" fill="#2dd4bf" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Metric 3: Catchment Level Bar Chart */}
        <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3 flex flex-col justify-between">
          <div>
            <span className="text-[10px] text-slate-400 font-semibold block">
              Catchment Level
            </span>
            <div className="text-xl font-extrabold text-emerald-400 font-mono mt-0.5">
              {catchmentVal}%
            </div>
          </div>

          <div className="h-16 w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <XAxis dataKey="time" stroke="#475569" fontSize={9} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#090d16', borderColor: '#1e293b', fontSize: '10px' }}
                />
                <Bar dataKey="catchment" fill="#10b981" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

    </div>
  );
};
