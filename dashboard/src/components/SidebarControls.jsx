/**
 * SidebarControls Component
 * Manages layer toggles (LST Heatmap, NDVI, Built-up Density), polygon selection tool, and zone details.
 */
import React from 'react';
import { 
  Layers, 
  Flame, 
  Trees, 
  Building2, 
  MousePointerClick, 
  ChevronLeft, 
  ChevronRight,
  MapPin,
  Thermometer,
  ShieldAlert,
  Info,
  Maximize2
} from 'lucide-react';
import { classifySeverity } from '../utils/uhiCalculator';

export const SidebarControls = ({ 
  activeLayer, 
  onSelectLayer, 
  isDrawingMode, 
  onToggleDrawingMode, 
  zones, 
  activeZone, 
  onSelectZone, 
  isCollapsed, 
  onToggleCollapse,
  isDarkMode,
  currentMetrics
}) => {
  const currentLst = activeZone ? activeZone.lst : (currentMetrics?.lstAvg || 36.5);
  const currentSeverity = classifySeverity(currentLst);

  return (
    <aside className={`relative z-20 transition-all duration-300 flex flex-col border-r ${
      isCollapsed ? 'w-14' : 'w-80'
    } ${
      isDarkMode 
        ? 'bg-slate-900/95 border-slate-800 text-slate-200' 
        : 'bg-white/95 border-slate-200 text-slate-800'
    }`}>
      {/* Collapse Toggle Button */}
      <button
        onClick={onToggleCollapse}
        className={`absolute -right-3 top-6 z-30 p-1.5 rounded-full border shadow-md transition-transform cursor-pointer ${
          isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700' : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-100'
        }`}
        title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
      >
        {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
      </button>

      {/* Sidebar Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        
        {/* Layer Controls Section */}
        <div>
          {!isCollapsed && (
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-rose-500" /> GIS Layer Overlays
            </h2>
          )}
          
          <div className="space-y-2">
            {/* LST Heatmap Toggle */}
            <button
              onClick={() => onSelectLayer('lst')}
              className={`w-full flex items-center gap-3 p-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                activeLayer === 'lst'
                  ? 'bg-rose-500/10 border-rose-500/50 text-rose-500 shadow-sm'
                  : isDarkMode ? 'bg-slate-800/50 border-slate-700/50 hover:bg-slate-800' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
              }`}
              title="Land Surface Temperature (LST) Heatmap"
            >
              <div className={`p-2 rounded-lg ${activeLayer === 'lst' ? 'bg-rose-500 text-white' : 'bg-rose-500/20 text-rose-400'}`}>
                <Flame className="w-4 h-4" />
              </div>
              {!isCollapsed && (
                <div className="text-left flex-1">
                  <div className="font-bold">LST Heatmap Overlay</div>
                  <div className="text-[10px] text-slate-400 font-normal">Thermal hotspot identification</div>
                </div>
              )}
            </button>

            {/* NDVI Vegetation Layer Toggle */}
            <button
              onClick={() => onSelectLayer('ndvi')}
              className={`w-full flex items-center gap-3 p-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                activeLayer === 'ndvi'
                  ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-500 shadow-sm'
                  : isDarkMode ? 'bg-slate-800/50 border-slate-700/50 hover:bg-slate-800' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
              }`}
              title="Vegetation Index (NDVI)"
            >
              <div className={`p-2 rounded-lg ${activeLayer === 'ndvi' ? 'bg-emerald-500 text-white' : 'bg-emerald-500/20 text-emerald-400'}`}>
                <Trees className="w-4 h-4" />
              </div>
              {!isCollapsed && (
                <div className="text-left flex-1">
                  <div className="font-bold">NDVI Vegetation Index</div>
                  <div className="text-[10px] text-slate-400 font-normal">Green canopy & inverse heat density</div>
                </div>
              )}
            </button>

            {/* Urban Density Layer Toggle */}
            <button
              onClick={() => onSelectLayer('builtup')}
              className={`w-full flex items-center gap-3 p-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                activeLayer === 'builtup'
                  ? 'bg-amber-500/10 border-amber-500/50 text-amber-500 shadow-sm'
                  : isDarkMode ? 'bg-slate-800/50 border-slate-700/50 hover:bg-slate-800' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
              }`}
              title="Built-Up Concrete Density"
            >
              <div className={`p-2 rounded-lg ${activeLayer === 'builtup' ? 'bg-amber-500 text-white' : 'bg-amber-500/20 text-amber-400'}`}>
                <Building2 className="w-4 h-4" />
              </div>
              {!isCollapsed && (
                <div className="text-left flex-1">
                  <div className="font-bold">Built-Up Density</div>
                  <div className="text-[10px] text-slate-400 font-normal">Concrete & impervious surface density</div>
                </div>
              )}
            </button>
          </div>
        </div>

        {/* Interactive Polygon Tool */}
        {!isCollapsed && (
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
              <Maximize2 className="w-3.5 h-3.5 text-cyan-400" /> Interactive Polygon Tool
            </h2>
            
            <button
              onClick={onToggleDrawingMode}
              className={`w-full flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                isDrawingMode
                  ? 'bg-cyan-500 text-white border-cyan-400 shadow-lg shadow-cyan-500/20 animate-pulse'
                  : isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700' : 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <MousePointerClick className="w-4 h-4" />
              <span>{isDrawingMode ? 'Drawing Active (Click map)' : 'Draw Custom Urban Zone'}</span>
            </button>
            <p className="text-[10px] text-slate-400 mt-1.5 text-center">
              Click on the map to draw custom polygon boundaries and extract local microclimate metrics.
            </p>
          </div>
        )}

        {/* Predefined Zones Selector */}
        {!isCollapsed && zones && zones.length > 0 && (
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-rose-400" /> Key Microclimate Zones
            </h2>
            <div className="space-y-1.5">
              <button
                onClick={() => onSelectZone(null)}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                  !activeZone 
                    ? 'bg-rose-500/10 border-rose-500/40 text-rose-400 font-bold' 
                    : isDarkMode ? 'border-slate-800 text-slate-400 hover:bg-slate-800' : 'border-slate-100 text-slate-600 hover:bg-slate-100'
                }`}
              >
                🌐 Entire Regional Agglomeration
              </button>

              {zones.map((zone) => (
                <button
                  key={zone.id}
                  onClick={() => onSelectZone(zone)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium border transition-all flex items-center justify-between cursor-pointer ${
                    activeZone?.id === zone.id
                      ? 'bg-rose-500/10 border-rose-500/40 text-rose-400 font-bold'
                      : isDarkMode ? 'border-slate-800 text-slate-300 hover:bg-slate-800' : 'border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <span className="truncate pr-2">{zone.name}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded font-mono bg-rose-500/20 text-rose-300">
                    {zone.lst}°C
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Active Zone Severity Badge */}
        {!isCollapsed && (
          <div className={`p-3.5 rounded-xl border ${currentSeverity.bg} ${currentSeverity.border}`}>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <ShieldAlert className={`w-3.5 h-3.5 ${currentSeverity.text}`} /> UHI Severity Category
              </span>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${currentSeverity.bg} ${currentSeverity.text} border ${currentSeverity.border}`}>
                {currentSeverity.name}
              </span>
            </div>
            <p className="text-xs text-slate-300 font-medium leading-relaxed">
              {currentSeverity.desc}
            </p>
          </div>
        )}

      </div>
    </aside>
  );
};
