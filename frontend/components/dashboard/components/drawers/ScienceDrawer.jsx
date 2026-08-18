import React, { useState } from 'react';
import { ChevronUp, ChevronDown, CheckCircle2, ShieldCheck, AlertTriangle } from 'lucide-react';
import { ReporterNarrative } from './ReporterNarrative';
import { CriticAuditStamp } from './CriticAuditStamp';
import { CaveatList } from './CaveatList';
import { formatExecutionTruth } from '../../../../lib/sciencePresentation';

export function ScienceDrawer({ missionControl }) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const report = missionControl?.report;

  if (!report) {
    return null;
  }

  const handleToggle = () => setIsExpanded(!isExpanded);
  
  const truth = formatExecutionTruth(report);
  
  const criticData = report.critic_audit;
  const hasCriticPassed = criticData?.verdict && (criticData.verdict.toUpperCase() === 'PASS' || criticData.verdict.toUpperCase() === 'PASSED');

  const hasAIInterpretation = !!report.reporter_narrative;

  return (
    <div className={`absolute bottom-0 left-0 w-full z-50 pointer-events-none flex flex-col items-center transition-all duration-300 ${isExpanded ? 'p-0 md:p-6' : 'p-4 md:p-6 pb-6'}`}>
      <div 
        className={`pointer-events-auto overflow-hidden transition-all duration-300 ease-in-out w-full max-w-5xl backdrop-blur-xl ${isExpanded ? 'rounded-t-2xl md:rounded-2xl border-b-0 md:border-b' : 'rounded-2xl'}`}
        style={{
          backgroundColor: 'rgba(6, 9, 17, 0.85)',
          border: '1px solid rgba(255,255,255,0.1)',
          boxShadow: '0 -10px 40px rgba(0,0,0,0.5)',
          height: isExpanded ? 'min(600px, 75vh)' : '48px',
        }}
      >
        {/* Header */}
        <button 
          onClick={handleToggle}
          className="w-full h-[48px] px-5 flex items-center justify-between transition-colors cursor-pointer hover:bg-white/5 border-b"
          style={{ borderColor: isExpanded ? 'rgba(255,255,255,0.1)' : 'transparent', backgroundColor: 'transparent' }}
        >
          <div className="flex items-center gap-3">
            <span 
              className="w-2 h-2 rounded-full animate-pulse bg-cyan-400" 
              style={{ boxShadow: '0 0 10px rgba(34,211,238,0.6)' }} 
            />
            <span className="font-mono text-xs font-bold tracking-widest text-slate-200">
              SCIENCE & INTELLIGENCE
            </span>
          </div>
          
          <div className="flex items-center gap-4">
            {!isExpanded && criticData && (
              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                hasCriticPassed 
                  ? 'bg-emerald-900/20 text-emerald-400 border-emerald-500/30' 
                  : 'bg-amber-900/20 text-amber-400 border-amber-500/30'
              }`}>
                {hasCriticPassed ? '✓ VERIFIED' : '⚠ FLAGGED'}
              </span>
            )}
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronUp className="w-4 h-4 text-slate-400" />
            )}
          </div>
        </button>

        {/* Expanded Content */}
        <div 
          className="p-6 overflow-y-auto custom-scrollbar flex flex-col gap-8"
          style={{ height: 'calc(100% - 48px)' }}
        >
          {truth.severity === 'error' && (
            <div className="p-3 rounded-xl text-xs font-mono font-bold border bg-rose-900/20 border-rose-500/30 text-rose-400 shadow-md">
              WARNING: {truth.description}
            </div>
          )}
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8 flex flex-col gap-6">
              
              {/* AI INTERPRETATION */}
              <div className="flex flex-col gap-3">
                <h3 className="font-mono text-[10px] font-bold tracking-widest text-slate-500 border-b border-slate-800 pb-2">
                  AI INTERPRETATION
                </h3>
                
                {hasAIInterpretation ? (
                  <ReporterNarrative 
                    reporterData={report.reporter_narrative} 
                    isCached={truth.mode === 'CACHED'} 
                    isSynthetic={truth.severity === 'error'}
                  />
                ) : (
                  <div className="flex items-center gap-3 p-4 rounded-xl border bg-slate-900/40 border-slate-700/50 text-slate-400 text-xs font-mono">
                    <AlertTriangle className="w-5 h-5 text-slate-500" />
                    <span>AI INTERPRETATION UNAVAILABLE (Quota Exhausted or Timeout)</span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="lg:col-span-4 flex flex-col gap-6">
              
              {/* CRITIC VERIFICATION */}
              <div className="flex flex-col gap-3">
                <h3 className="font-mono text-[10px] font-bold tracking-widest text-slate-500 border-b border-slate-800 pb-2">
                  CRITIC VERIFICATION
                </h3>
                {criticData ? (
                  <CriticAuditStamp criticData={criticData} />
                ) : (
                  <div className="text-xs font-mono text-slate-500 italic">
                    VERIFICATION UNAVAILABLE
                  </div>
                )}
              </div>

              {/* LIMITATIONS / CAVEATS / TIMINGS */}
              <CaveatList report={report} />

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
