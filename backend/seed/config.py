"""
seed/config.py
--------------
Single source of truth for all seed-generation and triage-engine parameters.

Any module that needs the cohort year bucket formula, the scoring weights,
or the demo-case specifications MUST import from here.  Never duplicate these
values inline.
"""
from __future__ import annotations
from datetime import date, timedelta
import random


# ── Reproducibility ─────────────────────────────────────────────────────────
SEED_RANDOM_SEED: int = 42          # passed to random.seed() before generation
ENGINE_RUN_DATE: date = date(2026, 8, 16)   # logical "today" for the triage engine
                                             # fixed so scores are deterministic


# ── Court Scope & Taxonomy ───────────────────────────────────────────────────
COURT_ESTABLISHMENT: str = "Pune District Court"
STATE: str = "Maharashtra"
DISTRICT: str = "Pune"
CASE_TYPE: str = "CS"               # Civil Suit
ACT_SECTION_BUCKET: str = "CPC_GENERAL"
CURRENT_STAGE: str = "Summons / Appearance"

STAGES: list[str] = [
    "Summons / Appearance",
    "Pleadings / Written Statement",
    "Framing of Issues",
    "Evidence / Argument",
]


# ── Cohort year bucket (canonical formula) ────────────────────────────────────
# Used by: seed generator, cohort endpoint (cohort/router.py), triage engine.
# Rule: group filing years into 2-year even-floor buckets.
#   2019 → "2018"   2020 → "2020"   2021 → "2020"   2022 → "2022"
def cohort_year_bucket(filing_year: int) -> str:
    return str((filing_year // 2) * 2)


# ── Scoring weights (locked Phase 0 formula) ─────────────────────────────────
WEIGHTS: dict[str, float] = {
    "structural_deviation": 0.30,
    "inactivity":           0.25,
    "age_deviation":        0.15,
    "adjournment":          0.10,
    "actionability":        0.20,
}

# Normalisation caps / scales
INACTIVITY_CAP_DAYS: int   = 300   # days_since_substantive / 300 → capped at 1.0
STRUCTURAL_CAP_RATIO: float = 5.0  # stage_deviation_ratio / 5.0  → capped at 1.0
ADJOURNMENT_CAP: int       = 5     # adjournment_streak / 5        → capped at 1.0

# Actionability discrete mapping
ACTIONABILITY_SCORE: dict[str, float] = {
    "LOW":     0.0,
    "UNKNOWN": 0.0,
    "MEDIUM":  50.0,
    "HIGH":    100.0,
}


# ── Bottleneck classifier thresholds (Layer 3) ───────────────────────────────
SUMMONS_DELAY_DAYS: int          = 90    # SUMMONS_ISSUED + no RETURN within N days
WITNESS_DELAY_DAYS: int          = 180   # stage=Evidence + inactivity > N days
REPEATED_ADJOURNMENT_STREAK: int = 4    # consecutive adjournments ≥ N
JUDGE_CHANGE_WINDOW_DAYS: int    = 365  # judge changes within N days
JUDGE_CHANGE_MIN_COUNT: int      = 2    # at least N judge changes
JUDGE_CHANGE_GRACE_DAYS: int     = 60   # grace period if judge changed recently
PROCEDURAL_INACTIVITY_DAYS: int  = 120  # fallback inactivity threshold


# ── Cohort statistics requirements ─────────────────────────────────────────
COHORT_FILING_YEAR_BUCKET: str = "2020"
COHORT_MIN_SIZE: int          = 15     # minimum for HIGH confidence


# ── Demo case specifications (Phase 0 locked) ────────────────────────────────
# Alpha: structurally stalled
ALPHA_CNR: str          = "SYN/PUN/CS/2021/000001"
ALPHA_FILING_DATE: date = date(2021, 3, 10)        # ~5 years old relative to ENGINE_RUN_DATE
ALPHA_STAGE_ENTERED: date = date(2025, 11, 2)       # exactly 287 days before ENGINE_RUN_DATE
ALPHA_LAST_SUBSTANTIVE: date = date(2025, 11, 2)    # substantive order on 2025-11-02
ALPHA_ADJOURNMENT_STREAK: int = 5
ALPHA_BOTTLENECK: str   = "SUMMONS_DELAY"
ALPHA_ACTIONABILITY: str = "HIGH"

# Beta: normally progressing
BETA_CNR: str           = "SYN/PUN/CS/2021/000002"
BETA_FILING_DATE: date  = date(2021, 5, 14)        # ~5 years old
BETA_STAGE_ENTERED: date = date(2026, 7, 2)        # 45 days before ENGINE_RUN_DATE
BETA_LAST_SUBSTANTIVE: date = date(2026, 7, 26)    # 21 days before ENGINE_RUN_DATE
BETA_ADJOURNMENT_STREAK: int = 0
BETA_BOTTLENECK: str    = "UNKNOWN"
BETA_ACTIONABILITY: str = "LOW"


# ── Dataset sizing requirements ──────────────────────────────────────────────
TOTAL_TARGET_CASES: int    = 1000
BACKGROUND_CASE_COUNT: int = 998      # 1000 total - (Alpha + Beta)
BACKGROUND_CNR_PREFIX: str = "SYN/PUN/CS"

# Background case filing year distribution
BACKGROUND_FILING_YEAR_MIN: int = 2018
BACKGROUND_FILING_YEAR_MAX: int = 2024

# Minimum cases in Alpha/Beta's cohort
ALPHA_BETA_COHORT_MIN_SIZE: int = 100


# ── Event taxonomy specifications ────────────────────────────────────────────
# Substantive event types (is_substantive = True)
SUBSTANTIVE_EVENT_TYPES: set[str] = {"HEARING", "ORDER", "WITNESS_EXAM"}

# Procedural event types (is_substantive = False)
PROCEDURAL_EVENT_TYPES: set[str] = {
    "ADJOURNMENT", "SUMMONS_ISSUED", "SUMMONS_RETURNED",
    "JUDGE_CHANGE", "STAGE_TRANSITION"
}
