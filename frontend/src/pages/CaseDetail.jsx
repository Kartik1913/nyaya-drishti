import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import Icon from "../components/Icon.jsx";
import BottleneckTag from "../components/BottleneckTag.jsx";
import ConfidenceBadge from "../components/ConfidenceBadge.jsx";
import AiNotice from "../components/AiNotice.jsx";
import UserActions from "../components/UserActions.jsx";
import AppFooter from "../components/AppFooter.jsx";
import { getCaseDetailApi, getCaseTimelineApi, getCaseCohortApi } from "../api/endpoints.js";

const EVENT_ICONS = {
  STAGE_TRANSITION: "layers",
  SUMMONS_ISSUED: "mail",
  SUMMONS_RETURNED: "assignment_turned_in",
  HEARING: "gavel",
  ORDER: "description",
  ADJOURNMENT: "schedule",
  JUDGE_CHANGE: "cached",
  WITNESS_EXAM: "group",
};

export default function CaseDetail() {
  const { id } = useParams();
  const [caseData, setCaseData] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [cohort, setCohort] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [flagged, setFlagged] = useState(false);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        setLoading(true);
        setError(null);
        const [c, t, co] = await Promise.all([
          getCaseDetailApi(id),
          getCaseTimelineApi(id),
          getCaseCohortApi(id).catch(() => null),
        ]);
        setCaseData(c);
        setTimeline(t || []);
        setCohort(co);
      } catch (err) {
        console.error("Failed to load case detail:", err);
        setError(err.response?.data?.detail || "Case not found or unable to load details.");
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-on-surface-variant">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-medium animate-pulse">Loading Case Evidence...</p>
        </div>
      </div>
    );
  }

  if (error || !caseData) {
    return (
      <main className="flex-1 p-margin-desktop space-y-6">
        <Link to="/queue" className="inline-flex items-center gap-1.5 text-secondary hover:underline text-body-sm font-medium">
          <Icon name="arrow_back" size="16px" />
          <span>Back to Priority Queue</span>
        </Link>
        <div className="p-4 bg-error/5 border border-error/20 rounded text-error text-body-sm flex items-center gap-3">
          <Icon name="error" />
          <span>{error || "Case could not be found."}</span>
        </div>
      </main>
    );
  }

  // Parse evidence JSON
  let evidence = {};
  try {
    if (caseData.evidence_json) {
      evidence = typeof caseData.evidence_json === "string"
        ? JSON.parse(caseData.evidence_json)
        : caseData.evidence_json;
    }
  } catch (e) {
    console.error("Failed to parse evidence_json", e);
  }

  const compScores = evidence.component_scores || {};
  const isAlpha = caseData.is_demo_stalled;
  const isBeta = caseData.is_demo_progressing;
  const score = caseData.triage_score || 0;
  const isStalled = score >= 50 || caseData.bottleneck_type !== "UNKNOWN";

  return (
    <>
      {/* Top App Bar */}
      <header className="sticky top-0 h-16 bg-surface border-b border-outline-variant flex justify-between items-center px-gutter z-20">
        <div className="flex items-center gap-4">
          <AiNotice text="Administrative Triage View Only" />
        </div>
        <div className="flex items-center gap-4">
          <UserActions />
        </div>
      </header>

      {/* Canvas */}
      <main className="flex-grow p-margin-mobile md:p-margin-desktop max-w-[1280px] mx-auto w-full space-y-gutter">
        {/* Back navigation & Header */}
        <div className="border-b border-outline-variant pb-4 flex flex-col md:flex-row justify-between md:items-start gap-4">
          <div>
            <Link to="/queue" className="inline-flex items-center gap-1 text-secondary hover:underline text-body-sm font-medium mb-2">
              <Icon name="arrow_back" size="16px" />
              <span>Back to Priority Queue</span>
            </Link>
            <h1 className="text-headline-lg font-headline-lg text-primary flex items-center gap-3">
              {caseData.synthetic_cnr}
              {isAlpha && (
                <span className="px-2 py-0.5 rounded bg-error/10 text-error border border-error/20 text-xs font-bold">
                  ALPHA DEMO
                </span>
              )}
              {isBeta && (
                <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">
                  BETA DEMO
                </span>
              )}
            </h1>
            <p className="text-body-md font-body-md text-on-surface-variant mt-1">
              {caseData.case_type} &bull; {caseData.court_establishment}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/comparison"
              className="px-4 py-2 border border-outline-variant text-primary bg-surface hover:bg-surface-container-low rounded text-label-md font-label-md transition-colors"
            >
              Side-by-Side Comparison
            </Link>
          </div>
        </div>

        {/* Dynamic Stalled / Normal Inspector Card */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-gutter">
          {/* Left / Center: Detailed Analysis (Col Span 2) */}
          <div className="xl:col-span-2 space-y-gutter">
            <article className="bg-surface-container-lowest border border-outline-variant rounded flex flex-col shadow-sm">
              <div className="p-6 border-b border-outline-variant flex justify-between items-start bg-surface-bright rounded-t">
                <div>
                  <h2 className="text-headline-sm font-headline-sm text-primary mb-1">
                    AI Triage Diagnostic
                  </h2>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <BottleneckTag type={caseData.bottleneck_type} size="lg" />
                    <ConfidenceBadge confidence={caseData.triage_confidence} />
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="block text-label-md font-label-md text-on-surface-variant uppercase tracking-wider mb-1">
                    Triage Score
                  </span>
                  <span className={`text-[40px] leading-[48px] font-bold tracking-tight ${isStalled ? "text-error" : "text-[#14532d]"}`}>
                    {score.toFixed(1)}
                  </span>
                </div>
              </div>

              <div className="p-6 bg-surface-container-lowest space-y-6">
                {/* Status Box */}
                {isStalled ? (
                  <div className="bg-error/5 border border-error/20 rounded-lg p-4 flex items-start gap-4">
                    <Icon name="warning" className="text-error mt-0.5" />
                    <div>
                      <h3 className="text-headline-sm font-headline-sm text-error mb-2">
                        Structurally Stalled
                      </h3>
                      <p className="text-body-sm font-body-sm text-on-surface-variant leading-relaxed">
                        {caseData.explanation_text || "Case shows persistent administrative bottlenecks."}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-[#f0fdf4] border border-[#bbf7d0] rounded-lg p-4 flex items-start gap-4">
                    <Icon name="check_circle" className="text-[#166534] mt-0.5" />
                    <div>
                      <h3 className="text-headline-sm font-headline-sm text-[#166534] mb-2">
                        Normal Progression
                      </h3>
                      <p className="text-body-sm font-body-sm text-[#14532d] leading-relaxed">
                        {caseData.explanation_text || "Case exhibits normal progression relative to its cohort."}
                      </p>
                    </div>
                  </div>
                )}

                {/* Progress bars for Evidence Breakdown */}
                <div>
                  <h4 className="text-label-md font-label-md text-on-surface-variant uppercase mb-4 border-b border-outline-variant pb-2">
                    Evidence Breakdown (Weights)
                  </h4>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between items-center mb-1 text-body-sm font-body-sm">
                        <span className="font-medium text-primary">1. Stage Deviation (30% max)</span>
                        <span className="font-bold text-error">{compScores.score_structural_deviation ?? 0} pts</span>
                      </div>
                      <div className="w-full bg-surface-variant h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-error h-full rounded-full"
                          style={{ width: `${((compScores.score_structural_deviation || 0) / 30) * 100}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1 text-body-sm font-body-sm">
                        <span className="font-medium text-primary">2. Substantive Inactivity (25% max)</span>
                        <span className="font-bold text-error">{compScores.score_inactivity ?? 0} pts</span>
                      </div>
                      <div className="w-full bg-surface-variant h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-error h-full rounded-full"
                          style={{ width: `${((compScores.score_inactivity || 0) / 25) * 100}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1 text-body-sm font-body-sm">
                        <span className="font-medium text-primary">3. Cohort Age Percentile (15% max)</span>
                        <span className="font-bold text-error">{compScores.score_age_deviation ?? 0} pts</span>
                      </div>
                      <div className="w-full bg-surface-variant h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-error h-full rounded-full"
                          style={{ width: `${((compScores.score_age_deviation || 0) / 15) * 100}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1 text-body-sm font-body-sm">
                        <span className="font-medium text-primary">4. Adjournment Pattern (10% max)</span>
                        <span className="font-bold text-error">{compScores.score_adjournment ?? 0} pts</span>
                      </div>
                      <div className="w-full bg-surface-variant h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-error h-full rounded-full"
                          style={{ width: `${((compScores.score_adjournment || 0) / 10) * 100}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1 text-body-sm font-body-sm">
                        <span className="font-medium text-primary">5. Administrative Actionability (20% max)</span>
                        <span className="font-bold text-error">{compScores.score_actionability ?? 0} pts</span>
                      </div>
                      <div className="w-full bg-surface-variant h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-error h-full rounded-full"
                          style={{ width: `${((compScores.score_actionability || 0) / 20) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {isStalled && (
                <div className="p-4 border-t border-outline-variant bg-surface-bright rounded-b text-right">
                  <button
                    type="button"
                    onClick={() => setFlagged(true)}
                    disabled={flagged}
                    className="px-6 py-2 bg-error text-white text-body-sm font-body-sm font-medium rounded hover:bg-[#93000a] transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-error disabled:opacity-60 disabled:cursor-default"
                  >
                    {flagged ? "Flagged for Lok Adalat" : "Flag for Lok Adalat"}
                  </button>
                </div>
              )}
            </article>

            {/* Event Timeline */}
            <div className="bg-surface-container-lowest border border-outline-variant rounded p-6 shadow-sm">
              <h3 className="text-headline-sm font-headline-sm text-primary mb-6 border-b border-outline-variant pb-3 flex items-center gap-2">
                <Icon name="history" />
                <span>Event Timeline Provenance</span>
              </h3>

              <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-outline-variant">
                {timeline.map((event, idx) => {
                  const iconName = EVENT_ICONS[event.event_type] || "description";
                  const isStage = event.event_type === "STAGE_TRANSITION";

                  return (
                    <div key={event.id || idx} className="relative flex items-start gap-4">
                      {/* Node circle */}
                      <div className={`absolute -left-6 top-0.5 w-6 h-6 rounded-full flex items-center justify-center border bg-surface ${
                        event.is_substantive
                          ? "text-emerald-700 border-emerald-300 bg-emerald-50"
                          : isStage
                          ? "text-secondary border-secondary bg-surface-container-high"
                          : "text-on-surface-variant border-outline-variant"
                      }`}>
                        <Icon name={iconName} size="14px" />
                      </div>

                      {/* Content block */}
                      <div className="flex-1 bg-surface-bright border border-outline-variant rounded p-4">
                        <div className="flex items-center justify-between gap-4 mb-1">
                          <span className="text-body-sm font-body-sm text-primary font-bold">
                            {event.event_type.replace(/_/g, " ")}
                          </span>
                          <span className="text-label-md font-label-md text-on-surface-variant font-mono">
                            {event.event_date}
                          </span>
                        </div>
                        {event.description && (
                          <p className="text-body-sm font-body-sm text-on-surface-variant mt-1 leading-relaxed">
                            {event.description}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Sidebar: Cohort Context & Metadata (Col Span 1) */}
          <div className="xl:col-span-1 space-y-gutter">
            <div className="bg-surface-container-lowest border border-outline-variant rounded p-6 shadow-sm space-y-6">
              <h3 className="text-headline-sm font-headline-sm text-primary border-b border-outline-variant pb-3 flex items-center gap-2">
                <Icon name="groups" />
                <span>Cohort Benchmark</span>
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-surface-bright border border-outline-variant rounded p-3 text-center">
                  <span className="text-[10px] text-on-surface-variant uppercase tracking-wider block mb-1">Cohort Size</span>
                  <span className="text-headline-sm font-headline-sm font-bold text-primary">
                    {cohort?.cohort_size || evidence.cohort_size || "N/A"}
                  </span>
                </div>
                <div className="bg-surface-bright border border-outline-variant rounded p-3 text-center">
                  <span className="text-[10px] text-on-surface-variant uppercase tracking-wider block mb-1">Cohort Median</span>
                  <span className="text-headline-sm font-headline-sm font-bold text-primary">
                    {cohort?.median_days_in_stage || evidence.cohort_median_days_in_stage || 65}d
                  </span>
                </div>
                <div className="bg-surface-bright border border-outline-variant rounded p-3 text-center">
                  <span className="text-[10px] text-on-surface-variant uppercase tracking-wider block mb-1">Days in Stage</span>
                  <span className="text-headline-sm font-headline-sm font-bold text-error">
                    {caseData.days_in_current_stage}d
                  </span>
                </div>
                <div className="bg-surface-bright border border-outline-variant rounded p-3 text-center">
                  <span className="text-[10px] text-on-surface-variant uppercase tracking-wider block mb-1">Deviation</span>
                  <span className="text-headline-sm font-headline-sm font-bold text-error">
                    {caseData.stage_deviation_ratio ? `${caseData.stage_deviation_ratio.toFixed(1)}x` : "N/A"}
                  </span>
                </div>
              </div>

              {/* Metadata list */}
              <div className="pt-4 border-t border-outline-variant space-y-3">
                <h4 className="text-label-md font-label-md text-primary font-bold">Provenance Timeline</h4>
                <ul className="space-y-2 text-body-sm font-body-sm text-on-surface-variant">
                  <li className="flex justify-between">
                    <span>Filing Date:</span>
                    <span className="font-mono text-primary">{caseData.filing_date}</span>
                  </li>
                  <li className="flex justify-between">
                    <span>Registration Date:</span>
                    <span className="font-mono text-primary">{caseData.registration_date || "-"}</span>
                  </li>
                  <li className="flex justify-between">
                    <span>Pending Since:</span>
                    <span className="font-mono text-primary">{caseData.pending_since}</span>
                  </li>
                  <li className="flex justify-between">
                    <span>Stage Entered:</span>
                    <span className="font-mono text-primary">{caseData.stage_entered_at || "-"}</span>
                  </li>
                  <li className="flex justify-between">
                    <span>Next Hearing:</span>
                    <span className="font-mono text-primary">{caseData.next_date || "Not Scheduled"}</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>

      <AppFooter />
    </>
  );
}
