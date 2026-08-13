/**
 * InsightsEngine Component
 * SDG 11 Climate Adaptation Insights & Cooling Strategy Impact Simulator
 */
import React, { useState } from 'react';
import { 
  Sliders, 
  Sparkles, 
  ShieldCheck, 
  Zap, 
  Leaf, 
  Building2, 
  Waves, 
  ArrowRight,
  TrendingDown,
  CheckCircle,
  Lightbulb
} from 'lucide-react';
import { 
  calculateCoolingSimulation, 
  getSdg11Recommendations 
} from '../utils/uhiCalculator';

export const InsightsEngine = ({ city, activeZone, currentMetrics, isDarkMode }) => {
  const [vegPct, setVegPct] = useState(15);
  const [coolPct, setCoolPct] = useState(20);
  const [waterPct, setWaterPct] = useState(10);

  const currentLst = activeZone ? activeZone.lst : (currentMetrics?.lstAvg || city.lstAvg);
  const currentNdvi = activeZone ? activeZone.ndvi : (currentMetrics?.ndviAvg || city.ndviAvg);
  const currentBuiltup = activeZone ? activeZone.builtup : (currentMetrics?.builtupDensity || city.builtupDensity);

  const simulationResult = calculateCoolingSimulation(currentLst, vegPct, coolPct, waterPct);
  const recommendations = getSdg11Recommendations(currentNdvi, currentBuiltup, currentLst);

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            SDG 11 Urban Planning & Climate Adaptation Engine
          </h2>
          <p className="text-xs text-slate-400">
            Simulate intervention scenarios and generate policy recommendations for urban cooling.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Interactive Cooling Strategy Impact Simulator (7 Cols) */}
        <div className={`lg:col-span-7 p-6 rounded-2xl border ${
          isDarkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'
        }`}>
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold text-sm flex items-center gap-2">
              <Sliders className="w-4 h-4 text-cyan-400" />
              Cooling Strategy Impact Simulator
            </h3>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              Interactive Physics Model
            </span>
          </div>

          {/* Sliders */}
          <div className="space-y-5">
            
            {/* Slider 1: Urban Canopy & Greenery */}
            <div>
              <div className="flex justify-between items-center text-xs font-semibold mb-2">
                <span className="flex items-center gap-1.5 text-emerald-400">
                  <Leaf className="w-4 h-4" /> Vegetation Canopy Expansion (Trees & Parks)
                </span>
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono">
                  +{vegPct}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="50"
                value={vegPct}
                onChange={(e) => setVegPct(Number(e.target.value))}
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
              <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                <span>0% (Current)</span>
                <span>+25% Canopy</span>
                <span>+50% Max Greenery</span>
              </div>
            </div>

            {/* Slider 2: Cool Pavements & High-Albedo Roofs */}
            <div>
              <div className="flex justify-between items-center text-xs font-semibold mb-2">
                <span className="flex items-center gap-1.5 text-amber-400">
                  <Building2 className="w-4 h-4" /> Cool Roofs & Reflective Pavement Retrofit
                </span>
                <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono">
                  +{coolPct}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="50"
                value={coolPct}
                onChange={(e) => setCoolPct(Number(e.target.value))}
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
              <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                <span>0% (Standard Asphalt)</span>
                <span>+25% High Albedo</span>
                <span>+50% Max Reflectivity</span>
              </div>
            </div>

            {/* Slider 3: Water Retention & Bioswales */}
            <div>
              <div className="flex justify-between items-center text-xs font-semibold mb-2">
                <span className="flex items-center gap-1.5 text-cyan-400">
                  <Waves className="w-4 h-4" /> Water Retention & Bioswale Retention
                </span>
                <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-mono">
                  +{waterPct}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="30"
                value={waterPct}
                onChange={(e) => setWaterPct(Number(e.target.value))}
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
              />
              <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                <span>0%</span>
                <span>+15% Wetland</span>
                <span>+30% Max Bioswale</span>
              </div>
            </div>

          </div>

          {/* Simulation Projected Impact Results Card */}
          <div className="mt-6 p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Projected Mitigation Outcomes
            </div>
            
            <div className="grid grid-cols-3 gap-3 text-center">
              
              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <div className="text-[10px] text-slate-400 font-medium">Temp Drop</div>
                <div className="text-xl font-black text-emerald-400">
                  -{simulationResult.tempDrop} °C
                </div>
                <div className="text-[9px] text-emerald-500 font-semibold mt-0.5">
                  {currentLst}°C ➔ {simulationResult.projectedLst}°C
                </div>
              </div>

              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <div className="text-[10px] text-slate-400 font-medium">HVAC Savings</div>
                <div className="text-xl font-black text-amber-400">
                  {simulationResult.energySavingsPct}%
                </div>
                <div className="text-[9px] text-amber-500 font-semibold mt-0.5">
                  Power Demand
                </div>
              </div>

              <div className="p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
                <div className="text-[10px] text-slate-400 font-medium">CO2 Offset</div>
                <div className="text-xl font-black text-cyan-400">
                  ~{simulationResult.co2MitigationTons}
                </div>
                <div className="text-[9px] text-cyan-500 font-semibold mt-0.5">
                  Tons/sq km/yr
                </div>
              </div>

            </div>
          </div>

        </div>

        {/* Right Column: Actionable SDG 11 Policy Recommendations (5 Cols) */}
        <div className={`lg:col-span-5 p-6 rounded-2xl border flex flex-col justify-between ${
          isDarkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'
        }`}>
          <div>
            <h3 className="font-bold text-sm mb-4 flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-amber-400" />
              Automated SDG 11 Policy Interventions
            </h3>

            <div className="space-y-3">
              {recommendations.map((rec, idx) => (
                <div 
                  key={idx} 
                  className={`p-3.5 rounded-xl border text-xs space-y-1.5 ${
                    isDarkMode ? 'bg-slate-800/60 border-slate-700/80 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between font-bold">
                    <span className="text-cyan-400 flex items-center gap-1.5">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                      {rec.category}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] bg-rose-500/20 text-rose-300 font-semibold">
                      {rec.impact}
                    </span>
                  </div>
                  <p className="text-slate-300 leading-relaxed text-[11px]">
                    {rec.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-5 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 shrink-0 text-emerald-400" />
            <span>
              Targeting <strong>SDG 11.7</strong>: Provide universal access to safe, inclusive, and green public spaces in urban centers.
            </span>
          </div>

        </div>

      </div>

    </div>
  );
};
