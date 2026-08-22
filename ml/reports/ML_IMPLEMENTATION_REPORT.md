# NYAYA DRISHTI — MACHINE LEARNING IMPLEMENTATION REPORT

> **Milestone:** Minimal ML Supporting-Signal Integration  
> **Branch:** `ml/structural-stall-model`  
> **Model Target:** `structural_stall_label` (Binary Classification, Decision Threshold = `0.40`)  
> **Status:** Implementation Complete & Fully Verified (Uncommitted on `ml/structural-stall-model` branch)  
> **Date:** August 2026

---

## 1. FILES CHANGED

| File Path | Action | Description |
| :--- | :---: | :--- |
| [`backend/ml/service.py`](file:///e:/nyaya-drishti/backend/ml/service.py) | **NEW** | Singleton model loader, feature extractor, fail-safe prediction service |
| [`backend/ml/__init__.py`](file:///e:/nyaya-drishti/backend/ml/__init__.py) | **NEW** | Package exports for `MLStallDetector`, `predict_stall_risk` |
| [`backend/triage/engine.py`](file:///e:/nyaya-drishti/backend/triage/engine.py) | **MODIFIED** | Integrated ML inference call after Layer 2 without altering scoring weights |
| [`backend/triage/evidence.py`](file:///e:/nyaya-drishti/backend/triage/evidence.py) | **MODIFIED** | Added `ml_stall_probability` and `ml_stall_risk_level` to evidence bundle |
| [`backend/triage/templates.py`](file:///e:/nyaya-drishti/backend/triage/templates.py) | **MODIFIED** | Appended non-binding administrative risk assessment string |
| [`backend/requirements.txt`](file:///e:/nyaya-drishti/backend/requirements.txt) | **MODIFIED** | Added pinned ML dependencies (`scikit-learn`, `xgboost`, `joblib`, `pandas`, `numpy`) |
| [`backend/database.py`](file:///e:/nyaya-drishti/backend/database.py) | **MODIFIED** | Allowed environment variables to override local `.env` for test database isolation |
| [`backend/tests/test_ml_service.py`](file:///e:/nyaya-drishti/backend/tests/test_ml_service.py) | **NEW** | 7 unit tests covering model loading, features, graceful failure, and consistency |
| [`backend/tests/test_api_endpoints.py`](file:///e:/nyaya-drishti/backend/tests/test_api_endpoints.py) | **MODIFIED** | Configured isolated local test database and table creation fixture |

---

## 2. ML SERVICE ARCHITECTURE

The ML service is implemented in [`backend/ml/service.py`](file:///e:/nyaya-drishti/backend/ml/service.py) as a lightweight, thread-safe singleton (`MLStallDetector`).

```text
Incoming Case + Events
          │
          ▼
detect_stall_metrics() (Layer 2)
          │
          ▼
predict_stall_risk(case, stall_metrics)
          ├── 1. Feature Extraction (10 features)
          ├── 2. Model Pipeline (ColumnTransformer + XGBClassifier)
          └── 3. Decision Threshold Evaluation (Threshold = 0.40)
          │
          ▼
Output Dict:
{
    "structural_stall_probability": 0.8080,
    "ml_stall_risk_level": "HIGH"
}
```

---

## 3. MODEL LOADING STRATEGY

* **Startup Singleton Loading:** The serialized pipeline (`ml/model/final_model.joblib`, 179 KB) is loaded **once** into memory upon first invocation and cached in the singleton instance (`_model`).
* **Candidate Path Discovery:** Resolves model location dynamically across environment variable `ML_MODEL_PATH`, relative project root paths, and working directory candidates.
* **Cold-Start Latency:** ~1.2 seconds once at boot.
* **Warm Inference Latency:** ~4.4 ms per single case.

---

## 4. FEATURE CONSTRUCTION (EXACT 10-FEATURE PARITY)

The backend constructs the exact 10 features used during training:

```python
features = {
    "state": str(getattr(case, "state", "Maharashtra") or "Maharashtra"),
    "district": str(getattr(case, "district", None) or getattr(case, "state", "Maharashtra") or "Maharashtra"),
    "court_establishment": str(getattr(case, "court_establishment", "UNKNOWN") or "UNKNOWN"),
    "case_type": str(getattr(case, "case_type", "CS") or "CS"),
    "tier": str(getattr(case, "tier", "district") or "district"),
    "filing_year": int(case.filing_date.year) if case.filing_date else 2022,
    "case_age_days": (ENGINE_RUN_DATE - case.filing_date).days if case.filing_date else int(stall_metrics.get("days_in_current_stage", 0)),
    "current_stage": str(getattr(case, "current_stage", "Summons / Appearance") or "Summons / Appearance"),
    "adjournment_count": int(stall_metrics.get("adjournment_count", 0)),
    "judge_change_count": int(stall_metrics.get("judge_change_count", 0)),
}
```

> [!NOTE]
> `triage_score`, `stage_deviation_ratio`, `cohort_percentile`, `bottleneck_type`, and `actionability_level` are strictly **excluded** from feature construction to prevent circular data leakage.

---

## 5. INTEGRATION POINT & TRIAGE PIPELINE FLOW

In [`backend/triage/engine.py`](file:///e:/nyaya-drishti/backend/triage/engine.py):
1. **Layer 1:** Resolve cohort & confidence (`resolve_cohort`).
2. **Layer 2:** Compute raw timeline metrics (`detect_stall_metrics`).
3. **ML Supporting Signal:** Call `predict_stall_risk(case, stall_metrics)` to generate `ml_result`.
4. **Layer 3:** Classify procedural bottleneck (`classify_bottleneck`) — **100% deterministic**.
5. **Layer 4:** Compute priority score (`compute_triage_score`) — **100% deterministic, zero formula weight changes**.
6. **Layer 5:** Bundle evidence (`build_evidence_bundle`), adding `ml_stall_probability` and `ml_stall_risk_level`.
7. **Layer 6:** Generate explanation (`generate_explanation`), appending administrative risk note.

---

## 6. EVIDENCE & EXPLANATION CHANGES

### Evidence Bundle (`evidence_json`)
Added two non-breaking keys:
```json
{
  "synthetic_cnr": "SYN/PUN/CS/2021/000001",
  "days_in_current_stage": 287,
  "stage_deviation_ratio": 4.42,
  "adjournment_count": 5,
  "judge_change_count": 0,
  "bottleneck_type": "SUMMONS_DELAY",
  "triage_score": 91.4,
  "ml_stall_probability": 0.808,
  "ml_stall_risk_level": "HIGH"
}
```

### Explanation Text
Appended non-binding administrative assessment:
> *"Case has been in stage 'Summons / Appearance' for 287 days (4.42x cohort median of 65d). Summons was issued with no return of service recorded over 287 days, resulting in 5 consecutive adjournments. High administrative actionability to request service status report from registry process server. **ML structural-stall assessment: HIGH (80.8%), based on historical patterns in case-stage, adjournment and bench-change features. This is an administrative triage signal and does not predict judicial outcome.***"

---

## 7. FAILURE SAFETY & GRACEFUL DEGRADATION

If the model file is missing, corrupt, or throws an unhandled exception during prediction:
1. The exception is caught and logged at `WARNING` level with the case CNR.
2. The ML service returns `{"structural_stall_probability": None, "ml_stall_risk_level": "UNKNOWN"}`.
3. The deterministic triage pipeline proceeds normally with zero interruption.
4. `triage_score`, `bottleneck_type`, and priority queue ordering remain 100% functional.

---

## 8. DEPENDENCY VERSIONS ADDED

Added to `backend/requirements.txt`:
```text
scikit-learn==1.9.0
xgboost==3.4.1
joblib==1.5.3
pandas==3.0.5
numpy==2.5.2
```

---

## 9. TEST RESULTS

Ran full pytest test suite (`pytest tests/`):

```text
tests/test_api_endpoints.py .............                                [ 52%]
tests/test_database_config.py ...                                        [ 64%]
tests/test_ml_service.py .......                                         [ 92%]
tests/test_triage_low_confidence.py ..                                   [100%]

======================= 25 passed in 14.48s =======================
```

### Specific ML Unit Tests Verified:
* ✅ `test_model_loads_successfully`: Pipeline loads and caches in singleton.
* ✅ `test_valid_case_produces_probability`: Produces valid float in $[0.0, 1.0]$.
* ✅ `test_threshold_classification`: Decision threshold $0.40$ correctly labels `HIGH` vs `LOW`.
* ✅ `test_unknown_categorical_values_do_not_crash`: Unseen categories safely ignored by OneHotEncoder.
* ✅ `test_missing_model_fails_gracefully`: Returns `None` and `"UNKNOWN"` without raising errors.
* ✅ `test_triage_engine_populates_evidence_and_preserves_score`: Evidence JSON contains ML fields and score remains valid.
* ✅ `test_deterministic_consistency`: Same case input produces identical probability output across repeated calls.

---

## 10. PERFORMANCE BENCHMARK RESULTS

| Operation | Latency |
| :--- | :---: |
| **Model Startup Load Time** | **1,197 ms** (one-time boot cost) |
| **Single-Case Inference Time** | **4.46 ms** |
| **1,000-Case Batch Triage Inference** | **4.81 seconds** (~4.8 ms/case) |

---

## 11. ROLLBACK STRATEGY

1. **Instant Soft Rollback (Zero Downtime):** Set environment variable `ML_MODEL_PATH=/nonexistent` or remove `final_model.joblib`. The ML service will automatically degrade gracefully to deterministic-only triage.
2. **Hard Code Rollback:** Revert `backend/triage/engine.py` and `backend/triage/evidence.py`. No database migrations or column removals are required because `evidence_json` is an open text field.
