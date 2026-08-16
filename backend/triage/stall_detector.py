"""
triage/stall_detector.py
------------------------
Layer 2 — Stall Detector

Derives metrics directly from CaseEvent records:
  - days_in_current_stage: (ENGINE_RUN_DATE - case.stage_entered_at).days
  - days_since_substantive_event: (ENGINE_RUN_DATE - latest_substantive_date).days
  - adjournment_streak: consecutive ADJOURNMENT events since latest substantive event
  - judge_change_count: JUDGE_CHANGE events in last 365 days
  - stage_deviation_ratio: days_in_current_stage / cohort_median_days_in_stage
"""
from __future__ import annotations
from datetime import date, timedelta
from typing import List, Dict, Any
from sqlalchemy.orm import Session

from models import Case, CaseEvent, CohortStat
from triage.config import ENGINE_RUN_DATE, JUDGE_CHANGE_WINDOW_DAYS, JUDGE_CHANGE_GRACE_DAYS


def detect_stall_metrics(db: Session, case: Case, cohort: CohortStat | None) -> Dict[str, Any]:
    """
    Analyzes case events and returns derived metrics.
    """
    # 1. days_in_current_stage
    stage_entered = case.stage_entered_at or case.pending_since or case.filing_date
    days_in_stage = (ENGINE_RUN_DATE - stage_entered).days
    if days_in_stage < 0:
        days_in_stage = 0

    # Query all events for case, ordered by event_date ascending, id ascending
    events = db.query(CaseEvent).filter(CaseEvent.case_id == case.id).order_by(
        CaseEvent.event_date.asc(), CaseEvent.id.asc()
    ).all()

    # 2. days_since_substantive_event
    substantive_events = [e for e in events if e.is_substantive]
    if substantive_events:
        latest_sub = max(substantive_events, key=lambda e: e.event_date)
        days_since_substantive = (ENGINE_RUN_DATE - latest_sub.event_date).days
        latest_sub_date = latest_sub.event_date
    else:
        days_since_substantive = (ENGINE_RUN_DATE - case.filing_date).days
        latest_sub_date = case.filing_date

    if days_since_substantive < 0:
        days_since_substantive = 0

    # 3. adjournment_streak (consecutive ADJOURNMENT events after latest substantive event)
    adjournment_streak = 0
    total_adjournments = sum(1 for e in events if e.event_type == "ADJOURNMENT")

    for e in reversed(events):
        if e.is_substantive:
            # Stop streak counting once we hit a substantive event going backward
            break
        if e.event_type == "ADJOURNMENT":
            adjournment_streak += 1

    # 4. judge_change_count in last 365 days
    cutoff_365 = ENGINE_RUN_DATE - timedelta(days=JUDGE_CHANGE_WINDOW_DAYS)
    judge_changes_365 = sum(
        1 for e in events if e.event_type == "JUDGE_CHANGE" and e.event_date >= cutoff_365
    )
    cutoff_60 = ENGINE_RUN_DATE - timedelta(days=JUDGE_CHANGE_GRACE_DAYS)
    judge_change_grace_period = any(
        e.event_type == "JUDGE_CHANGE" and e.event_date >= cutoff_60 for e in events
    )

    # 5. stage_deviation_ratio
    if cohort and cohort.median_days_in_stage > 0:
        cohort_median = cohort.median_days_in_stage
        stage_deviation_ratio = float(days_in_stage) / float(cohort_median)
    else:
        cohort_median = None
        stage_deviation_ratio = None

    return {
        "days_in_current_stage": days_in_stage,
        "days_since_substantive_event": days_since_substantive,
        "latest_substantive_date": latest_sub_date,
        "adjournment_streak": adjournment_streak,
        "adjournment_count": total_adjournments,
        "judge_change_count": judge_changes_365,
        "judge_change_grace_period": judge_change_grace_period,
        "stage_deviation_ratio": stage_deviation_ratio,
        "cohort_median_days_in_stage": cohort_median,
        "events": events,
    }
