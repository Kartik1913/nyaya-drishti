import React from "react";
import Icon from "./Icon.jsx";

/**
 * Confidence badge — HIGH uses the brand teal (certain/trustworthy), LOW uses
 * gold (caution, not danger — a low-confidence score isn't wrong, it just
 * needs the reader to know the cohort was too small to be sure). Previously
 * used raw Tailwind emerald/amber unrelated to the palette, plus a different
 * icon library (lucide-react) than the rest of the app, so these badges had
 * a visibly different stroke weight from every other icon on the site.
 */
const ConfidenceBadge = ({ confidence, className = "" }) => {
  const isHigh = confidence === "HIGH";

  if (isHigh) {
    return (
      <span
        className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded font-medium bg-teal/10 text-teal-dark border border-teal/25 ${className}`}
      >
        <Icon name="check_circle" filled size="14px" />
        High Confidence
      </span>
    );
  }

  return (
    <span
      title="Cohort size n < 15 or cohort stats unavailable. Cohort age percentile is suppressed."
      className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded font-medium bg-gold/10 text-gold-dark border border-gold/30 cursor-help ${className}`}
    >
      <Icon name="warning" filled size="14px" />
      Low Confidence (n &lt; 15)
    </span>
  );
};

export default ConfidenceBadge;
