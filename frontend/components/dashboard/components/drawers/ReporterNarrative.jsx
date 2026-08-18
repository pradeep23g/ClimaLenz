import React from 'react';
import ReactMarkdown from 'react-markdown';

export function ReporterNarrative({ reporterData, isCached, isSynthetic }) {
  if (!reporterData) {
    return (
      <div className="flex flex-col gap-2">
        <h3 className="font-mono text-[10px] tracking-widest border-b pb-1" style={{ borderColor: 'var(--line)', color: 'var(--text-3)' }}>AI / REPORTER</h3>
        <div className="mt-2 p-3 rounded text-xs font-mono border" style={{ backgroundColor: 'rgba(255, 84, 104, 0.1)', borderColor: 'rgba(255, 84, 104, 0.3)', color: 'var(--over)' }}>
          AI REPORTER UNAVAILABLE
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between border-b pb-1" style={{ borderColor: 'var(--line)' }}>
        <h3 className="font-mono text-[10px] tracking-widest" style={{ color: 'var(--text-3)' }}>AI / REPORTER</h3>
        {isSynthetic ? (
          <span className="font-mono text-[9px]" style={{ color: 'var(--over)' }}>SYNTHETIC DATA WARNING</span>
        ) : isCached ? (
          <span className="font-mono text-[9px]" style={{ color: 'var(--gold)' }}>BASED ON CACHED OBSERVATION</span>
        ) : null}
      </div>
      
      <div className="text-sm leading-relaxed prose prose-invert max-w-none" style={{ color: 'var(--text)' }}>
        {typeof reporterData === 'string' ? (
          <ReactMarkdown>{reporterData}</ReactMarkdown>
        ) : (
          <ReactMarkdown>{reporterData.executive_summary || JSON.stringify(reporterData, null, 2)}</ReactMarkdown>
        )}
      </div>
    </div>
  );
}
