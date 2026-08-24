# SIH FIRST-ROUND FEEDBACK — TECHNICAL RESPONSE DOCUMENT

> **Document:** `SIH_FEEDBACK_TECHNICAL_RESPONSE.md`
> **Team:** Team_Diamond | Problem Statement ID: SIH26_94
> **Date:** August 2026
> **Status:** Comprehensive technical response to SIH first-round jury feedback

> [!IMPORTANT]
> **Accuracy Rule:** This document contains only information traceable to the actual implemented codebase. No real-world validation accuracy figures have been fabricated. Synthetic training results are clearly labelled. Where data is unavailable, sections are explicitly marked **"Not yet measured — planned for real-data pilot."**

---

## 1. FEEDBACK RECEIVED

| # | Feedback Point |
|---|---|
| 1 | Strong and socially relevant problem statement |
| 2 | Clear distinction between case pendency and structural stalling |
| 3 | Good cohort-based triage and explainable priority queue |
| 4 | Strong literature analysis and practical software architecture |
| 5 | **Core AI/scoring methodology is not sufficiently detailed** |
| 6 | **Current validation is based on synthetic cases only** |
| 7 | **Need real judicial-data validation** |
| 8 | **Need scoring calibration and evaluation metrics** |
| 9 | **Need integration/privacy considerations** |
| 10 | **Clearly define the five triage signals, weights and normalization** |
| 11 | **Explain whether the system is rule-based, ML-based or hybrid** |
| 12 | **Validate using real anonymised court data** |
| 13 | **Define measurable metrics for identifying structurally stalled cases** |
| 14 | **Address fairness and explainability** |
| 15 | **Strengthen root-cause analysis and map each signal to a bottleneck** |
| 16 | **Expand literature with peer-reviewed judicial AI work** |
| 17 | **Add pilot plan using anonymised real district-court data** |
| 18 | **Define measurable outcomes: stall-identification precision, registrar review time, queue stability** |
| 19 | **Remove university/institution branding to comply with anonymity requirements** |

---

## 2. CURRENT ARCHITECTURE

Nyaya-Drishti is a **6-Layer Deterministic Triage Pipeline** augmented by a **Supporting ML Risk Signal**.

```
backend/triage/engine.py         <- Orchestrator (Layers 1-6)
backend/triage/cohort.py         <- Layer 1: Cohort Builder & Confidence Assessor
backend/triage/stall_detector.py <- Layer 2: Stall Metrics Detector
backend/triage/bottleneck.py     <- Layer 3: Bottleneck Classifier (6 rules)
backend/triage/scorer.py         <- Layer 4: Priority Scorer (5-signal formula)
backend/triage/evidence.py       <- Layer 5: Evidence Bundler
backend/triage/templates.py      <- Layer 6: Explanation Generator
backend/ml/service.py            <- ML Singleton Inference Service (XGBoost)
ml/model/final_model.joblib      <- Trained model artefact (180 KB)
```

### Complete Data Flow (As Implemented)

```
Raw Case + Event Data (database)
        |
        v
Layer 1: Cohort Resolution (triage/cohort.py)
  - 5-part cohort key: (court_establishment, case_type, act_section_bucket,
    filing_year_bucket, current_stage)
  - Confidence: HIGH if cohort_size >= 15, LOW if < 15
  - Empirical CDF age percentile within matching cohort
        |
        v
Layer 2: Stall Metrics Detection (triage/stall_detector.py)
  - days_in_current_stage, days_since_substantive_event
  - adjournment_streak, adjournment_count
  - judge_change_count (365d), judge_change_grace_period (60d)
  - stage_deviation_ratio = days_in_stage / cohort_median_days_in_stage
        |
        +----------------------------------------+
        v                                        v
Layer 3: Bottleneck Classifier          ML Structural Stall Detector
  - 6 deterministic rule cascade          (backend/ml/service.py)
  - Returns bottleneck_type               - XGBoost.predict_proba()[0][1]
    + actionability_level                 - structural_stall_probability
        |                                 - ml_stall_risk_level (HIGH/LOW)
        v                                         |
Layer 4: Priority Scorer                          |
  - 5-component weighted formula                  |
  - Returns: triage_score (0.0-100.0)             |
        +----------------------------------------+
                         v
Layer 5: Evidence Bundler (triage/evidence.py)
  - JSON payload >= 15 traceable metrics
  - Includes: ml_stall_probability, ml_stall_risk_level
                         v
Layer 6: Explanation Generator (triage/templates.py)
  - Deterministic template text (Zero LLM involvement)
                         v
Database Commit -> Priority Queue API -> Frontend
```

---

## 3. THE FIVE TRIAGE SIGNALS

> [!IMPORTANT]
> All formulas below are taken **verbatim from `backend/triage/scorer.py` and `backend/seed/config.py`**. Nothing has been invented or extrapolated.

---

### Signal 1: Structural Stage Deviation (Weight: **30%**)

**What it measures:**
How far a case has exceeded the median time that cohort-matched peer cases spend in its current procedural stage.

**Why it matters:**
A case taking 4x longer than the cohort median in "Summons / Appearance" is almost certainly stalled, not merely pending. Age alone reveals nothing; cohort-relative deviation reveals the outlier.

**How it is calculated** (from `triage/stall_detector.py`):
```python
stage_entered = case.stage_entered_at or case.pending_since or case.filing_date
days_in_stage = (ENGINE_RUN_DATE - stage_entered).days

# cohort_median_days_in_stage comes from CohortStat record (Layer 1)
stage_deviation_ratio = float(days_in_stage) / float(cohort_median_days_in_stage)
```

**How it is normalised** (from `triage/scorer.py`, `seed/config.py`):
```python
STRUCTURAL_CAP_RATIO = 5.0          # seed/config.py
raw_struct = min(stage_deviation_ratio / 5.0, 1.0) * 100.0
# 0.0 to 100.0; capped when deviation >= 5x the cohort median
```

**Contribution to score:**
```python
score_struct = raw_struct * 0.30    # max contribution: 30.0 points
```

**If cohort unavailable:** `stage_deviation_ratio = None`, `raw_struct = 0.0` (no penalty).

**Administrative bottleneck:** Procedural stage stalling — cases stuck in one stage far longer than matched peers at the same court.

---

### Signal 2: Substantive Inactivity / Dormancy (Weight: **25%**)

**What it measures:**
Days elapsed since the last substantive event (HEARING, ORDER, or WITNESS_EXAM). Procedural events (ADJOURNMENT, SUMMONS_ISSUED) do NOT reset this clock.

**Why it matters:**
A case can accumulate appearances without any substantive progression. Detecting dormancy reveals administrative stalling independent of case age.

**How it is calculated** (from `triage/stall_detector.py`):
```python
SUBSTANTIVE_EVENT_TYPES = {"HEARING", "ORDER", "WITNESS_EXAM"}  # seed/config.py
substantive_events = [e for e in events if e.is_substantive]
if substantive_events:
    latest_sub = max(substantive_events, key=lambda e: e.event_date)
    days_since_substantive = (ENGINE_RUN_DATE - latest_sub.event_date).days
else:
    days_since_substantive = (ENGINE_RUN_DATE - case.filing_date).days
```

**How it is normalised** (from `triage/scorer.py`, `seed/config.py`):
```python
INACTIVITY_CAP_DAYS = 300           # seed/config.py
raw_inact = min(days_inactive / 300.0, 1.0) * 100.0
# 0.0 to 100.0; capped at 300 days of inactivity
```

**Judge Change Grace Rule (implemented):**
```python
JUDGE_CHANGE_GRACE_DAYS = 60        # seed/config.py
# If bench changed within last 60 days:
if stall_metrics.get("judge_change_grace_period"):
    score_inact *= 0.5              # 50% reduction -- grace period for new bench
```

**Contribution to score:**
```python
score_inact = raw_inact * 0.25      # max contribution: 25.0 points (12.5 with grace)
```

**Administrative bottleneck:** Dormant cases — unserved summons with no follow-up, witness non-attendance, long gaps between listing dates.

---

### Signal 3: Cohort Age Percentile (Weight: **15%**)

**What it measures:**
The percentile rank of this case's total filing age within all cases in the same matched cohort (court + case type + act category + filing year band + current stage).

**Why it matters:**
Avoids penalising old cases that are genuinely progressing normally. A 5-year-old case in the 95th percentile within its cohort is a long-tail pendency outlier deserving administrative attention.

**How it is calculated** (from `triage/cohort.py`):
```python
case_age_days = (ENGINE_RUN_DATE - case.filing_date).days
cohort_ages = [(ENGINE_RUN_DATE - c.filing_date).days for c in matching_cases]
rank_count = sum(1 for age in cohort_ages if age <= case_age_days)
percentile = (rank_count / len(cohort_ages)) * 100.0
percentile = min(100.0, max(0.0, percentile))
```

**Confidence Suppression:**
```python
COHORT_MIN_SIZE = 15                # seed/config.py
if confidence_level == "HIGH" and age_percentile is not None:
    raw_age = age_percentile        # use empirical percentile
else:
    raw_age = 0.0                   # suppressed if cohort < 15 (LOW confidence)
```

**Contribution to score:**
```python
score_age = raw_age * 0.15          # max contribution: 15.0 points
```

**Administrative bottleneck:** Long-tail pendency outliers — cases whose filing age is anomalously high relative to their peer cohort.

---

### Signal 4: Adjournment Pattern (Weight: **10%**)

**What it measures:**
Consecutive streak of `ADJOURNMENT` events since the last substantive hearing, counted backwards through the event timeline.

**Why it matters:**
A single adjournment is routine. Five consecutive adjournments with no intervening hearing indicates repetitive delay, ineffective listing, or a party failing to appear — all registry-actionable.

**How it is calculated** (from `triage/stall_detector.py`):
```python
adjournment_streak = 0
for e in reversed(events):          # iterate backwards from most recent
    if e.is_substantive:
        break                       # stop at the most recent substantive event
    if e.event_type == "ADJOURNMENT":
        adjournment_streak += 1
```

**How it is normalised** (from `triage/scorer.py`, `seed/config.py`):
```python
ADJOURNMENT_CAP = 5                 # seed/config.py
raw_adj = min(streak / 5.0, 1.0) * 100.0
# 0.0 to 100.0; capped at 5 consecutive adjournments
```

**Contribution to score:**
```python
score_adj = raw_adj * 0.10          # max contribution: 10.0 points
```

**Administrative bottleneck:** Repeated-adjournment loops — ineffective process service, non-appearing witnesses, unresolved interlocutory applications.

---

### Signal 5: Administrative Actionability (Weight: **20%**)

**What it measures:**
A discrete ordinal score (LOW / MEDIUM / HIGH) representing the type of administrative intervention the registry can take on the identified bottleneck.

**Why it matters:**
Not all stalled cases are equally amenable to administrative resolution. Cases with clear registry-actionable bottlenecks (unserved summons, repeated adjournments) should be prioritised over cases where the stall type is unknown.

**How it is calculated** (from `triage/bottleneck.py` — deterministic cascade):

| Priority | Rule | Condition | Bottleneck | Actionability |
|---|---|---|---|---|
| 1 | SUMMONS_DELAY | SUMMONS_ISSUED + no SUMMONS_RETURNED within 90 days | `SUMMONS_DELAY` | **HIGH** |
| 2 | WITNESS_DELAY | Stage="Evidence / Argument" + inactivity > 180d | `WITNESS_DELAY` | **MEDIUM** |
| 3 | REPEATED_ADJOURNMENT | consecutive adjournments >= 4 | `REPEATED_ADJOURNMENT` | **HIGH** |
| 4 | JUDGE_CHANGE | judge_change_count >= 2 within 365 days | `JUDGE_CHANGE` | **MEDIUM** |
| 5 | PROCEDURAL_INACTIVITY | days_since_substantive > 120 | `PROCEDURAL_INACTIVITY` | **MEDIUM** |
| 6 | UNKNOWN | No rule triggered | `UNKNOWN` | **LOW** |

**How it is normalised** (from `triage/scorer.py`, `seed/config.py`):
```python
ACTIONABILITY_SCORE = {
    "LOW":     0.0,     # no registry action identified
    "UNKNOWN": 0.0,     # cannot determine bottleneck
    "MEDIUM":  50.0,    # administrative review recommended
    "HIGH":    100.0,   # direct registry intervention required
}
raw_action = ACTIONABILITY_SCORE.get(actionability_level, 0.0)
score_action = raw_action * 0.20    # max contribution: 20.0 points
```

---

## 4. WEIGHT NORMALISATION SUMMARY TABLE

| Signal | Weight | Raw Range | Normalisation Formula | Cap / Constraint |
|---|---|---|---|---|
| Structural Stage Deviation | **30%** | 0-100 | `min(stage_deviation_ratio / 5.0, 1.0) x 100` | Capped at 5x cohort median; 0 if no cohort |
| Substantive Inactivity | **25%** | 0-100 | `min(days_inactive / 300, 1.0) x 100` | Capped at 300 days; x0.5 grace if bench changed within 60d |
| Cohort Age Percentile | **15%** | 0-100 | Empirical CDF percentile within matched cohort | Suppressed to 0 if cohort < 15 (LOW confidence) |
| Adjournment Pattern | **10%** | 0-100 | `min(consecutive_adjournments / 5, 1.0) x 100` | Capped at 5 consecutive |
| Administrative Actionability | **20%** | 0 / 50 / 100 | Discrete ordinal: HIGH=100, MEDIUM=50, LOW/UNKNOWN=0 | Not continuous — discrete mapping |
| **TOTAL** | **100%** | **0-100** | | |

**Final Priority Score:**
```
Score = (raw_struct x 0.30) + (raw_inact x 0.25) + (raw_age x 0.15)
      + (raw_adj x 0.10) + (raw_action x 0.20)
```

---

## 5. RULE-BASED vs. ML-BASED vs. HYBRID

### Nyaya-Drishti is a HYBRID System

#### Tier 1: 100% Deterministic Rule Engine (Primary)

| Property | Detail |
|---|---|
| Architecture | 6-Layer pipeline with locked deterministic scoring formula |
| Auditability | Every score arithmetically decomposable into 5 weighted components |
| Explainability | Zero LLM — template-matched text from `triage/templates.py` |
| Judicial liability | Zero black-box risk — score reproducible manually with case records |
| Configuration | Weights locked in `seed/config.py` — single source of truth |

#### Tier 2: Supporting ML Risk Signal (Non-Binding)

| Property | Detail |
|---|---|
| Model | XGBoost Weighted (scale_pos_weight = 1.56) |
| Output | `structural_stall_probability` (0.0-1.0) + `ml_stall_risk_level` (HIGH / LOW) |
| Decision threshold | **0.40** (optimised for stalled-case recall: 74.10%) |
| Features | 10 metadata/timeline features — strictly excludes triage formula outputs |
| SHAP | Top drivers: `judge_change_count` (1.73 mean SHAP), `adjournment_count` (0.52) |
| Impact on priority score | **ZERO** — ML probability does NOT alter the 5-component score weights |
| Failure mode | Model load failure -> `None` / `UNKNOWN`; deterministic triage continues uninterrupted |

#### Hybrid Architecture Diagram

```
Case + Event Data (eCourts-compatible schema)
                |
                v
    +----------------------------+
    |  Layer 1: Cohort Builder  |  <- 5-part cohort key; HIGH/LOW confidence
    +----------+-----------------+
               v
    +----------------------------+
    |  Layer 2: Stall Detector  |  <- stage deviation, dormancy, adjournment
    +----------+-----------------+    streak, bench changes
               |
     +---------+---------+
     v                   v
+-----------+    +------------------------+
| Layer 3:  |    | ML Structural Stall    |
| Bottleneck|    | Detector (XGBoost)     |
| Classifier|    | structural_probability |
| (6 rules) |    | ml_stall_risk (H/L)    |
+-----+-----+    +----------+-------------+
      |                     |
      v                     |
+-----------+               |
| Layer 4:  |               |
| Scorer    |               |
| (30/25/15 |               |
|  /10/20)  |               |
+-----+-----+               |
      +---------------------+
                  v
      +---------------------+
      |  Layer 5: Evidence  | <- >=15 metrics + ML signal in JSON
      |  Bundler            |
      +----------+----------+
                 v
      +---------------------+
      |  Layer 6: Explanation| <- deterministic text + non-binding ML note
      +----------+----------+
                 v
      Explainable Priority Queue
```

> [!NOTE]
> ML acts as a supporting signal, not a decision authority. The final priority queue ordering is determined exclusively by the deterministic triage score.

---

## 6. ROOT-CAUSE ANALYSIS — SIGNAL TO BOTTLENECK MAPPING

> **Wording note:** "associated signal" is used throughout. Nyaya-Drishti identifies observable correlates of administrative bottlenecks — it does NOT claim to prove causal relationships in individual cases.

| Administrative Bottleneck | Observable Signal | Triage Signal Triggered | ML Feature (SHAP) | Registry Intervention |
|---|---|---|---|---|
| **Unserved Summons / Process Service Failure** | SUMMONS_ISSUED + no SUMMONS_RETURNED within 90 days | Signal 1 (Stage Deviation) + Signal 2 (Inactivity) + Signal 5 (HIGH -> SUMMONS_DELAY) | `current_stage_Summons/Appearance` (rank 4) | Follow up with Process Server; issue fresh summons; escalate to bailiff |
| **Witness Non-Attendance / Evidence Stagnation** | Stage="Evidence / Argument" + inactivity > 180 days | Signal 2 (Inactivity) + Signal 5 (MEDIUM -> WITNESS_DELAY) | `current_stage_Evidence/Argument` (rank 3) | Issue bailable warrant; reschedule witness examination |
| **Repetitive Adjournment Loops** | >= 4 consecutive ADJOURNMENT events | Signal 4 (Adjournment Pattern) + Signal 5 (HIGH -> REPEATED_ADJOURNMENT) | `adjournment_count` (rank 2, mean SHAP=0.52) | Flag for presiding judge; schedule monitoring hearing |
| **Bench/Judge Transfer Disruption** | >= 2 JUDGE_CHANGE events within 365 days + inactivity | Signal 2 (Inactivity, with grace) + Signal 5 (MEDIUM -> JUDGE_CHANGE) | `judge_change_count` (**rank 1**, mean SHAP=1.73) | Verify transfer paperwork; re-list at earliest slot for new bench |
| **General Procedural Dormancy** | No substantive event for > 120 days | Signal 2 (Inactivity) + Signal 5 (MEDIUM -> PROCEDURAL_INACTIVITY) | `case_age_days` (rank 5) | Schedule review hearing; verify no blocking application |
| **Long-Tail Cohort Pendency** | Case age at 90th+ percentile within cohort | Signal 3 (Cohort Age Percentile, HIGH confidence only) | `case_age_days` (rank 5) | Cross-reference with other signals; escalate for senior registrar review |

---

## 7. ML METHODOLOGY

### Training Data
- **Dataset:** `data/ml_training_matrix_synthetic.csv` — 10,000 synthetic cases
- **Target:** `structural_stall_label` (1=Stalled, 0=Progressing) — scenario-assigned during synthetic generation. **NOT real judicial ground truth.**
- **Events:** `data/synthetic_case_events.csv` — 99,440 synthetic events; 0 chronology violations.

### 10 Non-Leaking Features

| # | Feature | Source |
|---|---|---|
| 1-5 | `state`, `district`, `court_establishment`, `case_type`, `tier` | Case metadata |
| 6 | `filing_year` | `case.filing_date.year` |
| 7 | `case_age_days` | `(ENGINE_RUN_DATE - case.filing_date).days` |
| 8 | `current_stage` | `case.current_stage` |
| 9 | `adjournment_count` | Total ADJOURNMENT events from `detect_stall_metrics()` |
| 10 | `judge_change_count` | JUDGE_CHANGE events in last 365 days from `detect_stall_metrics()` |

**Excluded:** `triage_score`, `stage_deviation_ratio`, `adjournment_streak`, `cohort_percentile`, `bottleneck_type`, `actionability_level`, `days_since_substantive_event`.

### Model Comparison — 5-Fold Case-Level CV (**Synthetic Data Only**)

| Model | Precision | Recall | F1 | AUC | F1 Std Dev |
|---|---|---|---|---|---|
| Logistic Regression | 0.779 | 0.670 | 0.720 | 0.849 | +/-0.008 |
| Random Forest | 0.863 | 0.625 | 0.725 | 0.847 | +/-0.013 |
| XGBoost Unweighted | 0.875 | 0.630 | 0.732 | 0.859 | +/-0.013 |
| **XGBoost Weighted** | **0.824** | **0.683** | **0.747** | **0.859** | **+/-0.008** |

**Selected:** XGBoost Weighted — highest F1, lowest fold variance, best recall.

### Temporal Validation (**Synthetic: <=2022 train, >=2023 test**)

| Metric | Value |
|---|---|
| Accuracy | 81.0% |
| Precision | 86.2% |
| Recall | 59.7% |
| F1 | 0.705 |
| AUC | 0.828 |

> [!WARNING]
> These are **synthetic-data metrics only**. They confirm the pipeline generalises across synthetic filing-year bands. They do NOT represent real-world performance on real court cases.

---

## 8. CURRENT SYNTHETIC VALIDATION

| Validation Type | Result | Data Source |
|---|---|---|
| 5-Fold CV F1 | 0.747 +/- 0.008 | Synthetic (10,000 cases) |
| 5-Fold AUC-ROC | 0.859 +/- 0.003 | Synthetic |
| Temporal Split F1 | 0.705 | Synthetic |
| Threshold analysis | 0.40 selected | Synthetic |
| Demo Alpha score (91.4, rank #1) | ACHIEVED | Synthetic (deterministic) |
| Demo Beta score (14.7, rank last) | ACHIEVED | Synthetic (deterministic) |
| Data leakage audit | PASSED | Code review |
| Case-level split integrity | PASSED | Code review |
| Unseen-category resilience | PASSED | Unit test |
| 25 backend unit/integration tests | 100% pass | pytest |

### What Has NOT Been Validated
- Stall identification on real cases with event history
- Registrar review-time reduction on real workflows
- Queue rank stability across real daily batch runs
- Fairness across real case type/court tier distributions

---

## 9. REAL-DATA VALIDATION STATUS

### Available Real Dataset: `data/disposal_time_cleaned.csv`

| Property | Value |
|---|---|
| Real records | **3,179** disposed judicial cases |
| States | 19 |
| Case types | 5 (BA, CS, CRL_A, WP_C, MACA) |
| Court establishments | 332 |
| Tiers | District (1,509) + High Court (1,670) |

### Feature Availability Audit

| Feature Required by ML | In Real Dataset? | Status |
|---|---|---|
| `state` | YES (stateName) | Schema compatible |
| `court_establishment` | YES (courtName) | Schema compatible |
| `case_type` | YES (caseType) | Schema compatible |
| `tier` | YES (tier) | Schema compatible |
| `filing_year` | YES (filingYear) | Schema compatible |
| `district` | NO | Missing -- requires court hierarchy table |
| `case_age_days` (active) | NO | Dataset has disposed duration, not active age |
| `current_stage` | NO | Disposed cases have no current stage |
| `adjournment_count` | NO | Event history unavailable in open data |
| `judge_change_count` | NO | Event history unavailable in open data |

### Validation Boundary

**CURRENT -- Validated with real data:**
- Schema compatibility for 5 court metadata fields
- Distribution profile used to inform synthetic data generation

**NOT CURRENTLY POSSIBLE:**
Full structural-stall validation requires `adjournment_count`, `judge_change_count`, `current_stage` -- none present in public disposal dumps.

> [!IMPORTANT]
> The real dataset was used strictly for schema compatibility auditing. No model was retrained on it, no event records were fabricated, and no disposal-time metrics have been presented as stall-identification metrics.

---

## 10. REAL-DATA PILOT METHODOLOGY

### Dataset Requirements for Pilot

| Field | Why Required |
|---|---|
| Pseudonymised CNR | Case-level identifier (no PII) |
| Court establishment, State, District | Cohort key + ML feature |
| Case type | Cohort key + ML feature |
| Filing date + Current stage | Age calculation + ML feature |
| Ordered event history (type + date) | All 5 triage signal derivations require this |
| Adjournment records | Signal 4 + ML feature |
| Judge change records | Grace rule + ML feature |

### Ground-Truth Labelling Protocol

1. Senior court administrators / retired district judges review a stratified sample.
2. A case is labelled `structural_stall = 1` if ALL three hold:
   - In same stage > 2x cohort median, AND
   - No substantive hearing in > 90 days, AND
   - At least one registry-actionable bottleneck is identifiable.
3. Inter-rater agreement of Cohen's kappa >= 0.70 required before labels are accepted.

---

## 11. EVALUATION METRICS

| Metric | What It Measures | Formula | Current Status |
|---|---|---|---|
| Precision | Fraction of flagged cases genuinely stalled | TP / (TP + FP) | **Not yet measured -- planned for real-data pilot** |
| Recall | Fraction of genuine stalls captured | TP / (TP + FN) | **Not yet measured -- planned for real-data pilot** |
| F1-Score | Harmonic mean of precision and recall | 2xPxR / (P+R) | **Not yet measured -- planned for real-data pilot** |
| AUC-ROC | ML model's overall discrimination | Area under ROC curve | **Not yet measured -- planned for real-data pilot** |
| False Positive Rate | Normal cases incorrectly flagged | FP / (FP + TN) | **Not yet measured -- planned for real-data pilot** |
| False Negative Rate | Stalled cases missed | FN / (FN + TP) | **Not yet measured -- planned for real-data pilot** |
| Top-K Precision | Fraction of top-K queue entries truly stalled | TP@K / K | **Not yet measured -- planned for real-data pilot** |
| Queue Rank Stability | Consistency of daily queue ordering | Spearman rho between consecutive runs | **Not yet measured -- planned for real-data pilot** |
| Registrar Review Time | % reduction in time to identify actionable cases | (Without - With) / Without | **Not yet measured -- planned for real-data pilot** |
| Demo Score Gap | Alpha vs. Beta separation | Score difference | **ACHIEVED** -- 76.7 points (synthetic demo) |

> [!CAUTION]
> All metrics except Demo Score Gap are not yet measured. No fabricated numerical accuracy figures have been included.

---

## 12. CALIBRATION AND DECISION THRESHOLD

### Current Threshold: 0.40

| At threshold 0.40 (Synthetic test set, 2,000 cases) | Value |
|---|---|
| Precision | 71.80% |
| Recall | 74.10% |
| F1 | 0.729 |
| False Positive Rate | 18.6% |
| True Positives | 578 |
| False Positives | 227 |

**Rationale:** At threshold 0.50, recall drops to 66.15% (64 more stalled cases missed). In judicial administration, a missed stall is more costly than a false-positive registry review.

### Probability Calibration Status

> [!WARNING]
> **Formal probability calibration (Platt scaling / isotonic regression) has NOT been performed.** The `predict_proba()` output is a raw classifier score, not a calibrated frequency estimate. Formal calibration will be performed during the real-data pilot.

### HIGH/LOW Logic (from `backend/ml/service.py`):
```python
DECISION_THRESHOLD = 0.40
risk_level = "HIGH" if proba >= 0.40 else "LOW"
```

---

## 13. FAIRNESS

### Current Fairness Design (Implemented)

| Design Decision | Implementation | Source |
|---|---|---|
| Cohort-relative comparison | Age percentile within matched cohort -- not raw age | `triage/cohort.py` |
| Small-cohort suppression | Percentile signal = 0 if cohort < 15 (LOW confidence) | `seed/config.py: COHORT_MIN_SIZE = 15` |
| Judge change grace rule | Inactivity score x0.5 if bench changed within 60 days | `triage/scorer.py` |
| No PII or sensitive attributes in ML | Features: court metadata + timeline counts only | `ml/service.py` |
| Human administrative review | No automatic case disposal; queue for registrar action only | System design |

### Fairness Gaps -- Not Yet Measured

> [!WARNING]
> The following require real-data pilot analysis:
- False Positive Rate by case type (WP_C vs. BA vs. CS)
- Precision/Recall by court tier (district vs. high court)
- Score distribution equity across states and districts
- Long-tail bias for cases > 10 years old

---

## 14. EXPLAINABILITY

### Layer 1: Deterministic Score Decomposition

Every priority score is arithmetically decomposable. Example evidence bundle (Case ALPHA):
```json
{
  "score_structural_deviation": 26.52,   "raw_structural_deviation": 88.4,
  "score_inactivity": 23.93,             "raw_inactivity": 95.7,
  "score_age_deviation": 10.97,          "raw_age_percentile": 73.1,
  "score_adjournment": 10.00,            "raw_adjournment_streak": 100.0,
  "score_actionability": 20.00,          "raw_actionability": 100.0,
  "total_score": 91.4,
  "bottleneck_type": "SUMMONS_DELAY",
  "days_in_current_stage": 287,
  "stage_deviation_ratio": 4.42,
  "cohort_median_days_in_stage": 65
}
```

### Layer 2: ML SHAP Feature Attribution

| Rank | Feature | Mean |SHAP| | Registry Interpretation |
|---|---|---|---|
| 1 | `judge_change_count` | **1.7312** | Bench transfers -- strongest stall predictor |
| 2 | `adjournment_count` | **0.5153** | Cumulative procedural friction |
| 3 | `current_stage_Evidence/Argument` | 0.2008 | Witness/evidence stagnation |
| 4 | `current_stage_Summons/Appearance` | 0.1916 | Process service delays |
| 5 | `case_age_days` | 0.0763 | Total filing age |

ML explanation template (implemented, verified in `ML_PRE_INTEGRATION_AUDIT.md`):
> *"ML Supporting Assessment: [X]% structural delay risk based on historical adjournment and bench transfer patterns. Administrative triage only -- does not evaluate judicial merits or predict legal outcomes."*

---

## 15. PRIVACY

### Currently Implemented

| Control | Implementation |
|---|---|
| Synthetic data only | All records are 100% synthetic -- non-dismissible banner on every page |
| Role-based access control | `admin` vs. `registry_staff` JWT roles with enforced endpoint permissions |
| No PII in ML features | Features restricted to court metadata and timeline counts |
| ML inference fallback | On model failure: returns None / UNKNOWN; triage continues deterministically |
| Audit trail in evidence JSON | All scoring inputs stored in `case.evidence_json` for full auditability |

### Proposed for Production Deployment

| Control | Status | Description |
|---|---|---|
| Pseudonymisation | **PROPOSED** | Replace CNRs with pseudonymous IDs in analytics views |
| Minimum necessary data | **PROPOSED** | Exclude party names, advocate names, litigant demographics |
| Secure API communication | **PROPOSED** | HTTPS enforcement, JWT expiry controls, CORS whitelist |
| Immutable audit logs | **PROPOSED** | Server-side log of every queue access by user role and timestamp |
| Data retention policy | **PROPOSED** | Event data older than operational window purged under defined schedule |
| No judge ID in ML features | **PROPOSED** | Model must not be retrained on data identifying judicial officers |

---

## 16. INTEGRATION

### Current Integration (Live)

| Component | Technology | Status |
|---|---|---|
| Backend API | FastAPI + SQLAlchemy + SQLite | LIVE |
| Frontend | React + Vite SPA | LIVE |
| Authentication | JWT Bearer tokens + RBAC | IMPLEMENTED |
| ML inference | XGBoost singleton (ml/service.py) | IN PRODUCTION PIPELINE |
| Database | SQLite (dev), PostgreSQL/Supabase (production) | DUAL CONFIGURATION |

### Integration with eCourts (Future)

| Integration Point | Status |
|---|---|
| eCourts NDOH / Cause List API (event history) | FUTURE -- requires API access agreement |
| NJDG Data Feed (real-time pendency) | FUTURE -- currently static NJDG figures |
| Case Management System (CMS) export | FUTURE -- format mapping required |

---

## 17. PILOT ROADMAP

| Phase | Description | Status | Key Deliverable |
|---|---|---|---|
| **1** | Synthetic development and leakage-free ML experiments | **COMPLETE** | 10,000-case dataset, trained XGBoost, 25 backend tests, live prototype |
| **2** | Anonymised real district-court event data acquisition | FUTURE | Data sharing agreement; eCourts cause-list access |
| **3** | Ground-truth labelling with domain experts | FUTURE | Labelled sample (kappa >= 0.70); adjudicated stall criteria |
| **4** | Offline validation on labelled real data | FUTURE | Precision, Recall, F1, AUC, Fairness analysis |
| **5** | Registrar-assisted pilot at partnering court | FUTURE | Side-by-side testing vs. existing workflow |
| **6** | Impact measurement | FUTURE | Registrar review time (A/B test); queue stability (Spearman rho); FP rate |
| **7** | Controlled deployment / scaling | FUTURE | Production API; formal data processing agreement; DPDPA compliance |

---

## 18. LITERATURE GAPS AND RECOMMENDATIONS

The jury requested peer-reviewed judicial AI / case-prioritisation literature. The following research areas are directly relevant. **These are recommended areas for literature search -- no specific citations have been fabricated.**

| Research Area | Relevance | Suggested Journals / Venues |
|---|---|---|
| Judicial AI and Legal Case Outcome Prediction | Understanding the boundary between administrative triage and judicial prediction | *Artificial Intelligence and Law*, *Journal of Law and Courts* |
| Explainable AI (XAI) in Legal Systems | SHAP methodology; regulatory requirements for AI explainability | *AI & Society*, *ACM FAccT*, *IJCAI* |
| Court Delay Prediction and Pendency Analysis | ML approaches to judicial delay; feature selection for court data | *Journal of Empirical Legal Studies*, *Law & Social Inquiry* |
| Fairness in Algorithmic Decision-Making | Fairness metrics and bias auditing for judicial queue systems | *ACM FAccT*, *ICML*, *NeurIPS* |
| Queuing Theory in Judicial Systems | Mathematical modelling of case flow and waiting time | *Operations Research*, *Management Science* |
| Cohort Analysis in Longitudinal Legal Studies | Methodological basis for cohort-relative case assessment | *Empirical Legal Studies*, *Statistics and Public Policy* |
| Privacy-Preserving ML in Legal Contexts | Anonymisation for court records; DPDPA/GDPR compliance | *Privacy Enhancing Technologies*, *IEEE S&P* |

> [!NOTE]
> Team members should conduct searches on Google Scholar, SSRN, and ACM Digital Library in the above areas before the next presentation round.

---

## 19. ANONYMITY COMPLIANCE

### Repository Audit Results

A comprehensive search was conducted across all `.md`, `.py`, `.json`, `.txt`, and source files for university/college/institution names, institutional logos, and personal identifiers.

**Result: No institutional branding found in any repository file.**

All SIH-facing materials use only `Team_Diamond`, `SIH26_94`, and `Nyaya-Drishti` branding.

> [!WARNING]
> The **frontend logo image** (`frontend/src/assets/logo.jpg`) and **PPT/presentation materials** must be separately verified by the team -- image content cannot be audited programmatically.

---

## 20. RECOMMENDED CHANGES FOR SIH PRESENTATION

### Critical Slides to Add / Update

| Priority | Slide Content |
|---|---|
| CRITICAL | **Hybrid Architecture Diagram** -- two-tier design clearly labelled (Deterministic Engine + ML Signal) |
| CRITICAL | **5-Signal Weight Matrix** -- exact formula and normalisation table (Sections 3-4) |
| CRITICAL | **Root-Cause Mapping Table** -- bottleneck -> observable signal -> triage signal -> registry intervention |
| CRITICAL | **Validation Boundary Slide** -- clearly distinguish current synthetic results from proposed real-data pilot |
| CRITICAL | **Pilot Roadmap** -- 7-phase plan with Phase 1 marked complete |
| IMPORTANT | **ML Methodology Slide** -- features, model selection, threshold rationale, SHAP top findings |
| IMPORTANT | **Fairness Design Slide** -- cohort suppression, grace rules, no PII, human-in-the-loop |
| IMPORTANT | **Privacy & Integration Slide** -- current vs. proposed production safeguards |
| IMPORTANT | **Metrics Table Slide** -- definitions + "planned for real-data pilot" labels |
| RECOMMENDED | **Literature Slide Update** -- peer-reviewed research area categories with journal names |

### Wording Corrections

| Current (Incorrect) | Corrected Wording |
|---|---|
| Any implication results are real-world | "Results measured on 10,000 synthetic cases informed by 3,179 real court records. Real-data validation planned for pilot phase." |
| Any fabricated precision/recall on real data | "Not yet measured -- planned for real-data pilot." |
| "ML detects stall" without qualification | "ML signal provides supporting structural-stall probability (0.40 threshold); does not alter deterministic priority score." |

---

## FINAL STATUS TABLE

| Feedback Issue | Current Status | Fix / Next Step |
|---|---|---|
| Core AI/scoring methodology not sufficiently detailed | **PARTIALLY DONE** | Add 5-signal slide and weight matrix to PPT |
| Validation based on synthetic cases | **DONE** -- boundary clearly stated | Label all synthetic results in PPT |
| Need real judicial-data validation | **FUTURE VALIDATION** | Execute real-data pilot (Phases 2-6) |
| Scoring calibration and evaluation metrics | **PARTIALLY DONE** | Document metrics framework; label as planned for pilot |
| Integration/privacy considerations | **PARTIALLY DONE** | Add privacy/integration slide to PPT |
| Clearly define 5 signals, weights and normalisation | **DONE** -- fully documented in Sections 3-4 | Add to PPT |
| Explain rule-based / ML / hybrid system type | **DONE** -- hybrid architecture in Section 5 | Add hybrid architecture diagram to PPT |
| Validate with real anonymised court data | **FUTURE VALIDATION** | Execute real-data pilot (Phases 2-4) |
| Define measurable stall-identification metrics | **DONE** -- framework in Section 11 | Add metrics table to PPT |
| Address fairness and explainability | **PARTIALLY DONE** -- design exists; measurement pending | Add fairness slide; document gaps honestly |
| Strengthen root-cause analysis | **DONE** -- full mapping table in Section 6 | Add root-cause slide to PPT |
| Expand literature with peer-reviewed work | **MISSING** | Add peer-reviewed research area recommendations (Section 18) |
| Add pilot plan with real district-court data | **DONE** -- staged pilot methodology in Section 10 | Add pilot methodology slide to PPT |
| Define measurable outcomes | **DONE** -- metrics table in Section 11 | Add to PPT |
| Remove university/institution branding | **DONE** -- no branding found in repository files | Verify logo image and PPT slides separately |
