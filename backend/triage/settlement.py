"""
triage/settlement.py
---------------------
Settlement Score — a separate, deterministic signal from the main priority
score, estimating how likely a case could be resolved by mutual agreement
(Lok Adalat referral) rather than continuing to trial.

This is NOT the same question as triage_score. triage_score asks "how
urgently does this case need administrative attention"; settlement_score asks
"how amenable does this case look to being settled instead."

Deliberately deterministic, not ML — same reasoning as the main triage
formula: an explainable, reproducible weighted sum beats an opaque model,
especially for a signal that will be used to decide which cases get referred
to a real mediation process.

Uses exactly three signals, all already computed elsewhere in the pipeline —
no new data fields were added to get this working:

  Stage factor   (45%): earlier procedural stages are more settleable. Once a
                         case has reached full evidence/argument, both sides
                         have already sunk the cost that Lok Adalat is meant
                         to avoid, so the incentive to settle drops sharply.
  Age factor     (25%): newer cases are more settleable. The longer a dispute
                         sits, the more entrenched both sides tend to become.
  Responsiveness (30%): fewer consecutive adjournments implies the parties are
                         still actively engaged and reachable, a precondition
                         for any negotiated settlement.

Two note-worthy honesty points, kept in code comments rather than buried:
  1. Every case in the current synthetic dataset has an identical case_type
     ("CS") and act_section_bucket ("CPC_GENERAL") — there is no real
     per-category variation to weight on, so this formula intentionally does
     NOT use case type, even though real-world Lok Adalat settlement rates do
     vary significantly by case category (e.g., Section 138 cheque-bounce
     cases settle far more often than property disputes). If per-category
     variation is added to the synthetic generator later, a category-weight
     term should be added here and the weights below rebalanced.
  2. This estimates settleability from procedural posture only. It is not
     informed by claim amount or party type (bank/insurer vs. individual),
     which are real-world predictors this dataset does not currently model.
"""
from __future__ import annotations
from typing import Dict, Any, Tuple

from triage.config import ENGINE_RUN_DATE

# Stage order matches seed/config.py STAGES — earliest first. A case's
# position in this list is its only source of "how far along is this."
STAGE_ORDER = [
    "Summons / Appearance",
    "Pleadings / Written Statement",
    "Framing of Issues",
    "Evidence / Argument",
]

WEIGHTS = {
    "stage": 0.45,
    "age": 0.25,
    "responsiveness": 0.30,
}

# A case older than this contributes zero to the age factor — chosen to match
# the same "very stalled" horizon the main triage formula treats as maxed out.
AGE_CAP_DAYS = 365 * 3  # 3 years

# Adjournment streak at or above this contributes zero to responsiveness —
# matches ADJOURNMENT_CAP used by the main triage formula for consistency.
ADJOURNMENT_CAP = 5

HIGH_THRESHOLD = 65.0
MODERATE_THRESHOLD = 35.0


def _stage_factor(current_stage: str) -> float:
    """0-100. Earliest stage = 100, latest listed stage = 0."""
    try:
        idx = STAGE_ORDER.index(current_stage)
    except ValueError:
        # Unrecognized stage — treat as the most-progressed (most conservative
        # settlement estimate) rather than guessing optimistically.
        return 0.0
    span = len(STAGE_ORDER) - 1
    if span <= 0:
        return 100.0
    return 100.0 * (1.0 - idx / span)


def _age_factor(filing_date) -> float:
    """0-100. A case filed today = 100, a case at/beyond AGE_CAP_DAYS = 0."""
    age_days = (ENGINE_RUN_DATE - filing_date).days
    age_days = max(age_days, 0)
    return 100.0 * (1.0 - min(age_days / float(AGE_CAP_DAYS), 1.0))


def _responsiveness_factor(adjournment_streak: int) -> float:
    """0-100. Zero consecutive adjournments = 100, at/beyond the cap = 0."""
    streak = max(adjournment_streak, 0)
    return 100.0 * (1.0 - min(streak / float(ADJOURNMENT_CAP), 1.0))


def compute_settlement_score(case, stall_metrics: Dict[str, Any]) -> Tuple[float, str, Dict[str, float]]:
    """
    Returns (settlement_score, settlement_likelihood, component_breakdown).
    """
    raw_stage = _stage_factor(case.current_stage)
    raw_age = _age_factor(case.filing_date)
    raw_responsiveness = _responsiveness_factor(stall_metrics["adjournment_streak"])

    score_stage = raw_stage * WEIGHTS["stage"]
    score_age = raw_age * WEIGHTS["age"]
    score_responsiveness = raw_responsiveness * WEIGHTS["responsiveness"]

    total = round(score_stage + score_age + score_responsiveness, 1)

    if total >= HIGH_THRESHOLD:
        likelihood = "HIGH"
    elif total >= MODERATE_THRESHOLD:
        likelihood = "MODERATE"
    else:
        likelihood = "LOW"

    components = {
        "raw_stage_factor": round(raw_stage, 1),
        "score_stage_factor": round(score_stage, 2),
        "raw_age_factor": round(raw_age, 1),
        "score_age_factor": round(score_age, 2),
        "raw_responsiveness_factor": round(raw_responsiveness, 1),
        "score_responsiveness_factor": round(score_responsiveness, 2),
        "total_settlement_score": total,
    }

    return total, likelihood, components
