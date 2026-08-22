"""
triage/templates.py
-------------------
Layer 6 — Explanation Templates

Generates human-readable explanation strings directly from evidence bundle values.
Zero LLM involvement. Template matching based on bottleneck_type and confidence.
"""
from __future__ import annotations
from typing import Dict, Any


def generate_explanation(evidence: Dict[str, Any]) -> str:
    """
    Renders explanation string from evidence bundle fields.
    """
    bottleneck = evidence["bottleneck_type"]
    confidence = evidence["triage_confidence"]
    stage = evidence["current_stage"]
    days_in_stage = evidence["days_in_current_stage"]
    ratio = evidence["stage_deviation_ratio"]
    median_days = evidence["cohort_median_days_in_stage"]
    days_inactive = evidence["days_since_substantive_event"]
    streak = evidence["adjournment_streak"]
    percentile = evidence.get("cohort_age_percentile")

    if confidence == "LOW":
        if evidence.get("cohort_median_days_in_stage") is None:
            conf_warning = " (Low confidence: cohort data missing/invalid)."
        else:
            conf_warning = " (Low confidence cohort: n < 15)."
    else:
        conf_warning = ""

    if ratio is not None and median_days is not None:
        ratio_str = f" ({ratio:.2f}x cohort median of {median_days:.0f}d)"
    else:
        ratio_str = " (cohort median unavailable)"

    if bottleneck == "SUMMONS_DELAY":
        base_text = (
            f"Case has been in stage '{stage}' for {days_in_stage} days{ratio_str}. "
            f"Summons was issued with no return of service recorded over {days_inactive} days, resulting in {streak} consecutive adjournments. "
            f"High administrative actionability to request service status report from registry process server.{conf_warning}"
        )
    elif bottleneck == "WITNESS_DELAY":
        base_text = (
            f"Case has been in stage '{stage}' for {days_in_stage} days with {days_inactive} days since the last substantive hearing. "
            f"Witness examination stalled. Medium administrative actionability to issue witness summons or schedule witness batching.{conf_warning}"
        )
    elif bottleneck == "REPEATED_ADJOURNMENT":
        base_text = (
            f"Case exhibits {streak} consecutive administrative adjournments without substantive progress over {days_inactive} days in stage '{stage}'. "
            f"High administrative actionability to list case for mandatory hearing before presiding officer.{conf_warning}"
        )
    elif bottleneck == "JUDGE_CHANGE":
        # Note: UI renders JUDGE_CHANGE as "Bench Change"
        base_text = (
            f"Bench change recorded within the last 365 days. Procedural inactivity is {days_inactive} days in stage '{stage}'. "
            f"Medium administrative actionability to re-list case before the new bench.{conf_warning}"
        )
    elif bottleneck == "PROCEDURAL_INACTIVITY":
        base_text = (
            f"No substantive event recorded for {days_inactive} days in stage '{stage}'{ratio_str}. "
            f"Medium administrative actionability for registry follow-up.{conf_warning}"
        )
    else:
        # UNKNOWN / Progressing
        base_text = (
            f"Case exhibits normal progression for its cohort. "
            f"Currently in stage '{stage}' for {days_in_stage} days with substantive activity {days_inactive} days ago. "
            f"Low administrative actionability.{conf_warning}"
        )

    # Append ML supporting signal if inference produced a valid result
    ml_prob = evidence.get("ml_stall_probability")
    ml_level = evidence.get("ml_stall_risk_level")
    if ml_prob is not None and ml_level in ("HIGH", "LOW"):
        ml_note = (
            f" ML structural-stall assessment: {ml_level} ({ml_prob:.1%}), "
            "based on historical patterns in case-stage, adjournment and bench-change features. "
            "This is an administrative triage signal and does not predict judicial outcome."
        )
        return f"{base_text}{ml_note}"

    return base_text

