import React from 'react';
import { LayoutDashboard, Bot, Folder, FileText, Settings } from 'lucide-react';

export const Sidebar = ({ currentView, onViewChange }) => {
  const navItems = [
    { id: 'monitor', label: 'Monitor', icon: LayoutDashboard, active: true },
    { id: 'copilot', label: 'Copilot', icon: Bot, active: true },
    { id: 'sessions', label: 'Sessions', icon: Folder, active: false, tooltip: 'Coming Soon' },
    { id: 'evidence', label: 'Evidence', icon: FileText, active: false, tooltip: 'Coming Soon' },
    { id: 'system', label: 'System', icon: Settings, active: false, tooltip: 'Coming Soon' },
  ];

  return (
    <div className="w-16 md:w-56 h-full bg-[#03050a] border-r border-slate-800/50 flex flex-col justify-between select-none">
      <div className="flex flex-col py-6">
        <div className="px-4 md:px-6 mb-8 flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-cyan-900/40 border border-cyan-500/30 flex items-center justify-center shrink-0">
            <div className="w-4 h-4 rounded-sm bg-cyan-400" />
          </div>
          <span className="font-bold text-slate-200 tracking-wide hidden md:block text-sm">CLIMALENZ</span>
        </div>

        <nav className="flex flex-col gap-2 px-3">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => item.active && onViewChange(item.id)}
              disabled={!item.active}
              className={`
                flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group
                ${
                  !item.active 
                    ? 'opacity-40 cursor-not-allowed hover:bg-transparent' 
                    : currentView === item.id 
                      ? 'bg-cyan-950/40 text-cyan-400 border border-cyan-900/50' 
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50 border border-transparent'
                }
              `}
              title={item.tooltip}
            >
              <item.icon className="w-5 h-5 shrink-0" />
              <span className="text-xs font-semibold tracking-wide hidden md:block">{item.label}</span>
              {!item.active && (
                <span className="hidden md:block ml-auto text-[9px] uppercase tracking-wider font-bold text-slate-500 bg-slate-900 px-1.5 py-0.5 rounded">Soon</span>
              )}
            </button>
          ))}
        </nav>
      </div>

      <div className="p-4 md:p-6 text-[10px] text-slate-600 font-mono tracking-wider text-center md:text-left">
        <div className="hidden md:block">v1.1.0-alpha</div>
        <div className="hidden md:block">LOCAL_EVAL</div>
      </div>
    </div>
  );
};
