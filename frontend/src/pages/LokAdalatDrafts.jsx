import { useState } from "react";
import Icon from "../components/Icon.jsx";
import Badge from "../components/Badge.jsx";
import AppFooter from "../components/AppFooter.jsx";
import AiNotice from "../components/AiNotice.jsx";
import Reveal from "../components/Reveal.jsx";
import {
  lokAdalatSummary,
  lokAdalatCandidates,
  likelihoodStyles,
} from "../data/mockData.js";

const valueSizeClass = {
  display: "font-evidence text-display-lg text-primary tabular-nums",
  headline: "font-evidence text-headline-md text-primary mt-auto tabular-nums",
};

export default function LokAdalatDrafts() {
  const [decisions, setDecisions] = useState({});
  const [likelihoodFilter, setLikelihoodFilter] = useState("");

  const decide = (cnr, status) =>
    setDecisions((prev) => ({ ...prev, [cnr]: status }));

  const visibleCandidates = likelihoodFilter
    ? lokAdalatCandidates.filter((c) => c.likelihood === likelihoodFilter)
    : lokAdalatCandidates;

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

          {/* Summary Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {lokAdalatSummary.map((m, i) => (
              <Reveal key={m.label} variant="rise" delay={80 + i * 100}>
                <div className="bg-surface-container-lowest border border-surface-variant border-t-2 border-t-gold/60 rounded-DEFAULT p-6 flex flex-col justify-between h-full transition-all duration-300 hover:-translate-y-1 hover:shadow-md">
                  <span className="text-label-md font-label-md text-on-surface-variant uppercase tracking-wider mb-2">
                    {m.label}
                  </span>
                  <span
                    className={
                      m.tone === "secondary"
                        ? "font-evidence text-headline-md text-secondary mt-auto tabular-nums"
                        : valueSizeClass[m.size]
                    }
                  >
                    {m.value}
                  </span>
                </div>
              </Reveal>
            ))}
          </div>

          {/* Review Queue */}
          <Reveal variant="rise" delay={180}>
            <div className="bg-surface-container-lowest border border-surface-variant rounded-DEFAULT overflow-hidden">
              <div className="p-4 border-b border-surface-variant bg-surface-container-low flex flex-wrap justify-between items-center gap-3">
                <h3 className="text-headline-sm font-headline-sm text-on-surface">
                  Review Queue
                  <span className="ml-2 font-evidence text-body-sm text-on-surface-variant tabular-nums">
                    ({visibleCandidates.length})
                  </span>
                </h3>
                {/* Real settlement-likelihood filter. This control previously
                    rendered as a "Filter" button with no handler at all. */}
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
                      <option value="High">High</option>
                      <option value="Moderate">Moderate</option>
                      <option value="Low">Low</option>
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
                    {visibleCandidates.map((c, i) => {
                      const decision = decisions[c.cnr];
                      return (
                        <tr
                          key={c.cnr}
                          className={`hover:bg-gold/5 transition-colors duration-150 ${
                            i % 2 === 1 ? "bg-surface-container-low" : ""
                          }`}
                        >
                          <td className="px-6 py-4 font-evidence font-medium text-primary">
                            {c.cnr}
                          </td>
                          <td className="px-6 py-4">{c.category}</td>
                          <td className="px-6 py-4 font-evidence text-on-surface-variant tabular-nums">
                            {c.age}
                          </td>
                          <td className="px-6 py-4">
                            <Badge className={likelihoodStyles[c.likelihood]}>
                              <span className="font-evidence">
                                {c.likelihood} - {c.likelihoodPct}%
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
                                  onClick={() => decide(c.cnr, "rejected")}
                                  className="px-3 py-1.5 border border-outline-variant text-primary bg-surface-container-lowest hover:bg-surface-container-highest active:scale-[0.97] rounded-DEFAULT text-label-md font-label-md transition-all duration-150"
                                >
                                  Reject
                                </button>
                                <button
                                  type="button"
                                  onClick={() => decide(c.cnr, "approved")}
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
            </div>
          </Reveal>
        </div>
      </main>

      <AppFooter />
    </>
  );
}
