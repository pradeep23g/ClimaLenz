/**
 * Left Sidebar Navigation Component
 * Climalenz Dark-Themed Sidebar matching AquaLens AI design.
 */
import React from 'react';
import { 
  LayoutDashboard, 
  Droplet, 
  Flame, 
  Activity, 
  Network, 
  Bot, 
  Map, 
  Bell, 
  Sliders,
  Sparkles
} from 'lucide-react';

export const Sidebar = ({ activeEngine, setActiveEngine }) => {
  return (
    <aside className="w-60 bg-[#0b0f19] border-r border-slate-800/80 flex flex-col justify-between p-3 select-none text-xs">
      
      {/* Top Navigation Items */}
      <div className="space-y-4">
        
        {/* Dashboard Overview Main Button */}
        <button
          onClick={() => setActiveEngine('overview')}
          className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl font-bold transition-all cursor-pointer ${
            activeEngine === 'overview'
              ? 'bg-gradient-to-r from-cyan-500/20 to-teal-500/10 border border-cyan-500/50 text-cyan-300 shadow-md shadow-cyan-500/10'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
          }`}
        >
          <LayoutDashboard className="w-4 h-4 text-cyan-400" />
          <span>DASHBOARD OVERVIEW</span>
        </button>

        {/* Engine & Layers Menu Section */}
        <div>
          <div className="px-3 pb-2 text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
            ENGINES & LAYERS
          </div>

          <div className="space-y-1">
            {/* Water Engine */}
            <button
              onClick={() => setActiveEngine('water')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl font-medium transition-all cursor-pointer ${
                activeEngine === 'water'
                  ? 'bg-slate-800/90 border border-slate-700 text-slate-100 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
              }`}
            >
              <Droplet className={`w-4 h-4 ${activeEngine === 'water' ? 'text-cyan-400' : 'text-slate-400'}`} />
              <span>Water Engine</span>
            </button>

            {/* Heat Engine */}
            <button
              onClick={() => setActiveEngine('heat')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl font-medium transition-all cursor-pointer ${
                activeEngine === 'heat'
                  ? 'bg-slate-800/90 border border-slate-700 text-slate-100 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
              }`}
            >
              <Flame className={`w-4 h-4 ${activeEngine === 'heat' ? 'text-rose-400' : 'text-slate-400'}`} />
              <span>Heat Engine</span>
            </button>

            {/* Continuity Engine */}
            <button
              onClick={() => setActiveEngine('continuity')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl font-medium transition-all cursor-pointer ${
                activeEngine === 'continuity'
                  ? 'bg-slate-800/90 border border-slate-700 text-slate-100 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
              }`}
            >
              <Activity className={`w-4 h-4 ${activeEngine === 'continuity' ? 'text-emerald-400' : 'text-slate-400'}`} />
              <span>Continuity Engine</span>
            </button>

            {/* Bridge */}
            <button
              onClick={() => setActiveEngine('bridge')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl font-medium transition-all cursor-pointer ${
                activeEngine === 'bridge'
                  ? 'bg-slate-800/90 border border-slate-700 text-slate-100 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
              }`}
            >
              <Network className={`w-4 h-4 ${activeEngine === 'bridge' ? 'text-purple-400' : 'text-slate-400'}`} />
              <span>Bridge</span>
            </button>

            {/* Agents */}
            <button
              onClick={() => setActiveEngine('agents')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl font-medium transition-all cursor-pointer ${
                activeEngine === 'agents'
                  ? 'bg-slate-800/90 border border-slate-700 text-slate-100 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
              }`}
            >
              <Bot className={`w-4 h-4 ${activeEngine === 'agents' ? 'text-amber-400' : 'text-slate-400'}`} />
              <span>Agents</span>
            </button>
          </div>
        </div>

      </div>

      {/* Bottom Menu Items */}
      <div className="space-y-1 pt-4 border-t border-slate-800/80">
        
        {/* Map View */}
        <button
          onClick={() => setActiveEngine('map_view')}
          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl font-medium transition-all cursor-pointer ${
            activeEngine === 'map_view'
              ? 'bg-slate-800 border border-slate-700 text-slate-100'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
          }`}
        >
          <Map className="w-4 h-4 text-cyan-400" />
          <span>Map View</span>
        </button>

        {/* Alerts */}
        <button
          onClick={() => setActiveEngine('alerts')}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl font-medium transition-all cursor-pointer ${
            activeEngine === 'alerts'
              ? 'bg-slate-800 border border-slate-700 text-slate-100'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <Bell className="w-4 h-4 text-rose-400" />
            <span>Alerts</span>
          </div>
          <span className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-rose-500/20 text-rose-400">
            3
          </span>
        </button>

        {/* Settings */}
        <button
          onClick={() => setActiveEngine('settings')}
          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl font-medium transition-all cursor-pointer ${
            activeEngine === 'settings'
              ? 'bg-slate-800 border border-slate-700 text-slate-100'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
          }`}
        >
          <Sliders className="w-4 h-4 text-slate-400" />
          <span>Settings</span>
        </button>

      </div>

    </aside>
  );
};
