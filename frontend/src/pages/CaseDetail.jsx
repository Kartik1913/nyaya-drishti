import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import Icon from "../components/Icon.jsx";
import BottleneckTag from "../components/BottleneckTag.jsx";
import ConfidenceBadge from "../components/ConfidenceBadge.jsx";
import AiNotice from "../components/AiNotice.jsx";
import UserActions from "../components/UserActions.jsx";
import AppFooter from "../components/AppFooter.jsx";
import Reveal from "../components/Reveal.jsx";
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

/**
 * Evidence-breakdown component row. Bar/points color is tied to the case's
 * overall verdict (`stalled`), not evaluated per-row — these five figures are
 * weighted contributions to ONE formula, not five independent judgments, so a
 * healthy case should read as healthy across the board (teal), and a stalled
 * case should read as flagged across the board (error). The previous version
 * hard-coded every bar to error/red regardless of the case's actual outcome,
 * so a perfectly normal case visually screamed "danger" in every row.
 */
function EvidenceRow({ index, label, weight, points, max, stalled }) {
  const tone = stalled ? "text-error" : "text-teal-dark";
  const barTone = stalled
    ? "bg-gradient-to-r from-error to-error/70"
    : "bg-gradient-to-r from-teal to-teal-light";
  return (
    <div>
      <div className="flex justify-between items-center mb-1.5 text-body-sm font-body-sm">
        <span className="flex items-center gap-2 font-medium text-primary">
          <span className="font-evidence text-[11px] text-gold-dark tabular-nums">
            {String(index).padStart(2, "0")}
          </span>
          {label}
          <span className="text-[11px] text-on-surface-variant/70">
            ({weight}% max)
          </span>
        </span>
        <span className={`font-evidence font-bold tabular-nums ${tone}`}>
          {points} pts
        </span>
      </div>
      <div className="w-full bg-surface-variant h-2 rounded-full overflow-hidden">
        <div
          className={`${barTone} h-full rounded-full transition-all duration-700 ease-out`}
          style={{ width: `${Math.min(100, (points / max) * 100)}%` }}
        />
      </div>
    </div>
  );
}

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
          <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium animate-pulse">Loading case evidence…</p>
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
        <Reveal
          variant="up"
          className="border-b border-outline-variant pb-5 flex flex-col md:flex-row justify-between md:items-start gap-4"
        >
          <div>
            <Link to="/queue" className="inline-flex items-center gap-1 text-secondary hover:underline text-body-sm font-medium mb-2">
              <Icon name="arrow_back" size="16px" />
              <span>Back to Priority Queue</span>
            </Link>
            <div className="flex items-center gap-3 mb-1">
              <span className="h-px w-6 bg-gradient-to-r from-transparent to-gold" />
              <span className="font-label-md text-label-md uppercase tracking-[0.2em] text-gold-dark">
                Case File
              </span>
            </div>
            <h1 className="font-headline-lg text-headline-lg text-primary flex items-center gap-3 flex-wrap">
              <span className="font-evidence tracking-tight">{caseData.synthetic_cnr}</span>
              {isAlpha && (
                <span className="px-2 py-0.5 rounded bg-error/10 text-error border border-error/20 text-xs font-bold font-evidence">
                  ALPHA (DEMO)
                </span>
              )}
              {isBeta && (
                <span className="px-2 py-0.5 rounded bg-teal/10 text-teal-dark border border-teal/25 text-xs font-bold font-evidence">
                  BETA (DEMO)
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
              className="px-4 py-2 border border-outline-variant text-primary bg-surface hover:bg-surface-container-low hover:border-gold/40 rounded text-label-md font-label-md transition-colors"
            >
              Side-by-Side Comparison
            </Link>
          </div>
        </Reveal>

        {/* Case Summary — plain-language read of this case, distinct from the
            arithmetic-justification explanation_text shown further down. */}
        {caseData.case_summary && (
          <Reveal variant="up" delay={40}>
            <div className="relative bg-surface-container-lowest border border-outline-variant rounded-lg p-6 shadow-sm overflow-hidden">
              <span
                aria-hidden="true"
                className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-gold/50 to-transparent"
              />
              <h2 className="font-label-md text-label-md uppercase tracking-[0.2em] text-gold-dark mb-2.5 flex items-center gap-2">
                <Icon name="summarize" size="16px" />
                Case Summary
              </h2>
              <p className="font-body-lg text-body-lg text-on-surface leading-relaxed">
                {caseData.case_summary}
              </p>
            </div>
          </Reveal>
        )}

        {/* Dynamic Stalled / Normal Inspector Card */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-gutter">
          {/* Left / Center: Detailed Analysis (Col Span 2) */}
          <div className="xl:col-span-2 space-y-gutter">
            <Reveal variant="rise" delay={80}>
              <article className="relative bg-surface-container-lowest border border-outline-variant rounded-lg flex flex-col shadow-sm overflow-hidden transition-shadow duration-300 hover:shadow-md">
                {/* Gold signature rule — matches the landing page's brand language */}
                <span
                  aria-hidden="true"
                  className={`absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r ${
                    isStalled ? "from-error to-error/40" : "from-gold to-gold/40"
                  }`}
                />
                <div className="p-6 pt-7 border-b border-outline-variant flex justify-between items-start bg-surface-bright rounded-t">
                  <div>
                    <span className="font-label-md text-label-md uppercase tracking-[0.2em] text-gold-dark block mb-1.5">
                      AI Triage Diagnostic
                    </span>
                    <h2 className="text-headline-sm font-headline-sm text-primary mb-1">
                      Six-Layer Evidence Summary
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
                    <span
                      className={`font-evidence text-[42px] leading-[48px] font-semibold tracking-tight tabular-nums ${
                        isStalled ? "text-error" : "text-teal-dark"
                      }`}
                    >
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
                    <div className="bg-teal/5 border border-teal/20 rounded-lg p-4 flex items-start gap-4">
                      <Icon name="check_circle" className="text-teal-dark mt-0.5" />
                      <div>
                        <h3 className="text-headline-sm font-headline-sm text-teal-dark mb-2">
                          Normal Progression
                        </h3>
                        <p className="text-body-sm font-body-sm text-teal-dark/90 leading-relaxed">
                          {caseData.explanation_text || "Case exhibits normal progression relative to its cohort."}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Supporting Machine Learning Predictive Risk */}
                  {evidence.ml_stall_risk_level && evidence.ml_stall_risk_level !== "UNKNOWN" && (
                    <div className={`border rounded-lg p-4 flex items-start gap-4 ${
                      evidence.ml_stall_risk_level === "HIGH"
                        ? "bg-gold/10 border-gold/30 text-gold-dark"
                        : "bg-surface-container-low border-outline-variant text-on-surface"
                    }`}>
                      <Icon
                        name="psychology"
                        className={evidence.ml_stall_risk_level === "HIGH" ? "text-gold-dark mt-0.5" : "text-on-surface-variant mt-0.5"}
                      />
                      <div>
                        <h3 className="text-headline-sm font-headline-sm font-bold mb-1">
                          Supporting ML Risk Signal
                        </h3>
                        <p className="text-body-sm font-body-sm leading-relaxed mb-2 opacity-90">
                          {evidence.ml_stall_risk_level === "HIGH"
                            ? `The predictive model estimates a high probability of structural stall (${(evidence.ml_stall_probability * 100).toFixed(1)}%) based on comparative historical cohort patterns.`
                            : `The predictive model estimates a low probability of structural stall (${(evidence.ml_stall_probability * 100).toFixed(1)}%) based on comparative historical cohort patterns.`
                          }
                        </p>
                        <span className={`inline-block font-evidence text-[11px] font-bold px-2 py-0.5 rounded border uppercase ${
                          evidence.ml_stall_risk_level === "HIGH"
                            ? "bg-gold/20 border-gold/40 text-gold-dark"
                            : "bg-surface-container-high border-outline-variant text-on-surface-variant"
                        }`}>
                          Predictive Risk: {evidence.ml_stall_risk_level}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Evidence Breakdown */}
                  <div>
                    <h4 className="text-label-md font-label-md text-on-surface-variant uppercase mb-4 border-b border-outline-variant pb-2">
                      Evidence Breakdown (Weights)
                    </h4>
                    <div className="space-y-4">
                      <EvidenceRow
                        index={1}
                        label="Stage Deviation"
                        weight={30}
                        points={compScores.score_structural_deviation ?? 0}
                        max={30}
                        stalled={isStalled}
                      />
                      <EvidenceRow
                        index={2}
                        label="Substantive Inactivity"
                        weight={25}
                        points={compScores.score_inactivity ?? 0}
                        max={25}
                        stalled={isStalled}
                      />
                      <EvidenceRow
                        index={3}
                        label="Cohort Age Percentile"
                        weight={15}
                        points={compScores.score_age_deviation ?? 0}
                        max={15}
                        stalled={isStalled}
                      />
                      <EvidenceRow
                        index={4}
                        label="Adjournment Pattern"
                        weight={10}
                        points={compScores.score_adjournment ?? 0}
                        max={10}
                        stalled={isStalled}
                      />
                      <EvidenceRow
                        index={5}
                        label="Administrative Actionability"
                        weight={20}
                        points={compScores.score_actionability ?? 0}
                        max={20}
                        stalled={isStalled}
                      />
                    </div>
                  </div>
                </div>

                {isStalled && (
                  <div className="p-4 border-t border-outline-variant bg-surface-bright rounded-b text-right">
                    <button
                      type="button"
                      onClick={() => setFlagged(true)}
                      disabled={flagged}
                      className="px-6 py-2 bg-error text-white text-body-sm font-body-sm font-medium rounded hover:bg-[#93000a] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-error disabled:opacity-60 disabled:cursor-default disabled:hover:translate-y-0"
                    >
                      {flagged ? "Flagged for Lok Adalat" : "Flag for Lok Adalat"}
                    </button>
                  </div>
                )}
              </article>
            </Reveal>

            {/* Event Timeline */}
            <Reveal variant="rise" delay={160}>
              <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-6 shadow-sm">
                <h3 className="text-headline-sm font-headline-sm text-primary mb-6 border-b border-outline-variant pb-3 flex items-center gap-2">
                  <Icon name="history" className="text-gold-dark" />
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
                            ? "text-teal-dark border-teal/40 bg-teal/10"
                            : isStage
                            ? "text-gold-dark border-gold/50 bg-gold/10"
                            : "text-on-surface-variant border-outline-variant"
                        }`}>
                          <Icon name={iconName} size="14px" />
                        </div>

                        {/* Content block */}
                        <div className="flex-1 bg-surface-bright border border-outline-variant rounded p-4 transition-all duration-150 hover:border-gold/40 hover:shadow-sm">
                          <div className="flex items-center justify-between gap-4 mb-1">
                            <span className="text-body-sm font-body-sm text-primary font-bold">
                              {event.event_type.replace(/_/g, " ")}
                            </span>
                            <span className="text-label-md font-label-md text-on-surface-variant font-evidence">
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
            </Reveal>
          </div>

          {/* Right Sidebar: Cohort Context & Metadata (Col Span 1) */}
          <div className="xl:col-span-1 space-y-gutter">
            {/* Settlement Score — a separate signal from Triage Score. Triage
                asks "how urgent"; this asks "how settle-able." See
                backend/triage/settlement.py for the deterministic formula
                (case stage + age + adjournment responsiveness — no ML). */}
            {caseData.settlement_score != null && (
              <Reveal variant="right" delay={100}>
                <div className="relative bg-surface-container-lowest border border-outline-variant rounded-lg p-6 shadow-sm overflow-hidden transition-shadow duration-300 hover:shadow-md">
                  <span
                    aria-hidden="true"
                    className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-teal to-teal-light"
                  />
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-headline-sm font-headline-sm text-primary flex items-center gap-2">
                      <Icon name="handshake" className="text-teal-dark" />
                      <span>Settlement Score</span>
                    </h3>
                    <span
                      className={`font-evidence text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                        caseData.settlement_likelihood === "HIGH"
                          ? "bg-teal/10 text-teal-dark border-teal/25"
                          : caseData.settlement_likelihood === "MODERATE"
                          ? "bg-gold/15 text-gold-dark border-gold/35"
                          : "bg-surface-container-high text-on-surface-variant border-outline-variant"
                      }`}
                    >
                      {caseData.settlement_likelihood}
                    </span>
                  </div>
                  <p className="text-[11px] text-on-surface-variant mb-4 leading-relaxed">
                    Likelihood this case could be resolved via Lok Adalat instead
                    of continuing to trial — a separate question from urgency.
                  </p>
                  <div className="flex items-end gap-3">
                    <span className="font-evidence text-[36px] leading-none font-semibold text-teal-dark tabular-nums">
                      {caseData.settlement_score.toFixed(1)}
                    </span>
                    <div className="flex-1 h-2 bg-surface-variant rounded-full overflow-hidden mb-1.5">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-teal to-teal-light transition-all duration-700 ease-out"
                        style={{ width: `${Math.min(100, caseData.settlement_score)}%` }}
                      />
                    </div>
                  </div>
                  {caseData.settlement_likelihood !== "HIGH" && (
                    <Link
                      to="/lok-adalat-drafts"
                      className="mt-4 inline-flex items-center gap-1 text-[11px] font-semibold text-secondary hover:underline"
                    >
                      View all referral candidates
                      <Icon name="arrow_forward" size="12px" />
                    </Link>
                  )}
                </div>
              </Reveal>
            )}

            <Reveal variant="right" delay={120}>
              <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-6 shadow-sm space-y-6 transition-shadow duration-300 hover:shadow-md">
                <h3 className="text-headline-sm font-headline-sm text-primary border-b border-outline-variant pb-3 flex items-center gap-2">
                  <Icon name="groups" className="text-gold-dark" />
                  <span>Cohort Benchmark</span>
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-surface-bright border border-outline-variant rounded p-3 text-center">
                    <span className="text-[10px] text-on-surface-variant uppercase tracking-wider block mb-1">Cohort Size</span>
                    <span className="font-evidence text-headline-sm font-bold text-primary tabular-nums">
                      {cohort?.cohort_size || evidence.cohort_size || "N/A"}
                    </span>
                  </div>
                  <div className="bg-surface-bright border border-outline-variant rounded p-3 text-center">
                    <span className="text-[10px] text-on-surface-variant uppercase tracking-wider block mb-1">Cohort Median</span>
                    <span className="font-evidence text-headline-sm font-bold text-primary tabular-nums">
                      {cohort?.median_days_in_stage || evidence.cohort_median_days_in_stage || 65}d
                    </span>
                  </div>
                  <div className="bg-surface-bright border border-outline-variant rounded p-3 text-center">
                    <span className="text-[10px] text-on-surface-variant uppercase tracking-wider block mb-1">Days in Stage</span>
                    <span className={`font-evidence text-headline-sm font-bold tabular-nums ${isStalled ? "text-error" : "text-teal-dark"}`}>
                      {caseData.days_in_current_stage}d
                    </span>
                  </div>
                  <div className="bg-surface-bright border border-outline-variant rounded p-3 text-center">
                    <span className="text-[10px] text-on-surface-variant uppercase tracking-wider block mb-1">Deviation</span>
                    <span className={`font-evidence text-headline-sm font-bold tabular-nums ${isStalled ? "text-error" : "text-teal-dark"}`}>
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
                      <span className="font-evidence text-primary">{caseData.filing_date}</span>
                    </li>
                    <li className="flex justify-between">
                      <span>Registration Date:</span>
                      <span className="font-evidence text-primary">{caseData.registration_date || "-"}</span>
                    </li>
                    <li className="flex justify-between">
                      <span>Pending Since:</span>
                      <span className="font-evidence text-primary">{caseData.pending_since}</span>
                    </li>
                    <li className="flex justify-between">
                      <span>Stage Entered:</span>
                      <span className="font-evidence text-primary">{caseData.stage_entered_at || "-"}</span>
                    </li>
                    <li className="flex justify-between">
                      <span>Next Hearing:</span>
                      <span className="font-evidence text-primary">{caseData.next_date || "Not Scheduled"}</span>
                    </li>
                  </ul>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </main>

      <AppFooter />
    </>
  );
}
