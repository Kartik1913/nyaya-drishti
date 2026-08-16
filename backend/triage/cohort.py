"""
triage/cohort.py
----------------
Layer 1 — Cohort Builder & Confidence Assessor

Resolves the cohort record for a case based on its 5-part cohort key:
  (court_establishment, case_type, act_section_bucket, filing_year_bucket, current_stage)

If cohort_size >= COHORT_MIN_SIZE (15):
  - confidence = 'HIGH'
  - age percentile is computed relative to all cases in the same cohort key.
If cohort_size < 15 or cohort missing:
  - confidence = 'LOW'
  - age percentile is suppressed (None) and age score contribution = 0.
"""
from __future__ import annotations
from datetime import date
from typing import Optional, Tuple
from sqlalchemy.orm import Session

from models import Case, CohortStat
from triage.config import cohort_year_bucket, COHORT_MIN_SIZE, ENGINE_RUN_DATE


def resolve_cohort(
    db: Session,
    case: Case,
    all_cohorts: Optional[list[CohortStat]] = None,
    all_cases: Optional[list[Case]] = None,
) -> Tuple[Optional[CohortStat], str, Optional[float]]:
    """
    Returns:
      (cohort_stat_record, confidence_level, age_percentile)
    """
    filing_year = case.filing_date.year if case.filing_date else ENGINE_RUN_DATE.year
    y_bucket = cohort_year_bucket(filing_year)

    if all_cohorts is not None:
        cohort = next(
            (
                c for c in all_cohorts
                if c.court_establishment == case.court_establishment
                and c.case_type == case.case_type
                and c.act_section_bucket == case.act_section_bucket
                and c.filing_year_bucket == y_bucket
                and c.current_stage == case.current_stage
            ),
            None,
        )
    else:
        cohort = db.query(CohortStat).filter(
            CohortStat.court_establishment == case.court_establishment,
            CohortStat.case_type == case.case_type,
            CohortStat.act_section_bucket == case.act_section_bucket,
            CohortStat.filing_year_bucket == y_bucket,
            CohortStat.current_stage == case.current_stage,
        ).first()

    if not cohort or cohort.cohort_size < COHORT_MIN_SIZE:
        return cohort, "LOW", None

    # Compute age percentile relative to cohort
    case_age_days = (ENGINE_RUN_DATE - case.filing_date).days

    if all_cases is not None:
        matching_cases = [
            c for c in all_cases
            if c.court_establishment == case.court_establishment
            and c.case_type == case.case_type
            and c.act_section_bucket == case.act_section_bucket
            and c.current_stage == case.current_stage
        ]
    else:
        matching_cases = db.query(Case).filter(
            Case.court_establishment == case.court_establishment,
            Case.case_type == case.case_type,
            Case.act_section_bucket == case.act_section_bucket,
            Case.current_stage == case.current_stage,
        ).all()

    cohort_ages = [
        (ENGINE_RUN_DATE - c.filing_date).days
        for c in matching_cases
        if cohort_year_bucket(c.filing_date.year) == y_bucket
    ]

    if not cohort_ages:
        return cohort, "HIGH", 50.0

    rank_count = sum(1 for age in cohort_ages if age <= case_age_days)
    percentile = float(rank_count) / float(len(cohort_ages)) * 100.0
    percentile = min(100.0, max(0.0, percentile))

    return cohort, "HIGH", percentile
