import Icon from "../components/Icon.jsx";
import AiNotice from "../components/AiNotice.jsx";
import UserActions from "../components/UserActions.jsx";
import AppFooter from "../components/AppFooter.jsx";
import {
  dashboardKpis,
  bottleneckSignatures,
  districtHealth,
} from "../data/mockData.js";

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
  const { stalledPct, normalPct } = districtHealth;
  const circumference = 2 * Math.PI * 40; // r=40
  const dashoffset = circumference * (1 - stalledPct / 100);

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
              Aggregate view of systemic blockages and cohort deviations.
            </p>
          </div>
          <button
            type="button"
            className="bg-primary text-on-primary rounded px-4 py-2 flex items-center justify-center gap-2 hover:opacity-90 transition-opacity self-start"
          >
            <Icon name="cloud_upload" />
            <span className="text-label-md font-label-md">
              Import eCourts Data
            </span>
          </button>
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
