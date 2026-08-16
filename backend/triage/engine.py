"""
triage/engine.py
----------------
Triage Engine Orchestrator

Executes the 6-layer triage pipeline across all cases in the database:
  Layer 1: Cohort Builder & Confidence Assessor (triage.cohort)
  Layer 2: Stall Detector (triage.stall_detector)
  Layer 3: Bottleneck Classifier (triage.bottleneck)
  Layer 4: Scorer (triage.scorer)
  Layer 5: Evidence Bundler (triage.evidence)
  Layer 6: Explanation Generator (triage.templates)

Updates database records in place.
"""
from __future__ import annotations
import json
from typing import List, Dict, Any
from sqlalchemy.orm import Session, joinedload

from models import Case, CohortStat
from triage.cohort import resolve_cohort
from triage.stall_detector import detect_stall_metrics
from triage.bottleneck import classify_bottleneck
from triage.scorer import compute_triage_score
from triage.evidence import build_evidence_bundle
from triage.templates import generate_explanation


def run_triage_for_case(
    db: Session,
    case: Case,
    all_cohorts: Optional[list[CohortStat]] = None,
    all_cases: Optional[list[Case]] = None,
) -> Dict[str, Any]:
    """
    Runs Layers 1-6 for a single case and updates its fields.
    Returns the evidence bundle dict.
    """
    # Layer 1: Cohort & Confidence
    cohort, confidence_level, age_percentile = resolve_cohort(
        db, case, all_cohorts=all_cohorts, all_cases=all_cases
    )

    # Layer 2: Stall Metrics
    stall_metrics = detect_stall_metrics(db, case, cohort)

    # Layer 3: Bottleneck Classification
    bottleneck_type, actionability_level = classify_bottleneck(case, stall_metrics)

    # Layer 4: Priority Score
    triage_score, components = compute_triage_score(
        stall_metrics, actionability_level, confidence_level, age_percentile
    )

    # Layer 5: Evidence Bundle
    evidence_bundle = build_evidence_bundle(
        case, cohort, stall_metrics, bottleneck_type, actionability_level,
        confidence_level, age_percentile, triage_score, components
    )

    # Layer 6: Template Explanation
    explanation = generate_explanation(evidence_bundle)

    # Update Case fields
    case.triage_score = triage_score
    case.triage_confidence = confidence_level
    case.bottleneck_type = bottleneck_type
    case.days_since_substantive_event = stall_metrics["days_since_substantive_event"]
    case.days_in_current_stage = stall_metrics["days_in_current_stage"]
    if stall_metrics["stage_deviation_ratio"] is not None:
        case.stage_deviation_ratio = round(stall_metrics["stage_deviation_ratio"], 2)
    else:
        case.stage_deviation_ratio = None
    case.adjournment_streak = stall_metrics["adjournment_streak"]
    case.adjournment_count = stall_metrics["adjournment_count"]
    case.judge_change_count = stall_metrics["judge_change_count"]

    if cohort:
        case.cohort_size = cohort.cohort_size
        case.cohort_median_age = cohort.median_age_days

    case.cohort_percentile = round(age_percentile, 1) if age_percentile is not None else None
    case.evidence_json = json.dumps(evidence_bundle, ensure_ascii=False)
    case.explanation_text = explanation

    return evidence_bundle


def run_triage_all(db: Session) -> Dict[str, Any]:
    """
    Runs triage for all cases in the database.
    """
    cases = db.query(Case).options(joinedload(Case.events)).all()
    all_cohorts = db.query(CohortStat).all()
    results = []
    for case in cases:
        ev = run_triage_for_case(db, case, all_cohorts=all_cohorts, all_cases=cases)
        results.append(ev)

    db.commit()

    alpha = db.query(Case).filter(Case.is_demo_stalled == True).first()
    beta = db.query(Case).filter(Case.is_demo_progressing == True).first()

    alpha_score = alpha.triage_score if alpha else 0.0
    beta_score = beta.triage_score if beta else 0.0
    gap = round(alpha_score - beta_score, 1)

    return {
        "total_cases_triaged": len(cases),
        "alpha_score": alpha_score,
        "beta_score": beta_score,
        "score_gap": gap,
        "alpha_bottleneck": alpha.bottleneck_type if alpha else None,
        "beta_bottleneck": beta.bottleneck_type if beta else None,
    }
