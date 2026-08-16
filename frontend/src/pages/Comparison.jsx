import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getDemoComparisonApi } from '../api/endpoints';
import ScoreBadge from '../components/ScoreBadge';
import BottleneckTag from '../components/BottleneckTag';
import DataLabelBadge from '../components/DataLabelBadge';
import { 
  GitCompare, 
  AlertCircle, 
  ArrowUpRight, 
  Scale, 
  Clock, 
  Layers, 
  FileCheck, 
  ShieldCheck,
  TrendingDown,
  TrendingUp,
  Sparkles
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';

const Comparison = () => {
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
        console.error('Failed to load comparison:', err);
        setError('Failed to load demo comparison data.');
      } finally {
        setLoading(false);
      }
    };
    fetchComparison();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-400">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-medium animate-pulse">Loading Alpha vs. Beta Comparison Matrix...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 bg-rose-950/80 border border-rose-500/40 rounded-xl text-rose-300 text-sm flex items-center gap-3">
        <AlertCircle className="w-5 h-5 shrink-0" />
        <span>{error || 'Comparison data unavailable.'}</span>
      </div>
    );
  }

  const alpha = data.stalled_case || {};
  const beta = data.progressing_case || {};

  let alphaEvidence = {};
  let betaEvidence = {};
  try {
    if (alpha.evidence_json) {
      alphaEvidence = typeof alpha.evidence_json === 'string' ? JSON.parse(alpha.evidence_json) : alpha.evidence_json;
    }
    if (beta.evidence_json) {
      betaEvidence = typeof beta.evidence_json === 'string' ? JSON.parse(beta.evidence_json) : beta.evidence_json;
    }
  } catch (e) {
    console.error('Failed to parse evidence JSONs', e);
  }

  const alphaScores = alphaEvidence.component_scores || {};
  const betaScores = betaEvidence.component_scores || {};

  const scoreGap = ((alpha.triage_score || 0) - (beta.triage_score || 0)).toFixed(1);

  // Component breakdown comparison chart data
  const comparisonChartData = [
    {
      dimension: 'Structural Deviation (30%)',
      Alpha: alphaScores.score_structural_deviation || 0,
      Beta: betaScores.score_structural_deviation || 0,
    },
    {
      dimension: 'Substantive Inactivity (25%)',
      Alpha: alphaScores.score_inactivity || 0,
      Beta: betaScores.score_inactivity || 0,
    },
    {
      dimension: 'Cohort Age Percentile (15%)',
      Alpha: alphaScores.score_age_deviation || 0,
      Beta: betaScores.score_age_deviation || 0,
    },
    {
      dimension: 'Adjournment Pattern (10%)',
      Alpha: alphaScores.score_adjournment || 0,
      Beta: betaScores.score_adjournment || 0,
    },
    {
      dimension: 'Actionability (20%)',
      Alpha: alphaScores.score_actionability || 0,
      Beta: betaScores.score_actionability || 0,
    },
  ];

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <GitCompare className="w-6 h-6 text-indigo-400" />
            <h1 className="text-2xl font-black tracking-tight text-slate-100">
              Demo Contrast: CASE-ALPHA vs. CASE-BETA
            </h1>
            <DataLabelBadge type="SYNTHETIC" />
          </div>
          <p className="text-xs text-slate-400">
            Side-by-side audit proving why calendar case-age alone is inadequate for administrative listing.
          </p>
        </div>

        {/* Score Gap Callout Pill */}
        <div className="flex items-center gap-2.5 px-4 py-2 bg-gradient-to-r from-rose-950/80 via-slate-900 to-emerald-950/80 border border-slate-700 rounded-xl shadow-lg">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span className="text-xs text-slate-300 font-medium">Triage Score Gap:</span>
          <span className="text-lg font-black font-mono text-rose-400">+{scoreGap}</span>
          <span className="text-xs text-slate-400">Points</span>
        </div>
      </div>

      {/* Hero Comparative Narrative */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 text-xs text-slate-300 leading-relaxed space-y-2">
        <div className="font-bold text-slate-100 flex items-center gap-2">
          <Scale className="w-4 h-4 text-indigo-400" />
          <span>The 5-Year Case Dilemma</span>
        </div>
        <p>
          Both <strong>CASE-ALPHA</strong> and <strong>CASE-BETA</strong> are Civil Suits instituted in 2021 (~5 years pending) in Pune District Court. Under traditional first-in-first-out or pure age-based pendency metrics, both cases occupy identical priority slots.
        </p>
        <p>
          <strong>Nyaya-Drishti's 6-Layer Triage Engine</strong> dissects stage duration against dynamic cohort baselines:
          Alpha has been trapped in <em>Summons / Appearance</em> for <strong>287 days (4.42x cohort median)</strong> due to missing service returns, whereas Beta had substantive proceedings <strong>21 days ago</strong> and progresses on schedule.
        </p>
      </div>

      {/* Side-by-Side Comparison Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CASE-ALPHA */}
        <div className="bg-slate-900/90 border-2 border-rose-500/50 rounded-2xl p-6 shadow-xl relative overflow-hidden space-y-5">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-black text-rose-300 uppercase tracking-wide">
                  CASE-ALPHA (Stalled)
                </span>
                <DataLabelBadge type="SYNTHETIC" />
              </div>
              <div className="font-mono text-xs text-slate-400 mt-1">
                CNR: {alpha.synthetic_cnr}
              </div>
            </div>
            <ScoreBadge score={alpha.triage_score} size="lg" />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <BottleneckTag type={alpha.bottleneck_type} size="lg" />
            <span className="text-xs px-2.5 py-1 rounded-full font-bold bg-rose-950/80 text-rose-300 border border-rose-500/40">
              HIGH Administrative Actionability
            </span>
          </div>

          {/* Metric Grid */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
              <span className="text-slate-400 block text-[10px]">Days In Current Stage</span>
              <span className="font-mono font-black text-rose-400 text-base">{alpha.days_in_current_stage}d</span>
              <span className="text-[10px] text-slate-500 block">4.42x cohort median (65d)</span>
            </div>

            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
              <span className="text-slate-400 block text-[10px]">Substantive Inactivity</span>
              <span className="font-mono font-black text-rose-400 text-base">{alpha.days_since_substantive_event}d</span>
              <span className="text-[10px] text-slate-500 block">Zero substantive hearings</span>
            </div>

            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
              <span className="text-slate-400 block text-[10px]">Adjournment Streak</span>
              <span className="font-mono font-black text-rose-400 text-base">{alpha.adjournment_streak} Adjournments</span>
              <span className="text-[10px] text-slate-500 block">Consecutive administrative delays</span>
            </div>

            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
              <span className="text-slate-400 block text-[10px]">Cohort Age Percentile</span>
              <span className="font-mono font-bold text-slate-200 text-base">{alpha.cohort_percentile}%</span>
              <span className="text-[10px] text-slate-500 block">Filing year 2021 cohort</span>
            </div>
          </div>

          {/* Explanation Box */}
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300 space-y-1">
            <span className="font-bold text-rose-300 text-[11px] block">Triage Engine Diagnosis:</span>
            <p>{alpha.explanation_text}</p>
          </div>

          <div className="pt-2">
            <Link
              to={`/cases/${alpha.id}`}
              className="w-full py-2 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs transition flex items-center justify-center gap-2 shadow-lg shadow-rose-600/20"
            >
              <span>Inspect Full Case-Alpha Evidence</span>
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* CASE-BETA */}
        <div className="bg-slate-900/90 border-2 border-emerald-500/50 rounded-2xl p-6 shadow-xl relative overflow-hidden space-y-5">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-black text-emerald-300 uppercase tracking-wide">
                  CASE-BETA (Progressing)
                </span>
                <DataLabelBadge type="SYNTHETIC" />
              </div>
              <div className="font-mono text-xs text-slate-400 mt-1">
                CNR: {beta.synthetic_cnr}
              </div>
            </div>
            <ScoreBadge score={beta.triage_score} size="lg" />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <BottleneckTag type={beta.bottleneck_type} size="lg" />
            <span className="text-xs px-2.5 py-1 rounded-full font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-500/40">
              LOW Administrative Actionability
            </span>
          </div>

          {/* Metric Grid */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
              <span className="text-slate-400 block text-[10px]">Days In Current Stage</span>
              <span className="font-mono font-black text-emerald-400 text-base">{beta.days_in_current_stage}d</span>
              <span className="text-[10px] text-slate-500 block">0.69x cohort median (65d)</span>
            </div>

            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
              <span className="text-slate-400 block text-[10px]">Substantive Inactivity</span>
              <span className="font-mono font-black text-emerald-400 text-base">{beta.days_since_substantive_event}d</span>
              <span className="text-[10px] text-slate-500 block">Substantive hearing 3 weeks ago</span>
            </div>

            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
              <span className="text-slate-400 block text-[10px]">Adjournment Streak</span>
              <span className="font-mono font-black text-emerald-400 text-base">{beta.adjournment_streak} Adjournments</span>
              <span className="text-[10px] text-slate-500 block">Zero stalled adjournments</span>
            </div>

            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
              <span className="text-slate-400 block text-[10px]">Cohort Age Percentile</span>
              <span className="font-mono font-bold text-slate-200 text-base">{beta.cohort_percentile}%</span>
              <span className="text-[10px] text-slate-500 block">Filing year 2021 cohort</span>
            </div>
          </div>

          {/* Explanation Box */}
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300 space-y-1">
            <span className="font-bold text-emerald-300 text-[11px] block">Triage Engine Diagnosis:</span>
            <p>{beta.explanation_text}</p>
          </div>

          <div className="pt-2">
            <Link
              to={`/cases/${beta.id}`}
              className="w-full py-2 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition flex items-center justify-center gap-2 border border-slate-700"
            >
              <span>Inspect Full Case-Beta Evidence</span>
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* Comparative Breakdown Chart */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div>
          <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-400" />
            <span>Component-by-Component Weight Distribution</span>
          </h2>
          <p className="text-xs text-slate-400">
            Comparing weighted score contributions across all 5 triage dimensions
          </p>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={comparisonChartData} margin={{ top: 20, right: 20, left: 0, bottom: 20 }}>
              <XAxis dataKey="dimension" stroke="#64748b" fontSize={11} tickLine={false} />
              <YAxis stroke="#64748b" fontSize={11} tickLine={false} domain={[0, 35]} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#0f172a', 
                  borderColor: '#334155', 
                  borderRadius: '8px', 
                  fontSize: '12px',
                  color: '#f8fafc' 
                }} 
              />
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
              <Bar dataKey="Alpha" fill="#f43f5e" radius={[4, 4, 0, 0]} name="CASE-ALPHA (Stalled)" />
              <Bar dataKey="Beta" fill="#10b981" radius={[4, 4, 0, 0]} name="CASE-BETA (Progressing)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Comparison;
