import React from 'react';

export function MissionControlLayout({ children }) {
  return (
    <div className="climalenz-design flex-1 h-full w-full relative overflow-hidden" style={{ backgroundColor: 'var(--ink)', color: 'var(--text)' }}>
      {children}
    </div>
  );
}
