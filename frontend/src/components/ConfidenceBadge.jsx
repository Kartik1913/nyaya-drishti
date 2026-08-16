import React from 'react';
import { AlertTriangle, CheckCircle } from 'lucide-react';

const ConfidenceBadge = ({ confidence, className = '' }) => {
  const isHigh = confidence === 'HIGH';

  if (isHigh) {
    return (
      <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded font-medium bg-emerald-950/60 text-emerald-300 border border-emerald-500/30 ${className}`}>
        <CheckCircle className="w-3 h-3 text-emerald-400" />
        High Confidence
      </span>
    );
  }

  return (
    <span
      title="Cohort size n < 15 or cohort stats unavailable. Cohort age percentile is suppressed."
      className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded font-medium bg-amber-950/80 text-amber-300 border border-amber-500/40 cursor-help ${className}`}
    >
      <AlertTriangle className="w-3 h-3 text-amber-400" />
      Low Confidence (n &lt; 15)
    </span>
  );
};

export default ConfidenceBadge;
