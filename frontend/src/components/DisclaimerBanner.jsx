import React from "react";
import Icon from "./Icon.jsx";

const DisclaimerBanner = () => {
  return (
    <div className="bg-[#7c4d00] border-b border-[#9a6300] px-4 py-2 text-xs text-[#ffe0b2] sticky top-0 z-50">
      <div className="max-w-full flex items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <Icon name="shield" size="16px" className="text-[#ffb74d] shrink-0" />
          <div>
            <span className="font-semibold uppercase tracking-wider text-[10px] bg-[#9a6300]/50 border border-[#ffb74d]/50 px-1.5 py-0.5 rounded mr-2">
              NON-JUDICIAL PROTOTYPE
            </span>
            <span>
              This system provides{" "}
              <strong>administrative review triage only</strong>. It does{" "}
              <strong>NOT</strong> predict judicial outcomes, assign judge
              liability, or evaluate judicial officers. All case-level records
              are <strong>SYNTHETIC</strong>.
            </span>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-2 shrink-0">
          <span className="text-[10px] font-mono bg-black/20 px-2 py-0.5 rounded text-[#ffb74d]/80 border border-[#ffb74d]/20">
            NJDG Reference Compatible
          </span>
        </div>
      </div>
    </div>
  );
};

export default DisclaimerBanner;
