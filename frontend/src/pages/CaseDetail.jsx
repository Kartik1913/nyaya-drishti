import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getCaseDetailApi, getCaseTimelineApi, getCaseCohortApi } from '../api/endpoints';
import ScoreBadge from '../components/ScoreBadge';
import BottleneckTag from '../components/BottleneckTag';
import ConfidenceBadge from '../components/ConfidenceBadge';
import DataLabelBadge from '../components/DataLabelBadge';
import { 
  ArrowLeft, 
  Calendar, 
  Building, 
  Layers, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  FileText, 
  Gavel, 
  UserCheck, 
  Mail, 
  RefreshCcw, 
  Scale, 
  FileCheck, 
  Users 
} from 'lucide-react';

const EVENT_ICONS = {
  STAGE_TRANSITION: Layers,
  SUMMONS_ISSUED: Mail,
  SUMMONS_RETURNED: FileCheck,
  HEARING: Gavel,
  ORDER: FileText,
  ADJOURNMENT: Clock,
  JUDGE_CHANGE: RefreshCcw,
  WITNESS_EXAM: Users,
};

const CaseDetail = () => {
  const { id } = useParams();
  const [caseData, setCaseData] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [cohort, setCohort] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
        console.error('Failed to load case detail:', err);
        setError(err.response?.data?.detail || 'Case not found or unable to load details.');
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-400">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-medium animate-pulse">Loading Case Evidence & Provenance...</p>
        </div>
      </div>
    );
  }

  if (error || !caseData) {
    return (
      <div className="space-y-4 py-8">
        <Link to="/queue" className="inline-flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Priority Queue</span>
        </Link>
        <div className="p-6 bg-rose-950/80 border border-rose-500/40 rounded-xl text-rose-300 text-sm flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <span>{error || 'Case could not be found'}</span>
        </div>
      </div>
    );
  }

  // Parse evidence JSON
  let evidence = {};
  try {
    if (caseData.evidence_json) {
      evidence = typeof caseData.evidence_json === 'string' 
        ? JSON.parse(caseData.evidence_json) 
        : caseData.evidence_json;
    }
  } catch (e) {
    console.error('Failed to parse evidence_json', e);
  }

  const compScores = evidence.component_scores || {};
  const isAlpha = caseData.is_demo_stalled;
  const isBeta = caseData.is_demo_progressing;

  return (
    <div className="space-y-6 pb-12">
      {/* Back Link & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            to="/queue"
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
            title="Return to Queue"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black tracking-tight text-slate-100 font-mono">
                {caseData.synthetic_cnr}
              </h1>
              <DataLabelBadge type="SYNTHETIC" />
              {isAlpha && (
                <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 text-xs font-bold">
                  ALPHA DEMO CASE
                </span>
              )}
              {isBeta && (
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-bold">
                  BETA DEMO CASE
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {caseData.case_type} &bull; {caseData.court_establishment} &bull; {caseData.district}, {caseData.state}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/comparison"
            className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-slate-700 transition flex items-center gap-1.5 cursor-pointer"
          >
            <span>Compare with Alpha/Beta</span>
          </Link>
        </div>
      </div>

      {/* Priority Score Hero Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-center">
          {/* Score Block */}
          <div className="space-y-1 text-center lg:text-left border-b lg:border-b-0 lg:border-r border-slate-800 pb-4 lg:pb-0 lg:pr-6">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Triage Priority Score
            </span>
            <div className="flex items-center justify-center lg:justify-start gap-3">
              <ScoreBadge score={caseData.triage_score} size="lg" />
            </div>
            <span className="text-[10px] text-slate-400 block mt-1">
              Derived via locked 30/25/15/10/20 formula
            </span>
          </div>

          {/* Key Attributes Block */}
          <div className="lg:col-span-3 space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <BottleneckTag type={caseData.bottleneck_type} size="lg" />
              <ConfidenceBadge confidence={caseData.triage_confidence} />
              <span className={`text-xs px-2.5 py-1 rounded-full font-semibold border ${
                evidence.actionability_level === 'HIGH'
                  ? 'bg-rose-950/70 text-rose-300 border-rose-500/40'
                  : evidence.actionability_level === 'MEDIUM'
                  ? 'bg-amber-950/70 text-amber-300 border-amber-500/40'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}>
                Actionability: {evidence.actionability_level || 'UNKNOWN'}
              </span>
            </div>

            {/* Explanation Template Box */}
            <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 text-xs text-slate-200 leading-relaxed shadow-inner">
              <div className="flex items-center gap-1.5 text-indigo-400 font-bold text-[11px] mb-1">
                <FileText className="w-3.5 h-3.5" />
                <span>Deterministic Triage Explanation:</span>
              </div>
              <p className="text-slate-300">
                {caseData.explanation_text || 'No explanation generated.'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Grid: 5-Component Score Breakdown + Cohort Reference */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Component 1: Score Breakdown */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-md space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Scale className="w-4 h-4 text-indigo-400" />
              <span>5-Component Score Breakdown</span>
            </h2>
            <span className="text-[10px] font-mono text-slate-400">Total: 100%</span>
          </div>

          <div className="space-y-4 text-xs">
            {/* 1. Structural Deviation */}
            <div>
              <div className="flex justify-between mb-1">
                <span className="font-semibold text-slate-300">1. Structural Stage Deviation (30% weight)</span>
                <span className="font-mono text-indigo-300 font-bold">
                  {compScores.score_structural_deviation ?? '-'} / 30.0 pts
                </span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-indigo-500 h-2 rounded-full transition-all" 
                  style={{ width: `${Math.min(100, (compScores.score_structural_deviation || 0) / 30 * 100)}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
                <span>In stage: {caseData.days_in_current_stage ?? '-'}d ({caseData.stage_deviation_ratio ? `${caseData.stage_deviation_ratio.toFixed(2)}x cohort` : 'N/A'})</span>
                <span>Raw: {compScores.raw_structural_deviation ?? 0}%</span>
              </div>
            </div>

            {/* 2. Substantive Inactivity */}
            <div>
              <div className="flex justify-between mb-1">
                <span className="font-semibold text-slate-300">2. Substantive Inactivity (25% weight)</span>
                <span className="font-mono text-indigo-300 font-bold">
                  {compScores.score_inactivity ?? '-'} / 25.0 pts
                </span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-indigo-500 h-2 rounded-full transition-all" 
                  style={{ width: `${Math.min(100, (compScores.score_inactivity || 0) / 25 * 100)}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
                <span>Dormant for: {caseData.days_since_substantive_event ?? '-'} days</span>
                <span>Raw: {compScores.raw_inactivity ?? 0}%</span>
              </div>
              {evidence.judge_change_grace_period && (
                <div className="text-[10px] text-cyan-400 mt-0.5 flex items-center gap-1">
                  <RefreshCcw className="w-2.5 h-2.5" />
                  <span>Bench Change within 60d: Inactivity contribution multiplied by 0.5 grace factor.</span>
                </div>
              )}
            </div>

            {/* 3. Cohort Age Deviation */}
            <div>
              <div className="flex justify-between mb-1">
                <span className="font-semibold text-slate-300">3. Cohort Age Percentile (15% weight)</span>
                <span className="font-mono text-indigo-300 font-bold">
                  {compScores.score_age_deviation ?? '-'} / 15.0 pts
                </span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-indigo-500 h-2 rounded-full transition-all" 
                  style={{ width: `${Math.min(100, (compScores.score_age_deviation || 0) / 15 * 100)}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
                <span>
                  {caseData.triage_confidence === 'LOW' 
                    ? 'Suppressed (Low Confidence cohort)' 
                    : `Age Percentile: ${compScores.raw_age_percentile ?? '-'}%`}
                </span>
                <span>Raw: {compScores.raw_age_percentile ?? 0}%</span>
              </div>
            </div>

            {/* 4. Adjournment Pattern */}
            <div>
              <div className="flex justify-between mb-1">
                <span className="font-semibold text-slate-300">4. Adjournment Pattern (10% weight)</span>
                <span className="font-mono text-indigo-300 font-bold">
                  {compScores.score_adjournment ?? '-'} / 10.0 pts
                </span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-indigo-500 h-2 rounded-full transition-all" 
                  style={{ width: `${Math.min(100, (compScores.score_adjournment || 0) / 10 * 100)}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
                <span>Streak: {caseData.adjournment_streak ?? 0} &bull; Total: {caseData.adjournment_count ?? 0}</span>
                <span>Raw: {compScores.raw_adjournment_streak ?? 0}%</span>
              </div>
            </div>

            {/* 5. Actionability */}
            <div>
              <div className="flex justify-between mb-1">
                <span className="font-semibold text-slate-300">5. Administrative Actionability (20% weight)</span>
                <span className="font-mono text-indigo-300 font-bold">
                  {compScores.score_actionability ?? '-'} / 20.0 pts
                </span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-indigo-500 h-2 rounded-full transition-all" 
                  style={{ width: `${Math.min(100, (compScores.score_actionability || 0) / 20 * 100)}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
                <span>Registry remedy: {evidence.bottleneck_type === 'SUMMONS_DELAY' ? 'Process server follow-up' : 'Administrative listing'}</span>
                <span>Raw: {compScores.raw_actionability ?? 0} pts</span>
              </div>
            </div>
          </div>
        </div>

        {/* Component 2: Cohort Benchmark & Metadata */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-md space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-400" />
              <span>Cohort Benchmark Context</span>
            </h2>
            <DataLabelBadge type="SYNTHETIC" />
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 space-y-1">
              <span className="text-slate-400 block text-[10px]">Cohort Size</span>
              <span className="font-mono font-bold text-slate-100 text-sm">{cohort?.cohort_size || evidence.cohort_size || 'N/A'}</span>
            </div>

            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 space-y-1">
              <span className="text-slate-400 block text-[10px]">Cohort Median Stage Duration</span>
              <span className="font-mono font-bold text-emerald-300 text-sm">{cohort?.median_days_in_stage || evidence.cohort_median_days_in_stage || 65} Days</span>
            </div>

            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 space-y-1">
              <span className="text-slate-400 block text-[10px]">Case Stage Duration</span>
              <span className="font-mono font-bold text-rose-400 text-sm">{caseData.days_in_current_stage} Days</span>
            </div>

            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 space-y-1">
              <span className="text-slate-400 block text-[10px]">Deviation Ratio</span>
              <span className="font-mono font-bold text-amber-300 text-sm">{caseData.stage_deviation_ratio ? `${caseData.stage_deviation_ratio.toFixed(2)}x` : 'N/A'}</span>
            </div>
          </div>

          {/* Case Metadata Table */}
          <div className="border-t border-slate-800 pt-4 space-y-2 text-xs">
            <div className="font-semibold text-slate-300 mb-2">Auditable Case Provenance</div>
            <div className="grid grid-cols-2 gap-y-2 text-slate-400 text-[11px]">
              <div>Filing Date: <span className="text-slate-200 font-mono">{caseData.filing_date}</span></div>
              <div>Registration Date: <span className="text-slate-200 font-mono">{caseData.registration_date || '-'}</span></div>
              <div>Pending Since: <span className="text-slate-200 font-mono">{caseData.pending_since}</span></div>
              <div>Stage Entered Date: <span className="text-slate-200 font-mono">{caseData.stage_entered_at || '-'}</span></div>
              <div>Current Stage: <span className="text-slate-200 font-medium">{caseData.current_stage}</span></div>
              <div>Next Hearing Date: <span className="text-slate-200 font-mono">{caseData.next_date || 'Not scheduled'}</span></div>
            </div>
          </div>
        </div>
      </div>

      {/* Vertical Case Event Timeline */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-indigo-400" />
              <span>Auditable Event Timeline</span>
            </h2>
            <p className="text-xs text-slate-400">
              Complete chronological proceedings from initial filing to current status
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400">
            {timeline.length} Total Events
          </span>
        </div>

        <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-800">
          {timeline.map((event, index) => {
            const Icon = EVENT_ICONS[event.event_type] || FileText;
            const isStageTransition = event.event_type === 'STAGE_TRANSITION';
            const isSummonsIssued = event.event_type === 'SUMMONS_ISSUED';
            const isJudgeChange = event.event_type === 'JUDGE_CHANGE';

            return (
              <div key={event.id || index} className="relative flex items-start gap-4 group">
                {/* Node Icon */}
                <div className={`absolute -left-6 top-0.5 w-6 h-6 rounded-full flex items-center justify-center border ${
                  event.is_substantive
                    ? 'bg-emerald-950 text-emerald-400 border-emerald-500/50'
                    : isStageTransition
                    ? 'bg-indigo-950 text-indigo-400 border-indigo-500/50'
                    : isJudgeChange
                    ? 'bg-cyan-950 text-cyan-400 border-cyan-500/50'
                    : 'bg-slate-900 text-slate-400 border-slate-700'
                }`}>
                  <Icon className="w-3 h-3" />
                </div>

                {/* Content Box */}
                <div className="flex-1 bg-slate-950/60 border border-slate-800 rounded-xl p-3.5 space-y-1.5 shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-200">
                        {isJudgeChange ? 'Bench Change' : event.event_type.replace('_', ' ')}
                      </span>
                      {event.is_substantive && (
                        <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-semibold">
                          Substantive Hearing
                        </span>
                      )}
                      {isStageTransition && event.new_stage && (
                        <span className="px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-semibold">
                          Transitioned to: {event.new_stage}
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] font-mono text-slate-400">
                      {event.event_date}
                    </span>
                  </div>

                  {event.description && (
                    <p className="text-xs text-slate-400 leading-relaxed">
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
  );
};

export default CaseDetail;
