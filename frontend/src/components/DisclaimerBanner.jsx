import React from "react";
import Icon from "./Icon.jsx";

/**
 * Persistent prototype-status banner, shown on every workspace page. Recolored
 * from a raw, muddy brownish-amber (#7c4d00 family, unrelated to the palette)
 * to navy + brand gold — the same "this is a demo/caution, not danger" color
 * language used everywhere else on the site (the gold prototype disclaimer on
 * Login, the gold SYNTHETIC data tag), so every prototype notice now reads as
 * one consistent signal instead of three different ad-hoc colors.
 */
const DisclaimerBanner = () => {
  return (
    <div className="bg-navy border-b border-gold/30 px-4 py-2 text-xs text-slate-200 w-full shrink-0 z-30">
      <div className="max-w-full flex items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <Icon name="shield" size="16px" className="text-gold-light shrink-0" />
          <div>
            <span className="font-semibold uppercase tracking-wider text-[10px] bg-gold/20 text-gold-light border border-gold/40 px-1.5 py-0.5 rounded mr-2">
              NON-JUDICIAL PROTOTYPE
            </span>
            <span>
              This system provides{" "}
              <strong>administrative review triage only</strong>. It does{" "}
              <strong>NOT</strong> predict judicial outcomes, assign judge
              liability, or evaluate judicial officers. Individual case records
              and event histories are synthetic prototypes structured using
              authentic eCourts metadata schemas and official NJDG/Data.gov.in
              statistical baselines.
            </span>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-2 shrink-0">
          <span className="text-[10px] font-evidence bg-black/20 px-2 py-0.5 rounded text-gold-light/80 border border-gold-light/20">
            NJDG Reference Compatible
          </span>
        </div>
      </div>
    </div>
  );
};

export default DisclaimerBanner;
