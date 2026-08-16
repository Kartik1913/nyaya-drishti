import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAggregateStatsApi, getPriorityQueueApi, getDemoComparisonApi } from '../api/endpoints';
import DataLabelBadge from '../components/DataLabelBadge';
import ScoreBadge from '../components/ScoreBadge';
import BottleneckTag from '../components/BottleneckTag';
import { 
  Building2, 
  Layers, 
  AlertCircle, 
  Clock, 
  Activity, 
  ArrowRight, 
  Scale, 
  GitCompare, 
  ShieldCheck, 
  TrendingUp 
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  Cell 
} from 'recharts';

const Dashboard = () => {
  const [aggregateStats, setAggregateStats] = useState([]);
  const [queueSummary, setQueueSummary] = useState(null);
  const [comparison, setComparison] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [aggData, queueData, compData] = await Promise.all([
          getAggregateStatsApi(),
          getPriorityQueueApi(1, 100),
          getDemoComparisonApi(),
        ]);
        setAggregateStats(aggData);
        setQueueSummary(queueData);
        setComparison(compData);
      } catch (err) {
        console.error('Failed to load dashboard metrics:', err);
        setError('Failed to load dashboard data. Please verify the backend API server is running.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-400">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-medium animate-pulse">Loading Judicial Context & Triage Metrics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-rose-950/60 border border-rose-500/40 rounded-xl text-rose-300 text-sm flex items-center gap-3">
        <AlertCircle className="w-5 h-5 shrink-0" />
        <span>{error}</span>
      </div>
    );
  }

  // Calculate bottleneck distribution from queue sample
  const bottleneckCounts = {};
  let criticalCount = 0;
  let mediumCount = 0;
  let normalCount = 0;

  if (queueSummary?.cases) {
    queueSummary.cases.forEach((c) => {
      const type = c.bottleneck_type || 'UNKNOWN';
      bottleneckCounts[type] = (bottleneckCounts[type] || 0) + 1;

      const score = c.triage_score || 0;
      if (score >= 80) criticalCount++;
      else if (score >= 50) mediumCount++;
      else normalCount++;
    });
  }

  const chartData = [
    { name: 'Summons Delay', key: 'SUMMONS_DELAY', count: bottleneckCounts['SUMMONS_DELAY'] || 0, color: '#a855f7' },
    { name: 'Bench Change', key: 'JUDGE_CHANGE', count: bottleneckCounts['JUDGE_CHANGE'] || 0, color: '#06b6d4' },
    { name: 'Witness Delay', key: 'WITNESS_DELAY', count: bottleneckCounts['WITNESS_DELAY'] || 0, color: '#f97316' },
    { name: 'Adjournment Streak', key: 'REPEATED_ADJOURNMENT', count: bottleneckCounts['REPEATED_ADJOURNMENT'] || 0, color: '#f43f5e' },
    { name: 'Inactivity', key: 'PROCEDURAL_INACTIVITY', count: bottleneckCounts['PROCEDURAL_INACTIVITY'] || 0, color: '#eab308' },
    { name: 'Normal Progression', key: 'UNKNOWN', count: bottleneckCounts['UNKNOWN'] || 0, color: '#10b981' },
  ];

  return (
    <div className="space-y-8 pb-12">
      {/* Top Banner / Hero */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800/90 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-semibold uppercase tracking-wider">
                Court Establishment: Pune District Court
              </span>
              <DataLabelBadge type="SYNTHETIC" />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-slate-100">
              Administrative Pendency Triage Overview
            </h1>
            <p className="text-xs text-slate-300 leading-relaxed">
              Real-time administrative prioritization based on structural cohort stall deviation, substantive dormancy, and procedural bottlenecks. Separates genuine judicial deliberation from registry-actionable bottlenecks.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/queue"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition shadow-lg shadow-indigo-600/30 cursor-pointer"
            >
              <span>View Priority Queue</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/comparison"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs transition cursor-pointer"
            >
              <GitCompare className="w-4 h-4 text-indigo-400" />
              <span>Demo Comparison</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Section 1: Real NJDG Macro Context */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Building2 className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-bold text-slate-100">
              National & District Pendency Context
            </h2>
          </div>
          <DataLabelBadge type="REAL_AGGREGATE" source="NJDG / Data.gov.in" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {aggregateStats.map((item) => (
            <div
              key={item.id}
              className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-sm relative overflow-hidden flex flex-col justify-between"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <span className="text-[11px] font-medium text-slate-400 leading-tight">
                  {item.metric_name}
                </span>
                <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-500/30">
                  {item.source}
                </span>
              </div>
              <div className="text-xl font-black text-slate-100 tracking-tight my-1">
                {item.metric_value}
              </div>
              {item.notes && (
                <div className="text-[10px] text-slate-400 line-clamp-2 border-t border-slate-800/80 pt-2 mt-1">
                  {item.notes}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Section 2: Synthetic Establishment Triage Summary */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Layers className="w-5 h-5 text-indigo-400" />
            <h2 className="text-base font-bold text-slate-100">
              Establishment Triage & Bottleneck Distribution
            </h2>
          </div>
          <DataLabelBadge type="SYNTHETIC" />
        </div>

        {/* 3 Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-sm space-y-1">
            <div className="text-xs text-slate-400 font-medium flex items-center justify-between">
              <span>Total Seeded Cases</span>
              <DataLabelBadge type="SYNTHETIC" />
            </div>
            <div className="text-2xl font-black text-slate-100">
              {queueSummary?.total || 1000}
            </div>
            <div className="text-[11px] text-slate-400">
              Across Civil Suits (CPC) in Pune District Court
            </div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-sm space-y-1">
            <div className="text-xs text-slate-400 font-medium flex items-center justify-between">
              <span>Critical Actionable Review (Score &ge; 80)</span>
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
            </div>
            <div className="text-2xl font-black text-rose-400 flex items-center gap-2">
              {criticalCount}
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-rose-950/80 border border-rose-500/40 text-rose-300">
                Top Priority
              </span>
            </div>
            <div className="text-[11px] text-slate-400">
              Includes CASE-ALPHA (Score 91.4, Summons Delay)
            </div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-sm space-y-1">
            <div className="text-xs text-slate-400 font-medium flex items-center justify-between">
              <span>Cohort Dynamic Median Duration</span>
              <Clock className="w-3.5 h-3.5 text-indigo-400" />
            </div>
            <div className="text-2xl font-black text-indigo-300">
              65.0 <span className="text-sm font-normal text-slate-400">Days</span>
            </div>
            <div className="text-[11px] text-slate-400">
              Median stage baseline for 2020/2021 Civil Suits
            </div>
          </div>
        </div>

        {/* Bottleneck Distribution Bar Chart */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-100">
                Procedural Bottleneck Classification
              </h3>
              <p className="text-xs text-slate-400">
                Deterministic rule-based classification across the priority queue
              </p>
            </div>
            <span className="text-xs text-slate-400 font-mono">
              Sample size: {queueSummary?.cases?.length || 0}
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <XAxis 
                  dataKey="name" 
                  stroke="#64748b" 
                  fontSize={11} 
                  tickLine={false} 
                  interval={0}
                  angle={-15}
                  textAnchor="end"
                />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#0f172a', 
                    borderColor: '#334155', 
                    borderRadius: '8px', 
                    fontSize: '12px',
                    color: '#f8fafc'
                  }} 
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Section 3: Demo Spotlight (Alpha vs Beta) */}
      {comparison && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Scale className="w-5 h-5 text-indigo-400" />
              <h2 className="text-base font-bold text-slate-100">
                Demo Spotlight: The 5-Year Case Contrast
              </h2>
            </div>
            <Link
              to="/comparison"
              className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
            >
              <span>Full Side-by-Side Analysis</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            Both cases have been pending for ~5 years (since 2021). Without triage, age-based sorting treats them identically. Nyaya-Drishti detects that Alpha is structurally stalled on an administrative service bottleneck, while Beta is progressing normally.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Alpha Card */}
            <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-500/40 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-rose-300">CASE-ALPHA</span>
                  <DataLabelBadge type="SYNTHETIC" />
                </div>
                <ScoreBadge score={comparison.stalled_case?.triage_score} />
              </div>
              <div className="text-xs font-mono text-slate-400">
                CNR: {comparison.stalled_case?.synthetic_cnr}
              </div>
              <div className="flex items-center gap-2">
                <BottleneckTag type={comparison.stalled_case?.bottleneck_type} />
                <span className="text-xs text-rose-400 font-semibold">
                  287d Dormant &bull; 5 Adjournments
                </span>
              </div>
              <p className="text-xs text-slate-300 line-clamp-2">
                {comparison.stalled_case?.explanation_text}
              </p>
            </div>

            {/* Beta Card */}
            <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/40 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-emerald-300">CASE-BETA</span>
                  <DataLabelBadge type="SYNTHETIC" />
                </div>
                <ScoreBadge score={comparison.progressing_case?.triage_score} />
              </div>
              <div className="text-xs font-mono text-slate-400">
                CNR: {comparison.progressing_case?.synthetic_cnr}
              </div>
              <div className="flex items-center gap-2">
                <BottleneckTag type={comparison.progressing_case?.bottleneck_type} />
                <span className="text-xs text-emerald-400 font-semibold">
                  Active 21d ago &bull; 0 Adjournments
                </span>
              </div>
              <p className="text-xs text-slate-300 line-clamp-2">
                {comparison.progressing_case?.explanation_text}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
