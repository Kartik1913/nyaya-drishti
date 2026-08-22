// Demo/mock data standing in for the eventual eCourts / NJDG data feed.
// Swap these out for real API responses once the backend triage engine is wired up.

export const dashboardKpis = [
  { label: "Total Pending Cases", value: "12,450" },
  {
    label: "Structurally Stalled Flags",
    value: "1,840",
    tone: "error",
    icon: "warning",
  },
  { label: "Avg Delay vs Cohort Baseline", value: "+312 Days" },
  { label: "Lok Adalat Candidates", value: "340" },
];

export const bottleneckSignatures = [
  { label: "Dormant", count: 600, width: 100, tone: "error" },
  { label: "Churning", count: 450, width: 75, tone: "neutral" },
  { label: "Disrupted", count: 350, width: 58, tone: "neutral" },
  { label: "Slow-Start", count: 240, width: 40, tone: "neutral" },
  { label: "Cohort Outlier", count: 200, width: 33, tone: "neutral" },
];

export const districtHealth = { stalledPct: 15, normalPct: 85 };

export const stallSignatureStyles = {
  Dormant: "bg-secondary-container text-on-secondary-container",
  Churning: "bg-tertiary-fixed text-on-tertiary-fixed",
  Disrupted: "bg-error-container text-on-error-container",
  None: "bg-surface-variant text-on-surface-variant",
};

export const confidenceStyles = {
  High: "bg-surface-container-high text-on-surface",
  Low: "bg-surface-container text-on-surface-variant",
};

export const priorityQueueCases = [
  {
    cnr: "MHNG01-004521-2019",
    type: "Sec 138 NI Act",
    ageDays: 800,
    stallSignature: "Dormant",
    confidence: "High",
    score: 94,
  },
  {
    cnr: "DLCT02-011832-2017",
    type: "Civil Suit",
    ageDays: 1200,
    stallSignature: "Churning",
    confidence: "High",
    score: 88,
  },
  {
    cnr: "KABB03-009214-2020",
    type: "Motor Vehicle Claim",
    ageDays: 450,
    stallSignature: "Disrupted",
    confidence: "Low",
    score: 76,
  },
  {
    cnr: "GJSU01-005678-2021",
    type: "Rent Control",
    ageDays: 310,
    stallSignature: "Dormant",
    confidence: "High",
    score: 62,
  },
  {
    cnr: "MHPU04-002345-2022",
    type: "Labor Dispute",
    ageDays: 180,
    stallSignature: "None",
    confidence: "High",
    score: 42,
  },
];

export const caseInspectorCases = [
  {
    id: "CASE-ALPHA",
    ageLabel: "5 years old",
    cohort: "NI Act Magistrate Court",
    score: 91.4,
    status: "stalled",
    statusLabel: "Structurally Stalled",
    evidence: [
      { label: "Unserved Summons for 420 days", points: "+35 pts", width: 85 },
      { label: "14 consecutive adjournments", points: "+28 pts", width: 65 },
      { label: "3 judge transfers in 18 months", points: "+18 pts", width: 45 },
    ],
  },
  {
    id: "CASE-BETA",
    ageLabel: "5 years old",
    cohort: "NI Act Magistrate Court",
    score: 14.7,
    status: "normal",
    statusLabel: "Progressing Normally",
    summary:
      "Progressing normally through trial stages. No structural administrative bottlenecks detected by the AI triage system.",
  },
];

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

export const likelihoodStyles = {
  High: "bg-secondary-fixed text-on-secondary-fixed",
  Moderate: "bg-tertiary-fixed text-on-tertiary-fixed",
  Low: "bg-error-container text-on-error-container",
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
  { value: "81 Million", label: "District court cases analyzed" },
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
