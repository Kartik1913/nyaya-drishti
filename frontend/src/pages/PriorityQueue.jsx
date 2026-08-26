import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import Icon from "../components/Icon.jsx";
import Switch from "../components/Switch.jsx";
import Badge from "../components/Badge.jsx";
import ScoreBadge from "../components/ScoreBadge.jsx";
import BottleneckTag from "../components/BottleneckTag.jsx";
import ConfidenceBadge from "../components/ConfidenceBadge.jsx";
import AiNotice from "../components/AiNotice.jsx";
import UserActions from "../components/UserActions.jsx";
import AppFooter from "../components/AppFooter.jsx";
import { getPriorityQueueApi } from "../api/endpoints.js";


export default function PriorityQueue() {
  const [cases, setCases] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [bottleneckFilter, setBottleneckFilter] = useState("");
  const [confidenceFilter, setConfidenceFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [lokAdalatOnly, setLokAdalatOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchQueue = async () => {
    try {
      setLoading(true);
      setError(null);
      const filters = {};
      if (bottleneckFilter) filters.bottleneck_filter = bottleneckFilter;
      if (confidenceFilter) filters.confidence_filter = confidenceFilter;

      const data = await getPriorityQueueApi(page, limit, filters);
      setCases(data.cases || []);
      setTotal(data.total || 0);
    } catch (err) {
      console.error("Failed to fetch priority queue:", err);
      setError("Unable to load priority queue. Please check connection to the backend.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, [page, limit, bottleneckFilter, confidenceFilter]);

  const totalPages = Math.ceil(total / limit) || 1;

  // Filter cases dynamically based on search query & Lok Adalat switch
  const filteredCases = useMemo(() => {
    return cases.filter((c) => {
      // Search
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch =
          c.synthetic_cnr?.toLowerCase().includes(query) ||
          c.current_stage?.toLowerCase().includes(query) ||
          c.case_type?.toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }
      // Lok Adalat (Compoundable Acts)
      if (lokAdalatOnly) {
        const type = c.case_type || "";
        const isEligible =
          type.includes("138") ||
          type.includes("Negotiable") ||
          type.includes("Motor") ||
          type.includes("NI Act");
        if (!isEligible) return false;
      }
      return true;
    });
  }, [cases, searchQuery, lokAdalatOnly]);

  return (
    <>
      {/* Top App Bar */}
      <header className="sticky top-0 flex justify-between items-center px-gutter h-16 bg-surface border-b border-outline-variant z-20">
        <div className="flex items-center gap-4">
          <AiNotice text="Administrative Triage View Only" />
        </div>
        <div className="flex items-center gap-4">
          <div className="relative hidden sm:block">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search cases..."
              className="border border-outline-variant rounded-DEFAULT pl-10 pr-4 py-2 text-body-sm focus:border-secondary focus:ring-1 focus:ring-secondary w-64 bg-surface-container-lowest outline-none"
            />
            <Icon
              name="search"
              className="absolute left-3 top-2 text-on-surface-variant"
            />
          </div>
          <UserActions />
        </div>
      </header>

      {/* Page Content */}
      <main className="flex-1 p-margin-mobile md:p-margin-desktop">
        <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-4 mb-stack-lg animate-hero-fade-1">
          <div>
            <h2 className="text-headline-lg font-headline-lg text-on-surface">
              Triage Priority Queue
            </h2>
            <p className="text-body-sm font-body-sm text-on-surface-variant mt-1">
              Pune District Court - ranked by 6-layer administrative stall score.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-label-md font-label-md text-on-surface-variant">
              Filter: Lok Adalat Eligible (Compoundable Acts)
            </span>
            <Switch
              checked={lokAdalatOnly}
              onChange={setLokAdalatOnly}
              label="Filter to Lok Adalat eligible cases"
            />
          </div>
        </div>

        {/* Filters bar */}
        <div
          className="bg-surface-container-lowest border border-outline-variant rounded-lg p-4 mb-gutter flex flex-col md:flex-row items-center justify-between gap-4 opacity-0 animate-hero-fade-2"
          style={{ animationDelay: "80ms" }}
        >
          <div className="relative w-full md:w-80 sm:hidden">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search cases..."
              className="border border-outline-variant rounded-DEFAULT pl-10 pr-4 py-2 text-body-sm focus:border-secondary w-full bg-surface-container-lowest outline-none"
            />
            <Icon
              name="search"
              className="absolute left-3 top-2 text-on-surface-variant"
            />
          </div>

          <div className="flex flex-wrap items-center gap-4 w-full justify-end">
            <div className="flex items-center gap-2">
              <span className="text-label-md font-label-md text-on-surface-variant">Bottleneck:</span>
              <select
                value={bottleneckFilter}
                onChange={(e) => {
                  setBottleneckFilter(e.target.value);
                  setPage(1);
                }}
                className="bg-surface-container-lowest border border-outline-variant rounded px-2 py-1 text-body-sm outline-none focus:border-secondary"
              >
                <option value="">All Bottlenecks</option>
                <option value="SUMMONS_DELAY">Summons Delay</option>
                <option value="JUDGE_CHANGE">Bench Change</option>
                <option value="WITNESS_DELAY">Witness Delay</option>
                <option value="REPEATED_ADJOURNMENT">Repeated Adjournment</option>
                <option value="PROCEDURAL_INACTIVITY">Procedural Inactivity</option>
                <option value="UNKNOWN">Normal Progression</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-label-md font-label-md text-on-surface-variant">Confidence:</span>
              <select
                value={confidenceFilter}
                onChange={(e) => {
                  setConfidenceFilter(e.target.value);
                  setPage(1);
                }}
                className="bg-surface-container-lowest border border-outline-variant rounded px-2 py-1 text-body-sm outline-none focus:border-secondary"
              >
                <option value="">All Confidence</option>
                <option value="HIGH">High Confidence</option>
                <option value="LOW">Low Confidence</option>
              </select>
            </div>

            <button
              onClick={fetchQueue}
              className="p-1.5 hover:bg-surface border border-outline-variant rounded transition-colors cursor-pointer"
              title="Refresh Queue"
            >
              <Icon name="refresh" />
            </button>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-error/5 border border-error/20 rounded text-error text-body-sm flex items-center gap-3 mb-gutter">
            <Icon name="error" />
            <span>{error}</span>
          </div>
        )}

        {/* Priority Queue Table */}
        <div
          className="bg-surface-container-lowest border border-outline-variant rounded-lg overflow-hidden opacity-0 animate-hero-fade-3"
          style={{ animationDelay: "140ms" }}
        >
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-outline-variant">
              <thead className="bg-surface-container-low">
                <tr>
                  <th scope="col" className="px-6 py-4 text-center text-label-md font-label-md text-on-surface-variant uppercase tracking-wider">Rank</th>
                  <th scope="col" className="px-6 py-4 text-left text-label-md font-label-md text-on-surface-variant uppercase tracking-wider">CNR Number</th>
                  <th scope="col" className="px-6 py-4 text-left text-label-md font-label-md text-on-surface-variant uppercase tracking-wider">Case Type</th>
                  <th scope="col" className="px-6 py-4 text-left text-label-md font-label-md text-on-surface-variant uppercase tracking-wider">Current Stage</th>
                  <th scope="col" className="px-6 py-4 text-center text-label-md font-label-md text-on-surface-variant uppercase tracking-wider">Days in Stage</th>
                  <th scope="col" className="px-6 py-4 text-center text-label-md font-label-md text-on-surface-variant uppercase tracking-wider">Inactivity</th>
                  <th scope="col" className="px-6 py-4 text-left text-label-md font-label-md text-on-surface-variant uppercase tracking-wider">Stall Signature</th>
                  <th scope="col" className="px-6 py-4 text-left text-label-md font-label-md text-on-surface-variant uppercase tracking-wider">Confidence</th>
                  <th scope="col" className="px-6 py-4 text-center text-label-md font-label-md text-on-surface-variant uppercase tracking-wider">Triage Score</th>
                  <th scope="col" className="px-6 py-4 text-center text-label-md font-label-md text-on-surface-variant uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="bg-surface-container-lowest divide-y divide-outline-variant text-body-sm font-body-sm">
                {loading ? (
                  <tr>
                    <td colSpan={10} className="px-6 py-12 text-center text-on-surface-variant">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                        <span>Loading priority queue rows...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredCases.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-6 py-16 text-center text-on-surface-variant">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-surface-container-high flex items-center justify-center">
                          <Icon name="search_off" size="24px" className="text-on-surface-variant/60" />
                        </div>
                        <p className="font-body-md font-semibold text-on-surface">
                          No cases match the current filters
                        </p>
                        <p className="text-body-sm text-on-surface-variant/80 max-w-sm">
                          Try clearing the bottleneck, confidence, or search filters above.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredCases.map((c, i) => {
                    const rank = (page - 1) * limit + i + 1;
                    const isAlpha = c.is_demo_stalled;
                    const isBeta = c.is_demo_progressing;

                    return (
                      <tr
                        key={c.id}
                        className={`hover:bg-surface hover:shadow-[inset_3px_0_0_0_var(--tw-shadow-color)] hover:shadow-gold/50 transition-all duration-150 ${
                          isAlpha ? "bg-rose-50 border-l-4 border-error" : ""
                        } ${isBeta ? "bg-emerald-50 border-l-4 border-emerald-500" : ""}`}
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-center font-mono font-bold text-on-surface-variant">
                          {isAlpha ? (
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-error/10 text-error border border-error/20 font-bold">
                              1
                            </span>
                          ) : (
                            `#${rank}`
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-on-surface font-medium">
                          <div className="flex items-center gap-2">
                            <Link
                              to={`/cases/${c.id}`}
                              className="font-mono font-bold text-secondary hover:underline"
                            >
                              {c.synthetic_cnr}
                            </Link>
                            {isAlpha && (
                              <Badge className="bg-error/10 text-error border border-error/20">
                                ALPHA (DEMO)
                              </Badge>
                            )}
                            {isBeta && (
                              <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200">
                                BETA (DEMO)
                              </Badge>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-on-surface-variant">
                          {c.case_type}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-on-surface-variant">
                          {c.current_stage}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center font-mono text-on-surface-variant">
                          <div className="font-semibold">{c.days_in_current_stage ?? "-"}d</div>
                          {c.stage_deviation_ratio && (
                            <div className="text-[10px]">
                              {c.stage_deviation_ratio.toFixed(1)}x cohort
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center font-mono text-on-surface-variant">
                          {c.days_since_substantive_event ?? "-"}d
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <BottleneckTag type={c.bottleneck_type} />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <ConfidenceBadge confidence={c.triage_confidence} />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <ScoreBadge score={c.triage_score} />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <Link
                            to={`/cases/${c.id}`}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded bg-surface hover:bg-primary hover:text-on-primary hover:-translate-y-0.5 active:translate-y-0 border border-outline-variant text-label-md font-label-md transition-all duration-150"
                          >
                            <span>Review</span>
                            <Icon name="arrow_outward" size="14px" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between border-t border-outline-variant bg-surface-container-lowest px-4 py-3 sm:px-6 mt-4 rounded-lg border">
          <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between text-body-sm font-body-sm text-on-surface-variant">
            <p>
              Showing <span className="font-medium text-on-surface">{(page - 1) * limit + 1}</span> to{" "}
              <span className="font-medium text-on-surface">{Math.min(page * limit, total)}</span> of{" "}
              <span className="font-medium text-on-surface">{total}</span> results
            </p>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span>Per page:</span>
                <select
                  value={limit}
                  onChange={(e) => {
                    setLimit(Number(e.target.value));
                    setPage(1);
                  }}
                  className="bg-surface-container-lowest border border-outline-variant rounded px-2 py-1 outline-none"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </div>

              <nav aria-label="Pagination" className="isolate inline-flex -space-x-px rounded-md shadow-sm">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="relative inline-flex items-center rounded-l-md px-2 py-2 text-on-surface-variant ring-1 ring-inset ring-outline-variant hover:bg-surface disabled:opacity-40"
                >
                  <span className="sr-only">Previous</span>
                  <Icon name="chevron_left" size="20px" />
                </button>
                <span className="relative inline-flex items-center px-4 py-2 text-on-surface font-semibold">
                  {page} / {totalPages}
                </span>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="relative inline-flex items-center rounded-r-md px-2 py-2 text-on-surface-variant ring-1 ring-inset ring-outline-variant hover:bg-surface disabled:opacity-40"
                >
                  <span className="sr-only">Next</span>
                  <Icon name="chevron_right" size="20px" />
                </button>
              </nav>
            </div>
          </div>
        </div>
      </main>

      <AppFooter />
    </>
  );
}
