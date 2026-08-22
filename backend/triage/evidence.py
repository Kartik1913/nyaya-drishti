"""
triage/evidence.py
------------------
Layer 5 — Evidence Bundler

Bundles all derived stall metrics, cohort stats, component score breakdowns,
and bottleneck metadata into a single JSON-serializable dictionary with at least
10 traceable fields.
"""
from __future__ import annotations
import json
from typing import Dict, Any
from models import Case, CohortStat


def build_evidence_bundle(
    case: Case,
    cohort: CohortStat | None,
    stall_metrics: Dict[str, Any],
    bottleneck_type: str,
    actionability_level: str,
    confidence_level: str,
    age_percentile: float | None,
    triage_score: float,
    components: Dict[str, float],
    ml_result: Dict[str, Any] | None = None
) -> Dict[str, Any]:
    """
    Returns a dict containing 15+ traceable fields including supporting ML signals.
    """
    bundle = {
        "synthetic_cnr": case.synthetic_cnr,
        "court_establishment": case.court_establishment,
        "case_type": case.case_type,
        "act_section_bucket": case.act_section_bucket,
        "current_stage": case.current_stage,

        "filing_date": case.filing_date.isoformat(),
        "stage_entered_at": case.stage_entered_at.isoformat() if case.stage_entered_at else None,

        "days_in_current_stage": stall_metrics["days_in_current_stage"],
        "cohort_median_days_in_stage": stall_metrics["cohort_median_days_in_stage"],
        "stage_deviation_ratio": round(stall_metrics["stage_deviation_ratio"], 2) if stall_metrics["stage_deviation_ratio"] is not None else None,

        "days_since_substantive_event": stall_metrics["days_since_substantive_event"],
        "adjournment_streak": stall_metrics["adjournment_streak"],
        "adjournment_count": stall_metrics["adjournment_count"],
        "judge_change_count": stall_metrics["judge_change_count"],
        "judge_change_grace_period": stall_metrics.get("judge_change_grace_period", False),

        "cohort_size": cohort.cohort_size if cohort else 0,
        "cohort_age_percentile": round(age_percentile, 1) if age_percentile is not None else None,

        "bottleneck_type": bottleneck_type,
        "actionability_level": actionability_level,
        "triage_confidence": confidence_level,
        "triage_score": triage_score,

        "component_scores": components,

        "ml_stall_probability": ml_result.get("structural_stall_probability") if ml_result else None,
        "ml_stall_risk_level": ml_result.get("ml_stall_risk_level", "UNKNOWN") if ml_result else "UNKNOWN",
    }

    return bundle

