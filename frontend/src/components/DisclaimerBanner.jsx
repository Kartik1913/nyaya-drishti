import React from 'react';
import { ShieldAlert } from 'lucide-react';

const DisclaimerBanner = () => {
  return (
    <div className="bg-gradient-to-r from-amber-950/95 via-amber-900/90 to-amber-950/95 border-b border-amber-500/40 px-4 py-2 text-xs text-amber-200 shadow-md sticky top-0 z-50 backdrop-blur-md">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
          <div>
            <span className="font-bold px-1.5 py-0.5 bg-amber-500/30 border border-amber-500/50 rounded text-[10px] tracking-wider uppercase text-amber-300 mr-2">
              NON-JUDICIAL PROTOTYPE
            </span>
            <span>
              This system provides <strong>administrative review triage only</strong>. It does <strong>NOT</strong> predict judicial outcomes, assign judge liability, or evaluate judicial officers. All case-level records are <strong>SYNTHETIC</strong>.
            </span>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-2">
          <span className="text-[10px] font-mono bg-slate-900/80 px-2 py-0.5 rounded text-amber-300/80 border border-amber-500/20">
            NJDG Reference Compatible
          </span>
        </div>
      </div>
    </div>
  );
};

export default DisclaimerBanner;
