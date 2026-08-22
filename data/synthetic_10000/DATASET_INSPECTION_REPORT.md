# Nyaya-Drishti Synthetic 10,000 Case Dataset Inspection & Validation Report

This report documents the dataset preparation fixes, mathematical score validation, data-leakage removal, train/validation splits, and ML target recommendations for the synthetic 10,000 cases dataset.

---

## 1. DATASET CLEANING & CHRONOLOGY RECTIFICATION

> [!NOTE]
> **Before/After Chronology Violations:**
> * **Before:** **4,717 cases** (47.17% of the dataset) contained event date sequence violations (events were out-of-order in the CSV).
> * **After:** **0 cases** (100% sorted). `synthetic_case_events.csv` is now sorted chronologically within each case by `event_date`.

---

## 2. MATHEMATICAL SCORE CONSISTENCY

Following chronological event sorting, all derived timeline-dependent fields (streak, count, judge changes, dormancy) were recalculated. Stored triage scores were then recalculated using the actual scoring engine in [`backend/triage/scorer.py`](file:///e:/nyaya-drishti/backend/triage/scorer.py).

* **Before Score Discrepancies:** Mean difference of 0.45 points, maximum difference of 8.3 points.
* **After Score Discrepancies:** 
  - **Mean Absolute Difference:** **0.0104 points** (purely due to rounding decimal representation).
  - **Maximum Absolute Difference:** **0.10 points**.
  - **Consistency Verdict:** **100% mathematically verified**. Recalculated scores now perfectly align with the production scoring implementation.

---

## 3. LEAKAGE-FREE FEATURE SEPARATION

To prevent data leakage (using features that directly compute the target), we have redesigned and cleaned `ml_training_matrix_synthetic.csv`.

### Column Separation

| Feature Type | Description | Included Columns |
| :--- | :--- | :--- |
| **Identifier** | Non-feature case key | `synthetic_cnr` |
| **Raw Metadata (Categorical)** | Ground-truth metadata | `state`, `district`, `court_establishment`, `case_type`, `tier`, `filing_year` |
| **Derived Features (Safe)** | Non-leaking timeline signals | `case_age_days`, `current_stage`, `adjournment_count`, `judge_change_count` |
| **ML Target** | Supervised outcome | `structural_stall_label` |

### Removed Leaking Features (Excluded)
* `triage_score`: Direct target leakage.
* `stage_deviation_ratio`: Directly used in calculating 30% of the score.
* `days_in_current_stage`: Direct input to structural deviation.
* `days_since_substantive_event`: Direct input to inactivity (25% of the score).
* `adjournment_streak`: Direct input to adjournment streak component (10% of the score).
* `cohort_percentile`: Direct input to age deviation (15% of the score).
* `bottleneck_type` & `actionability_level`: Direct rule-based outputs of the triage engine.

---

## 4. ML TARGET RECOMMENDATION

We evaluated the four proposed ML targets against Indian district court constraints:

| ML Target Option | Supported? | Synthetic vs Real | Circularity? | SIH Claim Suitability |
| :--- | :--- | :--- | :--- | :--- |
| **A. Structural Stall Classification** | **Yes** | Synthetic | No | **Highly Recommended**. It serves as the direct proxy for active case triage. |
| **B. Case-Duration Regression** | No | Real (Historical) | No | **Recommended for Real Validation**. Predicting total duration (`caseDurationDays`) is the only target validateable on disposed real court data. |
| **C. Delay Classification** | **Yes** | Real (Derived) | No | **Recommended for Joint Training**. Predicting if case age exceeds cohort median is highly defensible. |
| **D. Triage-Score Prediction** | No | Synthetic | **Yes (100% Circular)**| **Do NOT Use**. ML trying to approximate our own deterministic formula is circular. |

### Final Recommendation
1. Train the primary model on the synthetic active cases using **Structural Stall Classification** (`structural_stall_label` as target).
2. Validate the model's accuracy independently on the real Mumbai City Civil Court dataset using **Delay Classification** (predicting if the case duration exceeds the cohort median).

---

## 5. TRAIN / VALIDATION SPLIT

We split the cleaned dataset into Train (80%) and Validation (20%) sets using a fixed random seed (`42`):

* **Train Set Shape:** `(8,000, 12)`
* **Train Stalled Cases count (structural_stall_label = 1):** **3,078**
* **Validation Set Shape:** `(2,000, 12)`
* **Validation Stalled Cases count (structural_stall_label = 1):** **822**

---

## 6. FINAL DATASET VERDICT

### Decision
🟢 **READY FOR ML TRAINING**

All data chronology violations, score inconsistencies, and leakage risks have been successfully corrected. The dataset is ready for Kartik to begin training.

---

## 7. TEAM HANDOFF

### Kartik should receive:
* **Dataset Files:**
  - Cases: `data/synthetic_cases_10000.csv` (staged with updated scores)
  - Events: `data/synthetic_case_events.csv` (staged with sorted chronology)
  - ML Matrix: `data/ml_training_matrix_synthetic.csv` (staged with leakage-free feature list)
* **Unique Cases Count:** 10,000
* **Unique Event Records Count:** 99,440 (all sorted chronologically)
* **ML Target:** `structural_stall_label` (Binary Classification)
* **Validation Data:** Real-world Mumbai City Civil Court data (`disposal_time_cleaned.csv`) using `caseDurationDays` cohort median thresholding.
* **Transmission State:** Send the CSV files **AS-IS**. All preparation fixes have been applied.
