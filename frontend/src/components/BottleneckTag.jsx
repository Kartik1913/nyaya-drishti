import React from "react";

/**
 * Bottleneck type badge, colored by ACTIONABILITY TIER rather than by an
 * arbitrary per-category hue.
 *
 * The previous version assigned six unrelated, highly-saturated colors
 * (purple, orange, rose, cyan, amber, slate) with no connection to the
 * brand palette or to what the colors actually meant — a registrar scanning
 * the queue had six hues to memorize with no shared logic between them.
 *
 * The 6-layer engine (see README, Layer 3: Bottleneck Classifier) already
 * assigns each bottleneck type a real actionability tier — that tier is the
 * thing a registrar actually needs at a glance ("do I act on this now, or
 * can it wait?"), so the badge now encodes THAT instead:
 *   - High actionability   → error red    (SUMMONS_DELAY, REPEATED_ADJOURNMENT)
 *   - Medium actionability → gold         (WITNESS_DELAY, JUDGE_CHANGE, PROCEDURAL_INACTIVITY)
 *   - Low / normal         → teal         (UNKNOWN)
 * Three meaningful, brand-token colors instead of six decorative ones —
 * fewer hues to learn, and the ones that remain actually tell you something.
 */

const TIER_STYLE = {
  high: {
    classes: "bg-error/10 text-error border-error/25",
    dot: "bg-error",
  },
  medium: {
    classes: "bg-gold/10 text-gold-dark border-gold/30",
    dot: "bg-gold",
  },
  low: {
    classes: "bg-teal/10 text-teal-dark border-teal/25",
    dot: "bg-teal",
  },
};

const BOTTLENECK_MAP = {
  SUMMONS_DELAY: { label: "Summons Delay", tier: "high" },
  REPEATED_ADJOURNMENT: { label: "Repeated Adjournment", tier: "high" },
  WITNESS_DELAY: { label: "Witness Delay", tier: "medium" },
  JUDGE_CHANGE: { label: "Bench Change", tier: "medium" },
  PROCEDURAL_INACTIVITY: { label: "Procedural Inactivity", tier: "medium" },
  UNKNOWN: { label: "Normal Progression", tier: "low" },
};

const BottleneckTag = ({ type, size = "sm", className = "" }) => {
  const meta = BOTTLENECK_MAP[type] || BOTTLENECK_MAP.UNKNOWN;
  const style = TIER_STYLE[meta.tier];

  const sizeClass =
    size === "lg"
      ? "text-sm px-3 py-1.5 font-semibold"
      : "text-xs px-2.5 py-0.5 font-medium";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border ${style.classes} ${sizeClass} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
      {meta.label}
    </span>
  );
};

export default BottleneckTag;
