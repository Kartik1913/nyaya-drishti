import { useState } from "react";
import Icon from "../components/Icon.jsx";
import AppFooter from "../components/AppFooter.jsx";
import UserActions from "../components/UserActions.jsx";
import AiNotice from "../components/AiNotice.jsx";
import { caseInspectorCases } from "../data/mockData.js";

function StalledCard({ c }) {
  const [flagged, setFlagged] = useState(false);

  return (
    <article className="bg-surface-container-lowest border border-outline-variant rounded flex flex-col shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
      <div className="p-6 border-b border-outline-variant flex justify-between items-start bg-surface-bright rounded-t">
        <div>
          <h2 className="text-headline-md font-headline-md text-primary mb-1">
            {c.id}
          </h2>
          <p className="text-body-sm font-body-sm text-on-surface-variant flex flex-wrap items-center gap-2">
            <Icon name="schedule" size="16px" /> {c.ageLabel}
            <span className="mx-1 text-outline-variant">|</span>
            <Icon name="folder_open" size="16px" /> Cohort: {c.cohort}
          </p>
        </div>
        <div className="text-right shrink-0">
          <span className="block text-label-md font-label-md text-on-surface-variant uppercase tracking-wider mb-1">
            Triage Score
          </span>
          <span className="text-[40px] leading-[48px] font-bold text-[#ba1a1a] tracking-tight">
            {c.score}
          </span>
        </div>
      </div>

      <div className="p-6 flex-1 bg-surface-container-lowest">
        <div className="flex items-center gap-2 mb-6">
          <Icon name="warning" className="text-error" />
          <h3 className="text-headline-sm font-headline-sm text-primary">
            {c.statusLabel}
          </h3>
        </div>
        <div className="mb-4">
          <h4 className="text-label-md font-label-md text-on-surface-variant uppercase mb-4 border-b border-outline-variant pb-2">
            Evidence Breakdown
          </h4>
          <div className="space-y-6 mt-4">
            {c.evidence.map((item) => (
              <div key={item.label}>
                <div className="flex justify-between items-center mb-2 gap-4">
                  <span className="text-body-sm font-body-sm text-primary font-medium">
                    {item.label}
                  </span>
                  <span className="text-body-sm font-body-sm text-[#ba1a1a] font-bold shrink-0">
                    {item.points}
                  </span>
                </div>
                <div className="w-full bg-surface-variant h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-[#ba1a1a] h-full rounded-full"
                    style={{ width: `${item.width}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="p-4 border-t border-outline-variant bg-surface-bright rounded-b text-right">
        <button
          type="button"
          onClick={() => setFlagged(true)}
          disabled={flagged}
          className="px-6 py-2 bg-[#ba1a1a] text-white text-body-sm font-body-sm font-medium rounded hover:bg-[#93000a] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#ba1a1a] disabled:opacity-60 disabled:cursor-default disabled:hover:translate-y-0"
        >
          {flagged ? "Flagged for Lok Adalat" : "Flag for Lok Adalat"}
        </button>
      </div>
    </article>
  );
}

function NormalCard({ c }) {
  return (
    <article className="bg-surface-container-lowest border border-outline-variant rounded flex flex-col shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
      <div className="p-6 border-b border-outline-variant flex justify-between items-start bg-surface-bright rounded-t">
        <div>
          <h2 className="text-headline-md font-headline-md text-primary mb-1">
            {c.id}
          </h2>
          <p className="text-body-sm font-body-sm text-on-surface-variant flex flex-wrap items-center gap-2">
            <Icon name="schedule" size="16px" /> {c.ageLabel}
            <span className="mx-1 text-outline-variant">|</span>
            <Icon name="folder_open" size="16px" /> Cohort: {c.cohort}
          </p>
        </div>
        <div className="text-right shrink-0">
          <span className="block text-label-md font-label-md text-on-surface-variant uppercase tracking-wider mb-1">
            Triage Score
          </span>
          <span className="text-[40px] leading-[48px] font-bold text-[#14532d] tracking-tight">
            {c.score}
          </span>
        </div>
      </div>

      <div className="p-6 flex-1 bg-surface-container-lowest flex flex-col justify-center">
        <div className="bg-[#f0fdf4] border border-[#bbf7d0] rounded-lg p-6 flex items-start gap-4">
          <div className="bg-[#166534] text-white rounded-full p-2 shrink-0 mt-1">
            <Icon name="check_circle" size="24px" />
          </div>
          <div>
            <h3 className="text-headline-sm font-headline-sm text-[#166534] mb-2">
              {c.statusLabel}
            </h3>
            <p className="text-body-md font-body-md text-[#14532d]">
              {c.summary}
            </p>
          </div>
        </div>
      </div>

      <div className="p-4 border-t border-outline-variant bg-surface-bright rounded-b text-right">
        <button
          type="button"
          className="px-6 py-2 bg-surface-container-lowest border border-primary text-primary text-body-sm font-body-sm font-medium rounded hover:bg-surface-container-low transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
        >
          View Details
        </button>
      </div>
    </article>
  );
}

export default function CaseInspector() {
  const [search, setSearch] = useState("");

  return (
    <>
      {/* Top App Bar */}
      <header className="sticky top-0 h-16 bg-surface border-b border-outline-variant flex justify-between items-center px-gutter z-20">
        <div className="flex items-center gap-4">
          <AiNotice text="Administrative Triage View Only" />
        </div>
        <div className="flex items-center gap-4">
          <div className="relative hidden md:flex items-center">
            <Icon
              name="search"
              className="absolute left-3 text-on-surface-variant"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search cases, cohorts..."
              className="pl-10 pr-4 py-2 bg-surface-container-lowest border border-outline-variant rounded-lg text-body-sm focus:border-secondary focus:ring-1 focus:ring-secondary outline-none w-64 transition-all"
            />
          </div>
          <UserActions />
        </div>
      </header>

      {/* Canvas */}
      <main className="flex-1 p-margin-desktop max-w-[1280px] mx-auto w-full">
        <div className="mb-stack-lg border-b border-outline-variant pb-4 animate-hero-fade-1">
          <h1 className="text-headline-lg font-headline-lg text-primary mb-2">
            Case Inspector: Scoring Transparency
          </h1>
          <p className="text-body-md font-body-md text-on-surface-variant max-w-3xl">
            Analyze AI triage scoring logic side-by-side to understand
            structural bottlenecks in the judicial process.
          </p>
        </div>

        <div
          className="grid grid-cols-1 xl:grid-cols-2 gap-gutter opacity-0 animate-hero-fade-2"
          style={{ animationDelay: "80ms" }}
        >
          {caseInspectorCases.map((c) =>
            c.status === "stalled" ? (
              <StalledCard key={c.id} c={c} />
            ) : (
              <NormalCard key={c.id} c={c} />
            )
          )}
        </div>
      </main>

      <AppFooter />
    </>
  );
}
