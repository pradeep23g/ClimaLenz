import React from 'react';
import ProvenanceBadge from './ProvenanceBadge';
import { Droplet, Thermometer, ShieldCheck, AlertCircle } from 'lucide-react';
import { formatExecutionTruth, formatHeatDelta, formatWaterScore } from '../../../../lib/sciencePresentation';

export default function ExecutiveHUD({ missionControl }) {
  const { report, status } = missionControl || {};

  if (status !== 'SUCCESS' || !report) {
    return null;
  }

  const {
    water_score,
    heat_delta_summary,
    heat_guardrail_status
  } = report;

  const truth = formatExecutionTruth(report);
  const formattedWater = formatWaterScore(water_score);
  const formattedHeat = formatHeatDelta(heat_delta_summary);

  const isGuardrailPass = heat_guardrail_status === 'PASS' || heat_guardrail_status === 'OK';

  return (
    <div className="absolute inset-0 z-40 pointer-events-none overflow-hidden">
      <div className="absolute top-[220px] md:top-24 right-4 left-4 md:left-auto md:right-6 pointer-events-auto w-auto md:w-[340px] rounded-2xl p-4 md:p-5 space-y-5 transition-all duration-300"
        style={{
          backgroundColor: 'rgba(6, 9, 17, 0.75)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: '1px solid rgba(255,255,255,0.1)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)'
        }}
      >
      {/* HUD Header */}
      <div className="flex flex-col gap-1 border-b pb-3" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
        <h2 className="text-lg md:text-xl font-bold tracking-tight uppercase text-white shadow-sm flex items-center gap-2">
          Decision HUD
        </h2>
        <p className="font-mono text-[9px] md:text-[10px] tracking-widest uppercase text-slate-400">
          Executive Summary
        </p>
      </div>

      {/* TRUST / PROVENANCE */}
      <div className="flex flex-col gap-2">
        <span className="font-mono text-[10px] font-semibold tracking-widest text-slate-500 uppercase">Trust / Provenance</span>
        <ProvenanceBadge truth={truth} />
      </div>

      <div className="space-y-4">
        {/* WHAT / IMPACT */}
        <div className="flex flex-col gap-2">
          <span className="font-mono text-[10px] font-semibold tracking-widest text-slate-500 uppercase">What / Impact</span>
          
          <div className="flex items-center justify-between p-3 rounded-xl transition-colors bg-slate-900/40 border border-slate-800/50 hover:bg-slate-800/60">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-cyan-900/30">
                <Droplet className="w-4 h-4 text-cyan-400" />
              </div>
              <span className="font-mono text-xs font-semibold tracking-wide text-slate-300">Water Score</span>
            </div>
            <span className="text-lg font-bold tracking-tight text-white">
              {formattedWater}
            </span>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl transition-colors bg-slate-900/40 border border-slate-800/50 hover:bg-slate-800/60">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-900/30">
                <Thermometer className="w-4 h-4 text-amber-400" />
              </div>
              <span className="font-mono text-xs font-semibold tracking-wide text-slate-300">Heat Delta</span>
            </div>
            <span className="text-lg font-bold tracking-tight text-white">
              {formattedHeat}
            </span>
          </div>
        </div>

        {/* RISK / SAFETY */}
        <div className="flex flex-col gap-2 pt-1">
          <span className="font-mono text-[10px] font-semibold tracking-widest text-slate-500 uppercase">Risk / Guardrail</span>
          
          <div className="flex items-center justify-between p-3 rounded-xl transition-colors bg-slate-900/40 border border-slate-800/50 hover:bg-slate-800/60">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${isGuardrailPass ? 'bg-emerald-900/30' : 'bg-rose-900/30'}`}>
                {isGuardrailPass ? (
                  <ShieldCheck className={`w-4 h-4 ${isGuardrailPass ? 'text-emerald-400' : 'text-rose-400'}`} />
                ) : (
                  <AlertCircle className={`w-4 h-4 ${isGuardrailPass ? 'text-emerald-400' : 'text-rose-400'}`} />
                )}
              </div>
              <span className="font-mono text-xs font-semibold tracking-wide text-slate-300">Status</span>
            </div>
            <span className={`text-xs font-bold font-mono px-2.5 py-1 rounded-md uppercase tracking-wider border ${
              isGuardrailPass 
                ? 'bg-emerald-900/20 text-emerald-400 border-emerald-500/30' 
                : 'bg-rose-900/20 text-rose-400 border-rose-500/30'
            }`}>
              {heat_guardrail_status === null || heat_guardrail_status === undefined ? 'UNAVAILABLE' : heat_guardrail_status}
            </span>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
}

