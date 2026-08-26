import React from 'react';

/**
 * Score badge, colored by the same three-tier brand logic as BottleneckTag:
 * error red (critical), gold (medium), teal (normal) — replacing the previous
 * raw rose/amber/emerald that didn't belong to the site's palette.
 */
const ScoreBadge = ({ score, size = 'md', showLabel = false }) => {
  const numericScore = typeof score === 'number' ? score : parseFloat(score) || 0;

  let colorClass = 'bg-teal/10 text-teal-dark border-teal/25';
  let tierLabel = 'Normal Progression';

  if (numericScore >= 80) {
    colorClass = 'bg-error/10 text-error border-error/30 shadow-error/10 shadow-sm';
    tierLabel = 'Critical Review';
  } else if (numericScore >= 50) {
    colorClass = 'bg-gold/15 text-gold-dark border-gold/35 shadow-sm';
    tierLabel = 'Medium Priority';
  }

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 font-semibold',
    md: 'text-sm px-2.5 py-1 font-bold',
    lg: 'text-2xl px-4 py-2 font-black tracking-tight',
  };

  return (
    <div className="inline-flex items-center gap-1.5">
      <span className={`inline-flex items-center justify-center font-evidence tabular-nums rounded-md border ${colorClass} ${sizeClasses[size] || sizeClasses.md}`}>
        {numericScore.toFixed(1)}
      </span>
      {showLabel && (
        <span className="text-xs font-medium text-on-surface-variant">
          ({tierLabel})
        </span>
      )}
    </div>
  );
};

export default ScoreBadge;
