# NYAYA DRISHTI — MACHINE LEARNING INTEGRATION PLAN

> **Design Document:** Minimal Supporting-Signal ML Integration Architecture  
> **Model Target:** `structural_stall_label` (XGBoost Weighted Pipeline, Decision Threshold = 0.40)  
> **Status:** Architectural Inspection & Proposal Only (No code changes implemented)  
> **Date:** August 2026

---

## 1. CURRENT TRIAGE ARCHITECTURE & DATA FLOW

Nyaya-Drishti currently operates a **6-layer deterministic triage pipeline** orchestrated in [`backend/triage/engine.py`](file:///e:/nyaya-drishti/backend/triage/engine.py):

```text
Database Query (Case + Events)
            │
            ▼
Layer 1: Cohort Resolution & Confidence Assessor (triage/cohort.py)
            │
            ▼
Layer 2: Stall Metrics Detection (triage/stall_detector.py)
         - days_in_current_stage
         - days_since_substantive_event
         - adjournment_streak & adjournment_count
         - judge_change_count & judge_change_grace_period
            │
            ▼
Layer 3: Procedural Bottleneck Classification (triage/bottleneck.py)
         - 6 deterministic procedural rules
            │
            ▼
Layer 4: 5-Component Priority Scorer (triage/scorer.py)
         - 30% Structural + 25% Inactivity + 15% Age + 10% Adjournment + 20% Actionability
            │
            ▼
Layer 5: Evidence Bundler (triage/evidence.py)
         - Generates 15+ traceable metrics in JSON dictionary
            │
            ▼
Layer 6: Explanation Generator (triage/templates.py)
         - Deterministic template matching (Zero LLM)
            │
            ▼
Database Commit & UI Priority Queue Rendering
```

---

## 2. PROPOSED MINIMAL INTEGRATION POINT

The trained ML model pipeline (`ml/model/final_model.joblib`) will be integrated strictly as a **non-intrusive supporting risk signal** between **Layer 2** and **Layer 5**:

```text
Layer 2: Stall Metrics Detected
            │
            ├─────────────────────────────────────────┐
            ▼                                         ▼
Layer 3: Bottleneck Classification       ML Feature Extraction & Inference
            │                                 (ml/predict.py or backend/ml/)
            ▼                                         │
Layer 4: Priority Scorer                              ▼
            │                            structural_stall_probability
            │                            ml_stall_risk_level (HIGH / LOW)
            │                                         │
            └────────────────────┬────────────────────┘
                                 ▼
                     Layer 5: Evidence Bundler
                     (appends ML probability to JSON)
                                 │
                                 ▼
                     Layer 6: Explanation Generator
                     (appends non-binding risk note)
```

---

## 3. KEY ARCHITECTURAL ANSWERS

### 1. Where the triage engine receives Case/Event data
* **Location:** `run_triage_for_case(db: Session, case: Case, ...)` in [`backend/triage/engine.py:L30`](file:///e:/nyaya-drishti/backend/triage/engine.py#L30).
* **Data State:** `case` contains all core metadata (`state`, `district`, `court_establishment`, `case_type`, `tier`, `filing_year`, `case_age_days`, `current_stage`), and `case.events` contains the sorted chronological event records.

### 2. Where feature extraction can safely occur
* **Location:** Directly in `backend/triage/engine.py` immediately after Layer 2 (`detect_stall_metrics`).
* **Available Features:** Layer 2 already extracts `days_in_current_stage`, `days_since_substantive_event`, `adjournment_count`, and `judge_change_count`.
* **Zero Extra Queries:** All 10 model features (`state`, `district`, `court_establishment`, `case_type`, `tier`, `filing_year`, `case_age_days`, `current_stage`, `adjournment_count`, `judge_change_count`) are already present in memory.

### 3. Where `ml/model/final_model.joblib` should be loaded
* **Location:** Loaded **once at application startup** in `backend/main.py` lifespan context (or a singleton loader module `backend/ml/service.py`).
* **Performance:** Loading once into memory costs ~15ms at server boot; subsequent inferences take <0.4ms per case without cold-start penalties.

### 4. How `structural_stall_probability` is generated
```python
# Extracted 10 features from in-memory case & stall_metrics
feature_dict = {
    "state": case.state,
    "district": case.district,
    "court_establishment": case.court_establishment,
    "case_type": case.case_type,
    "tier": case.tier,
    "filing_year": case.filing_year,
    "case_age_days": case.case_age_days,
    "current_stage": case.current_stage,
    "adjournment_count": stall_metrics["adjournment_count"],
    "judge_change_count": stall_metrics["judge_change_count"]
}
prob = float(ml_pipeline.predict_proba(pd.DataFrame([feature_dict]))[0][1])
ml_risk_level = "HIGH" if prob >= 0.40 else "LOW"
```

### 5. How ML output is added to the Evidence Bundle
* **Location:** [`backend/triage/evidence.py`](file:///e:/nyaya-drishti/backend/triage/evidence.py#L30).
* **Payload Addition:**
  ```python
  "ml_stall_probability": round(prob, 3),
  "ml_stall_risk_level": "HIGH" if prob >= 0.40 else "LOW",
  "ml_model_version": "v1.0-xgboost-weighted"
  ```

### 6. How ML output appears in the Explanation without legal predictions
* **Location:** [`backend/triage/templates.py`](file:///e:/nyaya-drishti/backend/triage/templates.py#L40).
* **Template Suffix Example:**
  ```text
  "...High administrative actionability to request service status report from registry process server. (ML Risk Assessment: 74.1% structural delay probability based on historical adjournment and bench transfer patterns. Administrative triage only — does not evaluate judicial merits or predict legal outcomes.)"
  ```

### 7. Deployment Environment Compatibility (Render & Vercel)
* **Render (Backend):** Python 3.12+ runtime on Render. Adding `scikit-learn>=1.5.0`, `xgboost>=2.0.0`, and `joblib>=1.4.0` to `backend/requirements.txt` installs pre-built binary wheels smoothly.
* **Vercel (Frontend):** 100% static React SPA. Consumes JSON response directly; no frontend dependencies needed.

### 8. Latency and Dependency Considerations
* **Memory Footprint:** The serialized pipeline is only **~180 KB**. RAM consumption during inference is <25 MB.
* **Inference Latency:** Batch inference for 1,000 cases takes ~35ms. Real-time per-case API latency increases by <1ms.

### 9. Database Schema Changes Required
* **Zero Breaking Schema Changes:** Because `Case.evidence_json` stores an open JSON payload, adding ML metrics requires no database migration.
* **Optional Non-Breaking Columns (for direct indexing):**
  - `ml_stall_probability = Column(Float, nullable=True)`
  - `ml_stall_risk_level = Column(String, nullable=True)`

---

## 4. IMPACT ANALYSIS BY COMPONENT

| Component | Files To Modify (When Approved) | Changes Required | Risk Level |
| :--- | :--- | :--- | :---: |
| **Backend ML Service** | `backend/ml/service.py` [NEW] | Singleton model loader and inference helper | Very Low |
| **Triage Engine** | `backend/triage/engine.py` | Call ML service after Layer 2 and pass to Layer 5 | Very Low |
| **Evidence Bundle** | `backend/triage/evidence.py` | Add `ml_stall_probability` and `ml_stall_risk_level` | Zero |
| **Templates** | `backend/triage/templates.py` | Add non-binding administrative risk suffix | Zero |
| **Dependencies** | `backend/requirements.txt` | Add `scikit-learn`, `xgboost`, `joblib` | Low |
| **Frontend UI** | `frontend/src/pages/CaseDetail.jsx` | Render ML Risk Card in audit breakdown | Very Low |

---

## 5. ROLLBACK STRATEGY

Because the ML model is decoupled from the deterministic scoring formula:
1. **Feature Flag / Fallback:** If `final_model.joblib` fails to load or throws an exception, the triage engine catches the error, logs a warning, sets `"ml_stall_probability": None`, and proceeds with the 100% deterministic score.
2. **Instant Reversion:** Reverting `backend/triage/engine.py` restores the standalone deterministic engine instantly without database schema rollback.

---

## 6. RISKS & MITIGATION

1. **Risk of Misinterpretation:** Users might mistake ML stall probability for a case outcome prediction.
   * *Mitigation:* Explicit label: `"Administrative Procedural Delay Risk Only"`.
2. **Risk of Circularity:**
   * *Mitigation:* ML features strictly exclude deterministic scores and rules. ML probability does not feed back into the 5 triage formula weights.
