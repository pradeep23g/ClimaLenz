/**
 * LoadingSkeleton Component
 * Animated skeleton placeholder for map and data charts loading state.
 */
import React from 'react';
import { Loader2, Globe, Radio } from 'lucide-react';

export const LoadingSkeleton = ({ isDarkMode }) => {
  return (
    <div className={`p-6 rounded-2xl border space-y-4 animate-pulse ${
      isDarkMode ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'
    }`}>
      <div className="flex items-center gap-3">
        <Loader2 className="w-5 h-5 text-rose-500 animate-spin" />
        <div className="space-y-1">
          <div className="h-4 w-48 bg-slate-700/50 rounded" />
          <div className="h-3 w-64 bg-slate-800/50 rounded" />
        </div>
      </div>
      <div className="h-64 w-full bg-slate-800/40 rounded-xl" />
    </div>
  );
};

export const ApiStatusBanner = ({ apiSources, isDarkMode }) => {
  return (
    <div className={`px-4 py-2 rounded-xl border text-xs flex flex-wrap items-center justify-between gap-3 ${
      isDarkMode ? 'bg-slate-900/80 border-slate-800 text-slate-300' : 'bg-white border-slate-200 text-slate-700'
    }`}>
      <div className="flex items-center gap-2">
        <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
        <span className="font-bold">Active Satellite Data Streams:</span>
      </div>

      <div className="flex items-center gap-3 font-mono text-[11px]">
        <span className="text-rose-400">📡 {apiSources.nasa}</span>
        <span className="text-cyan-400">🛰️ {apiSources.stac}</span>
        <span className="text-emerald-400">☀️ {apiSources.weather}</span>
        <span className="text-amber-400 hidden sm:inline">🇮🇳 {apiSources.isro}</span>
      </div>
    </div>
  );
};
