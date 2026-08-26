import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import Icon from "../components/Icon.jsx";
import Badge from "../components/Badge.jsx";
import AppFooter from "../components/AppFooter.jsx";
import AiNotice from "../components/AiNotice.jsx";
import Reveal from "../components/Reveal.jsx";
import { likelihoodStyles } from "../data/mockData.js";
import { getCasesApi } from "../api/endpoints.js";

/**
 * Lok Adalat Referral Candidates.
 *
 * Previously rendered five hardcoded demo rows with hand-typed settlement
 * percentages — no computation behind them at all. Now reads every one of
 * your 1,000 real (synthetic) cases from the backend and ranks by
 * `settlement_score`, which is computed deterministically in
 * backend/triage/settlement.py from case stage, age, and adjournment
 * responsiveness — the same "no black box" philosophy as the main triage
 * score, not an ML model.
 */

function daysAgo(isoDate) {
  if (!isoDate) return null;
  const diff = Date.now() - new Date(isoDate).getTime();
  return Math.max(0, Math.floor(diff / 86400000));
}

const DECISIONS_STORAGE_KEY = "lokAdalatDecisions";

function loadStoredDecisions() {
  try {
    const raw = localStorage.getItem(DECISIONS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export default function LokAdalatDrafts() {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [decisions, setDecisions] = useState(loadStoredDecisions);
  const [likelihoodFilter, setLikelihoodFilter] = useState("");

  useEffect(() => {
    const fetchCases = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getCasesApi(1000);
        setCases(data || []);
      } catch (err) {
        console.error("Failed to load Lok Adalat candidates:", err);
        setError("Unable to load candidates. Please check connection to the backend.");
      } finally {
        setLoading(false);
      }
    };
    fetchCases();
  }, []);

  const decide = (cnr, status) =>
    setDecisions((prev) => {
      const next = { ...prev, [cnr]: status };
      try {
        localStorage.setItem(DECISIONS_STORAGE_KEY, JSON.stringify(next));
      } catch {
        // Storage unavailable (private browsing, quota) — decision still
        // applies for this session, just won't survive a refresh.
      }
      return next;
    });

  // Rank by settlement_score — highest-likelihood candidates first.
  const ranked = useMemo(
    () =>
      [...cases]
        .filter((c) => c.settlement_score != null)
        .sort((a, b) => (b.settlement_score ?? 0) - (a.settlement_score ?? 0)),
    [cases]
  );

  const visibleCandidates = likelihoodFilter
    ? ranked.filter((c) => c.settlement_likelihood === likelihoodFilter)
    : ranked;

  // Real, live summary metrics — no hand-typed numbers.
  const highCount = ranked.filter((c) => c.settlement_likelihood === "HIGH").length;
  const candidateCount = ranked.filter((c) => c.settlement_likelihood !== "LOW").length;
  const avgScore =
    ranked.length > 0
      ? (ranked.reduce((s, c) => s + (c.settlement_score ?? 0), 0) / ranked.length).toFixed(1)
      : "0.0";

  const summaryMetrics = [
    { label: "Eligible Candidates", value: candidateCount, hint: "High or moderate settlement likelihood" },
    { label: "High-Likelihood Cases", value: highCount, hint: "settlement_score ≥ 65" },
    { label: "Avg Settlement Score", value: `${avgScore}%`, hint: "across all scored cases" },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-on-surface-variant">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium animate-pulse">
            Scoring settlement candidates…
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Top App Bar */}
      <header className="sticky top-0 flex justify-center items-center px-gutter h-16 bg-surface border-b border-outline-variant z-20">
        <AiNotice text="Administrative Triage View Only" />
      </header>

      {/* Main Canvas */}
      <main className="flex-1 p-margin-mobile md:p-margin-desktop">
        <div className="max-w-[1280px] mx-auto space-y-stack-lg">
          {/* Page Header */}
          <Reveal variant="up">
            <div className="flex items-center gap-3 mb-2">
              <span className="h-px w-6 bg-gradient-to-r from-transparent to-gold" />
              <span className="font-label-md text-label-md uppercase tracking-[0.2em] text-gold-dark">
                Alternate Resolution
              </span>
            </div>
            <h2 className="text-headline-lg-mobile md:text-headline-lg font-headline-lg text-on-surface mb-stack-md">
              Lok Adalat Referral Candidates
            </h2>
            <div className="bg-navy text-white p-4 rounded-lg border-t-2 border-gold flex items-start gap-3">
              <Icon name="info" filled className="shrink-0 text-gold-light" />
              <p className="text-body-md font-body-md font-bold">
                Legal Boundary Notice: This system only flags compoundable
                offenses. Final referral requires mandatory party consent.
              </p>
            </div>
          </Reveal>

          {error && (
            <div className="p-4 bg-error/5 border border-error/20 rounded text-error text-body-sm flex items-center gap-3">
              <Icon name="error" />
              <span>{error}</span>
            </div>
          )}

          {/* Summary Metrics — computed live from the same data as the table below */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {summaryMetrics.map((m, i) => (
              <Reveal key={m.label} variant="rise" delay={80 + i * 100}>
                <div className="bg-surface-container-lowest border border-surface-variant border-t-2 border-t-gold/60 rounded-DEFAULT p-6 flex flex-col justify-between h-full transition-all duration-300 hover:-translate-y-1 hover:shadow-md">
                  <span className="text-label-md font-label-md text-on-surface-variant uppercase tracking-wider mb-2">
                    {m.label}
                  </span>
                  <span className="font-evidence text-display-lg text-primary tabular-nums mt-auto">
                    {m.value}
                  </span>
                  <span className="text-[11px] text-on-surface-variant/70 mt-2">
                    {m.hint}
                  </span>
                </div>
              </Reveal>
            ))}
          </div>

          {/* Review Queue — not wrapped in Reveal: the scroll-triggered
              reveal observer was unreliable on this specific section once it
              holds up to 100 rows (large content whose observed element grows
              well past the initial viewport), so it's rendered plainly. */}
          <div>
            <div className="bg-surface-container-lowest border border-surface-variant rounded-DEFAULT overflow-hidden">
              <div className="p-4 border-b border-surface-variant bg-surface-container-low flex flex-wrap justify-between items-center gap-3">
                <h3 className="text-headline-sm font-headline-sm text-on-surface">
                  Review Queue
                  <span className="ml-2 font-evidence text-body-sm text-on-surface-variant tabular-nums">
                    ({visibleCandidates.length})
                  </span>
                </h3>
                <div className="flex items-center gap-2">
                  <Icon
                    name="filter_list"
                    size="18px"
                    className="text-on-surface-variant"
                  />
                  <label
                    htmlFor="likelihood-filter"
                    className="text-label-md font-label-md text-on-surface-variant"
                  >
                    Likelihood:
                  </label>
                  <div className="relative">
                    <select
                      id="likelihood-filter"
                      value={likelihoodFilter}
                      onChange={(e) => setLikelihoodFilter(e.target.value)}
                      className="appearance-none bg-surface-container-lowest border border-outline-variant rounded-four pl-3 pr-8 py-1.5 text-body-sm font-body-sm outline-none focus:border-gold focus:ring-1 focus:ring-gold/40 transition-colors cursor-pointer hover:border-gold/40"
                    >
                      <option value="">All candidates</option>
                      <option value="HIGH">High</option>
                      <option value="MODERATE">Moderate</option>
                      <option value="LOW">Low</option>
                    </select>
                    <Icon
                      name="expand_more"
                      size="16px"
                      className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant"
                    />
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto w-full">
                <table className="w-full text-left border-collapse min-w-[820px]">
                  <thead>
                    <tr className="bg-surface-container-low text-label-md font-label-md text-on-surface-variant uppercase tracking-wider border-b border-surface-variant">
                      <th className="px-6 py-4 font-semibold whitespace-nowrap">
                        CNR Number
                      </th>
                      <th className="px-6 py-4 font-semibold whitespace-nowrap">
                        Current Stage
                      </th>
                      <th className="px-6 py-4 font-semibold whitespace-nowrap">
                        Case Age
                      </th>
                      <th className="px-6 py-4 font-semibold whitespace-nowrap">
                        Settlement Likelihood
                      </th>
                      <th className="px-6 py-4 font-semibold text-right whitespace-nowrap">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="text-body-md font-body-md divide-y divide-surface-variant">
                    {visibleCandidates.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center">
                          <div className="flex flex-col items-center gap-2.5">
                            <div className="w-11 h-11 rounded-full bg-gold/10 flex items-center justify-center">
                              <Icon
                                name="search_off"
                                size="22px"
                                className="text-gold-dark/70"
                              />
                            </div>
                            <p className="font-body-md font-semibold text-on-surface">
                              No candidates at this likelihood
                            </p>
                            <button
                              type="button"
                              onClick={() => setLikelihoodFilter("")}
                              className="text-body-sm text-secondary hover:underline"
                            >
                              Show all candidates
                            </button>
                          </div>
                        </td>
                      </tr>
                    )}
                    {visibleCandidates.slice(0, 100).map((c, i) => {
                      const decision = decisions[c.synthetic_cnr];
                      const age = daysAgo(c.filing_date);
                      return (
                        <tr
                          key={c.id}
                          className={`hover:bg-gold/5 transition-colors duration-150 ${
                            i % 2 === 1 ? "bg-surface-container-low" : ""
                          }`}
                        >
                          <td className="px-6 py-4 font-evidence font-medium text-primary">
                            <Link to={`/cases/${c.id}`} className="hover:underline">
                              {c.synthetic_cnr}
                            </Link>
                          </td>
                          <td className="px-6 py-4">{c.current_stage}</td>
                          <td className="px-6 py-4 font-evidence text-on-surface-variant tabular-nums">
                            {age != null ? `${age.toLocaleString("en-IN")} days` : "—"}
                          </td>
                          <td className="px-6 py-4">
                            <Badge className={likelihoodStyles[c.settlement_likelihood]}>
                              <span className="font-evidence">
                                {c.settlement_likelihood} - {c.settlement_score?.toFixed(0)}%
                              </span>
                            </Badge>
                          </td>
                          <td className="px-6 py-4 text-right">
                            {decision ? (
                              <span
                                className={`text-label-md font-label-md ${
                                  decision === "approved"
                                    ? "text-teal-dark"
                                    : "text-on-surface-variant"
                                }`}
                              >
                                {decision === "approved"
                                  ? "Notice Approved"
                                  : "Rejected"}
                              </span>
                            ) : (
                              <div className="flex justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() => decide(c.synthetic_cnr, "rejected")}
                                  className="px-3 py-1.5 border border-outline-variant text-primary bg-surface-container-lowest hover:bg-surface-container-highest active:scale-[0.97] rounded-DEFAULT text-label-md font-label-md transition-all duration-150"
                                >
                                  Reject
                                </button>
                                <button
                                  type="button"
                                  onClick={() => decide(c.synthetic_cnr, "approved")}
                                  className="px-3 py-1.5 bg-gradient-to-r from-gold to-gold-dark text-white border border-gold-dark hover:-translate-y-0.5 active:translate-y-0 rounded-DEFAULT text-label-md font-label-md transition-all duration-150"
                                >
                                  Approve Notice
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {visibleCandidates.length > 100 && (
                <p className="px-6 py-3 text-[11px] text-on-surface-variant border-t border-surface-variant">
                  Showing the top 100 of {visibleCandidates.length} ranked candidates.
                </p>
              )}
            </div>
          </div>
        </div>
      </main>

      <AppFooter />
    </>
  );
}
