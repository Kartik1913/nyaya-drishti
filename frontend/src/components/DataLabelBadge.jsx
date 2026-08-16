import React from 'react';

const DataLabelBadge = ({ type = 'SYNTHETIC', source = null, className = '' }) => {
  if (type === 'REAL_AGGREGATE' || source) {
    const label = source ? `Source: ${source}` : 'REAL AGGREGATE';
    return (
      <span className={`inline-flex items-center gap-1 font-mono text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 tracking-wider uppercase shadow-sm ${className}`}>
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
        [{label}]
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1 font-mono text-[10px] font-semibold px-2 py-0.5 rounded bg-sky-950/80 text-sky-300 border border-sky-500/40 tracking-wider uppercase shadow-sm ${className}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-sky-400"></span>
      [SYNTHETIC]
    </span>
  );
};

export default DataLabelBadge;
