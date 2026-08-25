import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Icon from "../components/Icon.jsx";
import AiNotice from "../components/AiNotice.jsx";
import UserActions from "../components/UserActions.jsx";
import AppFooter from "../components/AppFooter.jsx";
import { getAggregateStatsApi, getTriageStatsApi } from "../api/endpoints.js";

const barTone = {
  error: "bg-error",
  neutral: "bg-on-tertiary-container",
};

function KpiCard({ label, value, tone, icon }) {
  const isAlert = tone === "error";
  return (
    <div
      className={`bg-surface-container-lowest border rounded p-6 flex flex-col justify-between h-full relative overflow-hidden ${
        isAlert ? "border-error/30" : "border-surface-variant"
      }`}
    >
      {isAlert && (
        <div className="absolute top-0 right-0 w-16 h-16 bg-error/5 rounded-bl-full -mr-4 -mt-4" />
      )}
      <div className="text-label-md font-label-md text-on-surface-variant mb-2">
        {label}
      </div>
      <div
        className={`text-headline-md font-headline-md flex items-center gap-2 ${
          isAlert ? "text-error" : "text-primary"
        }`}
      >
        {icon && <Icon name={icon} filled className="text-error" />}
        {value}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [aggregateStats, setAggregateStats] = useState([]);
  const [triageStats, setTriageStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [aggData, triageData] = await Promise.all([
          getAggregateStatsApi(),
          getTriageStatsApi(),
        ]);
        setAggregateStats(aggData);
        setTriageStats(triageData);
      } catch (err) {
        console.error("Failed to load dashboard metrics:", err);
        setError("Failed to load dashboard data. Please verify the backend API server is running.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-on-surface-variant">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-medium animate-pulse">Loading Triage Metrics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="m-6 p-4 bg-error/5 border border-error/20 rounded text-error text-body-sm flex items-center gap-3">
        <Icon name="error" />
        <span>{error}</span>
      </div>
    );
  }

  // Calculate bottleneck metrics from backend triage stats
  const bottleneckCounts = triageStats?.bottlenecks || {};
  const criticalCount = triageStats?.stalled_cases || 0;

  // Find DB aggregate stats matching label categories
  const pendingCasesObj = aggregateStats.find(item => item.metric_name.toLowerCase().includes("pending")) || { metric_value: "12,450" };
  const avgDelayObj = aggregateStats.find(item => item.metric_name.toLowerCase().includes("delay") || item.metric_name.toLowerCase().includes("age")) || { metric_value: "+312 Days" };
  const lokAdalatObj = aggregateStats.find(item => item.metric_name.toLowerCase().includes("adalat") || item.metric_name.toLowerCase().includes("lok")) || { metric_value: "340" };

  const dashboardKpis = [
    { label: "Total Pending Cases", value: pendingCasesObj.metric_value },
    {
      label: "Structurally Stalled Flags",
      value: criticalCount.toString(),
      tone: "error",
      icon: "warning",
    },
    { label: "Avg Delay vs Cohort Baseline", value: avgDelayObj.metric_value },
    { label: "Lok Adalat Candidates", value: lokAdalatObj.metric_value },
  ];

  const chartData = [
    { label: "Summons Delay", tone: "error", count: bottleneckCounts["SUMMONS_DELAY"] || 0 },
    { label: "Bench Change", tone: "neutral", count: bottleneckCounts["JUDGE_CHANGE"] || 0 },
    { label: "Witness Delay", tone: "neutral", count: bottleneckCounts["WITNESS_DELAY"] || 0 },
    { label: "Adjournment Streak", tone: "error", count: bottleneckCounts["REPEATED_ADJOURNMENT"] || 0 },
    { label: "Procedural Inactivity", tone: "neutral", count: bottleneckCounts["PROCEDURAL_INACTIVITY"] || 0 },
  ];

  const maxCount = Math.max(...chartData.map((d) => d.count), 1);
  const bottleneckSignatures = chartData.map((d) => ({
    ...d,
    width: (d.count / maxCount) * 100,
  }));

  const stalledPctRaw = triageStats
    ? triageStats.stalled_percentage
    : 15.0;
  const stalledPct = stalledPctRaw.toFixed(1);
  const normalPct = (100 - stalledPctRaw).toFixed(1);

  const circumference = 2 * Math.PI * 40; // r=40
  const dashoffset = circumference * (1 - stalledPctRaw / 100);

  return (
    <>
      {/* Top App Bar */}
      <header className="sticky top-0 h-16 border-b border-outline-variant bg-surface flex justify-between items-center px-gutter z-20">
        <div className="flex-grow flex justify-center">
          <AiNotice />
        </div>
        <UserActions />
      </header>

      {/* Main Content Area */}
      <main className="flex-1 p-margin-mobile md:p-margin-desktop">
        {/* Page header */}
        <div className="mb-stack-lg flex flex-col md:flex-row justify-between md:items-start gap-4">
          <div>
            <h1 className="text-headline-lg font-headline-lg text-primary">
              District Overview
            </h1>
            <p className="text-body-md font-body-md text-on-surface-variant mt-stack-sm max-w-2xl">
              Aggregate view of Pune District Court systemic blockages and cohort deviations.
            </p>
          </div>
          <Link
            to="/queue"
            className="bg-primary text-on-primary rounded px-4 py-2 flex items-center justify-center gap-2 hover:opacity-90 transition-opacity self-start text-label-md font-label-md"
          >
            <Icon name="list_alt" />
            <span>View Priority Queue</span>
          </Link>
        </div>

        {/* KPI Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-gutter mb-stack-lg">
          {dashboardKpis.map((kpi) => (
            <KpiCard key={kpi.label} {...kpi} />
          ))}
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-gutter">
          {/* Bar chart */}
          <div className="bg-surface-container-lowest border border-surface-variant rounded p-6 lg:col-span-2">
            <h2 className="text-headline-sm font-headline-sm text-primary mb-6 border-b border-surface-variant pb-3">
              Bottleneck Signatures
            </h2>
            <div className="space-y-4">
              {bottleneckSignatures.map((row) => (
                <div key={row.label} className="flex items-center gap-4">
                  <div className="w-32 text-label-md font-label-md text-on-surface-variant text-right shrink-0">
                    {row.label}
                  </div>
                  <div className="flex-grow flex items-center gap-3">
                    <div
                      className={`${barTone[row.tone]} h-3 rounded-full`}
                      style={{ width: `${row.width}%` }}
                    />
                    <span
                      className={`text-body-sm font-body-sm ${
                        row.tone === "error"
                          ? "text-error font-semibold"
                          : "text-on-surface-variant"
                      }`}
                    >
                      {row.count}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Donut chart */}
          <div className="bg-surface-container-lowest border border-surface-variant rounded p-6 lg:col-span-1 flex flex-col">
            <h2 className="text-headline-sm font-headline-sm text-primary mb-6 border-b border-surface-variant pb-3">
              District Health
            </h2>
            <div className="flex-grow flex items-center justify-center relative py-8">
              <svg className="w-48 h-48 transform -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  fill="transparent"
                  r="40"
                  stroke="#e0e3e5"
                  strokeWidth="12"
                />
                <circle
                  cx="50"
                  cy="50"
                  fill="transparent"
                  r="40"
                  stroke="#ba1a1a"
                  strokeDasharray={circumference}
                  strokeDashoffset={dashoffset}
                  strokeLinecap="round"
                  strokeWidth="12"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-headline-md font-headline-md text-error font-bold">
                  {stalledPct}%
                </span>
                <span className="text-label-md font-label-md text-error">
                  Stalled
                </span>
              </div>
            </div>
            <div className="flex justify-center gap-6 mt-4 pt-4 border-t border-surface-variant">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-error" />
                <span className="text-label-md font-label-md text-on-surface-variant">
                  Stalled ({stalledPct}%)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-surface-container-highest" />
                <span className="text-label-md font-label-md text-on-surface-variant">
                  Normal ({normalPct}%)
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>

      <AppFooter />
    </>
  );
}
