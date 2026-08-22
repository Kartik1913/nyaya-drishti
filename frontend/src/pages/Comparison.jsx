import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Icon from "../components/Icon.jsx";
import ScoreBadge from "../components/ScoreBadge.jsx";
import BottleneckTag from "../components/BottleneckTag.jsx";
import AiNotice from "../components/AiNotice.jsx";
import UserActions from "../components/UserActions.jsx";
import AppFooter from "../components/AppFooter.jsx";
import { getDemoComparisonApi } from "../api/endpoints.js";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export default function Comparison() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchComparison = async () => {
      try {
        setLoading(true);
        const res = await getDemoComparisonApi();
        setData(res);
      } catch (err) {
        console.error("Failed to load comparison:", err);
        setError("Failed to load demo comparison data.");
      } finally {
        setLoading(false);
      }
    };
    fetchComparison();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-on-surface-variant">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-medium animate-pulse">Loading Comparison Matrix...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <main className="flex-grow p-margin-desktop space-y-6">
        <div className="p-4 bg-error/5 border border-error/20 rounded text-error text-body-sm flex items-center gap-3">
          <Icon name="error" />
          <span>{error || "Comparison data unavailable."}</span>
        </div>
      </main>
    );
  }

  const alpha = data.stalled_case || {};
  const beta = data.progressing_case || {};

  let alphaEvidence = {};
  let betaEvidence = {};
  try {
    if (alpha.evidence_json) {
      alphaEvidence =
        typeof alpha.evidence_json === "string"
          ? JSON.parse(alpha.evidence_json)
          : alpha.evidence_json;
    }
    if (beta.evidence_json) {
      betaEvidence =
        typeof beta.evidence_json === "string"
          ? JSON.parse(beta.evidence_json)
          : beta.evidence_json;
    }
  } catch (e) {
    console.error("Failed to parse evidence JSONs", e);
  }

  const alphaScores = alphaEvidence.component_scores || {};
  const betaScores = betaEvidence.component_scores || {};
  const scoreGap = ((alpha.triage_score || 0) - (beta.triage_score || 0)).toFixed(1);

  const comparisonChartData = [
    {
      dimension: "Structural (30%)",
      Alpha: alphaScores.score_structural_deviation || 0,
      Beta: betaScores.score_structural_deviation || 0,
    },
    {
      dimension: "Inactivity (25%)",
      Alpha: alphaScores.score_inactivity || 0,
      Beta: betaScores.score_inactivity || 0,
    },
    {
      dimension: "Age (15%)",
      Alpha: alphaScores.score_age_deviation || 0,
      Beta: betaScores.score_age_deviation || 0,
    },
    {
      dimension: "Adjournment (10%)",
      Alpha: alphaScores.score_adjournment || 0,
      Beta: betaScores.score_adjournment || 0,
    },
    {
      dimension: "Actionability (20%)",
      Alpha: alphaScores.score_actionability || 0,
      Beta: betaScores.score_actionability || 0,
    },
  ];

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
      <main className="flex-1 p-margin-mobile md:p-margin-desktop max-w-[1280px] mx-auto w-full space-y-gutter">
        {/* Page header */}
        <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-4 border-b border-outline-variant pb-4">
          <div>
            <h1 className="text-headline-lg font-headline-lg text-primary">
              Demo Contrast: CASE-ALPHA vs. CASE-BETA
            </h1>
            <p className="text-body-md font-body-md text-on-surface-variant mt-1">
              Side-by-side audit of two 5-year-old pending cases.
            </p>
          </div>
          <div className="px-4 py-2 bg-error/5 border border-error/20 rounded flex items-center gap-2 self-start">
            <Icon name="warning" className="text-error" />
            <span className="text-label-md font-label-md text-error">
              Triage Score Gap: +{scoreGap} Points
            </span>
          </div>
        </div>

        {/* Narrative Box */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded p-6 shadow-sm space-y-2">
          <h3 className="text-headline-sm font-headline-sm text-primary flex items-center gap-2">
            <Icon name="balance" />
            <span>The 5-Year Case Dilemma</span>
          </h3>
          <p className="text-body-md font-body-md text-on-surface-variant leading-relaxed">
            Both cases have been pending since 2021 (~5 years) in Pune District Court. Traditional age-based sorting treats them identically. Nyaya-Drishti detects that Alpha is structurally stalled on an administrative service bottleneck, while Beta progresses normally.
          </p>
        </div>

        {/* Contrast Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-gutter">
          {/* CASE-ALPHA */}
          <div className="bg-surface-container-lowest border-2 border-error rounded p-6 shadow-md space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-headline-sm font-headline-sm text-error font-bold">CASE-ALPHA (Stalled)</h3>
                <span className="text-label-md font-label-md font-mono text-on-surface-variant">CNR: {alpha.synthetic_cnr}</span>
              </div>
              <span className="text-[32px] font-bold text-error leading-none">{alpha.triage_score?.toFixed(1)}</span>
            </div>

            <div className="flex flex-wrap gap-2">
              <BottleneckTag type={alpha.bottleneck_type} />
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-error/10 text-error">High Actionability</span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-body-sm font-body-sm text-on-surface-variant">
              <div className="p-3 bg-surface-bright border border-outline-variant rounded">
                <span className="block text-[10px] uppercase font-bold text-on-surface-variant mb-1">Days In Stage</span>
                <span className="text-headline-sm font-headline-sm text-error font-bold">{alpha.days_in_current_stage}d</span>
              </div>
              <div className="p-3 bg-surface-bright border border-outline-variant rounded">
                <span className="block text-[10px] uppercase font-bold text-on-surface-variant mb-1">Inactivity</span>
                <span className="text-headline-sm font-headline-sm text-error font-bold">{alpha.days_since_substantive_event}d</span>
              </div>
            </div>

            <div className="p-4 bg-surface-bright border border-outline-variant rounded text-body-sm font-body-sm text-on-surface-variant">
              <span className="font-bold text-error block mb-1">Triage Diagnosis:</span>
              <p className="leading-relaxed">{alpha.explanation_text}</p>
            </div>

            <Link
              to={`/cases/${alpha.id}`}
              className="w-full py-2 bg-error hover:bg-[#93000a] text-white rounded text-center text-label-md font-label-md font-semibold transition-colors block"
            >
              Inspect Case-Alpha Evidence
            </Link>
          </div>

          {/* CASE-BETA */}
          <div className="bg-surface-container-lowest border-2 border-emerald-500/50 rounded p-6 shadow-md space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-headline-sm font-headline-sm text-emerald-700 font-bold">CASE-BETA (Normal)</h3>
                <span className="text-label-md font-label-md font-mono text-on-surface-variant">CNR: {beta.synthetic_cnr}</span>
              </div>
              <span className="text-[32px] font-bold text-emerald-700 leading-none">{beta.triage_score?.toFixed(1)}</span>
            </div>

            <div className="flex flex-wrap gap-2">
              <BottleneckTag type={beta.bottleneck_type} />
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700">Low Actionability</span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-body-sm font-body-sm text-on-surface-variant">
              <div className="p-3 bg-surface-bright border border-outline-variant rounded">
                <span className="block text-[10px] uppercase font-bold text-on-surface-variant mb-1">Days In Stage</span>
                <span className="text-headline-sm font-headline-sm text-emerald-700 font-bold">{beta.days_in_current_stage}d</span>
              </div>
              <div className="p-3 bg-surface-bright border border-outline-variant rounded">
                <span className="block text-[10px] uppercase font-bold text-on-surface-variant mb-1">Inactivity</span>
                <span className="text-headline-sm font-headline-sm text-emerald-700 font-bold">{beta.days_since_substantive_event}d</span>
              </div>
            </div>

            <div className="p-4 bg-surface-bright border border-outline-variant rounded text-body-sm font-body-sm text-on-surface-variant">
              <span className="font-bold text-emerald-700 block mb-1">Triage Diagnosis:</span>
              <p className="leading-relaxed">{beta.explanation_text}</p>
            </div>

            <Link
              to={`/cases/${beta.id}`}
              className="w-full py-2 bg-surface border border-outline-variant hover:bg-surface-container-low text-primary text-center text-label-md font-label-md font-semibold transition-colors block"
            >
              Inspect Case-Beta Evidence
            </Link>
          </div>
        </div>

        {/* Recharts comparative bar chart */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded p-6 shadow-sm space-y-4">
          <div>
            <h3 className="text-headline-sm font-headline-sm text-primary flex items-center gap-2">
              <Icon name="leaderboard" />
              <span>Weight Distribution Comparison</span>
            </h3>
            <p className="text-body-sm font-body-sm text-on-surface-variant">
              Side-by-side component scores comparing Alpha vs Beta.
            </p>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={comparisonChartData} margin={{ top: 20, right: 20, left: 0, bottom: 20 }}>
                <XAxis dataKey="dimension" stroke="#76777d" fontSize={11} tickLine={false} />
                <YAxis stroke="#76777d" fontSize={11} tickLine={false} domain={[0, 35]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#ffffff",
                    borderColor: "#c6c6cd",
                    borderRadius: "4px",
                    fontSize: "12px",
                    color: "#191c1e",
                  }}
                />
                <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }} />
                <Bar dataKey="Alpha" fill="#ba1a1a" radius={[4, 4, 0, 0]} name="CASE-ALPHA (Stalled)" />
                <Bar dataKey="Beta" fill="#166534" radius={[4, 4, 0, 0]} name="CASE-BETA (Normal)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </main>

      <AppFooter />
    </>
  );
}
