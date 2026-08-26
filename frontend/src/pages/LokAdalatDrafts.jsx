import { useState } from "react";
import Icon from "../components/Icon.jsx";
import Badge from "../components/Badge.jsx";
import AppFooter from "../components/AppFooter.jsx";
import AiNotice from "../components/AiNotice.jsx";
import {
  lokAdalatSummary,
  lokAdalatCandidates,
  likelihoodStyles,
} from "../data/mockData.js";

const valueSizeClass = {
  display: "text-display-lg font-display-lg text-primary",
  headline: "text-headline-md font-headline-md text-primary mt-auto",
};

export default function LokAdalatDrafts() {
  const [decisions, setDecisions] = useState({});

  const decide = (cnr, status) =>
    setDecisions((prev) => ({ ...prev, [cnr]: status }));

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
          <div className="animate-hero-fade-1">
            <h2 className="text-headline-lg-mobile md:text-headline-lg font-headline-lg text-on-surface mb-stack-md">
              Lok Adalat Referral Candidates
            </h2>
            <div className="bg-secondary-fixed text-on-secondary-fixed p-4 rounded-DEFAULT border border-secondary-fixed flex items-start gap-3">
              <Icon name="info" filled className="shrink-0" />
              <p className="text-body-md font-body-md font-bold">
                Legal Boundary Notice: This system only flags compoundable
                offenses. Final referral requires mandatory party consent.
              </p>
            </div>
          </div>

          {/* Summary Metrics */}
          <div
            className="grid grid-cols-1 md:grid-cols-3 gap-6 opacity-0 animate-hero-fade-2"
            style={{ animationDelay: "80ms" }}
          >
            {lokAdalatSummary.map((m, i) => (
              <div
                key={m.label}
                style={{ animationDelay: `${80 + i * 100}ms` }}
                className="bg-surface-container-lowest border border-surface-variant border-t-2 border-t-gold/60 rounded-DEFAULT p-6 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
              >
                <span className="text-label-md font-label-md text-on-surface-variant uppercase tracking-wider mb-2">
                  {m.label}
                </span>
                <span
                  className={
                    m.tone === "secondary"
                      ? "text-headline-md font-headline-md text-secondary mt-auto"
                      : valueSizeClass[m.size]
                  }
                >
                  {m.value}
                </span>
              </div>
            ))}
          </div>

          {/* Review Queue */}
          <div
            className="bg-surface-container-lowest border border-surface-variant rounded-DEFAULT overflow-hidden opacity-0 animate-hero-fade-3"
            style={{ animationDelay: "180ms" }}
          >
            <div className="p-4 border-b border-surface-variant bg-surface-container-low flex justify-between items-center">
              <h3 className="text-headline-sm font-headline-sm text-on-surface">
                Review Queue
              </h3>
              <button
                type="button"
                className="flex items-center gap-2 px-4 py-2 border border-outline-variant rounded-DEFAULT text-body-sm font-body-sm hover:bg-surface-container-highest transition-colors"
              >
                <Icon name="filter_list" size="18px" />
                Filter
              </button>
            </div>

            <div className="overflow-x-auto w-full">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="bg-surface-container-low text-label-md font-label-md text-on-surface-variant uppercase tracking-wider border-b border-surface-variant">
                    <th className="px-6 py-4 font-semibold whitespace-nowrap">
                      CNR Number
                    </th>
                    <th className="px-6 py-4 font-semibold whitespace-nowrap">
                      Case Category
                    </th>
                    <th className="px-6 py-4 font-semibold whitespace-nowrap">
                      Age
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
                  {lokAdalatCandidates.map((c, i) => {
                    const decision = decisions[c.cnr];
                    return (
                      <tr
                        key={c.cnr}
                        className={`hover:bg-gold/5 transition-colors duration-150 ${
                          i % 2 === 1 ? "bg-surface-container-low" : ""
                        }`}
                      >
                        <td className="px-6 py-4 font-medium text-primary">
                          {c.cnr}
                        </td>
                        <td className="px-6 py-4">{c.category}</td>
                        <td className="px-6 py-4 text-on-surface-variant">
                          {c.age}
                        </td>
                        <td className="px-6 py-4">
                          <Badge className={likelihoodStyles[c.likelihood]}>
                            {c.likelihood} - {c.likelihoodPct}%
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-right">
                          {decision ? (
                            <span
                              className={`text-label-md font-label-md ${
                                decision === "approved"
                                  ? "text-secondary"
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
                                onClick={() => decide(c.cnr, "rejected")}
                                className="px-3 py-1.5 border border-outline-variant text-primary bg-surface-container-lowest hover:bg-surface-container-highest active:scale-[0.97] rounded-DEFAULT text-label-md font-label-md transition-all duration-150"
                              >
                                Reject
                              </button>
                              <button
                                type="button"
                                onClick={() => decide(c.cnr, "approved")}
                                className="px-3 py-1.5 bg-primary text-on-primary border border-primary hover:bg-tertiary hover:-translate-y-0.5 active:translate-y-0 rounded-DEFAULT text-label-md font-label-md transition-all duration-150"
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
          </div>
        </div>
      </main>

      <AppFooter />
    </>
  );
}
