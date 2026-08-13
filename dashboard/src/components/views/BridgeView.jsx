/**
 * BridgeView Component
 * Displays live satellite data pipeline health, active streams, latency telemetry, and system validation controls.
 * API key tables removed per user instructions.
 */
import React from 'react';
import { 
  Network, 
  Activity, 
  RefreshCw, 
  CheckCircle2, 
  Radio, 
  Database, 
  Zap, 
  ShieldCheck 
} from 'lucide-react';

export const BridgeView = ({
  pipelineStatus,
  onTriggerSync,
  isSyncing
}) => {
  return (
    <div className="flex-1 p-4 space-y-4 overflow-y-auto bg-[#060911] text-slate-100 select-none">
      
      {/* Title Bar */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-slate-100 tracking-tight flex items-center gap-2">
            <Network className="w-5 h-5 text-purple-400" />
            Bridge Layer Data Pipeline
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Bridging raw satellite telemetry passes directly into formula processors.
          </p>
        </div>

        <button
          onClick={onTriggerSync}
          disabled={isSyncing}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-500 hover:bg-purple-400 text-slate-950 font-bold text-xs shadow-lg shadow-purple-500/20 transition-all cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
          <span>{isSyncing ? 'Syncing Streams...' : 'Trigger Manual Pipeline Sync'}</span>
        </button>
      </div>

      {/* Pipeline Status Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        <div className="bg-[#0b0f19] border border-slate-800 rounded-2xl p-4 flex items-center gap-4 shadow-xl">
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[10px] text-slate-400 font-bold uppercase">Pipeline Operational Health</div>
            <div className="text-xl font-black text-emerald-400 font-mono mt-0.5">
              {pipelineStatus.health}
            </div>
          </div>
        </div>

        <div className="bg-[#0b0f19] border border-slate-800 rounded-2xl p-4 flex items-center gap-4 shadow-xl">
          <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[10px] text-slate-400 font-bold uppercase">Average Ingestion Latency</div>
            <div className="text-xl font-black text-purple-400 font-mono mt-0.5">
              {pipelineStatus.latency}
            </div>
          </div>
        </div>

        <div className="bg-[#0b0f19] border border-slate-800 rounded-2xl p-4 flex items-center gap-4 shadow-xl">
          <div className="p-3 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[10px] text-slate-400 font-bold uppercase">Last Pass Orbital Sync</div>
            <div className="text-xl font-black text-cyan-400 font-mono mt-0.5">
              {pipelineStatus.lastSync}
            </div>
          </div>
        </div>

      </div>

      {/* Active Stream Telemetry Table */}
      <div className="bg-[#0b0f19] border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        <h3 className="text-xs font-bold text-slate-200 flex items-center gap-2">
          <Radio className="w-4 h-4 text-purple-400" />
          Active Engine Telemetry Streams
        </h3>

        <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/60">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/80 text-[10px] text-slate-400 uppercase font-mono">
                <th className="py-2.5 px-4">Pipeline Stream</th>
                <th className="py-2.5 px-4">Status</th>
                <th className="py-2.5 px-4">Latency</th>
                <th className="py-2.5 px-4 text-right">Data Throughput</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-slate-300">
              {pipelineStatus.activeEngineStreams.map((stream, idx) => (
                <tr key={idx} className="hover:bg-slate-900/40">
                  <td className="py-3 px-4 font-bold text-slate-200 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
                    {stream.name}
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-emerald-400 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {stream.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-400">{stream.latency}</td>
                  <td className="py-3 px-4 text-right text-cyan-400 font-bold">{stream.throughput}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
