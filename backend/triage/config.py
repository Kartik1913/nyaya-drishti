"""
triage/config.py
----------------
Triage Engine configuration parameters re-exported from seed.config.
Ensures single source of truth across seed generation and triage scoring.
"""
from seed.config import (
    WEIGHTS,
    INACTIVITY_CAP_DAYS,
    STRUCTURAL_CAP_RATIO,
    ADJOURNMENT_CAP,
    ACTIONABILITY_SCORE,
    SUMMONS_DELAY_DAYS,
    WITNESS_DELAY_DAYS,
    REPEATED_ADJOURNMENT_STREAK,
    JUDGE_CHANGE_WINDOW_DAYS,
    JUDGE_CHANGE_MIN_COUNT,
    JUDGE_CHANGE_GRACE_DAYS,
    PROCEDURAL_INACTIVITY_DAYS,
    ENGINE_RUN_DATE,
    COHORT_MIN_SIZE,
    cohort_year_bucket,
)
