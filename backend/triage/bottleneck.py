"""
triage/bottleneck.py
--------------------
Layer 3 — Bottleneck Classifier (Deterministic Cascade)

Evaluates rules in fixed priority order:
  1. SUMMONS_ISSUED with no SUMMONS_RETURNED within 90 days -> SUMMONS_DELAY (HIGH)
  2. stage="Evidence / Argument" and days_since_substantive > 180 -> WITNESS_DELAY (MEDIUM)
  3. adjournment_streak >= 4 -> REPEATED_ADJOURNMENT (HIGH)
  4. judge_change_count >= 2 -> JUDGE_CHANGE (MEDIUM)
  5. days_since_substantive > 120 -> PROCEDURAL_INACTIVITY (MEDIUM)
  6. Else -> UNKNOWN (LOW)
"""
from __future__ import annotations
from typing import Dict, Any, Tuple
from models import Case
from triage.config import (
    SUMMONS_DELAY_DAYS,
    WITNESS_DELAY_DAYS,
    REPEATED_ADJOURNMENT_STREAK,
    JUDGE_CHANGE_MIN_COUNT,
    PROCEDURAL_INACTIVITY_DAYS,
    ENGINE_RUN_DATE,
)


def classify_bottleneck(case: Case, stall_metrics: Dict[str, Any]) -> Tuple[str, str]:
    """
    Returns:
      (bottleneck_type, actionability_level)
    """
    events = stall_metrics["events"]
    days_since_substantive = stall_metrics["days_since_substantive_event"]
    streak = stall_metrics["adjournment_streak"]
    judge_changes = stall_metrics["judge_change_count"]

    # Rule 1: SUMMONS_ISSUED with no SUMMONS_RETURNED within 90 days
    summons_issued_events = [e for e in events if e.event_type == "SUMMONS_ISSUED"]
    if summons_issued_events:
        latest_issued = max(summons_issued_events, key=lambda e: e.event_date)
        summons_returned = [
            e for e in events
            if e.event_type == "SUMMONS_RETURNED" and e.event_date >= latest_issued.event_date
        ]
        days_since_issued = (ENGINE_RUN_DATE - latest_issued.event_date).days
        if not summons_returned and days_since_issued >= SUMMONS_DELAY_DAYS:
            return "SUMMONS_DELAY", "HIGH"

    # Rule 2: Evidence stage with witness delay > 180 days
    if case.current_stage == "Evidence / Argument" and days_since_substantive > WITNESS_DELAY_DAYS:
        return "WITNESS_DELAY", "MEDIUM"

    # Rule 3: Consecutive adjournments >= 4
    if streak >= REPEATED_ADJOURNMENT_STREAK:
        return "REPEATED_ADJOURNMENT", "HIGH"

    # Rule 4: Judge / Bench changes >= 2
    if judge_changes >= JUDGE_CHANGE_MIN_COUNT:
        return "JUDGE_CHANGE", "MEDIUM"

    # Rule 5: Procedural inactivity > 120 days
    if days_since_substantive > PROCEDURAL_INACTIVITY_DAYS:
        return "PROCEDURAL_INACTIVITY", "MEDIUM"

    # Rule 6: Default fallback
    return "UNKNOWN", "LOW"
