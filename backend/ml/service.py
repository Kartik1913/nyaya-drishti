"""
backend/ml/service.py
---------------------
Singleton Machine Learning Inference Service for Nyaya-Drishti.

Responsible for:
- Loading final_model.joblib once at startup (lazy singleton)
- Constructing the 10 required features matching training definitions exactly
- Generating structural_stall_probability (0.0 to 1.0)
- Assigning ml_stall_risk_level ('HIGH' >= 0.40, 'LOW' < 0.40)
- Graceful failover: logs errors and returns None/UNKNOWN if model is missing or fails
"""
from __future__ import annotations
import os
import logging
from typing import Dict, Any, Optional
from datetime import date
import joblib
import pandas as pd

from seed.config import ENGINE_RUN_DATE

logger = logging.getLogger(__name__)

DECISION_THRESHOLD = 0.40


class MLStallDetector:
    _instance: Optional[MLStallDetector] = None
    _model: Any = None
    _model_loaded: bool = False

    @classmethod
    def get_instance(cls) -> MLStallDetector:
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    def _resolve_model_path(self) -> Optional[str]:
        # 1. Environment variable override
        env_path = os.getenv("ML_MODEL_PATH")
        if env_path and os.path.exists(env_path):
            return env_path

        # 2. Check relative candidate paths
        current_dir = os.path.dirname(os.path.abspath(__file__))  # backend/ml
        backend_dir = os.path.dirname(current_dir)                # backend
        project_root = os.path.dirname(backend_dir)              # project root

        candidates = [
            os.path.join(project_root, "ml", "model", "final_model.joblib"),
            os.path.join(backend_dir, "ml", "model", "final_model.joblib"),
            os.path.join(backend_dir, "final_model.joblib"),
            os.path.join(os.getcwd(), "ml", "model", "final_model.joblib"),
        ]

        for path in candidates:
            if os.path.exists(path):
                return path

        return None

    def load_model(self) -> bool:
        if self._model_loaded:
            return self._model is not None

        model_path = self._resolve_model_path()
        if not model_path:
            logger.warning("[ML Service] final_model.joblib not found. ML predictions will be disabled.")
            self._model = None
            self._model_loaded = True
            return False

        try:
            self._model = joblib.load(model_path)
            self._model_loaded = True
            logger.info(f"[ML Service] Successfully loaded model from {model_path}")
            return True
        except Exception as e:
            logger.error(f"[ML Service] Failed to load model from {model_path}: {e}")
            self._model = None
            self._model_loaded = True
            return False

    def predict_stall_risk(self, case: Any, stall_metrics: Dict[str, Any]) -> Dict[str, Any]:
        """
        Runs inference on a single Case object and its derived stall metrics.
        Returns:
            {
                "structural_stall_probability": float | None,
                "ml_stall_risk_level": "HIGH" | "LOW" | "UNKNOWN"
            }
        """
        if not self._model_loaded:
            self.load_model()

        if self._model is None:
            return {
                "structural_stall_probability": None,
                "ml_stall_risk_level": "UNKNOWN"
            }

        try:
            # 1. Feature construction: exactly matching training definitions
            filing_date = getattr(case, "filing_date", None)
            if filing_date:
                filing_year = int(filing_date.year)
                case_age_days = (ENGINE_RUN_DATE - filing_date).days
            else:
                filing_year = 2022
                case_age_days = int(stall_metrics.get("days_in_current_stage", 0))

            features = {
                "state": str(getattr(case, "state", "Maharashtra") or "Maharashtra"),
                "district": str(getattr(case, "district", None) or getattr(case, "state", "Maharashtra") or "Maharashtra"),
                "court_establishment": str(getattr(case, "court_establishment", "UNKNOWN") or "UNKNOWN"),
                "case_type": str(getattr(case, "case_type", "CS") or "CS"),
                "tier": str(getattr(case, "tier", "district") or "district"),
                "filing_year": filing_year,
                "case_age_days": case_age_days,
                "current_stage": str(getattr(case, "current_stage", "Summons / Appearance") or "Summons / Appearance"),
                "adjournment_count": int(stall_metrics.get("adjournment_count", 0)),
                "judge_change_count": int(stall_metrics.get("judge_change_count", 0)),
            }

            df_input = pd.DataFrame([features])
            
            # Predict probability for class 1 (Structural Stall)
            proba = float(self._model.predict_proba(df_input)[0][1])
            risk_level = "HIGH" if proba >= DECISION_THRESHOLD else "LOW"

            return {
                "structural_stall_probability": round(proba, 4),
                "ml_stall_risk_level": risk_level
            }

        except Exception as e:
            cnr = getattr(case, "synthetic_cnr", "UNKNOWN")
            logger.warning(f"[ML Service] Inference failed for case {cnr}: {e}")
            return {
                "structural_stall_probability": None,
                "ml_stall_risk_level": "UNKNOWN"
            }


def get_ml_service() -> MLStallDetector:
    return MLStallDetector.get_instance()


def predict_stall_risk(case: Any, stall_metrics: Dict[str, Any]) -> Dict[str, Any]:
    return get_ml_service().predict_stall_risk(case, stall_metrics)
