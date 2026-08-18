import React from 'react';
import { Shield, Activity, Database, Zap, AlertTriangle } from 'lucide-react';

export default function ProvenanceBadge({ truth }) {
  if (!truth) return null;

  let bgColor = 'bg-slate-800/80';
  let textColor = 'text-slate-300';
  let borderColor = 'border-slate-600/50';
  let Icon = Database;

  if (truth.severity === 'success') {
    bgColor = 'bg-emerald-950/40';
    textColor = 'text-emerald-400';
    borderColor = 'border-emerald-500/30';
    Icon = Activity;
  } else if (truth.severity === 'info') {
    bgColor = 'bg-blue-950/40';
    textColor = 'text-blue-400';
    borderColor = 'border-blue-500/30';
    Icon = Database;
  } else if (truth.severity === 'warning') {
    bgColor = 'bg-amber-950/40';
    textColor = 'text-amber-400';
    borderColor = 'border-amber-500/30';
    Icon = AlertTriangle;
  } else if (truth.severity === 'error') {
    bgColor = 'bg-rose-950/40';
    textColor = 'text-rose-400';
    borderColor = 'border-rose-500/30';
    Icon = Zap;
  }

  return (
    <div className={`flex flex-col p-3 rounded-xl border backdrop-blur-md shadow-lg transition-all duration-300 ${bgColor} ${borderColor}`}>
      <div className="flex items-center gap-2 mb-1">
        <Icon className={`w-4 h-4 ${textColor} animate-pulse`} />
        <span className={`text-[11px] font-black tracking-widest uppercase ${textColor}`}>
          {truth.label}
        </span>
      </div>
      <div className="flex items-start gap-2 mt-1">
        <div className="w-4 flex justify-center mt-1">
          <div className="w-px h-full bg-slate-600/50 rounded" />
        </div>
        <div className="flex flex-col gap-1">
          <div className="text-[10px] uppercase tracking-wider text-slate-400 font-medium leading-tight">
            <span className="opacity-75">Prov:</span>{' '}
            <span className="text-slate-200">{truth.provenance}</span>
          </div>
          <div className="text-[9px] text-slate-500 leading-tight">
            {truth.description}
          </div>
        </div>
      </div>
    </div>
  );
}
