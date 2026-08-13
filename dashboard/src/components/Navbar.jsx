/**
 * Header / Navbar Component
 * Climalenz Dark-Themed Navigation Header matching AquaLens AI design.
 */
import React, { useState } from 'react';
import { 
  Globe, 
  Search, 
  RefreshCw, 
  Settings, 
  Bell, 
  ChevronDown,
  UserCheck,
  Sparkles,
  Layers,
  Home
} from 'lucide-react';

export const Navbar = ({ 
  selectedCityId, 
  onSelectCity, 
  presetCities,
  onRefresh,
  isSyncing,
  activeEngine,
  setActiveEngine,
  onGoHome
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);

  const filteredCities = presetCities.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.country.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <header className="sticky top-0 z-50 bg-[#0b0f19]/90 backdrop-blur-md border-b border-slate-800 text-slate-100">
      <div className="max-w-[1700px] mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14 gap-4">
          
          {/* Logo & Brand Title */}
          <div className="flex items-center gap-3">
            {onGoHome && (
              <button
                onClick={onGoHome}
                title="Back to Home"
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <Home className="w-4 h-4" />
              </button>
            )}
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveEngine('overview')}>
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 via-teal-400 to-emerald-400 flex items-center justify-center text-slate-950 shadow-md shadow-cyan-500/20">
                <Globe className="w-5 h-5 animate-pulse text-slate-950" />
              </div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg tracking-wider bg-gradient-to-r from-white via-cyan-200 to-teal-300 bg-clip-text text-transparent">
                  CLIMALENZ
                </span>
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              </div>
            </div>
          </div>

          {/* Search Navigation Bar */}
          <div className="flex-1 max-w-md relative hidden md:block">
            <div className="relative flex items-center">
              <Search className="w-4 h-4 absolute left-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search Navigation... (Press '/' to focus)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-12 py-1.5 rounded-lg text-xs bg-slate-900/90 border border-slate-800 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
              />
              <span className="absolute right-3 text-[10px] font-mono text-slate-500 bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">
                &gt;&gt;
              </span>
            </div>
          </div>

          {/* Right Action Menu Items */}
          <div className="flex items-center gap-3 text-xs">
            
            {/* City Preset Selector */}
            <select
              value={selectedCityId}
              onChange={(e) => onSelectCity(e.target.value)}
              className="bg-slate-900 border border-slate-800 text-slate-300 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-cyan-500 cursor-pointer"
            >
              {presetCities.map(city => (
                <option key={city.id} value={city.id}>
                  📍 {city.name}, {city.country}
                </option>
              ))}
            </select>

            {/* Start Status Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 font-medium text-xs transition-colors cursor-pointer"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>Start status</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {showStatusDropdown && (
                <div className="absolute right-0 mt-2 w-56 rounded-xl bg-slate-900 border border-slate-800 shadow-2xl p-2 z-50 text-xs">
                  <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Pipeline Engine Status
                  </div>
                  <div className="space-y-1 mt-1">
                    <div className="flex items-center justify-between p-1.5 rounded bg-slate-800/40 text-slate-300">
                      <span>Water Engine</span>
                      <span className="text-emerald-400 font-bold">● Active</span>
                    </div>
                    <div className="flex items-center justify-between p-1.5 rounded bg-slate-800/40 text-slate-300">
                      <span>Heat Engine</span>
                      <span className="text-emerald-400 font-bold">● Active</span>
                    </div>
                    <div className="flex items-center justify-between p-1.5 rounded bg-slate-800/40 text-slate-300">
                      <span>Continuity Engine</span>
                      <span className="text-emerald-400 font-bold">● Active</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Refresh Button */}
            <button
              onClick={onRefresh}
              className={`p-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 transition-colors cursor-pointer ${
                isSyncing ? 'animate-spin text-cyan-400' : ''
              }`}
              title="Sync Live Pipeline"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            {/* Settings Icon */}
            <button 
              onClick={() => setActiveEngine('settings')}
              className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 transition-colors cursor-pointer"
              title="Settings"
            >
              <Settings className="w-4 h-4" />
            </button>

            {/* Notifications Bell Icon with Red Badge '5' */}
            <button 
              onClick={() => setActiveEngine('alerts')}
              className="relative p-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 transition-colors cursor-pointer"
              title="Alert Notifications"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-600 text-white text-[9px] font-bold flex items-center justify-center border border-slate-950">
                5
              </span>
            </button>

            {/* User Profile Avatar */}
            <div className="flex items-center gap-2 pl-1 border-l border-slate-800">
              <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-cyan-600 to-emerald-500 border border-cyan-400/40 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                A
              </div>
            </div>

          </div>

        </div>
      </div>
    </header>
  );
};
