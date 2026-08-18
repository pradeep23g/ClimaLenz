import React, { useState } from 'react';
import { Search, Play, Settings2, ShieldAlert, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';

export const CommandBar = ({ missionControl }) => {
  const {
    selectedLocation,
    selectedIntervention,
    selectedDelta,
    setLocation,
    setIntervention,
    setDelta,
    runAssessment,
    status,
    errorMessage
  } = missionControl;

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState(null);

  const handleSearchSubmit = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setSearchError(null);

    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`);
      const results = await res.json();

      if (results && results.length > 0) {
        const first = results[0];
        const lat = parseFloat(first.lat);
        const lng = parseFloat(first.lon);
        const name = first.display_name.split(',')[0];

        const latDelta = 0.025;
        const lngDelta = 0.035;
        
        // Construct standard AOI polygon
        const geom = {
          type: 'Polygon',
          coordinates: [[
            [lng - lngDelta, lat - latDelta],
            [lng + lngDelta, lat - latDelta],
            [lng + lngDelta, lat + latDelta],
            [lng - lngDelta, lat + latDelta],
            [lng - lngDelta, lat - latDelta]
          ]],
          // Extensions for the UI
          center: [lng, lat],
          name: name
        };

        setLocation(geom);
        setSearchQuery(name);
      } else {
        setSearchError('Location not found.');
      }
    } catch (err) {
      setSearchError('Search failed.');
    } finally {
      setIsSearching(false);
    }
  };

  const isRunning = status === 'LOADING';

  return (
    <div className="absolute top-4 md:top-6 left-1/2 -translate-x-1/2 z-30 w-full max-w-4xl px-4 pointer-events-none transition-all duration-300">
      <div className="pointer-events-auto backdrop-blur-xl border rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row items-stretch text-sm font-sans" 
           style={{ backgroundColor: 'rgba(6, 9, 17, 0.85)', borderColor: 'rgba(255,255,255,0.1)' }}>
        
        {/* Search Section */}
        <div className="flex-1 border-b md:border-b-0 md:border-r p-1.5 md:p-2 flex items-center bg-white/5" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
          <form onSubmit={handleSearchSubmit} className="flex w-full items-center px-2">
            <Search className="w-4 h-4 text-cyan-400 mr-2 shrink-0" />
            <input
              type="text"
              placeholder="Search AOI (e.g., London)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-none text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-0 w-full text-sm h-8 md:h-9"
              disabled={isRunning}
            />
            {isSearching && <Loader2 className="w-4 h-4 text-cyan-400 animate-spin shrink-0 ml-2" />}
          </form>
        </div>

        {/* Controls Section */}
        <div className="flex-[1.5] flex items-center p-1.5 md:p-2 gap-3 bg-black/20">
          
          <div className="flex items-center gap-2 px-2 border-r pr-3" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
            <Settings2 className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={selectedIntervention}
              onChange={(e) => setIntervention(e.target.value)}
              disabled={isRunning}
              className="bg-transparent border-none text-slate-200 font-medium text-xs focus:outline-none cursor-pointer uppercase tracking-wider [&>option]:bg-slate-900"
            >
              <option value="CANOPY">Canopy</option>
              <option value="COOL_ROOF">Cool Roof</option>
              <option value="ALBEDO">Albedo</option>
            </select>
          </div>

          <div className="flex-1 flex flex-col justify-center px-2 min-w-[100px]">
            <div className="flex justify-between text-[9px] font-mono text-slate-400 mb-1">
              <span>DELTA</span>
              <span className="text-cyan-400 font-bold">+{Math.round(selectedDelta * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={selectedDelta}
              onChange={(e) => setDelta(parseFloat(e.target.value))}
              disabled={isRunning}
              className="w-full accent-cyan-400 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer"
            />
          </div>

        </div>

        {/* Action Section */}
        <div className="p-1.5 md:p-2 flex items-center bg-white/5">
          <button
            onClick={runAssessment}
            disabled={isRunning || !selectedLocation}
            className={`flex items-center justify-center gap-2 px-4 py-2 rounded-xl font-bold text-xs uppercase tracking-wider transition-all h-full w-full md:w-auto ${
              isRunning 
                ? 'cursor-not-allowed opacity-50 bg-slate-800 text-slate-400'
                : !selectedLocation
                ? 'cursor-not-allowed opacity-50 bg-slate-800 text-slate-400'
                : 'shadow-[0_0_15px_rgba(34,211,238,0.3)] bg-cyan-600 hover:bg-cyan-500 text-white'
            }`}
          >
            {isRunning ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ANALYZING
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5" />
                RUN ASSESS
              </>
            )}
          </button>
        </div>

      </div>
      
      {/* Status Messages */}
      {(searchError || errorMessage) && (
        <div className="mt-2 flex items-center justify-center pointer-events-auto">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-rose-950/90 border border-rose-900/50 text-rose-400 text-xs font-medium backdrop-blur-md shadow-lg">
            <ShieldAlert className="w-3.5 h-3.5" />
            {searchError || errorMessage}
          </div>
        </div>
      )}
      
      {status === 'SUCCESS' && !errorMessage && !isRunning && (
        <div className="mt-2 flex items-center justify-center pointer-events-auto">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-950/90 border border-emerald-900/50 text-emerald-400 text-xs font-medium backdrop-blur-md shadow-lg">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Assessment Complete
          </div>
        </div>
      )}

    </div>
  );
};
