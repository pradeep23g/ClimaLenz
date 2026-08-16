import React from 'react';
import { AlertTriangle, ArrowUpRight, Droplet, Flame, Gauge, Network, ShieldCheck, ThermometerSun, Trees, Waves } from 'lucide-react';
import { MapLibreView } from '../MapLibreView';

const MetricCard = ({ icon: Icon, label, value, detail, tone, onClick }) => (
  <button type="button" onClick={onClick} className={`min-w-0 rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-left shadow-xl transition hover:-translate-y-0.5 ${onClick ? `cursor-pointer ${tone.hover}` : ''}`}>
    <div className="mb-3 flex items-start justify-between gap-3"><span className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">{label}</span><Icon className={`h-4 w-4 ${tone.text}`} /></div>
    <div className={`font-mono text-2xl font-black ${tone.text}`}>{value}</div>
    <p className="mt-1 text-xs leading-relaxed text-slate-400">{detail}</p>
  </button>
);

export const OverviewDashboard = ({ currentCity, onLocationChange, setActiveEngine, activeZone, onSelectZone, livePredictions, pipelineStatus, selectedSatellite, colocationResult, colocationState }) => {
  const heat = currentCity.heatEngine;
  const continuity = currentCity.continuityEngine;
  const primaryZone = currentCity.zones?.find((zone) => zone.severity?.includes('Critical')) || currentCity.zones?.[0];
  const criticalWarnings = pipelineStatus?.activeEngineStreams?.filter(
    (stream) => stream.status?.toLowerCase().includes('critical'),
  ).length || 2;
  const riskScore = Math.round((continuity.continuityScore + livePredictions.catchmentLevel) / 2);
  const trend = continuity.historicalTrend || [];
  const trendDelta = trend.length > 1 ? Math.round((trend.at(-1).stability - trend[0].stability) * 100) : 0;

  const displayRiskScore = colocationResult?.water_score ?? riskScore;
  const displayRiskDetail = colocationResult?.water_tier ?? (riskScore >= 75 ? 'Stable operating posture' : 'Elevated environmental pressure');
  const displayHeatDeltaText = colocationResult?.heat_delta_summary ?? `${primaryZone?.name || 'Commercial zone'} LST delta`;

  return (
    <section className="flex-1 overflow-y-auto bg-slate-950 p-4 text-slate-100 lg:p-5">
      <div className="mx-auto max-w-[1800px] space-y-4">
        <header className="flex flex-wrap items-end justify-between gap-3">
          <div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-400">Climalenz intelligence command</p><h1 className="mt-1 text-2xl font-black tracking-tight">Dashboard Overview</h1><p className="mt-1 text-xs text-slate-400">Executive environmental posture for {currentCity.name}, {currentCity.country}</p></div>
          <div className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-300"><span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" /> Orbital telemetry synchronized</div>
        </header>

        <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-4">
          <MetricCard icon={Gauge} label="Composite environmental risk" value={`${displayRiskScore}/100`} detail={displayRiskDetail} tone={{ text: 'text-emerald-400', hover: 'hover:border-emerald-400/60' }} />
          <MetricCard icon={ThermometerSun} label="Primary active anomaly" value={`+${heat.uhiDelta}°C`} detail={displayHeatDeltaText} tone={{ text: 'text-rose-400', hover: 'hover:border-rose-400/60' }} onClick={() => setActiveEngine('heat')} />
          <MetricCard icon={Network} label="Pipeline operational health" value="98.6%" detail="All ingestion and inference services nominal" tone={{ text: 'text-cyan-400', hover: 'hover:border-cyan-400/60' }} onClick={() => setActiveEngine('bridge')} />
          <MetricCard icon={AlertTriangle} label="Active AI agent warnings" value={`${criticalWarnings} Critical`} detail="Telemetry flags require analyst attention" tone={{ text: 'text-amber-400', hover: 'hover:border-amber-400/60' }} onClick={() => setActiveEngine('agents')} />
        </div>

        <div className="h-[min(58vh,650px)] min-h-[460px]">
          <MapLibreView city={currentCity} onLocationChange={onLocationChange} activeEngine="overview" activeZone={activeZone} onSelectZone={onSelectZone} livePredictions={livePredictions} satelliteFeedNotice={selectedSatellite} showLayerControls />
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <button type="button" onClick={() => setActiveEngine('water')} className="group rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-left shadow-xl transition hover:border-cyan-400/50"><div className="flex items-center justify-between"><span className="flex items-center gap-2 text-sm font-bold"><Droplet className="h-4 w-4 text-cyan-400" /> Water engine</span><ArrowUpRight className="h-4 w-4 text-slate-500 transition group-hover:text-cyan-400" /></div><div className="mt-4 grid grid-cols-2 gap-3"><div><p className="text-[10px] uppercase tracking-wider text-slate-500">Soil moisture</p><p className="mt-1 font-mono text-xl font-black text-cyan-300">{livePredictions.soilMoisture}%</p></div><div><p className="text-[10px] uppercase tracking-wider text-slate-500">Catchment level</p><p className="mt-1 font-mono text-xl font-black text-cyan-300">{livePredictions.catchmentLevel}%</p></div></div><p className="mt-4 flex items-center gap-1 text-xs font-semibold text-amber-300"><Waves className="h-3.5 w-3.5" /> Active water deficit: {primaryZone?.name || 'Review catchment area'}</p></button>
          <button type="button" onClick={() => setActiveEngine('heat')} className="group rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-left shadow-xl transition hover:border-rose-400/50"><div className="flex items-center justify-between"><span className="flex items-center gap-2 text-sm font-bold"><Flame className="h-4 w-4 text-rose-400" /> Heat engine</span><ArrowUpRight className="h-4 w-4 text-slate-500 transition group-hover:text-rose-400" /></div><div className="mt-4 grid grid-cols-2 gap-3"><div><p className="text-[10px] uppercase tracking-wider text-slate-500">LST surface temp</p><p className="mt-1 font-mono text-xl font-black text-rose-300">{heat.lstAvg}°C</p></div><div><p className="text-[10px] uppercase tracking-wider text-slate-500">UHI delta</p><p className="mt-1 font-mono text-xl font-black text-rose-300">+{heat.uhiDelta}°C</p></div></div><div className="mt-4 flex h-8 items-end gap-1" aria-label="Diurnal surface-temperature curve">{heat.diurnalTrend?.map((point) => <span key={point.hour} className="flex-1 rounded-t bg-rose-400/70" style={{ height: `${Math.max(18, (point.urban / 46) * 100)}%` }} title={`${point.hour}: ${point.urban}°C`} />)}</div></button>
          <button type="button" onClick={() => setActiveEngine('continuity')} className="group rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-left shadow-xl transition hover:border-emerald-400/50"><div className="flex items-center justify-between"><span className="flex items-center gap-2 text-sm font-bold"><Trees className="h-4 w-4 text-emerald-400" /> Continuity engine</span><ArrowUpRight className="h-4 w-4 text-slate-500 transition group-hover:text-emerald-400" /></div><div className="mt-4 grid grid-cols-2 gap-3"><div><p className="text-[10px] uppercase tracking-wider text-slate-500">Ecological stability</p><p className="mt-1 font-mono text-xl font-black text-emerald-300">{continuity.stabilityIndex.toFixed(2)} ESI</p></div><div><p className="text-[10px] uppercase tracking-wider text-slate-500">10-year trend</p><p className={`mt-1 font-mono text-xl font-black ${trendDelta >= 0 ? 'text-emerald-300' : 'text-amber-300'}`}>{trendDelta >= 0 ? '+' : ''}{trendDelta} pts</p></div></div><p className="mt-4 flex items-center gap-1 text-xs font-semibold text-emerald-300"><ShieldCheck className="h-3.5 w-3.5" /> Risk projection: {continuity.riskProjection}</p></button>
        </div>
      </div>
    </section>
  );
};
