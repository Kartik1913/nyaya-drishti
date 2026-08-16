"""
triage/scorer.py
----------------
Layer 4 — Priority Scorer

Computes priority score using the locked 30/25/15/10/20 formula:
  A (Structural deviation, 30%): min(stage_deviation_ratio / 5.0, 1.0) * 100 * 0.30
  B (Inactivity, 25%):           min(days_since_substantive / 300, 1.0) * 100 * 0.25
  C (Age deviation, 15%):        cohort_age_percentile * 0.15  (0.0 if LOW confidence)
  D (Adjournment streak, 10%):  min(adjournment_streak / 5, 1.0) * 100 * 0.10
  E (Actionability, 20%):        {LOW: 0, UNKNOWN: 0, MEDIUM: 50, HIGH: 100} * 0.20

Returns overall score (0.0 to 100.0) and component breakdown.
"""
from __future__ import annotations
from typing import Dict, Any, Tuple
from triage.config import (
    WEIGHTS,
    INACTIVITY_CAP_DAYS,
    STRUCTURAL_CAP_RATIO,
    ADJOURNMENT_CAP,
    ACTIONABILITY_SCORE,
)


def compute_triage_score(
    stall_metrics: Dict[str, Any],
    actionability_level: str,
    confidence_level: str,
    age_percentile: float | None
) -> Tuple[float, Dict[str, float]]:
    """
    Returns:
      (triage_score, component_scores)
    """
    ratio = stall_metrics["stage_deviation_ratio"]
    days_inactive = stall_metrics["days_since_substantive_event"]
    streak = stall_metrics["adjournment_streak"]

    # Component A: Structural deviation (0 - 100 raw)
    if ratio is not None:
        raw_struct = min(ratio / STRUCTURAL_CAP_RATIO, 1.0) * 100.0
    else:
        raw_struct = 0.0
    score_struct = raw_struct * WEIGHTS["structural_deviation"]

    # Component B: Inactivity (0 - 100 raw)
    raw_inact = min(days_inactive / float(INACTIVITY_CAP_DAYS), 1.0) * 100.0
    score_inact = raw_inact * WEIGHTS["inactivity"]
    if stall_metrics.get("judge_change_grace_period"):
        score_inact *= 0.5

    # Component C: Age deviation (0 - 100 raw, 0 if LOW confidence)
    if confidence_level == "HIGH" and age_percentile is not None:
        raw_age = age_percentile
    else:
        raw_age = 0.0
    score_age = raw_age * WEIGHTS["age_deviation"]

    # Component D: Adjournment pattern (0 - 100 raw)
    raw_adj = min(streak / float(ADJOURNMENT_CAP), 1.0) * 100.0
    score_adj = raw_adj * WEIGHTS["adjournment"]

    # Component E: Administrative actionability (0, 50, 100 raw)
    raw_action = ACTIONABILITY_SCORE.get(actionability_level, 0.0)
    score_action = raw_action * WEIGHTS["actionability"]

    # Final score
    total_raw = score_struct + score_inact + score_age + score_adj + score_action
    triage_score = round(total_raw, 1)

    components = {
        "raw_structural_deviation": round(raw_struct, 1),
        "score_structural_deviation": round(score_struct, 2),

        "raw_inactivity": round(raw_inact, 1),
        "score_inactivity": round(score_inact, 2),

        "raw_age_percentile": round(raw_age, 1) if age_percentile is not None else 0.0,
        "score_age_deviation": round(score_age, 2),

        "raw_adjournment_streak": round(raw_adj, 1),
        "score_adjournment": round(score_adj, 2),

        "raw_actionability": round(raw_action, 1),
        "score_actionability": round(score_action, 2),

        "total_score": triage_score,
    }

    return triage_score, components
