/**
 * ApiKeyStatusWidget Component
 * Top Left Widget displaying API Key Status (Satellite Data) with key indicators.
 */
import React from 'react';
import { KeyRound, ShieldAlert, CheckCircle2, Ban } from 'lucide-react';

export const ApiKeyStatusWidget = ({ apiKeys }) => {
  return (
    <div className="bg-[#0e1424] border border-slate-800/80 rounded-2xl p-4 shadow-xl select-none">
      <h3 className="text-xs font-bold text-slate-200 mb-3 flex items-center justify-between">
        <span className="flex items-center gap-2">
          <KeyRound className="w-4 h-4 text-cyan-400" />
          API Key Status (Satellite Data)
        </span>
      </h3>

      <div className="grid grid-cols-4 gap-3 text-center">
        {apiKeys.map((item, idx) => {
          const keyNumber = idx + 1;
          const isActive = item.status === 'active';
          const isWarning = item.status === 'warning';
          
          return (
            <div 
              key={item.id} 
              className="bg-slate-900/80 border border-slate-800/80 rounded-xl p-2.5 flex flex-col items-center justify-center space-y-1.5"
            >
              <span className="text-[10px] font-medium text-slate-400">
                Key #{keyNumber}
              </span>

              {isActive ? (
                <div className="p-1.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <KeyRound className="w-4 h-4" />
                </div>
              ) : isWarning ? (
                <div className="p-1.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">
                  <ShieldAlert className="w-4 h-4 text-rose-400" />
                </div>
              ) : (
                <div className="p-1.5 rounded-full bg-slate-800 text-slate-500 border border-slate-700">
                  <Ban className="w-4 h-4 text-rose-500" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
