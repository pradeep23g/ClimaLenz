import React from 'react';
import { ShieldCheck, AlertTriangle } from 'lucide-react';

export function CriticAuditStamp({ criticData }) {
  if (!criticData || !criticData.verdict) return null;

  const verdict = criticData.verdict.toUpperCase();
  const isPassed = verdict === 'PASS' || verdict === 'PASSED';
  
  const colorToken = isPassed ? 'var(--good)' : 'var(--gold)';
  const bgColor = isPassed ? 'rgba(52, 211, 155, 0.1)' : 'rgba(216, 176, 106, 0.1)';
  const borderColor = isPassed ? 'rgba(52, 211, 155, 0.3)' : 'rgba(216, 176, 106, 0.3)';

  return (
    <div className="flex flex-col gap-3">
      <h3 className="font-mono text-[10px] tracking-widest border-b pb-1" style={{ borderColor: 'var(--line)', color: 'var(--text-3)' }}>AI AUDIT / CRITIC</h3>
      
      <div 
        className="flex items-start gap-3 p-3 rounded-md border"
        style={{ backgroundColor: bgColor, borderColor: borderColor }}
      >
        {isPassed ? (
          <ShieldCheck className="w-5 h-5 shrink-0 mt-0.5" style={{ color: colorToken }} />
        ) : (
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" style={{ color: colorToken }} />
        )}
        
        <div className="flex flex-col gap-1">
          <span className="font-mono text-xs font-bold" style={{ color: colorToken }}>
            CRITIC VERIFIED: {isPassed ? 'PASSED' : 'FLAGGED'}
          </span>
          {criticData.summary && (
            <p className="text-[11px] leading-snug" style={{ color: 'rgba(255,255,255,0.7)' }}>
              {criticData.summary}
            </p>
          )}
        </div>
      </div>

      {!isPassed && criticData.unsupported_claims && criticData.unsupported_claims.length > 0 && (
        <div className="flex flex-col gap-1.5 mt-1">
          <span className="font-mono text-[9px]" style={{ color: 'var(--text-3)' }}>UNSUPPORTED CLAIMS:</span>
          {criticData.unsupported_claims.map((claim, idx) => (
            <div key={idx} className="border p-2 rounded text-[10px]" style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderColor: 'var(--line-2)', color: 'var(--text-2)' }}>
              <span className="font-mono mr-1" style={{ color: 'var(--gold)' }}>[{claim.severity}]</span>
              {claim.claim_text}: {claim.reason}
            </div>
          ))}
        </div>
      )}
      
      {!isPassed && criticData.llm_audit_notes && (
        <div className="text-[10px] italic" style={{ color: 'var(--text-3)' }}>
          {criticData.llm_audit_notes}
        </div>
      )}
    </div>
  );
}
