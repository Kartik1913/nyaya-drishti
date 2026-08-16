import React from 'react';

const ScoreBadge = ({ score, size = 'md', showLabel = false }) => {
  const numericScore = typeof score === 'number' ? score : parseFloat(score) || 0;
  
  let colorClass = 'bg-slate-800 text-slate-300 border-slate-700';
  let tierLabel = 'Low';

  if (numericScore >= 80) {
    colorClass = 'bg-rose-950/80 text-rose-300 border-rose-500/50 shadow-rose-950/50 shadow-sm';
    tierLabel = 'Critical Review';
  } else if (numericScore >= 50) {
    colorClass = 'bg-amber-950/80 text-amber-300 border-amber-500/50 shadow-amber-950/50 shadow-sm';
    tierLabel = 'Medium Priority';
  } else {
    colorClass = 'bg-emerald-950/70 text-emerald-300 border-emerald-500/40 shadow-emerald-950/30 shadow-sm';
    tierLabel = 'Normal Progression';
  }

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 font-semibold',
    md: 'text-sm px-2.5 py-1 font-bold',
    lg: 'text-2xl px-4 py-2 font-black tracking-tight',
  };

  return (
    <div className="inline-flex items-center gap-1.5">
      <span className={`inline-flex items-center justify-center font-mono rounded-md border ${colorClass} ${sizeClasses[size] || sizeClasses.md}`}>
        {numericScore.toFixed(1)}
      </span>
      {showLabel && (
        <span className="text-xs font-medium text-slate-400">
          ({tierLabel})
        </span>
      )}
    </div>
  );
};

export default ScoreBadge;
