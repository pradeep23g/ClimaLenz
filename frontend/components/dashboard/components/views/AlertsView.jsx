/**
 * AlertsView Component
 * Climate Anomaly & Threshold Alert System.
 */
import React from 'react';
import { Bell, ShieldAlert, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';

export const AlertsView = ({ currentCity }) => {
  const alerts = [
    {
      id: 1,
      title: 'High Evapotranspiration Deficit Alert',
      engine: 'Water Engine',
      severity: 'High',
      time: '12 minutes ago',
      desc: `Soil moisture levels dropping below 25% threshold in central ${currentCity.name} urban zone.`
    },
    {
      id: 2,
      title: 'Land Surface Temp (LST) Hotspot Detected',
      engine: 'Heat Engine',
      severity: 'Critical',
      time: '34 minutes ago',
      desc: `Thermal anomaly registered at +5.4°C above regional baseline.`
    },
    {
      id: 3,
      title: 'Ecological Canopy Fragmentation',
      engine: 'Continuity Engine',
      severity: 'Medium',
      time: '2 hours ago',
      desc: 'Canopy continuity dropped 4% along urban expansion boundary.'
    },
    {
      id: 4,
      title: 'Sentinel-2 Satellite Pass Completed',
      engine: 'Bridge Layer',
      severity: 'Info',
      time: '4 hours ago',
      desc: 'Orbital feed successfully ingested and updated in formula processor.'
    },
    {
      id: 5,
      title: 'Automated Insight Synthesis Ready',
      engine: 'Agents Layer',
      severity: 'Info',
      time: '5 hours ago',
      desc: 'AI copilot completed the latest climate intelligence synthesis.'
    }
  ];

  return (
    <div className="flex-1 p-4 space-y-4 overflow-y-auto bg-[#0b0f19] text-slate-100">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-black tracking-tight flex items-center gap-2">
          <Bell className="w-5 h-5 text-rose-400" />
          Climate Alerts & Anomaly Feed
        </h1>
        <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30">
          5 Active System Alerts
        </span>
      </div>

      <div className="space-y-3 max-w-4xl">
        {alerts.map((alert) => (
          <div 
            key={alert.id} 
            className="bg-[#0e1424] border border-slate-800 rounded-2xl p-4 flex items-start gap-4 hover:border-slate-700 transition-all"
          >
            <div className={`p-2.5 rounded-xl shrink-0 ${
              alert.severity === 'Critical' ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20' :
              alert.severity === 'High' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
              alert.severity === 'Medium' ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' :
              'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
            }`}>
              <AlertTriangle className="w-5 h-5" />
            </div>

            <div className="flex-1 space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm text-slate-200">{alert.title}</h3>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800">
                    {alert.engine}
                  </span>
                </div>
                <span className="text-[10px] text-slate-500 flex items-center gap-1 font-mono">
                  <Clock className="w-3 h-3" /> {alert.time}
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                {alert.desc}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
