# NYAYA-DRISHTI — SIH FIRST ROUND PPT ROADMAP

> **Factual Source Document** — Every claim in this document is traceable to the actual implemented codebase, verified tests, and deployed infrastructure. This document is intended as the single source of truth for constructing the SIH First Round PPT.

---

## 1. PROJECT TITLE

**Nyaya-Drishti**
*(Sanskrit: "Judicial Insight")*

**Formal Title:**
AI-Based Judicial Pendency Triage System for Prioritising Structurally Stalled Cases in District Courts

**Tagline:**
> "NJDG tells a court how many cases are pending. Nyaya-Drishti tells it which ones to pick up first — and why."

---

## 2. PROBLEM STATEMENT

### The Scale of the Problem
India's district courts collectively face a pendency exceeding **4.5 crore (45+ million) cases**. A single district court establishment can have 20,000–60,000 pending cases at any time.

### The Operational Gap
Existing systems like the **National Judicial Data Grid (NJDG)** provide aggregate pendency monitoring — total counts, age buckets, and disposal rates. But the critical operational question remains unanswered:

> **"Among all pending cases, which ones should registry staff inspect first, and why?"**

### Why Age-Based Listing Fails
Currently, case listing priority is determined almost entirely by **case age** (oldest first). This fails because:

- A **4.5-year-old case** that has had 22 regular hearings and is nearing final arguments receives top priority — even though it needs no administrative intervention.
- An **18-month-old case** where summons was issued 9 months ago with no return of service, with 5 consecutive adjournments and 3 judge changes, sits near the bottom of the queue — even though it is completely stalled on a solvable administrative bottleneck.

### The Missing Layer
There is no automated system that:
1. Compares a case's **timeline progression** against similar peer cases.
2. Detects **structural delay patterns** (dormancy, process loops, disruptions).
3. Identifies **the specific administrative bottleneck** causing the stall.
4. Produces an **explainable, auditable priority score** for registry action.

### What Nyaya-Drishti Does NOT Do
- It does **NOT** predict who will win or lose a case.
- It does **NOT** evaluate judicial officers or judge performance.
- It does **NOT** recommend judicial decisions.
- It does **NOT** autonomously dispose of cases.

It is a **purely administrative queue management tool** for court registry staff.

---

## 3. TARGET USERS

| User Type | What They Need | What Nyaya-Drishti Provides | Implemented Permissions |
| :--- | :--- | :--- | :--- |
| **Admin Staff** | Full system visibility, ability to reset demo data, oversight of all triage metrics | Complete dashboard access, priority queue, case detail with evidence, Alpha/Beta comparison, database reseed capability | `admin` role — full access to all endpoints including `POST /admin/reseed` |
| **Registry Staff** | Actionable ranked list of cases requiring administrative follow-up | Priority queue (ranked by triage score), case detail with bottleneck explanation, cohort benchmarking | `registry_staff` role — read access to all triage endpoints, reseed restricted (HTTP 403) |

### Currently NOT Supported (Do Not Claim)
- Judges (no judge-facing views implemented)
- Lawyers / Advocates (no party-facing interface)
- Litigants / Citizens (no public portal)
- Police / Investigation agencies

---

## 4. PROPOSED IDEA — NYAYA DRISHTI

### Complete Workflow

```
RAW CASE DATA (synthetic, eCourts-compatible schema)
        |
        v
CASE + EVENT INFORMATION
  - Filing date, current stage, hearing dates
  - Event types: HEARING, ORDER, ADJOURNMENT, SUMMONS_ISSUED,
    SUMMONS_RETURNED, WITNESS_EXAM, JUDGE_CHANGE, STAGE_TRANSITION
        |
        v
FEATURE EXTRACTION (Layer 2 - Stall Detector)
  - days_in_current_stage
  - days_since_substantive_event
  - adjournment_streak (consecutive, post-substantive)
  - judge_change_count (within 365-day window)
  - stage_deviation_ratio (case vs. cohort median)
        |
        v
COHORT COMPARISON (Layer 1 - Cohort Builder)
  - 5-part cohort key: (court, case_type, act_section, filing_year_bucket, stage)
  - Statistical baselines: median_days_in_stage, median_age, p75, p90
  - Confidence assessment: HIGH if cohort >= 15 cases, LOW if < 15
  - Age percentile computed within cohort
        |
        v
BOTTLENECK DETECTION (Layer 3 - Bottleneck Classifier)
  - Deterministic rule cascade (6 rules in priority order)
  - Classifies: SUMMONS_DELAY, WITNESS_DELAY, REPEATED_ADJOURNMENT,
    JUDGE_CHANGE, PROCEDURAL_INACTIVITY, or UNKNOWN
  - Assigns actionability: HIGH, MEDIUM, or LOW
        |
        v
TRIAGE SCORING (Layer 4 - Priority Scorer)
  - 5-component weighted formula (30/25/15/10/20)
  - Score range: 0.0 to 100.0
  - Higher score = higher administrative review priority
        |
        v
EVIDENCE BUNDLE (Layer 5 - Evidence Bundler)
  - JSON payload with 15+ traceable metrics
  - Every score factor is individually auditable
        |
        v
EXPLANATION (Layer 6 - Template Generator)
  - Deterministic, template-matched text
  - Zero LLM involvement
  - Explains exact arithmetic factors behind the score
        |
        v
PRIORITY QUEUE
  - Cases ranked descending by triage_score
  - Filterable by bottleneck type and confidence level
  - Searchable by CNR number
  - Paginated for large datasets
        |
        v
ADMINISTRATIVE ACTION
  - Registry staff reviews top-priority cases
  - Investigates identified bottleneck
  - Takes administrative action (e.g., resend summons, schedule hearing)
```

### Key Concepts Explained

| Concept | Meaning |
| :--- | :--- |
| **Triage Score** | A number from 0 to 100 indicating administrative review priority. Higher = more urgently needs registry attention. |
| **Triage Confidence** | HIGH if the case belongs to a cohort with >= 15 cases (reliable statistical comparison). LOW if cohort < 15 (age percentile suppressed). |
| **Bottleneck Type** | The specific identified administrative delay pattern: Summons Delay, Witness Delay, Repeated Adjournment, Judge/Bench Change, Procedural Inactivity, or Unknown (progressing normally). |
| **Cohort** | A group of similar cases sharing: court establishment, case type, act/section bucket, filing year bucket, and current stage. Cases are compared against their cohort's statistical baseline. |
| **Stage Deviation Ratio** | How many times longer this case has been in its current stage compared to the cohort median. A ratio of 4.42x means the case has been in-stage 4.42 times longer than typical. |
| **Actionability** | Whether the identified bottleneck has a practical administrative remedy (HIGH = clear registry action available, LOW = progressing normally). |
| **Evidence** | A structured JSON bundle containing all 15+ metrics that contributed to the triage score — fully auditable. |
| **Explanation** | A human-readable sentence generated from templates (not an LLM) explaining exactly why the case received its score. |

### Critical Distinction
- **"Case priority"** = priority for administrative registry review.
- This is **NOT** "case outcome prediction" or "judgment likelihood."

---

## 5. SOLUTION

### INPUT
- **1,000 synthetic cases** modeled on eCourts/NJDG data schema.
- Each case has 5-25 timeline events (hearings, orders, adjournments, summons, judge changes, stage transitions).
- Cases span filing years 2018-2024, all within a simulated "Pune District Court" jurisdiction.
- 4 real aggregate statistics sourced from NJDG/Data.gov.in provide macro context.

### PROCESSING
1. **Cohort Construction:** Cases are grouped into cohorts by 5-part key. Statistical baselines (median stage duration, median age, percentiles) are pre-computed for each cohort. Currently 16 cohort stat records exist.
2. **Stall Detection:** For each case, the engine analyzes the event timeline to derive: days in current stage, days since last substantive event, consecutive adjournment streak, judge change count in the last 365 days, and stage deviation ratio vs. cohort median.
3. **Bottleneck Classification:** A deterministic 6-rule cascade identifies the primary administrative bottleneck from the derived metrics.

### INTELLIGENCE
4. **Priority Scoring:** A locked 5-component weighted formula calculates the triage score (0-100).
5. **Evidence Bundling:** All 15+ metrics are packaged into a traceable JSON audit payload.
6. **Explanation Generation:** Template-matched text explains the exact factors — no LLM, no hallucination.

### OUTPUT
7. **Priority Queue:** All 1,000 cases ranked descending by triage score, with bottleneck tags, confidence badges, and score indicators.
8. **Case Detail Page:** Deep-dive view for any individual case showing timeline, cohort benchmark, score component breakdown, and explanation.
9. **Alpha/Beta Comparison:** Side-by-side demonstration proving that age alone is insufficient for prioritization.

### USER ACTION
10. **Registry staff** opens the Priority Queue -> sees CASE-ALPHA at rank #1 with Score 91.4 and "Summons Delay" tag -> clicks to view detail -> reads explanation -> takes administrative action (request service status report from process server).

---

## 6. ALGORITHM / LOGIC USED

### Classification: Deterministic Rule-Based + Statistical Baseline System
**This is NOT a trained machine learning model.** The system uses:
- Pre-computed **statistical baselines** (median, p75, p90 percentiles) from cohort data.
- **Deterministic rule cascades** for bottleneck classification.
- A **fixed weighted formula** for priority scoring.
- **Template-based** explanation generation (zero LLM).

### Why This Approach Is Appropriate for Judicial Administrative Triage
1. **Full Explainability:** Every point in the score is traceable to a specific measurable metric. A black-box ML model cannot provide this level of auditability, which is essential in a judicial context.
2. **No Training Data Required:** Real labeled training data (cases officially classified as "stalled" vs. "progressing") does not exist. The system uses statistical comparison instead of supervised learning.
3. **Deterministic Reproducibility:** Given the same input data and engine date, the system produces identical scores every time. This is critical for administrative accountability.
4. **No Bias Risk:** Because it compares a case only against its own cohort's statistical profile (not against judge-specific or party-specific data), it avoids encoding discriminatory patterns.

---

### Layer 1: Cohort Builder & Confidence Assessor
**File:** `backend/triage/cohort.py`

**Cohort Key (5-part):**
```
(court_establishment, case_type, act_section_bucket, filing_year_bucket, current_stage)
```

**Filing Year Bucket Formula:**
```python
def cohort_year_bucket(filing_year: int) -> str:
    return str((filing_year // 2) * 2)
# 2019 -> "2018", 2020 -> "2020", 2021 -> "2020", 2022 -> "2022"
```

**Confidence Rules:**
- If cohort_size >= 15: confidence = `HIGH`, age percentile is computed.
- If cohort_size < 15 or cohort missing: confidence = `LOW`, age percentile = None, age score contribution = 0.

**Age Percentile:**
Rank-based percentile of the case's age (days since filing) among all cases in the same cohort bucket.

---

### Layer 2: Stall Detector
**File:** `backend/triage/stall_detector.py`

Derives 5 metrics from the case's event timeline:

| Metric | Derivation |
| :--- | :--- |
| `days_in_current_stage` | `ENGINE_RUN_DATE - case.stage_entered_at` (from latest STAGE_TRANSITION event) |
| `days_since_substantive_event` | `ENGINE_RUN_DATE - latest substantive event date` (HEARING, ORDER, or WITNESS_EXAM) |
| `adjournment_streak` | Count of consecutive ADJOURNMENT events working backwards from the most recent event until a substantive event is found |
| `judge_change_count` | Count of JUDGE_CHANGE events within the last 365 days |
| `stage_deviation_ratio` | `days_in_current_stage / cohort.median_days_in_stage` |

**ENGINE_RUN_DATE** is fixed at `2026-08-16` for deterministic scoring.

---

### Layer 3: Bottleneck Classifier (Deterministic Cascade)
**File:** `backend/triage/bottleneck.py`

Rules are evaluated in **strict priority order** — the first matching rule wins:

| Priority | Rule | Condition | Bottleneck | Actionability |
| :--- | :--- | :--- | :--- | :--- |
| 1 | Summons Delay | SUMMONS_ISSUED with no SUMMONS_RETURNED within >= 90 days | `SUMMONS_DELAY` | HIGH |
| 2 | Witness Delay | Stage = "Evidence / Argument" AND days_since_substantive > 180 | `WITNESS_DELAY` | MEDIUM |
| 3 | Repeated Adjournment | adjournment_streak >= 4 | `REPEATED_ADJOURNMENT` | HIGH |
| 4 | Judge/Bench Change | judge_change_count >= 2 (within 365 days) | `JUDGE_CHANGE` | MEDIUM |
| 5 | Procedural Inactivity | days_since_substantive > 120 | `PROCEDURAL_INACTIVITY` | MEDIUM |
| 6 | Default | None of the above | `UNKNOWN` | LOW |

---

### Layer 4: Priority Scorer (Locked 30/25/15/10/20 Formula)
**File:** `backend/triage/scorer.py`

```
Triage Score = A + B + C + D + E
```

| Component | Weight | Raw Formula | Cap |
| :--- | :--- | :--- | :--- |
| **A: Structural Deviation** | 30% | `min(stage_deviation_ratio / 5.0, 1.0) x 100` | Capped at ratio = 5.0 |
| **B: Inactivity** | 25% | `min(days_since_substantive / 300, 1.0) x 100` | Capped at 300 days. x0.5 discount if judge changed in last 60 days |
| **C: Age Deviation** | 15% | `cohort_age_percentile` (0-100) | Set to 0 if confidence = LOW |
| **D: Adjournment Streak** | 10% | `min(adjournment_streak / 5, 1.0) x 100` | Capped at 5 consecutive |
| **E: Actionability** | 20% | `{HIGH: 100, MEDIUM: 50, LOW: 0, UNKNOWN: 0}` | Discrete mapping |

**Final score** = `round(A*0.30 + B*0.25 + C*0.15 + D*0.10 + E*0.20, 1)`

---

### Layer 5: Evidence Bundler
**File:** `backend/triage/evidence.py`

Produces a JSON payload with **15+ traceable fields** including:
- `synthetic_cnr`, `court_establishment`, `case_type`, `current_stage`
- `filing_date`, `stage_entered_at`
- `days_in_current_stage`, `cohort_median_days_in_stage`, `stage_deviation_ratio`
- `days_since_substantive_event`, `adjournment_streak`, `adjournment_count`, `judge_change_count`
- `cohort_size`, `cohort_age_percentile`
- `bottleneck_type`, `actionability_level`, `triage_confidence`, `triage_score`
- `component_scores` (individual A/B/C/D/E breakdown)

---

### Layer 6: Explanation Generator
**File:** `backend/triage/templates.py`

Template-matched deterministic text. **Zero LLM involvement.**

Example output for SUMMONS_DELAY:
> *"Case has been in stage 'Summons / Appearance' for 287 days (4.42x cohort median of 65d). Summons was issued with no return of service recorded over 287 days, resulting in 5 consecutive adjournments. High administrative actionability to request service status report from registry process server."*

---

### CASE-ALPHA vs. CASE-BETA Demonstration

| Metric | CASE-ALPHA (Stalled) | CASE-BETA (Progressing) |
| :--- | :--- | :--- |
| **CNR** | SYN/PUN/CS/2021/000001 | SYN/PUN/CS/2021/000002 |
| **Filing Date** | 2021-03-10 (~5 years old) | 2021-05-14 (~5 years old) |
| **Triage Score** | **91.4** | **14.7** |
| **Bottleneck** | SUMMONS_DELAY (HIGH) | UNKNOWN (LOW) |
| **Days in Stage** | 287 | 45 |
| **Stage Deviation** | 4.42x cohort median | Normal |
| **Days Since Substantive** | 287 | 21 |
| **Adjournment Streak** | 5 consecutive | 0 |
| **Score Gap** | 91.4 - 14.7 = **76.7 points** | -- |

> Both cases are approximately the same age (~5 years). Under age-based listing, they would be treated identically. Nyaya-Drishti identifies ALPHA as the case requiring urgent administrative intervention.

---

## 7. FLOWCHART

### System-Level Flowchart (Entire Pipeline)

```
+----------------------------------+
|   SYNTHETIC CASE DATA (JSON)     |
|   1,000 cases, 5-25 events each |
+----------------+-----------------+
                 |
                 v
+----------------------------------+
|   DATA LOADING & VALIDATION      |
|   seed/loader.py                 |
|   - Parse JSON -> SQLAlchemy ORM |
|   - Validate stage_entered_at   |
|   - Load cohort_stats            |
|   - Load aggregate_context       |
+----------------+-----------------+
                 |
                 v
+----------------------------------+
| LAYER 1: COHORT BUILDER          |
|   triage/cohort.py               |
|   - Match case -> 5-part key     |
|   - Assess confidence (HIGH/LOW) |
|   - Compute age percentile       |
+----------------+-----------------+
                 |
                 v
+----------------------------------+
| LAYER 2: STALL DETECTOR          |
|   triage/stall_detector.py       |
|   - days_in_current_stage        |
|   - days_since_substantive       |
|   - adjournment_streak           |
|   - judge_change_count           |
|   - stage_deviation_ratio        |
+----------------+-----------------+
                 |
                 v
+----------------------------------+
| LAYER 3: BOTTLENECK CLASSIFIER   |
|   triage/bottleneck.py           |
|   - 6-rule deterministic cascade |
|   - Assigns bottleneck_type      |
|   - Assigns actionability_level  |
+----------------+-----------------+
                 |
                 v
+----------------------------------+
| LAYER 4: PRIORITY SCORER         |
|   triage/scorer.py               |
|   - 5-component weighted formula |
|   - Score: 0.0 to 100.0          |
+----------------+-----------------+
                 |
                 v
+----------------------------------+
| LAYER 5: EVIDENCE BUNDLER        |
|   triage/evidence.py             |
|   - 15+ traceable JSON fields    |
|   - Full auditability            |
+----------------+-----------------+
                 |
                 v
+----------------------------------+
| LAYER 6: EXPLANATION GENERATOR   |
|   triage/templates.py            |
|   - Template-matched text        |
|   - Zero LLM                     |
+----------------+-----------------+
                 |
                 v
+----------------------------------+
|   PRIORITY QUEUE (API)           |
|   Ranked descending by score     |
|   Filterable + Searchable        |
+----------------+-----------------+
                 |
                 v
+----------------------------------+
|   REGISTRY STAFF ACTION          |
|   Inspect -> Investigate ->      |
|   Intervene administratively     |
+----------------------------------+
```

### Individual Case Flowchart

```
   CASE (with event timeline)
          |
          v
   FEATURE EXTRACTION
   - stage duration, inactivity,
     adjournment streak, judge changes
          |
          v
   COHORT MATCHING
   - 5-part key -> statistical baseline
   - Confidence: HIGH or LOW
          |
          v
   BOTTLENECK DETECTION
   - 6-rule cascade -> bottleneck type
   - Actionability level
          |
          v
   TRIAGE SCORE (0-100)
   - 30% structural + 25% inactivity
     + 15% age + 10% adjournment
     + 20% actionability
          |
          v
   EXPLANATION
   - Template-generated text
   - Itemized evidence bundle
          |
          v
   RANKED IN PRIORITY QUEUE
```

---

## 8. TECHNOLOGY STACK

| Layer | Technology | Version | Actual Role in Nyaya-Drishti |
| :--- | :--- | :--- | :--- |
| **Frontend Framework** | React | 19.x | Single-page application with client-side routing for Dashboard, Priority Queue, Case Detail, and Comparison pages |
| **Build Tool** | Vite | 8.x | Fast development server and production bundler for the React SPA |
| **HTTP Client** | Axios | 1.19.x | Makes REST API calls to the FastAPI backend, handles JWT token injection via request interceptor |
| **Data Visualization** | Recharts | 3.10.x | Renders interactive bar charts for bottleneck distribution and aggregate statistics |
| **UI Icons** | Lucide-React | 1.31.x | Consistent judicial-themed iconography across all pages |
| **CSS Framework** | Tailwind CSS | 4.x | Dark-mode judicial interface styling with responsive layouts |
| **Routing** | React Router DOM | 7.x | Client-side page routing with protected routes (RequireAuth wrapper) |
| **Backend Framework** | FastAPI | 0.115.x | High-performance async REST API serving all triage, auth, and data endpoints |
| **ASGI Server** | Uvicorn | 0.30.x | Production ASGI server running the FastAPI application |
| **ORM** | SQLAlchemy | 2.0.x | Object-relational mapper for all database models (User, Case, CaseEvent, CohortStat, AggregateContext) |
| **Schema Validation** | Pydantic | 2.7.x | Request/response data validation and serialization for all API endpoints |
| **Authentication** | python-jose (JWT) + passlib (bcrypt) | -- | HS256 JWT token generation, bcrypt password hashing, OAuth2 password bearer flow |
| **Database** | PostgreSQL (Supabase) | -- | Production relational storage for 1,000 cases, 16 cohort stats, events, and users |
| **Database (Dev)** | SQLite | -- | Local development fallback when DATABASE_URL is not set |
| **PostgreSQL Driver** | psycopg2-binary | 2.9.x | Python PostgreSQL adapter for SQLAlchemy engine |
| **Environment Config** | python-dotenv | 1.0.x | Loads environment variables from `.env` files |
| **Testing** | pytest + httpx | 8.x / 0.27.x | 18 automated backend tests covering auth, RBAC, queue ordering, cohort logic, and triage edge cases |
| **Frontend Deployment** | Vercel | -- | Hosts the production React SPA, auto-deploys from GitHub `main` branch |
| **Backend Deployment** | Render | -- | Hosts the production FastAPI backend as a web service |
| **Database Hosting** | Supabase | -- | Managed PostgreSQL with connection pooling for production persistence |

### Technologies NOT Used (Do Not Claim)
- No scikit-learn, TensorFlow, PyTorch, or any ML training framework
- No LLM (GPT, Gemini, etc.) for explanation generation
- No pandas or NumPy at runtime (cohort stats are pre-computed by the seed generator)
- No Redis or caching layer
- No Docker or Kubernetes
- No Kafka, RabbitMQ, or message queues

---

## 9. SYSTEM ARCHITECTURE

### Deployed Architecture

```
+-------------------------------------------------------------+
|                      USER (Browser)                          |
|  Registry Staff / Admin logs in via /login page              |
+-----------------------------+--------------------------------+
                              | HTTPS
                              v
+-------------------------------------------------------------+
|                VERCEL (Frontend Hosting)                      |
|  React SPA - Vite-built static bundle                        |
|  URL: https://nyaya-drishti-phi.vercel.app                   |
|  - Serves index.html + JS/CSS assets                         |
|  - Environment: VITE_API_URL -> Render backend               |
|  - Auto-deploys from GitHub main branch                      |
+-----------------------------+--------------------------------+
                              | REST API (JSON + JWT Bearer)
                              v
+-------------------------------------------------------------+
|                RENDER (Backend Hosting)                       |
|  FastAPI - Uvicorn - Python 3.12                             |
|  URL: https://nyaya-drishti-qjrd.onrender.com               |
|  - 8 API routers: auth, cases, cohort, queue, stats,         |
|    demo, admin, root                                         |
|  - CORS configured for Vercel domain                         |
|  - Environment: DATABASE_URL, SECRET_KEY, APP_ENV=production |
+-----------------------------+--------------------------------+
                              | PostgreSQL Wire Protocol (SSL)
                              v
+-------------------------------------------------------------+
|               SUPABASE (PostgreSQL Hosting)                   |
|  - 5 tables: users, cases, case_events, cohort_stats,        |
|    aggregate_context                                         |
|  - 1,000 synthetic cases with 5-25 events each               |
|  - 16 cohort stat records                                    |
|  - 4 real aggregate context records (NJDG/Data.gov.in)       |
|  - 2 user accounts (admin, registry)                         |
|  - Connection pooling: pool_size=10, max_overflow=20         |
+-------------------------------------------------------------+
```

### Communication Flow
1. **User -> Vercel:** Browser loads the React SPA (static HTML/JS/CSS).
2. **Browser -> Render:** Axios sends REST API requests with JWT Bearer token in Authorization header.
3. **Render -> Supabase:** SQLAlchemy ORM queries PostgreSQL over SSL with connection pooling.
4. **Render -> Browser:** JSON responses containing case data, triage metrics, evidence bundles, and explanations.

### API Endpoints (Implemented)

| Method | Endpoint | Purpose | Auth Required |
| :--- | :--- | :--- | :--- |
| POST | `/auth/token` | Login (OAuth2 password flow) | No |
| GET | `/auth/me` | Get current user info | Yes |
| GET | `/queue` | Priority queue (paginated, filterable) | Yes |
| GET | `/cases` | List cases | Yes |
| GET | `/cases/{id}` | Case detail | Yes |
| GET | `/cases/{id}/timeline` | Case event timeline | Yes |
| GET | `/cases/{id}/cohort` | Case cohort statistics | Yes |
| GET | `/stats/aggregate` | District-level aggregate stats | Yes |
| GET | `/demo/comparison` | Alpha vs Beta comparison | Yes |
| POST | `/admin/reseed` | Reset demo database | Yes (admin only) |
| GET | `/` | Health check / root info | No |

---

## 10. INNOVATION

### Genuine Differentiators (Implemented)

1. **Administrative Triage, Not Outcome Prediction**
   The system explicitly avoids predicting who wins or loses. It identifies which cases need administrative attention — a fundamentally different and more ethically appropriate goal for a court technology tool.

2. **Cohort-Relative Delay Detection**
   Instead of using absolute age or arbitrary thresholds, the system compares each case against a statistically computed baseline of similar cases. A case spending 287 days in a stage where the cohort median is 65 days (4.42x) is genuinely anomalous, regardless of its absolute age.

3. **Multi-Signal Bottleneck Identification**
   The system combines 5 distinct delay signals (structural deviation, inactivity, age deviation, adjournment patterns, actionability) into a single weighted score. No existing judicial system performs this multi-signal combination.

4. **Full Explainability by Design**
   Every point in the triage score is decomposed into individually auditable components. The 15+ field evidence bundle and template-generated explanation ensure zero opacity — critical in a judicial administrative context.

5. **Confidence-Aware Scoring**
   When a cohort is too small (< 15 cases), the system automatically suppresses the age percentile component and marks the result as LOW confidence rather than producing a misleadingly confident score.

6. **Judge Change Grace Period**
   If a judge/bench change occurred within the last 60 days, the inactivity score component is automatically discounted by 50% — acknowledging that recent transfers naturally cause temporary procedural pauses.

7. **Deterministic Reproducibility**
   The entire engine uses a fixed ENGINE_RUN_DATE and deterministic calculations. Given the same data, scores are identical every time — essential for administrative accountability and audit trails.

8. **Data Label Enforcement**
   Database-level CHECK constraints enforce that all case records carry `data_label = 'SYNTHETIC'` and all aggregate context carries `data_label = 'REAL_AGGREGATE'`, preventing accidental misrepresentation of synthetic data as real.

---

## 11. DIFFERENTIATION FROM EXISTING SYSTEMS

| Aspect | Traditional Approach (NJDG / CIS) | Nyaya-Drishti |
| :--- | :--- | :--- |
| **What it shows** | Case counts, age buckets, disposal rates | Individual case priority with bottleneck identification |
| **Priority determination** | Case age (oldest first) | Multi-signal triage score (structural, inactivity, adjournment, actionability) |
| **Bottleneck identification** | Not available | 6-rule deterministic classifier (Summons Delay, Witness Delay, etc.) |
| **Cohort comparison** | Not available | 5-part cohort key with median/percentile statistical baselines |
| **Explainability** | N/A | 15+ field evidence bundle + template-generated explanation |
| **Actionability guidance** | Not available | HIGH/MEDIUM/LOW actionability classification with specific registry action suggestions |
| **Confidence assessment** | Not available | Automatic LOW confidence marking for small cohorts (< 15 cases) |
| **User targeting** | General court monitoring | Specific to registry/administrative staff |
| **Scope** | Monitor aggregate pendency | Prioritize individual case review |
| **Data distinction** | Mixes real and derived | Database-enforced data_label constraints (SYNTHETIC vs REAL_AGGREGATE) |

---

## 12. FEASIBILITY

### Currently Implemented (Verified)

| Evidence | Status |
| :--- | :--- |
| Working React frontend with 5 pages (Login, Dashboard, Priority Queue, Case Detail, Comparison) | DEPLOYED on Vercel |
| Working FastAPI backend with 11 API endpoints | DEPLOYED on Render |
| PostgreSQL database with 1,000 cases, 16 cohort stats, and triage metrics | LIVE on Supabase |
| Complete 6-layer triage engine computing scores for all cases | VERIFIED: ALPHA = 91.4, BETA = 14.7 |
| Role-based authentication (admin, registry_staff) with JWT | VERIFIED with automated tests |
| 18 automated backend tests (auth, RBAC, queue ordering, cohort, triage) | ALL 18 PASS |
| Production deployment (Vercel + Render + Supabase) | LIVE and accessible |
| CORS configuration for production domain | CONFIGURED |
| Environment-based security (dev defaults blocked in production) | RuntimeError raised if secrets missing in production |
| Deterministic seed data with automated verification (1,000 cases, 5-25 events each) | VERIFIED |
| Non-dismissible disclaimer banner on every page | IMPLEMENTED |
| Database-level CHECK constraints for data label integrity | ENFORCED |

### Future / Proposed (NOT Yet Implemented)

| Feature | Status |
| :--- | :--- |
| Integration with real eCourts/NJDG case data | FUTURE |
| Survival analysis / ML-based baseline models | FUTURE |
| Multi-district / multi-state support | FUTURE |
| Real-time data pipeline (Kafka/Airflow) | FUTURE |
| Advanced anomaly detection | FUTURE |
| Judge/lawyer/citizen-facing interfaces | FUTURE |
| Cross-court benchmarking | FUTURE |
| Mobile application | FUTURE |
| Audit logging of registry actions taken | FUTURE |

---

## 13. IMPACT

### Potential Impact (Based on Demonstrated Capabilities)

1. **Better Prioritization of Administrative Workload**
   Instead of manually scanning thousands of cases, registry staff see a ranked queue with the most structurally stalled cases at the top. The 76.7-point gap between ALPHA (91.4) and BETA (14.7) demonstrates meaningful signal separation.

2. **Faster Identification of Stalled Cases**
   The system surfaces cases with specific bottlenecks (unserved summons, repeated adjournments, bench change inactivity) that would otherwise remain buried in age-sorted lists.

3. **Better Visibility into Bottleneck Patterns**
   The dashboard's aggregate distribution chart shows registry staff the proportion of cases affected by each bottleneck type, enabling systemic process improvements.

4. **More Explainable Decision Support**
   Every recommendation is backed by 15+ auditable metrics and a plain-language explanation. Registry staff can verify and understand the system's reasoning before taking action.

5. **Reduced Manual Screening Burden**
   Instead of reviewing 1,000 cases manually, staff can focus on the top-priority cases identified by the system — potentially reducing screening effort by an order of magnitude.

6. **Potential Reduction in Avoidable Administrative Delay**
   By identifying summons delays, adjournment loops, and post-transfer inactivity early, the system enables proactive intervention before cases accumulate years of unnecessary procedural delay.

### What the System Does NOT Guarantee
- It does not guarantee faster judgments or higher disposal rates.
- It does not replace judicial decision-making.
- It does not eliminate all delay (many delays are inherent to complex litigation).

---

## 14. ROADMAP

### PHASE 1 — CURRENT MVP (Implemented)
- 6-layer deterministic triage engine
- 1,000 synthetic cases with full event timelines
- 16 cohort stat baselines with statistical comparison
- 5-component weighted priority scoring (0-100)
- Bottleneck classification (6 types)
- Evidence bundling (15+ traceable fields)
- Template-based explanations (zero LLM)
- React dashboard with Priority Queue, Case Detail, and Alpha/Beta Comparison
- Role-based authentication (admin, registry_staff)
- PostgreSQL production database (Supabase)
- Cloud deployment (Vercel + Render)
- 18 automated backend tests
- Data label integrity constraints

### PHASE 2 — PILOT (FUTURE)
- Replace synthetic data with anonymized real case timelines from a partner district court (subject to authorization)
- Calibrate scoring weights based on registry staff feedback
- Add audit logging of registry actions taken on flagged cases
- User acceptance testing with actual court registry staff
- Performance optimization for 50,000+ case datasets

### PHASE 3 — SCALE (FUTURE)
- Multi-district support (multiple court establishments)
- Multi-state deployment capability
- Role expansion (separate dashboards for District Judge, State CJI office)
- API rate limiting and production hardening
- Kubernetes/Docker containerization for cloud-native deployment

### PHASE 4 — ADVANCED INTELLIGENCE (FUTURE)
- Survival analysis models (Cox Proportional Hazards / Kaplan-Meier) for more sophisticated cohort baselines
- SHAP-based explainability for any ML components
- Cross-court benchmarking analytics
- Predictive timeline forecasting (estimated time to next milestone)
- Anomaly detection for unusual case patterns

### PHASE 5 — PRODUCTION INTEGRATION (FUTURE)
- Integration with official eCourts CIS data feeds (subject to NIC/DoJ authorization)
- Government cloud hosting (Meghraj/NIC Cloud) for data residency compliance
- SSO integration with government identity providers
- Compliance with Judicial Data Protection guidelines
- Deployment as an officially authorized registry tool

---

## 15. DEMO SCENARIO

### 90-Second Demo Script

**Setup:** Open the Nyaya-Drishti deployed URL.

**0:00 - 0:15 — Login**
- Note the non-dismissible disclaimer banner: "NON-JUDICIAL PROTOTYPE — This system provides administrative review triage only."
- Click "Admin Staff" quick-fill button -> Sign In.

**0:15 - 0:35 — Dashboard Overview**
- Observe the 4 macro context cards with source attribution (`[Source: NJDG]` / `[Source: DATA_GOV_IN]`).
- Review the Pune District Court bottleneck distribution chart showing the proportion of cases by bottleneck type.

**0:35 - 0:55 — Priority Queue**
- Navigate to Priority Queue.
- **CASE-ALPHA** appears at **rank #1** with a score of **91.4** and a `Summons Delay` tag.
- Demonstrate bottleneck filter (e.g., filter by "Bench Change" or "Summons Delay").
- Note that CASE-BETA appears much lower in the queue with score **14.7**.

**0:55 - 1:15 — Case Detail & Auditability**
- Click on CASE-ALPHA to open the detail page.
- Walk through the **5-component score breakdown**:
  - Structural Deviation: 26.49 points
  - Inactivity: 23.92 points
  - Age Deviation: 10.97 points
  - Adjournment: 10.0 points
  - Actionability: 20.0 points
- Show the **Cohort Benchmark Context**: 287 days in stage vs. 65-day cohort median = 4.42x deviation.
- Scroll through the **Event Timeline** showing SUMMONS_ISSUED with no SUMMONS_RETURNED.
- Read the **Explanation**: "High administrative actionability to request service status report from registry process server."

**1:15 - 1:30 — Alpha vs Beta Side-by-Side**
- Navigate to Demo Comparison.
- Show CASE-ALPHA (Score 91.4, stalled) next to CASE-BETA (Score 14.7, progressing).
- Conclude: *"Both cases are approximately 5 years old. Without Nyaya-Drishti, they look identical in an age-sorted queue. With Nyaya-Drishti, registry staff can immediately identify and act on ALPHA's unserved summons while letting BETA proceed to final arguments undisturbed."*

---

## 16. KEY NUMBERS / PROOF OF IMPLEMENTATION

| Metric | Verified Value |
| :--- | :--- |
| Total synthetic cases | **1,000** |
| Events per case | **5-25** (enforced by automated verification) |
| Cohort stat records | **16** |
| Real aggregate context records | **4** (sourced from NJDG / Data.gov.in) |
| User roles | **2** (admin, registry_staff) |
| API endpoints | **11** |
| Frontend pages | **5** (Login, Dashboard, Priority Queue, Case Detail, Comparison) |
| Reusable UI components | **6** (Navbar, DisclaimerBanner, ScoreBadge, BottleneckTag, ConfidenceBadge, DataLabelBadge) |
| Automated backend tests | **18** (all passing) |
| CASE-ALPHA triage score | **91.4** |
| CASE-BETA triage score | **14.7** |
| Alpha-Beta score gap | **76.7 points** |
| ALPHA bottleneck | SUMMONS_DELAY (HIGH actionability) |
| BETA bottleneck | UNKNOWN (LOW actionability) |
| ALPHA stage deviation | **4.42x** cohort median (287d vs 65d) |
| ALPHA adjournment streak | **5** consecutive |
| Triage engine layers | **6** |
| Score components | **5** (30/25/15/10/20 weights) |
| Evidence bundle fields | **15+** traceable metrics |
| Bottleneck types | **6** (Summons Delay, Witness Delay, Repeated Adjournment, Judge Change, Procedural Inactivity, Unknown) |
| Deployment platforms | **3** (Vercel, Render, Supabase) |

---

## 17. SIH PPT SLIDE MAPPING

### Recommended PPT Structure (10 Slides)

| Slide | Title | Content | Source Section | Suggested Visual |
| :--- | :--- | :--- | :--- | :--- |
| **1** | **Title Slide** | "Nyaya-Drishti: AI-Based Judicial Pendency Triage System for District Courts" + Team Name + SIH Problem Statement ID + Tagline | S1 | Project logo / Scale of Justice icon |
| **2** | **The Problem** | Pendency scale (4.5 Cr cases), why age-based listing fails, the Alpha vs Beta paradox (same age, opposite need), the missing operational layer | S2 | Simple split diagram: "Old + Active = Low Priority" vs "Young + Stalled = High Priority" |
| **3** | **Our Solution: Nyaya-Drishti** | High-level pipeline: Data -> Features -> Cohort -> Bottleneck -> Score -> Evidence -> Queue -> Action. Key concepts in 5 bullet points. | S4, S5 | System pipeline flowchart (from S7) |
| **4** | **How It Works: 6-Layer Triage Engine** | Layer 1-6 summary table. Emphasize: deterministic, explainable, rule-based — NOT a black-box ML model. Show the 30/25/15/10/20 formula. | S6 | Layered architecture diagram + formula |
| **5** | **Bottleneck Detection** | 6-rule cascade table (Summons Delay -> Unknown). Actionability levels. Real example: ALPHA's summons delay. | S6 (Layer 3) | Rule cascade flow + ALPHA example callout |
| **6** | **Live Demo: Alpha vs Beta** | Side-by-side comparison table with actual verified values. Score 91.4 vs 14.7. "Same age, opposite need." | S15, S16 | Screenshot of the Comparison page or Alpha/Beta split card |
| **7** | **System Architecture & Tech Stack** | Vercel -> Render -> Supabase diagram. Key technologies table (React, FastAPI, PostgreSQL, JWT). | S8, S9 | Architecture diagram from S9 |
| **8** | **Innovation & Differentiation** | 4-5 key differentiators vs traditional systems. Comparison table (Traditional vs Nyaya-Drishti). | S10, S11 | Comparison table |
| **9** | **Feasibility & Impact** | "Currently implemented" evidence checklist. 26 backend tests passing. Live deployment URLs. Potential impact on registry workload. | S12, S13 | Checklist with green checkmarks |
| **10** | **Roadmap & Next Steps** | Phase 1 (MVP - Done) -> Phase 2 (Pilot) -> Phase 3 (Scale) -> Phase 4 (Advanced) -> Phase 5 (Integration). Clear CURRENT vs FUTURE labels. | S14 | Phased roadmap timeline |

### Optional Additional Slides (if 12 slides allowed)

| Slide | Title | Content |
| :--- | :--- | :--- |
| **11** | **Ethical Safeguards** | What the system does NOT do: no outcome prediction, no judge evaluation, no autonomous decisions. Disclaimer banner. Data label enforcement. |
| **12** | **Key Numbers** | Quick-reference stats card: 1,000 cases, 26 backend tests, 91.4 vs 14.7, 76.7-point gap, 6 layers, 15+ evidence fields, 3 deployment platforms. |

---

## 18. FACT CHECK / DO NOT CLAIM

> **CRITICAL: The following claims must NOT appear in the PPT.**

| DO NOT Claim | What Is Actually True |
| :--- | :--- |
| "We use AI/ML to train a model" | The system uses deterministic rules and statistical baselines. No ML model is trained. |
| "We use deep learning / neural networks" | No deep learning, neural networks, or gradient-based optimization is used anywhere in the codebase. |
| "We use an LLM for explanations" | Explanations are generated from fixed templates. Zero LLM involvement. |
| "We use real court case data" | All 1,000 cases are SYNTHETIC. Only 4 aggregate statistics are sourced from NJDG/Data.gov.in. |
| "We predict case outcomes / judgments" | The system predicts administrative review priority, NOT judicial outcomes. |
| "We evaluate judges / judicial performance" | Judge identity is NEVER used as a cohort key or performance metric. Judge changes are only treated as timeline events. |
| "We guarantee faster case disposal" | The system enables better prioritization, but does not guarantee faster disposal. |
| "We integrated with eCourts / NJDG APIs" | No live API integration exists. The prototype uses synthetic data modeled on eCourts schema. |
| "Citizens / lawyers can use the system" | Only admin and registry_staff roles are implemented. No public-facing interface exists. |
| "We use pandas/scikit-learn at runtime" | The seed generator may use pandas, but the runtime triage engine uses only Python standard library + SQLAlchemy. |
| "We deployed on government cloud" | Deployment is on commercial platforms (Vercel, Render, Supabase). Government cloud deployment is a FUTURE phase. |
| "First in the world / First in India" | No evidence to support such claims. Do not make them. |
| "100% accurate" | The system is a prototype with synthetic data. Accuracy claims require real-world validation. |
| "We use scikit-learn / lifelines / survival analysis" | These are FUTURE roadmap items, not currently implemented. |
| "We use Redis / Kafka / Docker / Kubernetes" | None of these are used in the current implementation. |

---

*Document generated from thorough inspection of the Nyaya-Drishti repository on 2026-08-16. All values verified against actual codebase, test results, and deployed infrastructure.*
