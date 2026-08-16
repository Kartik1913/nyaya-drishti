import React from 'react';

const BOTTLENECK_MAP = {
  SUMMONS_DELAY: {
    label: 'Summons Delay',
    classes: 'bg-purple-950/70 text-purple-300 border-purple-500/40',
    dot: 'bg-purple-400',
  },
  WITNESS_DELAY: {
    label: 'Witness Delay',
    classes: 'bg-orange-950/70 text-orange-300 border-orange-500/40',
    dot: 'bg-orange-400',
  },
  REPEATED_ADJOURNMENT: {
    label: 'Repeated Adjournment',
    classes: 'bg-rose-950/70 text-rose-300 border-rose-500/40',
    dot: 'bg-rose-400',
  },
  JUDGE_CHANGE: {
    label: 'Bench Change',
    classes: 'bg-cyan-950/70 text-cyan-300 border-cyan-500/40',
    dot: 'bg-cyan-400',
  },
  PROCEDURAL_INACTIVITY: {
    label: 'Procedural Inactivity',
    classes: 'bg-amber-950/70 text-amber-300 border-amber-500/40',
    dot: 'bg-amber-400',
  },
  UNKNOWN: {
    label: 'Normal Progression',
    classes: 'bg-slate-800/80 text-slate-300 border-slate-700',
    dot: 'bg-emerald-400',
  },
};

const BottleneckTag = ({ type, size = 'sm', className = '' }) => {
  const meta = BOTTLENECK_MAP[type] || BOTTLENECK_MAP.UNKNOWN;
  
  const sizeClass = size === 'lg' 
    ? 'text-sm px-3 py-1.5 font-semibold' 
    : 'text-xs px-2.5 py-0.5 font-medium';

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border ${meta.classes} ${sizeClass} ${className}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`}></span>
      {meta.label}
    </span>
  );
};

export default BottleneckTag;
