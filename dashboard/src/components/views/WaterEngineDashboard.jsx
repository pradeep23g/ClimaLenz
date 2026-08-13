/**
 * WaterEngineDashboard Component
 * Core Water Engine Dashboard View matching AquaLens AI design.
 * Features Satellite Data Feed, MapLibre GIS Map, Formula Processor Node diagram, and Ground Predictions graphs.
 * API key widgets removed per user instructions.
 */
import React from 'react';
import { SatelliteFeedWidget } from '../widgets/SatelliteFeedWidget';
import { FormulaProcessorWidget } from '../widgets/FormulaProcessorWidget';
import { GroundDataPredictionWidget } from '../widgets/GroundDataPredictionWidget';
import { MapLibreView } from '../MapLibreView';
import { Droplet, Layers } from 'lucide-react';

export const WaterEngineDashboard = ({
  currentCity,
  onLocationChange,
  activeEngine,
  activeZone,
  onSelectZone,
  livePredictions,
  coefficients,
  selectedSatellite
}) => {
  return (
    <div className="flex-1 p-4 space-y-4 overflow-y-auto bg-[#060911] text-slate-100">
      
      {/* Title Bar */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-black text-slate-100 tracking-tight flex items-center gap-2">
          <Droplet className="w-5 h-5 text-cyan-400" />
          Water Engine Dashboard
        </h1>
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Active Pipeline: Hydrologic Formula Processor</span>
        </div>
      </div>

      {/* Top Grid: Satellite Data Feed (Left) + MapLibre GIS Canvas (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* Left Column Box: Satellite Data Feed */}
        <div className="lg:col-span-4 flex flex-col justify-between">
          <SatelliteFeedWidget waterEngineData={currentCity.waterEngine} />
        </div>

        {/* Right Column: MapLibre GIS Map View */}
        <div className="lg:col-span-8 min-h-[420px]">
          <MapLibreView
            city={currentCity}
            onLocationChange={onLocationChange}
            activeEngine={activeEngine}
            activeZone={activeZone}
            onSelectZone={onSelectZone}
            livePredictions={livePredictions}
            satelliteFeedNotice={selectedSatellite}
          />
        </div>

      </div>

      {/* Bottom Grid: Formula Processor & Ground Data Predictions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* Left Widget: Formula Processor Flow Node Diagram */}
        <div className="lg:col-span-5 flex flex-col justify-between">
          <FormulaProcessorWidget 
            formulaText={currentCity.waterEngine.formula}
            activeEngine="water"
          />
        </div>

        {/* Right Widget: Ground Data Prediction Charts */}
        <div className="lg:col-span-7">
          <GroundDataPredictionWidget 
            predictions={livePredictions}
            timeSeries={currentCity.waterEngine.timeSeries}
          />
        </div>

      </div>

    </div>
  );
};
