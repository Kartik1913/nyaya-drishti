import { useMemo, useState } from "react";
import Icon from "../components/Icon.jsx";
import Badge from "../components/Badge.jsx";
import Switch from "../components/Switch.jsx";
import AiNotice from "../components/AiNotice.jsx";
import UserActions from "../components/UserActions.jsx";
import AppFooter from "../components/AppFooter.jsx";
import {
  priorityQueueCases,
  stallSignatureStyles,
  confidenceStyles,
} from "../data/mockData.js";

// Section 138 NI Act and Motor Vehicle Claims are compoundable acts eligible
// for Lok Adalat referral; everything else stays out when the filter is on.
const LOK_ADALAT_ELIGIBLE_TYPES = new Set(["Sec 138 NI Act", "Motor Vehicle Claim"]);

export default function PriorityQueue() {
  const [search, setSearch] = useState("");
  const [lokAdalatOnly, setLokAdalatOnly] = useState(false);

  const filteredCases = useMemo(() => {
    return priorityQueueCases.filter((c) => {
      const matchesSearch = c.cnr.toLowerCase().includes(search.toLowerCase());
      const matchesFilter =
        !lokAdalatOnly || LOK_ADALAT_ELIGIBLE_TYPES.has(c.type);
      return matchesSearch && matchesFilter;
    });
  }, [search, lokAdalatOnly]);

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
              value={search}
              onChange={(e) => setSearch(e.target.value)}
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
      <main className="flex-1 p-margin-desktop">
        <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-4 mb-stack-lg">
          <h2 className="text-headline-lg font-headline-lg text-on-surface">
            Triage Priority Queue
          </h2>
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

        {/* Priority Queue Table */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-outline-variant">
              <thead className="bg-surface-container-low">
                <tr>
                  {[
                    "CNR Number",
                    "Case Type",
                    "Age in Days",
                    "Stall Signature",
                    "Confidence",
                    "Triage Score",
                  ].map((h) => (
                    <th
                      key={h}
                      scope="col"
                      className="px-6 py-4 text-left text-label-md font-label-md text-on-surface-variant uppercase tracking-wider"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-surface-container-lowest divide-y divide-outline-variant text-body-sm font-body-sm">
                {filteredCases.map((c, i) => (
                  <tr
                    key={c.cnr}
                    className={`hover:bg-surface transition-colors ${
                      i % 2 === 1 ? "bg-surface-bright" : ""
                    }`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-on-surface font-medium">
                      {c.cnr}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-on-surface-variant">
                      {c.type}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-on-surface-variant">
                      {c.ageDays.toLocaleString("en-IN")}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge className={stallSignatureStyles[c.stallSignature]}>
                        {c.stallSignature}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge className={confidenceStyles[c.confidence]}>
                        {c.confidence}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-error font-bold">
                      {c.score}
                    </td>
                  </tr>
                ))}
                {filteredCases.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-8 text-center text-on-surface-variant"
                    >
                      No cases match the current search and filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between border-t border-outline-variant bg-surface-container-lowest px-4 py-3 sm:px-6 mt-4 rounded-lg border">
          <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
            <p className="text-body-sm font-body-sm text-on-surface-variant">
              Showing{" "}
              <span className="font-medium text-on-surface">
                {filteredCases.length === 0 ? 0 : 1}
              </span>{" "}
              to{" "}
              <span className="font-medium text-on-surface">
                {filteredCases.length}
              </span>{" "}
              of <span className="font-medium text-on-surface">97</span> results
            </p>
            <nav
              aria-label="Pagination"
              className="isolate inline-flex -space-x-px rounded-md shadow-sm"
            >
              <a
                href="#prev"
                className="relative inline-flex items-center rounded-l-md px-2 py-2 text-on-surface-variant ring-1 ring-inset ring-outline-variant hover:bg-surface focus:z-20 focus:outline-offset-0"
              >
                <span className="sr-only">Previous</span>
                <Icon name="chevron_left" size="20px" />
              </a>
              {[1, 2, 3].map((p) => (
                <a
                  key={p}
                  href={`#page-${p}`}
                  aria-current={p === 1 ? "page" : undefined}
                  className={`relative inline-flex items-center px-4 py-2 text-body-sm font-body-sm font-semibold focus:z-20 focus:outline-offset-0 ${
                    p === 1
                      ? "z-10 bg-secondary text-on-secondary"
                      : "text-on-surface ring-1 ring-inset ring-outline-variant hover:bg-surface"
                  }`}
                >
                  {p}
                </a>
              ))}
              <a
                href="#next"
                className="relative inline-flex items-center rounded-r-md px-2 py-2 text-on-surface-variant ring-1 ring-inset ring-outline-variant hover:bg-surface focus:z-20 focus:outline-offset-0"
              >
                <span className="sr-only">Next</span>
                <Icon name="chevron_right" size="20px" />
              </a>
            </nav>
          </div>
        </div>
      </main>

      <AppFooter />
    </>
  );
}
