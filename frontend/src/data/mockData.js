// Static content for the public landing page and the Lok Adalat referral
// screen. Everything else in the app — dashboard metrics, the priority queue,
// case detail, and the demo comparison — reads from the live backend API.
//
// Dead fixtures for those API-backed screens (dashboardKpis, priorityQueueCases,
// bottleneckSignatures, districtHealth, stallSignatureStyles, confidenceStyles)
// and for the removed CaseInspector page (caseInspectorCases) were deleted:
// they were stale duplicates of real data and a source of drift.
export const lokAdalatSummary = [
  { label: "Total Eligible Candidates", value: "340", size: "display" },
  { label: "Top Category", value: "Sec 138 NI Act", size: "headline" },
  {
    label: "Est. Bench Time Saved",
    value: "~1,200 Hours",
    size: "headline",
    tone: "secondary",
  },
];

// Settlement likelihood, on the brand's three-tier scale. Note the polarity is
// inverted vs. triage severity: here a HIGH value is the good outcome (this
// case can likely be settled out of court), so high = teal. Low likelihood is
// simply "not a candidate" — muted neutral, not an error, since there is
// nothing wrong with a case that isn't Lok Adalat material.
export const likelihoodStyles = {
  High: "bg-teal/10 text-teal-dark border border-teal/25",
  Moderate: "bg-gold/15 text-gold-dark border border-gold/35",
  Low: "bg-surface-container-high text-on-surface-variant border border-outline-variant",
};

export const lokAdalatCandidates = [
  {
    cnr: "MHNG01-008234-2021",
    category: "Sec 138 NI Act",
    age: "420 days",
    likelihood: "High",
    likelihoodPct: 88,
  },
  {
    cnr: "DLND02-011456-2022",
    category: "MACT",
    age: "285 days",
    likelihood: "Moderate",
    likelihoodPct: 62,
  },
  {
    cnr: "UPKJ05-004321-2023",
    category: "Sec 138 NI Act",
    age: "115 days",
    likelihood: "High",
    likelihoodPct: 91,
  },
  {
    cnr: "RJJP01-009876-2020",
    category: "MACT",
    age: "850 days",
    likelihood: "Low",
    likelihoodPct: 25,
  },
  {
    cnr: "KAJP01-001234-2023",
    category: "Sec 138 NI Act",
    age: "80 days",
    likelihood: "High",
    likelihoodPct: 85,
  },
];

// --- Landing page content ---

export const valueProps = [
  {
    icon: "troubleshoot",
    title: "Identify Stalled Cases",
    body: "Automatically detect procedural bottlenecks and aging cases requiring administrative intervention.",
  },
  {
    icon: "insights",
    title: "Understand Delay Signals",
    body: "Analyze historical data and metadata to predict and mitigate systemic delays in the litigation lifecycle.",
  },
  {
    icon: "account_tree",
    title: "Optimize Judicial Workflow",
    body: "Prioritize high-impact triage tasks, allowing judicial officers to focus on substantive legal interpretation.",
  },
];

export const impactStats = [
  { value: "5.4 Crore+", label: "Nationwide pending cases" },
  { value: "149 Days vs 5 Years", label: "Mean filing-to-decision disparity" },
  {
    value: "3,179 Real Records Audited",
    label: "Real eCourts open-data records used to establish schema and distribution baselines.",
  },
];

export const engineLayers = [
  { icon: "layers", title: "Cohort Builder", body: "Groups similar cases for baseline comparison." },
  { icon: "radar", title: "Stall Detector", body: "Identifies anomalous inactivity patterns." },
  { icon: "account_tree", title: "Bottleneck Classifier", body: "Categorizes the root cause of delays." },
  { icon: "calculate", title: "Priority Scorer", body: "Assigns urgency based on administrative impact." },
  { icon: "fact_check", title: "Evidence Generator", body: "Provides explicit reasoning for every score." },
  { icon: "format_list_numbered", title: "Priority Queue", body: "Delivers actionable lists to administrators." },
];

export const userPersonas = [
  {
    title: "District Court Registrar",
    body: "Manage systemic bottlenecks across the district, reallocate resources efficiently, and monitor overall pendency health metrics.",
  },
  {
    title: "District & Sessions Judge",
    body: "Review triage queues for individual courtrooms, ensure administrative blockages are cleared, and maintain judicial momentum.",
  },
  {
    title: "DLSA Secretary",
    body: "Identify high-potential cases for Lok Adalat referral and track the impact of alternative dispute resolution interventions.",
  },
];

export const problemStatements = [
  {
    icon: "inventory_2",
    title: "Cases disappear into the backlog",
    body: "High-pendency environments make it difficult to identify which cases are genuinely stalled versus those proceeding normally.",
  },
  {
    icon: "hourglass_bottom",
    title: "Not every old case is equally urgent",
    body: "Case age alone does not explain why a matter is delayed. Procedural complexity and administrative history provide the true context.",
  },
  {
    icon: "troubleshoot",
    title: "Bottlenecks are difficult to see",
    body: "Important signals are distributed across case records and procedural history, hidden within the noise of standard filing activity.",
  },
  {
    icon: "low_priority",
    title: "Limited resources require prioritization",
    body: "Court administrators need to know where intervention could have the greatest potential value to restore procedural momentum.",
  },
];

export const triagePillars = [
  {
    title: "Detect",
    body: "Identifies structural patterns associated with stalled cases across the entire docket.",
  },
  {
    title: "Explain",
    body: "Surfaces the specific procedural factors contributing to a triage score for total transparency.",
  },
  {
    title: "Prioritize",
    body: "Creates an actionable queue for administrative review, focusing attention where it matters most.",
  },
];
