/**
 * FormulaProcessorWidget Component
 * Visual node flow diagram matching AquaLens AI design.
 * Displays inputs, math formula node, and calculated output state.
 */
import React from 'react';
import { Cpu, ArrowRight } from 'lucide-react';

export const FormulaProcessorWidget = ({ formulaText = 'Q = P - E - ΔS', activeEngine = 'water' }) => {
  return (
    <div className="bg-[#0e1424] border border-slate-800/80 rounded-2xl p-4 shadow-xl select-none flex flex-col justify-between">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-bold text-slate-200 flex items-center gap-2">
          <Cpu className="w-4 h-4 text-cyan-400" />
          Formula Processor
        </h3>
        <div className="flex items-center gap-2 text-[10px] font-semibold">
          <span className="flex items-center gap-1 text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Status
          </span>
          <span className="flex items-center gap-1 text-slate-400">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
            Logic
          </span>
        </div>
      </div>

      {/* Visual Node Flow Diagram */}
      <div className="flex items-center justify-between gap-2 bg-slate-950/80 p-3 rounded-xl border border-slate-800/80 my-auto">
        
        {/* Left Inputs Column */}
        <div className="flex flex-col space-y-1.5">
          <span className="text-[10px] font-bold text-slate-400 uppercase text-center mb-0.5">Inputs</span>
          {['Input 1', 'Input 2', 'Input 3', 'Input 4'].map((inp, idx) => (
            <div 
              key={idx}
              className="px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-[10px] font-mono text-slate-300 text-center shadow-inner"
            >
              {inp}
            </div>
          ))}
        </div>

        {/* Arrow to Formula Node */}
        <div className="flex flex-col items-center text-cyan-400">
          <ArrowRight className="w-4 h-4 animate-pulse" />
        </div>

        {/* Formula Node Box */}
        <div className="bg-gradient-to-br from-cyan-950/80 to-slate-900 border border-cyan-500/40 rounded-xl p-3 text-center flex-1 mx-1 shadow-lg shadow-cyan-500/5">
          <div className="text-xs font-extrabold text-cyan-300 font-mono tracking-tight mb-1">
            {formulaText}
          </div>
          <div className="text-[9px] text-slate-400 font-medium">
            Formula - logic
          </div>
        </div>

        {/* Arrow to Output Node */}
        <div className="flex flex-col items-center text-cyan-400">
          <ArrowRight className="w-4 h-4 animate-pulse" />
        </div>

        {/* Output Node Box */}
        <div className="flex flex-col space-y-1 items-center">
          <div className="px-3 py-2 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 text-xs font-bold text-center shadow-md">
            Output
          </div>
          <span className="text-[10px] text-emerald-400/90 font-medium flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            Load
          </span>
        </div>

      </div>

    </div>
  );
};
