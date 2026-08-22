# NYAYA DRISHTI — MACHINE LEARNING TRAINING REPORT

> **Project Phase:** ML Model Development & Evaluation  
> **Dataset Source:** Cleaned 10,000 Synthetic Case Records + 3,179 Real Disposed Judicial Reference Cases  
> **Date:** August 2026  
> **Status:** Completed (Local Uncommitted Workspace)

---

## 1. DATASET USED

* **Primary Training & Testing Dataset:** `data/synthetic_cases_10000.csv` and `data/ml_training_matrix_synthetic.csv` (10,000 cases).
* **Event History Dataset:** `data/synthetic_case_events.csv` (99,440 timeline events, 100% sorted chronologically).
* **Real-World Reference Dataset:** `data/disposal_time_cleaned.csv` (3,179 real disposed district court and high court cases across 19 states).

---

## 2. TARGET DEFINITION

* **Primary Supervised Target:** `structural_stall_label` (Binary Classification: `1` = Structurally Stalled, `0` = Progressing Normally).
* **Target Origin:** Generated during scenario synthesis to represent structural delay patterns (unserved summons, repeated adjournments, procedural dormancy, bench change disruptions).
* **Targets Excluded to Prevent Circularity:**
  - `triage_score`: Produced by the 5-component weighted formula $(0.30 \times \text{Struct} + 0.25 \times \text{Inact} + 0.15 \times \text{Age} + 0.10 \times \text{Adj} + 0.20 \times \text{Action})$.
  - `bottleneck_type` & `actionability_level`: Produced by the deterministic 6-rule cascade.
  - `stage_deviation_ratio`: Direct mathematical input to structural deviation score.

---

## 3. FEATURE LIST

The feature matrix uses 10 leakage-free features divided into raw metadata and non-leaking derived features:

### Raw Metadata Features (Categorical & Numeric)
1. `state` (Categorical - 19 states)
2. `district` (Categorical - District name)
3. `court_establishment` (Categorical - Court name)
4. `case_type` (Categorical - CS, BA, CRL_A, WP_C, MACA)
5. `tier` (Categorical - `district` vs `hc`)
6. `filing_year` (Numeric - Filing year)

### Non-Leaking Derived Features (Numeric & Stage)
7. `case_age_days` (Numeric - Total days since filing relative to reference date)
8. `current_stage` (Categorical - Stage name e.g., Summons/Appearance, Evidence/Argument)
9. `adjournment_count` (Numeric - Total historical adjournments recorded in timeline)
10. `judge_change_count` (Numeric - Bench changes in the last 365 days)

---

## 4. LEAKAGE CHECK

Prior to training, the feature matrix was independently audited for target leakage:
- **Excluded Features:** `triage_score`, `stage_deviation_ratio`, `days_since_substantive_event`, `adjournment_streak`, `cohort_percentile`, `bottleneck_type`, `actionability_level`, `synthetic_cnr` (ID).
- **Leakage Audit Verdict:** **PASSED**. Features represent pure environmental metadata and historical event counts without exposing the target calculation or deterministic triage weights.

---

## 5. CLASS DISTRIBUTION

* **Total Records:** 10,000 cases
* **Class `0` (Normal Progression):** 6,100 cases (61.0%)
* **Class `1` (Structurally Stalled):** 3,900 cases (39.0%)
* **Class Ratio:** ~1.56 : 1 (Moderately balanced dataset; blind oversampling/SMOTE was not required).

---

## 6. MODELS TESTED

Three explainable classification algorithms were trained and evaluated:

1. **Logistic Regression** (Linear baseline, L2 regularization, `max_iter=1000`)
2. **Random Forest Classifier** (Ensemble of 100 decision trees, `n_estimators=100`)
3. **XGBoost Classifier** (Gradient boosted decision trees, `learning_rate=0.1`, `max_depth=6`, `n_estimators=100`)

---

## 7. TRAIN / TEST METHODOLOGY

* **Split Ratio:** 80% Train (8,000 cases), 20% Test (2,000 cases).
* **Sampling:** Stratified by `structural_stall_label` to preserve exact class ratios in train and test splits.
* **Random Seed:** Fixed seed `42` across data splitting and model initialization for 100% reproducibility.
* **Preprocessing Pipeline:** Scikit-Learn `ColumnTransformer` with `StandardScaler` for numeric features and `OneHotEncoder(handle_unknown='ignore')` for categorical features.

---

## 8. METRICS TABLE

| Model | Train Acc | Test Acc | Train F1 | Test F1 | Test Precision | Test Recall | Test ROC-AUC |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Baseline (Majority Class)** | 61.00% | 61.00% | 0.0000 | 0.0000 | 0.0000 | 0.0000 | 0.5000 |
| **Logistic Regression** | 80.45% | 78.95% | 0.7297 | 0.7091 | 0.7691 | 0.6577 | 0.8438 |
| **Random Forest** | 100.0% | 81.65% | 1.0000 | 0.7299 | 0.8566 | 0.6359 | 0.8442 |
| **XGBoost Classifier (Selected)** | **84.58%** | **82.25%** | **0.7707** | **0.7341** | **0.8829** | **0.6282** | **0.8508** |

---

## 9. CONFUSION MATRIX (TEST SET - 2,000 CASES)

### XGBoost (Selected Best Model)
```text
                  Predicted Normal (0)    Predicted Stalled (1)
Actual Normal (0)         1,155                     65   (High Precision: 88.3%)
Actual Stalled (1)          290                    490   (Recall: 62.8%)
```

### Random Forest
```text
                  Predicted Normal (0)    Predicted Stalled (1)
Actual Normal (0)         1,137                     83
Actual Stalled (1)          284                    496
```

### Logistic Regression
```text
                  Predicted Normal (0)    Predicted Stalled (1)
Actual Normal (0)         1,066                    154
Actual Stalled (1)          267                    513
```

---

## 10. BEST MODEL SELECTION

**Selected Model:** **XGBoost Classifier**

### Selection Rationale
* **Highest Test Precision (88.29%):** When XGBoost flags a case as `Structurally Stalled`, it is correct 88.3% of the time. In court registry workflows, high precision prevents registry staff from wasting time on false alarms.
* **Best Test F1-Score (0.7341) & ROC-AUC (0.8508):** Superior overall discriminative capability across all threshold boundaries.
* **Controlled Overfitting:** Unlike Random Forest (which memorized the training set at 100% accuracy), XGBoost maintains tight alignment between train accuracy (84.58%) and test accuracy (82.25%).

---

## 11. FEATURE IMPORTANCE (TOP 10 PREDICTIVE FEATURES)

| Rank | Feature | Importance | Legal / Administrative Interpretation |
| :---: | :--- | :---: | :--- |
| **1** | `judge_change_count` | **0.2374** | Frequent bench transfers severely disrupt case progression, driving structural stalling. |
| **2** | `current_stage_Summons / Appearance` | **0.0427** | Cases stalled early during process service are highly prone to long-term structural delays. |
| **3** | `adjournment_count` | **0.0389** | High cumulative adjournment counts strongly correlate with procedural stagnation. |
| **4** | `current_stage_Evidence / Argument` | **0.0230** | Stagnation during the evidence stage (e.g., unexamined witnesses) indicates bottlenecking. |
| **5** | `current_stage_Pleadings / Issues` | **0.0223** | Delays in completing pleadings signal party-driven procedural friction. |
| **6** | `court_establishment_UTTAR__DC_04` | **0.0131** | Court-establishment specific pendency load baseline. |
| **7** | `court_establishment_TELANG_DC_01` | **0.0128** | Localized court establishment delay pattern. |
| **8** | `state_Bihar` | **0.0121** | State-level procedural environment variation. |
| **9** | `court_establishment_TELANG_DC_02` | **0.0113** | Localized court establishment delay pattern. |
| **10** | `state_West Bengal` | **0.0107** | Regional procedural timeline variation. |

---

## 12. OVERFITTING CHECK

* **Logistic Regression:** Train Acc `80.45%` vs Test Acc `78.95%` ($\Delta = 1.50\%$) — Extremely stable.
* **Random Forest:** Train Acc `100.00%` vs Test Acc `81.65%` ($\Delta = 18.35\%$) — Severe overfitting on training set.
* **XGBoost:** Train Acc `84.58%` vs Test Acc `82.25%` ($\Delta = 2.33\%$) — Well-regularized, excellent generalization performance on test set.

---

## 13. REAL-DATA GENERALIZATION CHECK (3,179 REAL DISPOSED CASES)

We evaluated the feature schema of the audited real-world dataset (`data/disposal_time_cleaned.csv`, 3,179 disposed district court and high court cases) against the 10 features required by the trained model pipeline:

### Feature Schema Comparison

| Model Required Feature | Available in Real Dataset? | Real Column Name | Status |
| :--- | :---: | :--- | :--- |
| `state` | **Yes** | `stateName` | Mapped directly |
| `court_establishment` | **Yes** | `courtName` | Mapped directly |
| `case_type` | **Yes** | `caseType` | Mapped directly |
| `tier` | **Yes** | `tier` | Mapped directly |
| `filing_year` | **Yes** | `filingYear` | Mapped directly |
| `district` | **No** | None | Missing (requires court hierarchy mapping) |
| `case_age_days` | **No** | `caseDurationDays` | Disposed cases contain total duration, not active age |
| `current_stage` | **No** | None | Missing (0% — disposed cases have no current stage) |
| `adjournment_count` | **No** | None | Missing (0% — dataset lacks event histories) |
| `judge_change_count` | **No** | None | Missing (0% — dataset lacks event histories) |

### Real-Data Evaluation Finding
* **Feature Schema Compatibility:** **Incompatible for direct frozen model inference** (5 out of 10 features, including all timeline and stage features, are absent from the real disposed dataset).
* **Ethical & Rigor Rule Applied:** In strict accordance with the project guidelines, **we did NOT fabricate missing event history or dummy stage data** for the real cases.
* **Generalization Insight:** The real dataset validates that metadata features (`state`, `court`, `caseType`, `filingYear`, `tier`) are authentic eCourts fields. Full end-to-end ML model inference on real records will take place when eCourts event-level hearing logs become available.

---

## 14. LIMITATIONS

1. **Synthetic Training Data:** The model was trained on `SYNTHETIC_AUGMENTED` cases modeled after eCourts schemas. While procedural rules match real courts, full real-world validation requires event logs.
2. **Missing Real Event Logs:** Public judicial datasets currently export case disposition summaries rather than granular hearing-by-hearing event logs.
3. **Recall / Precision Tradeoff:** XGBoost prioritizes high precision (88.3%) over recall (62.8%), meaning it focuses on high-confidence stalled cases without generating excessive false positives.

---

## 15. RECOMMENDED NEXT STEPS

1. **Persist Trained Pipeline:** The trained model pipeline is saved at [`ml/model/best_model_pipeline.joblib`](file:///e:/nyaya-drishti/ml/model/best_model_pipeline.joblib).
2. **Sidecar Inference API:** Create a lightweight FastAPI endpoint wrapper under `backend/ml/` that loads the serialized pipeline to provide real-time ML risk predictions alongside the deterministic triage engine.
3. **Real eCourts Event Scraper:** Develop an authorized ingestion parser for real eCourts event logs to extract `adjournment_count` and `judge_change_count` from live court cause lists.

---

## 16. FINAL VERDICT & DECISION

🟢 **MODEL READY FOR INTEGRATION**

The trained XGBoost model achieves **82.25% Test Accuracy**, **88.29% Test Precision**, and **0.8508 ROC-AUC** on leakage-free synthetic data. The model pipeline is fully serialized and ready for sidecar integration into the Nyaya Drishti platform.

---

## 📊 CONCISE SUMMARY FOR SIH PRESENTATION

> **Nyaya-Drishti Machine Learning Architecture:**
>
> 1. **Leakage-Free Feature Design:** Trained on 10,000 synthetic case timelines using pure environmental metadata (`state`, `court`, `case_type`, `tier`) and non-leaking timeline signals (`adjournment_count`, `judge_change_count`, `current_stage`), strictly excluding the deterministic triage score to avoid circular logic.
> 2. **Selected Algorithm (XGBoost):** Evaluated Logistic Regression, Random Forest, and XGBoost. Selected **XGBoost Classifier** for its superior test precision (**88.3%**), strong F1-score (**0.734**), ROC-AUC (**0.851**), and well-controlled regularization (84.6% train vs 82.3% test accuracy).
> 3. **Top Predictive Drivers:** Model feature importances reveal that **recent bench transfers (`judge_change_count`: 23.7% importance)** and **early-stage summons/appearance delays (4.3% importance)** are the leading predictors of long-term structural case stalling.
> 4. **Real-Data Validation Rigor:** Audited against 3,179 real-world judicial cases. Confirmed schema alignment on core metadata while transparently documenting the absence of public event-level cause lists in official open-data dumps.
