import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import Icon from "./Icon.jsx";
import Badge from "./Badge.jsx";
import AppFooter from "./AppFooter.jsx";
import AiNotice from "./AiNotice.jsx";
import Reveal from "./Reveal.jsx";
import { likelihoodStyles } from "../data/mockData.js";
import { getCasesApi } from "../api/endpoints.js";
import { DECISIONS_STORAGE_KEY, loadStoredDecisions, persistDecisions } from "../data/lokAdalatDecisions.js";

/**
 * Shared list view for the "Approved" and "Rejected" sidebar pages —
 * both read the exact same localStorage-backed decisions used on
 * Lok Adalat Drafts, so a decision made on one page shows up on the
 * others immediately (same key, same shape).
 */
export default function LokAdalatDecisionList({ decisionType, title, emptyText }) {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [decisions, setDecisions] = useState(loadStoredDecisions);

  useEffect(() => {
    const fetchCases = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getCasesApi(1000);
        setCases(data || []);
      } catch (err) {
        console.error(`Failed to load ${decisionType} candidates:`, err);
        setError("Unable to load cases. Please check connection to the backend.");
      } finally {
        setLoading(false);
      }
    };
    fetchCases();
  }, [decisionType]);

  const revertDecision = (cnr) =>
    setDecisions((prev) => {
      const next = { ...prev };
      delete next[cnr];
      return persistDecisions(next);
    });

  const rows = useMemo(
    () =>
      cases
        .filter((c) => decisions[c.synthetic_cnr] === decisionType)
        .sort((a, b) => (b.settlement_score ?? 0) - (a.settlement_score ?? 0)),
    [cases, decisions, decisionType]
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-on-surface-variant">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium animate-pulse">Loading cases…</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <header className="sticky top-0 flex justify-center items-center px-gutter h-16 bg-surface border-b border-outline-variant z-20">
        <AiNotice text="Administrative Triage View Only" />
      </header>

      <main className="flex-1 p-margin-mobile md:p-margin-desktop">
        <div className="max-w-[1280px] mx-auto space-y-stack-lg">
          <Reveal variant="up">
            <div className="flex items-center gap-3 mb-2">
              <span className="h-px w-6 bg-gradient-to-r from-transparent to-gold" />
              <span className="font-label-md text-label-md uppercase tracking-[0.2em] text-gold-dark">
                Alternate Resolution
              </span>
            </div>
            <h2 className="text-headline-lg-mobile md:text-headline-lg font-headline-lg text-on-surface mb-stack-md">
              {title}
            </h2>
          </Reveal>

          {error && (
            <div className="p-4 bg-error/5 border border-error/20 rounded text-error text-body-sm flex items-center gap-3">
              <Icon name="error" />
              <span>{error}</span>
            </div>
          )}

          <div className="bg-surface-container-lowest border border-surface-variant rounded-DEFAULT overflow-hidden">
            <div className="p-4 border-b border-surface-variant bg-surface-container-low">
              <h3 className="text-headline-sm font-headline-sm text-on-surface">
                {title}
                <span className="ml-2 font-evidence text-body-sm text-on-surface-variant tabular-nums">
                  ({rows.length})
                </span>
              </h3>
            </div>

            {rows.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <div className="flex flex-col items-center gap-2.5">
                  <div className="w-11 h-11 rounded-full bg-gold/10 flex items-center justify-center">
                    <Icon name="search_off" size="22px" className="text-gold-dark/70" />
                  </div>
                  <p className="font-body-md font-semibold text-on-surface">{emptyText}</p>
                  <Link to="/lok-adalat-drafts" className="text-body-sm text-secondary hover:underline">
                    Go to Lok Adalat Drafts
                  </Link>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto w-full">
                <table className="w-full text-left border-collapse min-w-[720px]">
                  <thead>
                    <tr className="bg-surface-container-low text-label-md font-label-md text-on-surface-variant uppercase tracking-wider border-b border-surface-variant">
                      <th className="px-6 py-4 font-semibold whitespace-nowrap">CNR Number</th>
                      <th className="px-6 py-4 font-semibold whitespace-nowrap">Current Stage</th>
                      <th className="px-6 py-4 font-semibold whitespace-nowrap">Settlement Likelihood</th>
                      <th className="px-6 py-4 font-semibold text-right whitespace-nowrap">Action</th>
                    </tr>
                  </thead>
                  <tbody className="text-body-md font-body-md divide-y divide-surface-variant">
                    {rows.map((c, i) => (
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
                        <td className="px-6 py-4">
                          <Badge className={likelihoodStyles[c.settlement_likelihood]}>
                            <span className="font-evidence">
                              {c.settlement_likelihood} - {c.settlement_score?.toFixed(0)}%
                            </span>
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            type="button"
                            onClick={() => revertDecision(c.synthetic_cnr)}
                            className="px-3 py-1.5 border border-outline-variant text-primary bg-surface-container-lowest hover:bg-surface-container-highest active:scale-[0.97] rounded-DEFAULT text-label-md font-label-md transition-all duration-150"
                          >
                            Move Back to Review
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>

      <AppFooter />
    </>
  );
}
