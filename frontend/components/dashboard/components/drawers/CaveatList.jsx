import React from 'react';

export function CaveatList({ report }) {
  const hasCaveats = report.caveats && report.caveats.length > 0;
  const hasProvenance = report.provenance && report.provenance !== 'live';
  const hasStageTimings = report.stage_timings && Object.keys(report.stage_timings).length > 0;

  if (!hasCaveats && !hasProvenance && !hasStageTimings && report.scene_confidence === undefined) return null;

  return (
    <div className="flex flex-col gap-2 mt-2 pt-4 border-t" style={{ borderColor: 'var(--line)' }}>
      <h3 className="font-mono text-[10px] tracking-widest mb-1" style={{ color: 'var(--text-3)' }}>TRUST / CONTEXT</h3>
      
      {hasProvenance && (
        <div className="flex items-center justify-between text-xs font-mono">
          <span style={{ color: 'var(--text-3)' }}>PROVENANCE:</span>
          <span style={{ color: 'var(--text-2)' }}>{report.provenance.toUpperCase()}</span>
        </div>
      )}
      
      <div className="flex items-center justify-between text-xs font-mono">
        <span style={{ color: 'var(--text-3)' }}>SCENE CONFIDENCE:</span>
        <span style={{ color: 'var(--text-2)' }}>
          {(report.scene_confidence === null || report.scene_confidence === undefined || isNaN(report.scene_confidence))
            ? 'UNAVAILABLE' 
            : `${(report.scene_confidence * 100).toFixed(1)}%`}
        </span>
      </div>

      {hasCaveats && (
        <div className="mt-2">
          <span className="font-mono text-[9px]" style={{ color: 'var(--text-3)' }}>CAVEATS:</span>
          <ul className="list-disc pl-4 mt-1 space-y-1">
            {report.caveats.map((cav, idx) => (
              <li key={idx} className="text-[10px]" style={{ color: 'var(--text-2)' }}>
                {cav}
              </li>
            ))}
          </ul>
        </div>
      )}

      {hasStageTimings && (
        <div className="mt-2">
          <span className="font-mono text-[9px]" style={{ color: 'var(--text-3)' }}>STAGE TIMINGS (MS):</span>
          <div className="flex flex-col gap-1 mt-1">
            {Object.entries(report.stage_timings).map(([stage, timeMs]) => (
              <div key={stage} className="flex justify-between text-[10px] font-mono border-b pb-0.5" style={{ borderColor: 'var(--line-2)', color: 'var(--text-2)' }}>
                <span>{stage}</span>
                <span style={{ color: 'var(--text)' }}>{typeof timeMs === 'number' ? timeMs.toFixed(1) : timeMs} ms</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
