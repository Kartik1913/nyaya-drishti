import React from 'react';

/**
 * Data-provenance tag. This is the visible half of the project's central
 * integrity claim: macro context figures come from published NJDG /
 * Data.gov.in data, while every case-level record is synthetic. The backend
 * carries this distinction on the record itself (`source`, `data_label`), and
 * this badge surfaces it at the point of use so a reader never has to guess
 * which numbers are real.
 *
 * Teal = verified/official aggregate; gold = synthetic prototype data (the
 * same gold used by the prototype disclaimer banner, so every "this is demo
 * data" signal across the app shares one color). Tuned for the light card
 * surfaces these sit on.
 */
const DataLabelBadge = ({ type = 'SYNTHETIC', source = null, className = '' }) => {
  if (type === 'REAL_AGGREGATE' || source) {
    const label = source ? `Source: ${source}` : 'REAL AGGREGATE';
    return (
      <span className={`inline-flex items-center gap-1 font-evidence text-[9px] font-semibold px-1.5 py-0.5 rounded bg-teal/10 text-teal-dark border border-teal/30 tracking-wider uppercase ${className}`}>
        <span className="w-1 h-1 rounded-full bg-teal shrink-0"></span>
        [{label}]
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1 font-evidence text-[9px] font-semibold px-1.5 py-0.5 rounded bg-gold/15 text-gold-dark border border-gold/40 tracking-wider uppercase ${className}`}>
      <span className="w-1 h-1 rounded-full bg-gold shrink-0"></span>
      [SYNTHETIC]
    </span>
  );
};

export default DataLabelBadge;
