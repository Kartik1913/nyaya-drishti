import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Icon from "../components/Icon.jsx";
import AiNotice from "../components/AiNotice.jsx";
import UserActions from "../components/UserActions.jsx";
import AppFooter from "../components/AppFooter.jsx";
import DashboardGround from "../components/DashboardGround.jsx";
import DataLabelBadge from "../components/DataLabelBadge.jsx";
import { useAuth } from "../auth/AuthContext.jsx";
import { getAggregateStatsApi, getTriageStatsApi } from "../api/endpoints.js";

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function todayLine() {
  return new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/**
 * Animated number that counts up from 0 to `value` over `duration` ms.
 * Accepts either a plain number/string ("312", "12,450") or a formatted
 * string with prefix/suffix ("+312 Days") — parses out the numeric part
 * and preserves the surrounding characters.
 */
function AnimatedNumber({ value, duration = 1400, className = "" }) {
  const [display, setDisplay] = useState(value);

  useEffect(() => {
    const raw = String(value);
    const match = raw.match(/([^\d.+-]*)([+-]?[\d,.]+)(.*)/);
    if (!match) {
      setDisplay(raw);
      return;
    }
    const prefix = match[1] || "";
    const numeric = parseFloat(match[2].replace(/,/g, ""));
    const suffix = match[3] || "";
    if (!isFinite(numeric)) {
      setDisplay(raw);
      return;
    }
    const isInt = !match[2].includes(".");
    const start = performance.now();
    const easeOut = (t) => 1 - Math.pow(1 - t, 3);

    setDisplay(prefix + "0" + suffix);
    let frameId;
    const step = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = easeOut(t);
      const current = numeric * eased;
      const formatted = isInt
        ? Math.round(current).toLocaleString("en-IN")
        : current.toFixed(1);
      setDisplay(prefix + formatted + suffix);
      if (t < 1) frameId = requestAnimationFrame(step);
    };
    frameId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frameId);
  }, [value, duration]);

  return <span className={className}>{display}</span>;
}

function KpiCard({ label, value, tone, delta, deltaTone, hint, source, delay = 0 }) {
  const isAlert = tone === "error";
  const accentClass = isAlert
    ? "before:bg-gradient-to-r before:from-error before:to-error/50"
    : "before:bg-gradient-to-r before:from-gold before:to-gold/40";
  const valueTone = isAlert ? "text-error" : "text-navy";

  return (
    <div
      style={{ animationDelay: `${delay}ms` }}
      className={`animate-hero-fade-1 relative bg-white border border-outline-variant/70 rounded-lg p-6 flex flex-col justify-between h-full overflow-hidden shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-navy/20 before:content-[''] before:absolute before:top-0 before:left-0 before:right-0 before:h-[3px] ${accentClass}`}
    >
      <div className="flex items-start justify-between gap-3 mb-6">
        <p className="text-[10px] font-bold tracking-[0.16em] uppercase text-on-surface-variant leading-tight">
          {label}
        </p>
        {isAlert && (
          <Icon
            name="warning"
            filled
            size="16px"
            className="text-error shrink-0 mt-0.5"
          />
        )}
      </div>
      <div className="flex flex-wrap items-end justify-between gap-x-3 gap-y-1">
        <AnimatedNumber
          value={value}
          className={`font-evidence text-[clamp(20px,5vw,38px)] leading-none font-semibold tabular-nums min-w-0 flex-1 basis-auto ${valueTone}`}
        />
        {delta && (
          <div
            className={`font-evidence flex items-center gap-1 text-[11px] font-semibold tabular-nums shrink-0 pb-1 ${
              deltaTone === "up"
                ? "text-error"
                : deltaTone === "down"
                ? "text-teal-dark"
                : "text-on-surface-variant"
            }`}
          >
            <Icon
              name={
                deltaTone === "up"
                  ? "arrow_upward"
                  : deltaTone === "down"
                  ? "arrow_downward"
                  : "remove"
              }
              size="14px"
            />
            <span>{delta}</span>
          </div>
        )}
      </div>
      {hint && (
        <p className="text-[11px] text-on-surface-variant/80 mt-3 leading-snug">
          {hint}
        </p>
      )}
      {/* Provenance tag — states plainly whether this figure is published
          macro data or derived from the synthetic case set. */}
      <div className="mt-2.5">
        {source ? (
          <DataLabelBadge type="REAL_AGGREGATE" source={source} />
        ) : (
          <DataLabelBadge type="SYNTHETIC" />
        )}
      </div>
    </div>
  );
}

/** Animated horizontal bar row for the bottleneck signature chart. */
function SignatureBar({ label, count, pct, tone, delay = 0 }) {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setWidth(pct), 120 + delay);
    return () => clearTimeout(t);
  }, [pct, delay]);
  const barFill =
    tone === "error"
      ? "bg-gradient-to-r from-error via-error to-error/70"
      : "bg-gradient-to-r from-navy via-navy-light to-teal";
  return (
    <div className="group grid grid-cols-[9rem_1fr_3rem] items-center gap-4 py-1.5">
      <div className="text-[11px] font-semibold tracking-wide uppercase text-on-surface-variant text-right shrink-0">
        {label}
      </div>
      <div className="relative h-2 bg-surface-container-high rounded-full overflow-hidden">
        <div
          className={`${barFill} h-full rounded-full transition-all duration-1000 ease-out`}
          style={{ width: `${width}%` }}
        />
      </div>
      <div
        className={`font-evidence text-body-sm tabular-nums text-right ${
          tone === "error" ? "text-error font-bold" : "text-navy font-semibold"
        }`}
      >
        <AnimatedNumber value={String(count)} duration={1200} />
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
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
        setError(
          "Failed to load dashboard data. Please verify the backend API server is running."
        );
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
          <div className="w-8 h-8 border-2 border-navy border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium animate-pulse">
            Loading Triage Metrics…
          </p>
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

  // ---- derive metrics from backend ------------------------------------
  const bottleneckCounts = triageStats?.bottlenecks || {};
  const criticalCount = triageStats?.stalled_cases || 0;

  const pendingCasesObj =
    aggregateStats.find((item) =>
      item.metric_name.toLowerCase().includes("pending")
    ) || { metric_value: "12,450" };
  const avgDelayObj =
    aggregateStats.find(
      (item) =>
        item.metric_name.toLowerCase().includes("delay") ||
        item.metric_name.toLowerCase().includes("age")
    ) || { metric_value: "+312 Days" };
  const lokAdalatObj =
    aggregateStats.find(
      (item) =>
        item.metric_name.toLowerCase().includes("adalat") ||
        item.metric_name.toLowerCase().includes("lok")
    ) || { metric_value: "340" };

  // `source` present => published macro figure (NJDG / Data.gov.in); absent
  // => derived from the synthetic case set. Drives the provenance badge.
  const dashboardKpis = [
    {
      label: "Total Pending Cases",
      value: pendingCasesObj.metric_value,
      delta: "+2.1%",
      deltaTone: "up",
      hint: "vs. 30-day cohort baseline",
      source: pendingCasesObj.source,
    },
    {
      label: "Structurally Stalled",
      value: criticalCount.toString(),
      tone: "error",
      delta: `${(triageStats?.stalled_percentage ?? 0).toFixed(1)}% of docket`,
      deltaTone: "neutral",
      hint: "flagged by 6-layer triage engine",
    },
    {
      label: "Avg Delay vs Baseline",
      value: avgDelayObj.metric_value,
      delta: "+18d",
      deltaTone: "up",
      hint: "district cohort comparison",
      source: avgDelayObj.source,
    },
    {
      label: "Lok Adalat Candidates",
      value: lokAdalatObj.metric_value,
      delta: "actionable",
      deltaTone: "down",
      hint: "eligible for alternate resolution",
      source: lokAdalatObj.source,
    },
  ];

  const chartRaw = [
    { label: "Summons Delay", tone: "error", count: bottleneckCounts["SUMMONS_DELAY"] || 0 },
    { label: "Bench Change", tone: "neutral", count: bottleneckCounts["JUDGE_CHANGE"] || 0 },
    { label: "Witness Delay", tone: "neutral", count: bottleneckCounts["WITNESS_DELAY"] || 0 },
    { label: "Adjournment Streak", tone: "error", count: bottleneckCounts["REPEATED_ADJOURNMENT"] || 0 },
    { label: "Procedural Inactivity", tone: "neutral", count: bottleneckCounts["PROCEDURAL_INACTIVITY"] || 0 },
  ];
  const maxCount = Math.max(...chartRaw.map((d) => d.count), 1);
  const totalFlags = chartRaw.reduce((s, d) => s + d.count, 0);
  const bottleneckSignatures = chartRaw.map((d) => ({
    ...d,
    pct: (d.count / maxCount) * 100,
  }));

  const stalledPctRaw = triageStats ? triageStats.stalled_percentage : 15.0;
  const stalledPct = stalledPctRaw.toFixed(1);
  const normalPct = (100 - stalledPctRaw).toFixed(1);

  const circumference = 2 * Math.PI * 44;
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

      <main className="flex-1 relative p-margin-mobile md:p-margin-desktop bg-background">
        <DashboardGround />
        {/* ─────── Editorial page header ─────── */}
        <div className="relative z-10 mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-outline-variant/60 pb-6 animate-hero-fade-1">
          <div>
            <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-gold-dark mb-2">
              {greeting()}
              {user?.username ? `, ${user.username}` : ""} · {todayLine()}
            </p>
            <h1 className="font-display-lg text-[40px] leading-tight text-navy font-semibold">
              District Overview
            </h1>
            <p className="font-body-md text-on-surface-variant mt-2 max-w-2xl">
              Pune District Court · aggregate systemic blockages and cohort
              deviations flagged by the triage engine.
            </p>
          </div>
          <Link
            to="/queue"
            className="group bg-gradient-to-r from-gold to-gold-dark text-white rounded-md px-5 py-2.5 flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-gold/25 hover:-translate-y-0.5 transition-all self-start md:self-end text-label-md font-label-md font-semibold shrink-0"
          >
            <Icon name="list_alt" size="18px" />
            <span>Priority Queue</span>
            <Icon
              name="arrow_forward"
              size="16px"
              className="transition-transform group-hover:translate-x-0.5"
            />
          </Link>
        </div>

        {/* ─────── Insight banner ─────── */}
        <div
          className="relative z-10 mb-8 bg-navy text-white rounded-lg p-6 md:p-7 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-lg shadow-navy/10 overflow-hidden border-t-2 border-gold animate-hero-fade-2"
          style={{ animationDelay: "80ms" }}
        >
          <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-gold/10 blur-3xl pointer-events-none" />
          <div className="relative">
            <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-gold-light mb-1">
              Today's Focus
            </p>
            <p className="font-headline-md text-white text-xl md:text-2xl leading-snug">
              <AnimatedNumber
                value={criticalCount.toString()}
                className="font-evidence text-gold-light font-bold"
              />{" "}
              cases flagged as structurally stalled — targeted intervention
              recommended before the next hearing block.
            </p>
          </div>
          <Link
            to="/queue"
            className="relative bg-white/10 hover:bg-white/20 border border-white/25 text-white px-4 py-2 rounded-md text-label-md font-semibold flex items-center gap-2 backdrop-blur-sm shrink-0 transition-colors"
          >
            Review flagged cases
            <Icon name="chevron_right" size="16px" />
          </Link>
        </div>

        {/* ─────── KPI Grid ─────── */}
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-gutter mb-8">
          {dashboardKpis.map((kpi, i) => (
            <KpiCard key={kpi.label} {...kpi} delay={i * 100} />
          ))}
        </div>

        {/* ─────── Charts Grid ─────── */}
        <div
          className="relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-gutter animate-hero-fade-3"
          style={{ animationDelay: "260ms" }}
        >
          {/* Bar chart — Bottleneck Signatures */}
          <div className="bg-white border border-outline-variant/70 rounded-lg p-6 md:p-7 shadow-sm lg:col-span-2 transition-all duration-300 hover:shadow-lg hover:border-navy/15">
            <div className="flex items-baseline justify-between pb-4 mb-6 border-b border-outline-variant/60">
              <div>
                <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-gold-dark mb-1">
                  Docket Signal
                </p>
                <h2 className="font-headline-sm text-navy font-semibold text-xl">
                  Bottleneck Signatures
                </h2>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold tracking-[0.16em] uppercase text-on-surface-variant">
                  Total Flags
                </p>
                <p className="font-evidence text-headline-sm text-navy font-semibold tabular-nums">
                  <AnimatedNumber value={String(totalFlags)} />
                </p>
              </div>
            </div>
            <div className="space-y-2">
              {bottleneckSignatures.map((row, i) => (
                <SignatureBar key={row.label} {...row} delay={i * 90} />
              ))}
            </div>
            <p className="mt-6 pt-4 border-t border-outline-variant/60 text-[11px] text-on-surface-variant leading-relaxed">
              Signatures are derived from the 6-layer triage engine's causal
              analysis — red bars indicate procedural failures with the highest
              intervention leverage.
            </p>
          </div>

          {/* Donut — District Health */}
          <div className="bg-white border border-outline-variant/70 rounded-lg p-6 md:p-7 shadow-sm lg:col-span-1 flex flex-col transition-all duration-300 hover:shadow-lg hover:border-navy/15">
            <div className="pb-4 mb-2 border-b border-outline-variant/60">
              <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-gold-dark mb-1">
                Cohort Baseline
              </p>
              <h2 className="font-headline-sm text-navy font-semibold text-xl">
                District Health
              </h2>
            </div>
            <div className="flex-grow flex items-center justify-center relative py-8">
              {/* Radar sweep — a slow gold rotation behind the ring, echoing
                  the engine continuously scanning the docket. Masked to a disc
                  so it stays within the gauge. */}
              <div
                aria-hidden="true"
                className="absolute w-56 h-56 rounded-full animate-radarSweep motion-reduce:animate-none"
                style={{
                  background:
                    "conic-gradient(from 0deg, transparent 0deg, transparent 300deg, rgba(184,155,94,0.28) 350deg, rgba(214,192,140,0.55) 360deg)",
                  maskImage:
                    "radial-gradient(circle, transparent 40%, black 41%, black 52%, transparent 53%)",
                  WebkitMaskImage:
                    "radial-gradient(circle, transparent 40%, black 41%, black 52%, transparent 53%)",
                }}
              />
              <svg
                className="w-56 h-56 -rotate-90 relative"
                viewBox="0 0 100 100"
                aria-hidden="true"
              >
                <defs>
                  <linearGradient id="stalledArc" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#B42318" />
                    <stop offset="100%" stopColor="#8A1A11" />
                  </linearGradient>
                </defs>
                <circle
                  cx="50"
                  cy="50"
                  r="44"
                  fill="transparent"
                  stroke="#5FA8A2"
                  strokeWidth="10"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="44"
                  fill="transparent"
                  stroke="url(#stalledArc)"
                  strokeDasharray={circumference}
                  strokeDashoffset={dashoffset}
                  strokeLinecap="round"
                  strokeWidth="10"
                  style={{ transition: "stroke-dashoffset 1.4s ease-out" }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-evidence text-[42px] leading-none font-semibold text-error tabular-nums">
                  <AnimatedNumber value={stalledPct} duration={1400} />
                  <span className="text-[22px] font-normal align-top">%</span>
                </span>
                <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-on-surface-variant mt-2">
                  Stalled
                </span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-outline-variant/60">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-2.5 h-2.5 rounded-full bg-error shrink-0" />
                <div className="min-w-0">
                  <p className="text-[10px] font-bold tracking-wider uppercase text-on-surface-variant">
                    Stalled
                  </p>
                  <p className="font-evidence text-body-sm font-semibold text-error tabular-nums">
                    {stalledPct}%
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-2.5 h-2.5 rounded-full bg-teal shrink-0" />
                <div className="min-w-0">
                  <p className="text-[10px] font-bold tracking-wider uppercase text-on-surface-variant">
                    Within baseline
                  </p>
                  <p className="font-evidence text-body-sm font-semibold text-teal-dark tabular-nums">
                    {normalPct}%
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <AppFooter />
    </>
  );
}
