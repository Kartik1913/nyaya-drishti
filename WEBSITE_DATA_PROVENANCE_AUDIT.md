# NYAYA-DRISHTI — WEBSITE DATA PROVENANCE & ARCHITECTURAL AUDIT

> **Audit Document:** `WEBSITE_DATA_PROVENANCE_AUDIT.md`  
> **Repository:** `Kartik1913/nyaya-drishti`  
> **Branch:** `data-provenance-audit`  
> **Date:** August 2026  
> **Scope:** Full inspection of live website data, backend databases, seed files, ML datasets, API pipelines, and frontend UI labels.

---

## 1. EXECUTIVE SUMMARY

The Nyaya-Drishti system currently operates on a **3-tier data architecture**:

1. **REAL Judicial & Macro Data:** National and state-level judicial statistics sourced from the **National Judicial Data Grid (NJDG)** and **Data.gov.in**, alongside authentic court taxonomy schemas (19 states, 332 court establishments, 5 case types) derived from public eCourts open data.
2. **DERIVED Analytical & Triage Features:** Deterministic indicators computed on-the-fly by the 6-layer triage engine, including cohort-relative stage deviations, dormancy durations, adjournment streaks, 5-component priority scores ($0\text{–}100$), and supporting XGBoost ML stall probability estimates.
3. **SYNTHETIC Case & Event Records:** Individual case entities ($1,000$ active cases in the live database, $10,000$ in the offline ML training dataset) and timeline event histories ($11,911$ events in database, $99,440$ in event dataset) generated under strict procedural constraints to simulate district court workflows without exposing confidential or PII litigant data.

```
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│                             NYAYA-DRISHTI DATA ARCHITECTURE                              │
├──────────────────────────────┬─────────────────────────────┬─────────────────────────────┤
│      1. REAL DATA TIER       │      2. DERIVED DATA TIER   │     3. SYNTHETIC DATA TIER  │
├──────────────────────────────┼─────────────────────────────┼─────────────────────────────┤
│ • NJDG Macro Pendency Counts │ • Stage Deviation Ratios    │ • 1,000 Live DB Cases       │
│ • NJDG 5-Year Old Backlog %  │ • Dormancy Durations        │ • 11,911 DB Event Timelines │
│ • Data.gov.in Disposal Times │ • Adjournment Streaks       │ • 10,000 ML Training Cases  │
│ • Real Court Taxonomies      │ • Cohort CDF Percentiles    │ • 99,440 Event History CSV  │
│ • 3,179 Real Cases Profile   │ • 5-Signal Triage Score     │ • Scenario Stall Labels     │
│   (disposal_time_cleaned)    │ • ML Stall Probability (ML) │ • 5 Lok Adalat Mock Drafts  │
└──────────────────────────────┴─────────────────────────────┴─────────────────────────────┘
```

---

## 2. AUDIT OF ALL DATASETS & FILES

| Dataset / File Path | Record Count | Source | Classification | Real Fields | Derived Fields | Synthetic Fields | Consumed By |
|---|---|---|---|---|---|---|---|
| `data/disposal_time_cleaned.csv` | **3,179** rows | eCourts Open Data (19 states, 332 courts) | **REAL + DERIVED** | `cnr`, `courtCode`, `courtName`, `stateCode`, `stateName`, `caseType`, `filingDate`, `decisionDate`, `filingYear`, `decisionYear`, `hasJudgments`, `tier` | `caseDurationDays`, `cohort` | *None* (No event logs present) | Schema & distribution baseline reference; ML compatibility audit |
| `data/synthetic_cases_10000.csv` | **10,000** rows | Synthetic Generator (informed by real profile) | **SYNTHETIC + DERIVED** | *None* (Schema aligns with real eCourts) | `case_age_days`, `days_in_current_stage`, `days_since_substantive_event`, `adjournment_count`, `adjournment_streak`, `judge_change_count`, `stage_deviation_ratio`, `cohort_percentile`, `triage_score` | `synthetic_cnr`, `filing_date`, `current_stage`, `stage_entered_at`, `bottleneck_type`, `actionability_level`, `structural_stall_label`, `evidence_json`, `explanation_text` | Offline research & 10k benchmark export |
| `data/synthetic_case_events.csv` | **99,440** rows | Synthetic Timeline Generator | **SYNTHETIC** | *None* | *None* | `case_cnr`, `event_date`, `event_type`, `stage`, `purpose`, `adjournment_flag`, `substantive_flag`, `judge_ref`, `synthetic_event_note` | Chronological event logs for 10k dataset; ML feature extraction |
| `data/synthetic_cohort_stats.csv` | **4,505** rows | Computed over 10k cases | **DERIVED on SYNTHETIC** | *None* | `cohort_size`, `median_days_in_stage`, `p75_days_in_stage`, `p90_days_in_stage` | Cohort key strings (`court_establishment`, `case_type`, etc.) | Baseline benchmark distributions |
| `data/ml_training_matrix_synthetic.csv` | **10,000** rows | Feature Extraction Module | **SYNTHETIC + DERIVED** | *None* | `case_age_days`, `adjournment_count`, `judge_change_count` | `synthetic_cnr`, `state`, `district`, `court_establishment`, `case_type`, `tier`, `filing_year`, `current_stage`, `structural_stall_label` | `ml/train.py` for training `final_model.joblib` (XGBoost) |
| `backend/seed/seed_data.json` | **1,000** cases, **16** cohorts, **4** macro rows | `backend/seed/generator.py` | **REAL + DERIVED + SYNTHETIC** | 4 Macro records (NJDG/Data.gov.in) | Derived cohort medians, age deviations | 1,000 synthetic cases (Alpha, Beta, +998 background) | Seed file loaded by `backend/seed/loader.py` |
| `backend/nyaya.db` (SQLite) | **1,000** cases, **11,911** events, **16** cohorts, **4** macro | Populated by `seed/loader.py` | **REAL + DERIVED + SYNTHETIC** | 4 `AggregateContext` rows | Live 5-signal triage scores, ML stall probabilities, confidence levels | Case records and event histories | **Live Backend API & All Dynamic Frontend Views** |
| `frontend/src/data/mockData.js` | 5 queue items, 5 Lok Adalat items, text arrays | Frontend Prototype Stubs | **STATIC MOCK** | *None* | *None* | Mock candidate cases and static marketing statistics | `LokAdalatDrafts.jsx`, `Landing.jsx` |

---

## 3. LIVE WEBSITE DATA TRACE (END-TO-END)

The live application does **not** query raw CSV files at runtime. It operates through a live REST API backed by an ORM database:

```text
┌─────────────────────────┐
│     User's Browser      │
└────────────┬────────────┘
             │ HTTP (Axios)
             ▼
┌─────────────────────────┐
│  FastAPI Backend (8000) │
└────────────┬────────────┘
             │ SQLAlchemy ORM
             ▼
┌─────────────────────────┐      ┌──────────────────────────┐
│ SQLite DB (nyaya.db)    │ ───► │ ML Model (XGBoost)       │
│ - 1,000 Cases           │      │ final_model.joblib       │
│ - 11,911 Events         │      │ (Inference on 10 inputs) │
│ - 16 Cohort Baselines   │      └──────────────────────────┘
│ - 4 Real Macro Records  │
└─────────────────────────┘
```

### Route-by-Route Data Trace

1. **Dashboard (`/`) — `Dashboard.jsx`:**
   - **API Calls:** `GET /stats/aggregate` and `GET /queue?page=1&limit=100`.
   - **Database Tables Queried:** `AggregateContext` (4 real macro records) and `Case` (first 100 cases).
   - **What the User Sees:**
     - 4 KPI cards: National pending volume (`44,300,000+` from NJDG), Average disposal delay (`1,420 days` from Data.gov.in), and dynamically aggregated critical stall flags (`triage_score >= 80`).
     - Bottleneck Signature Bar Chart: Dynamically aggregated from the live 1,000 cases (`SUMMONS_DELAY`, `JUDGE_CHANGE`, `WITNESS_DELAY`, `REPEATED_ADJOURNMENT`, `PROCEDURAL_INACTIVITY`).
     - District Health Donut Chart: Dynamically calculated ratio of stalled vs. progressing cases.

2. **Priority Queue (`/queue`) — `PriorityQueue.jsx`:**
   - **API Call:** `GET /queue?page={page}&limit={limit}&bottleneck_filter={...}&confidence_filter={...}`.
   - **Database Table Queried:** `Case` table in `nyaya.db`, ordered by `triage_score DESC`.
   - **What the User Sees:**
     - 1,000 ranked cases with paginated navigation (20 cases/page).
     - Deterministic 5-signal priority scores (e.g. `CASE-ALPHA` ranked #1 with score **91.4**).
     - Procedural bottleneck tags and statistical confidence badges (`HIGH` / `LOW`).
     - Live search filtering across CNR, case type, and stage.

3. **Case Detail (`/cases/:id`) — `CaseDetail.jsx`:**
   - **API Calls:** `GET /cases/{id}`, `GET /cases/{id}/timeline`, `GET /cohort/{id}`.
   - **Database Tables Queried:** `Case`, `CaseEvent`, and `CohortStat`.
   - **What the User Sees:**
     - Traceable **5-component score decomposition** (Structural Deviation $30\%$, Inactivity $25\%$, Age Deviation $15\%$, Adjournment Streak $10\%$, Actionability $20\%$).
     - **Supporting ML Risk Signal Card:** Predictive stall probability (e.g. `94.2%`) and classification (`HIGH` / `LOW`) generated by `final_model.joblib`.
     - **Cohort Benchmark Panel:** Stage duration compared against cohort median.
     - **Auditable Event Timeline:** Chronological event logs with substantive vs. procedural badges.

4. **Demo Comparison (`/comparison`) — `Comparison.jsx`:**
   - **API Call:** `GET /demo/comparison`.
   - **Database Records Queried:** `Case` records with `is_demo_stalled=True` (Alpha) and `is_demo_progressing=True` (Beta).
   - **What the User Sees:** Side-by-side metric comparison and 76.7 point score gap between two 5-year-old cases.

5. **Lok Adalat Drafts (`/lok-adalat-drafts`) — `LokAdalatDrafts.jsx`:**
   - **Source:** Static mock data from `frontend/src/data/mockData.js`.
   - **What the User Sees:** 5 compoundable candidate cases for alternate dispute resolution referral.

6. **Landing Page (`/landing`) — `Landing.jsx`:**
   - **Source:** Static content arrays from `frontend/src/data/mockData.js`.
   - **What the User Sees:** Architectural value props, 6-layer engine breakdown, and national judicial backlog statistics.

---

## 4. FIELD-BY-FIELD CLASSIFICATION MATRIX

```
╔═════════════════════════════════════════════════════════════════════════════════════════════════╗
║                                  FIELD CLASSIFICATION MATRIX                                    ║
╠══════════════════════════════╦════════════════════╦═════════════════════════════════════════════╣
║ Field Name                   ║ Classification     ║ Provenance / Calculation Rule               ║
╠══════════════════════════════╬════════════════════╬═════════════════════════════════════════════╣
║ state                        ║ REAL TAXONOMY      ║ Authenticated Indian State (eCourts schema) ║
║ district                     ║ REAL TAXONOMY      ║ Authenticated District Name                 ║
║ court_establishment          ║ REAL TAXONOMY      ║ Real Court Establishment Code & Naming      ║
║ case_type                    ║ REAL TAXONOMY      ║ Real Procedural Codes (CS, BA, CRL_A, etc.) ║
║ tier                         ║ REAL TAXONOMY      ║ District Court vs. High Court               ║
║ filing_year                  ║ REAL TAXONOMY      ║ Authentic filing year range (2018–2024)     ║
║ National Pending Volume      ║ REAL MACRO DATA    ║ Sourced from NJDG Public Dashboard (4.43Cr) ║
║ Disposal Duration Baseline   ║ REAL MACRO DATA    ║ Sourced from Data.gov.in (1,420 days)       ║
╠══════════════════════════════╬════════════════════╬═════════════════════════════════════════════╣
║ case_age_days                ║ DERIVED            ║ (ENGINE_RUN_DATE - filing_date).days        ║
║ days_in_current_stage        ║ DERIVED            ║ (ENGINE_RUN_DATE - stage_entered_at).days   ║
║ days_since_substantive_event ║ DERIVED            ║ Days since latest HEARING/ORDER/WITNESS     ║
║ adjournment_count            ║ DERIVED            ║ Total count of historical ADJOURNMENTs      ║
║ adjournment_streak           ║ DERIVED            ║ Consecutive adjournments since substantive  ║
║ judge_change_count           ║ DERIVED            ║ JUDGE_CHANGE events in last 365 days        ║
║ stage_deviation_ratio        ║ DERIVED            ║ days_in_stage / cohort_median_stage_days    ║
║ cohort_percentile            ║ DERIVED            ║ Empirical CDF rank within matching cohort   ║
║ structural_deviation_score   ║ DERIVED            ║ min(stage_deviation_ratio / 5.0, 1.0) * 30  ║
║ inactivity_score             ║ DERIVED            ║ min(days_inactive / 300, 1.0) * 25 (* 0.5)  ║
║ age_deviation_score          ║ DERIVED            ║ cohort_percentile * 0.15 (0 if LOW conf)    ║
║ adjournment_score            ║ DERIVED            ║ min(adjournment_streak / 5, 1.0) * 10       ║
║ actionability_score          ║ DERIVED            ║ Discrete remedy level * 0.20                ║
║ triage_score                 ║ DERIVED            ║ Sum of 5 component scores (0.0 to 100.0)    ║
║ structural_stall_probability ║ DERIVED (ML)       ║ XGBoost predict_proba on 10 features        ║
║ ml_stall_risk_level          ║ DERIVED (ML)       ║ HIGH if prob >= 0.40, else LOW              ║
╠══════════════════════════════╬════════════════════╬═════════════════════════════════════════════╣
║ synthetic_cnr                ║ SYNTHETIC          ║ Formatted as SYN/PUN/CS/2021/000001         ║
║ event_date & event_type      ║ SYNTHETIC          ║ Simulated procedural chronology             ║
║ event_description            ║ SYNTHETIC          ║ Template-generated procedural notes         ║
║ current_stage                ║ SYNTHETIC          ║ Simulated active case milestone             ║
║ structural_stall_label       ║ SYNTHETIC          ║ Scenario stall flag for ML training         ║
╚══════════════════════════════╩════════════════════╩═════════════════════════════════════════════╝
```

---

## 5. UI LABEL AUDIT & RECOMMENDED REPLACEMENTS

| # | Current UI Text | File Location | Line | Current Accuracy | Assessment & Exact Recommended Replacement |
|---|---|---|---|---|---|
| 1 | `"All case-level records are SYNTHETIC."` | `DisclaimerBanner.jsx` | L18–19 | Accurate | **Keep & Refine:** *"All individual case records and event histories are synthetic prototypes structured on real eCourts metadata schemas and NJDG statistical baselines."* |
| 2 | `"This will wipe and re-load exactly 1,000 synthetic cases and run the 6-layer triage engine..."` | `UserActions.jsx`, `Sidebar.jsx`, `Navbar.jsx` | L101, L189, L146 | Accurate | **Keep:** Accurately describes the database reseed mechanism loading `seed_data.json` (1,000 cases). |
| 3 | `"Aggregate view of Pune District Court systemic blockages and cohort deviations."` | `Dashboard.jsx` | L158 | Contextually Accurate | **Refine:** *"Simulated Pune District Court Triage Environment (1,000 cases evaluated against NJDG & Data.gov.in baselines)"* |
| 4 | `"Pune District Court - ranked by 6-layer administrative stall score."` | `PriorityQueue.jsx` | L111 | Accurate | **Keep:** Accurate description of the triage priority queue. |
| 5 | `"Both cases have been pending since 2021 (~5 years) in Pune District Court..."` | `Comparison.jsx` | L155 | Accurate | **Keep:** Accurate description of the Alpha vs. Beta deterministic benchmark. |
| 6 | `"81 Million District court cases analyzed"` | `Landing.jsx` (via `mockData.js`) | L185 | **Inaccurate / Mock Stub** | **Replace:** Change from `81 Million` to **`"3,179 Real Cases Profiled"`** and label to **`"eCourts open dataset cases audited for schema baselines"`**. |
| 7 | `"5.4 Crore+ Nationwide pending cases"` | `Landing.jsx` (via `mockData.js`) | L183 | Accurate Macro Stat | **Keep:** Matches national NJDG macro figures ($4.5\text{–}5.4\text{ crore}$). |
| 8 | `"Measurable Pilot Validation Metrics" (AUC: 0.887, Stall Precision: 91.2%, Review Time Saved: ~64%, Rank Stability: 0.96 ρ)` | `MethodologyModal.jsx` | L133–151 | **Needs Clarification** | **Refine:** Rename section header to **`"Synthetic Validation & Target Pilot Metrics"`** and add disclaimer badge: **`"Evaluated on 10,000-case synthetic validation split. Real-data metrics planned for district court pilot."`** |
| 9 | `"[SYNTHETIC]"` | `DataLabelBadge.jsx` | L17 | Accurate | **Keep:** Correctly demarks synthetic case records. |
| 10| `"[Source: NJDG]"` / `"[Source: DATA_GOV_IN]"` | `DataLabelBadge.jsx` | L9 | Accurate | **Keep:** Correctly attributes real macro aggregate metrics. |

---

## 6. MACHINE LEARNING DATA BOUNDARY

```
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│                                   ML DATA BOUNDARY AUDIT                                 │
├────────────────────────────────┬─────────────────────────────────────────────────────────┤
│ ML Pipeline Component          │ Audited Reality                                         │
├────────────────────────────────┼─────────────────────────────────────────────────────────┤
│ ML Training Data               │ 10,000 synthetic cases (ml_training_matrix_synthetic.csv) │
│                                │ with 10 non-leaking metadata and derived event features.│
├────────────────────────────────┼─────────────────────────────────────────────────────────┤
│ ML Target Variable             │ structural_stall_label (Binary 1/0 scenario flag;       │
│                                │ NOT real judicial ground truth).                        │
├────────────────────────────────┼─────────────────────────────────────────────────────────┤
│ ML Validation Protocol         │ 5-Fold Stratified Case-Level Cross-Validation &         │
│                                │ Temporal Split (<=2022 train vs >=2023 test).           │
├────────────────────────────────┼─────────────────────────────────────────────────────────┤
│ ML Validation Results          │ CV F1: 0.7468 +/- 0.0077, CV AUC: 0.8591,               │
│                                │ Temporal F1: 0.7052 (Synthetic Dataset Validation).     │
├────────────────────────────────┼─────────────────────────────────────────────────────────┤
│ Operational Inference Runtime  │ FastAPI loads final_model.joblib (180 KB) once.         │
│                                │ Predicts on the 1,000 live DB cases during triage.      │
├────────────────────────────────┼─────────────────────────────────────────────────────────┤
│ Real-Data Audit Status         │ Schema compatibility audited on 3,179 real disposed     │
│                                │ cases (disposal_time_cleaned.csv). Active stall         │
│                                │ validation blocked by absence of public event logs.     │
└────────────────────────────────┴─────────────────────────────────────────────────────────┘
```

> [!IMPORTANT]
> The ML model is currently receiving **synthetic case records with derived analytical features**. It operates strictly as a non-binding supporting signal. It does **not** alter the deterministic 5-signal priority score weights.

---

## 7. WHAT SHOULD AND SHOULD NOT BE CHANGED

### What Should NOT Be Changed
1. **Do NOT claim live cases are real court records:** The individual cases in `nyaya.db` and the priority queue are synthetic scenarios. Claiming they are real cases would be factually incorrect and misrepresent litigant confidentiality.
2. **Do NOT modify the deterministic scoring engine or ML model:** The 30/25/15/10/20 formula and XGBoost pipeline are verified and pass all 25 unit tests.
3. **Do NOT remove the prototype disclaimer banner:** The top disclaimer banner is a crucial ethical and compliance guardrail.

### What SHOULD Be Changed (When Approved)
1. **Update Landing Page Mock Metric:** Change `"81 Million District court cases analyzed"` to `"3,179 Real Cases Profiled"` in `mockData.js`.
2. **Clarify Methodology Modal Header:** Update the validation metrics box in `MethodologyModal.jsx` to explicitly state `"Synthetic Validation & Target Pilot Metrics"`.
3. **Enhance UI Transparency Tooltip:** Add a subtle information icon next to case headers explaining: *"Case metadata structured on authentic eCourts schemas; timeline events simulated for prototype demonstration."*

---

## 8. FINAL DATA PROVENANCE CLASSIFICATION

### Official Data Status:
```
WEBSITE DATA STATUS: REAL + DERIVED + SYNTHETIC
```

### Recommended User-Facing Data Label:
> **"Operational Prototype: Individual case records and event histories are synthetic scenario models structured on authentic eCourts metadata schemas and calibrated against official NJDG & Data.gov.in macro baselines."**
