"""
seed/generator.py
-----------------
Generates all synthetic case data as a plain Python dict structure:
  1. Exactly 1,000 synthetic cases (including CASE-ALPHA and CASE-BETA).
  2. 5 to 25 realistic events per case (inclusive).
  3. Correct event taxonomy: SUMMONS_ISSUED is strictly is_substantive=False.
  4. Dynamically calculated CohortStat rows for every cohort key generated.
  5. Alpha/Beta cohort key has >= 100 cases with median stage duration calculated dynamically.
  6. 4 real-aggregate context records (data_label='REAL_AGGREGATE').

Running this module directly regenerates seed_data.json:
    python -m seed.generator
"""
from __future__ import annotations

import json
import random
from datetime import date, timedelta
from pathlib import Path
from typing import Any

from seed.config import (
    # Scope
    COURT_ESTABLISHMENT, STATE, DISTRICT, CASE_TYPE, ACT_SECTION_BUCKET, CURRENT_STAGE,
    STAGES,
    # Cohort
    COHORT_FILING_YEAR_BUCKET, cohort_year_bucket, ALPHA_BETA_COHORT_MIN_SIZE,
    # Demo cases
    ALPHA_CNR, ALPHA_FILING_DATE, ALPHA_STAGE_ENTERED, ALPHA_LAST_SUBSTANTIVE,
    ALPHA_ADJOURNMENT_STREAK, ALPHA_BOTTLENECK, ALPHA_ACTIONABILITY,
    BETA_CNR, BETA_FILING_DATE, BETA_STAGE_ENTERED, BETA_LAST_SUBSTANTIVE,
    BETA_ADJOURNMENT_STREAK, BETA_BOTTLENECK, BETA_ACTIONABILITY,
    # Sizing
    TOTAL_TARGET_CASES, BACKGROUND_CASE_COUNT, BACKGROUND_CNR_PREFIX,
    BACKGROUND_FILING_YEAR_MIN, BACKGROUND_FILING_YEAR_MAX,
    # Engine & Randomness
    ENGINE_RUN_DATE, SEED_RANDOM_SEED,
)


def _d(d: date) -> str:
    return d.isoformat()


def _days(start: date, end: date) -> int:
    return (end - start).days


def _clamp(val: int, lo: int, hi: int) -> int:
    return max(lo, min(hi, val))


def _random_date_in_year(year: int, rng: random.Random) -> date:
    start = date(year, 1, 1)
    end = date(year, 12, 31)
    delta = (end - start).days
    return start + timedelta(days=rng.randint(0, delta))


# ── Alpha events (14 events, 5 <= 14 <= 25) ───────────────────────────────────

def _build_alpha_events() -> list[dict]:
    """
    CASE-ALPHA events (14 events):
    - Filing ORDER (substantive=True)
    - Early HEARING 1 (substantive=True)
    - Early ORDER 1 (substantive=True)
    - Early HEARING 2 (substantive=True)
    - Early ORDER 2 (substantive=True)
    - Intermediate HEARING 3 (substantive=True)
    - STAGE_TRANSITION into "Summons / Appearance" on 2025-11-02 (287d ago)
    - Substantive ORDER on 2025-11-02 (substantive=True) -> sets days_since_substantive=287
    - SUMMONS_ISSUED on 2025-11-02 (substantive=False per taxonomy rule!)
    - 5 consecutive ADJOURNMENT events (~50d spacing)
    """
    events: list[dict] = []

    # 1. Registration Order
    events.append({
        "event_date": _d(ALPHA_FILING_DATE),
        "event_type": "ORDER",
        "is_substantive": True,
        "new_stage": None,
        "description": "Case registered. Plaint admitted.",
        "data_label": "SYNTHETIC",
    })

    # 2-6. Early substantive hearings/orders (2021 to 2024)
    early_dates = [
        ALPHA_FILING_DATE + timedelta(days=90),
        ALPHA_FILING_DATE + timedelta(days=240),
        ALPHA_FILING_DATE + timedelta(days=450),
        ALPHA_FILING_DATE + timedelta(days=750),
        ALPHA_FILING_DATE + timedelta(days=1100),
    ]
    event_types = ["HEARING", "ORDER", "HEARING", "ORDER", "HEARING"]
    descriptions = [
        "Preliminary hearing. Defendant notice issued.",
        "Order on preliminary objections.",
        "Substantive hearing on interim application.",
        "Order directing compliance of procedural steps.",
        "Hearing on framing of issues postponed.",
    ]
    for dt, et, desc in zip(early_dates, event_types, descriptions):
        events.append({
            "event_date": _d(dt),
            "event_type": et,
            "is_substantive": True,
            "new_stage": None,
            "description": desc,
            "data_label": "SYNTHETIC",
        })

    # 7. STAGE_TRANSITION -> Summons / Appearance (2025-11-02, 287 days ago)
    events.append({
        "event_date": _d(ALPHA_STAGE_ENTERED),
        "event_type": "STAGE_TRANSITION",
        "is_substantive": False,
        "new_stage": CURRENT_STAGE,
        "description": f"Case moved to stage: {CURRENT_STAGE}",
        "data_label": "SYNTHETIC",
    })

    # 8. Substantive ORDER on 2025-11-02 (substantive=True) -> 287 days ago
    events.append({
        "event_date": _d(ALPHA_LAST_SUBSTANTIVE),
        "event_type": "ORDER",
        "is_substantive": True,
        "new_stage": None,
        "description": "Order directing fresh summons service on unserved defendants.",
        "data_label": "SYNTHETIC",
    })

    # 9. SUMMONS_ISSUED on 2025-11-02 (is_substantive=False per taxonomy rule!)
    events.append({
        "event_date": _d(ALPHA_LAST_SUBSTANTIVE),
        "event_type": "SUMMONS_ISSUED",
        "is_substantive": False,
        "new_stage": None,
        "description": "Summons issued to defendant. No service return received.",
        "data_label": "SYNTHETIC",
    })

    # 10-14. Five consecutive adjournments (~50-day spacing)
    adj_date = ALPHA_LAST_SUBSTANTIVE + timedelta(days=50)
    for i in range(ALPHA_ADJOURNMENT_STREAK):
        events.append({
            "event_date": _d(adj_date),
            "event_type": "ADJOURNMENT",
            "is_substantive": False,
            "new_stage": None,
            "description": f"Adjournment {i+1}: Next date posted. Awaiting summons service.",
            "data_label": "SYNTHETIC",
        })
        adj_date += timedelta(days=50)

    events.sort(key=lambda e: (e["event_date"], 0 if e["event_type"] == "STAGE_TRANSITION" else 1))
    return events


# ── Beta events (10 events, 5 <= 10 <= 25) ────────────────────────────────────

def _build_beta_events() -> list[dict]:
    """
    CASE-BETA events (10 events):
    - Filing ORDER (substantive=True)
    - 5 substantive hearings/orders (2021 to 2026)
    - STAGE_TRANSITION on 2026-07-02 (45d ago)
    - Substantive HEARING on 2026-07-26 (21d ago)
    - Subsequent procedural ORDER on 2026-08-01 (substantive=False)
    """
    events: list[dict] = []

    events.append({
        "event_date": _d(BETA_FILING_DATE),
        "event_type": "ORDER",
        "is_substantive": True,
        "new_stage": None,
        "description": "Case registered.",
        "data_label": "SYNTHETIC",
    })

    h_dates = [
        BETA_FILING_DATE + timedelta(days=90),
        BETA_FILING_DATE + timedelta(days=250),
        BETA_FILING_DATE + timedelta(days=550),
        BETA_FILING_DATE + timedelta(days=900),
        BETA_FILING_DATE + timedelta(days=1400),
    ]
    for i, h in enumerate(h_dates, 1):
        events.append({
            "event_date": _d(h),
            "event_type": "HEARING",
            "is_substantive": True,
            "new_stage": None,
            "description": f"Substantive hearing {i}.",
            "data_label": "SYNTHETIC",
        })

    # STAGE_TRANSITION 45 days ago
    events.append({
        "event_date": _d(BETA_STAGE_ENTERED),
        "event_type": "STAGE_TRANSITION",
        "is_substantive": False,
        "new_stage": CURRENT_STAGE,
        "description": f"Case moved to stage: {CURRENT_STAGE}",
        "data_label": "SYNTHETIC",
    })

    # Most recent substantive event: hearing 21 days ago
    events.append({
        "event_date": _d(BETA_LAST_SUBSTANTIVE),
        "event_type": "HEARING",
        "is_substantive": True,
        "new_stage": None,
        "description": "Substantive hearing. Arguments heard. Next date set.",
        "data_label": "SYNTHETIC",
    })

    # Procedural step after hearing
    events.append({
        "event_date": _d(BETA_LAST_SUBSTANTIVE + timedelta(days=6)),
        "event_type": "SUMMONS_ISSUED",
        "is_substantive": False,
        "new_stage": None,
        "description": "Notice copy dispatched to parties.",
        "data_label": "SYNTHETIC",
    })

    events.sort(key=lambda e: (e["event_date"], 0 if e["event_type"] == "STAGE_TRANSITION" else 1))
    return events


# ── Alpha & Beta records ──────────────────────────────────────────────────────

def _build_alpha() -> dict:
    days_in_stage = _days(ALPHA_STAGE_ENTERED, ENGINE_RUN_DATE)     # = 287
    days_since_sub = _days(ALPHA_LAST_SUBSTANTIVE, ENGINE_RUN_DATE)  # = 287

    return {
        "synthetic_cnr": ALPHA_CNR,
        "state": STATE,
        "district": DISTRICT,
        "court_establishment": COURT_ESTABLISHMENT,
        "case_type": CASE_TYPE,
        "act_section_bucket": ACT_SECTION_BUCKET,
        "filing_date": _d(ALPHA_FILING_DATE),
        "registration_date": _d(ALPHA_FILING_DATE),
        "pending_since": _d(ALPHA_FILING_DATE),
        "current_status": "Pending",
        "current_stage": CURRENT_STAGE,
        "stage_entered_at": _d(ALPHA_STAGE_ENTERED),
        "next_date": None,
        "days_since_substantive_event": days_since_sub,
        "days_in_current_stage": days_in_stage,
        "adjournment_streak": ALPHA_ADJOURNMENT_STREAK,
        "adjournment_count": ALPHA_ADJOURNMENT_STREAK,
        "judge_change_count": 0,
        "bottleneck_type": ALPHA_BOTTLENECK,
        "is_demo_stalled": True,
        "is_demo_progressing": False,
        "data_label": "SYNTHETIC",
        "events": _build_alpha_events(),
    }


def _build_beta() -> dict:
    days_in_stage = _days(BETA_STAGE_ENTERED, ENGINE_RUN_DATE)       # = 45
    days_since_sub = _days(BETA_LAST_SUBSTANTIVE, ENGINE_RUN_DATE)   # = 21

    return {
        "synthetic_cnr": BETA_CNR,
        "state": STATE,
        "district": DISTRICT,
        "court_establishment": COURT_ESTABLISHMENT,
        "case_type": CASE_TYPE,
        "act_section_bucket": ACT_SECTION_BUCKET,
        "filing_date": _d(BETA_FILING_DATE),
        "registration_date": _d(BETA_FILING_DATE),
        "pending_since": _d(BETA_FILING_DATE),
        "current_status": "Pending",
        "current_stage": CURRENT_STAGE,
        "stage_entered_at": _d(BETA_STAGE_ENTERED),
        "next_date": _d(ENGINE_RUN_DATE + timedelta(days=14)),
        "days_since_substantive_event": days_since_sub,
        "days_in_current_stage": days_in_stage,
        "adjournment_streak": BETA_ADJOURNMENT_STREAK,
        "adjournment_count": 0,
        "judge_change_count": 0,
        "bottleneck_type": BETA_BOTTLENECK,
        "is_demo_stalled": False,
        "is_demo_progressing": True,
        "data_label": "SYNTHETIC",
        "events": _build_beta_events(),
    }


# ── Background case generator ─────────────────────────────────────────────────

def _build_background_case(
    index: int,
    target_stage: str,
    target_filing_year: int,
    target_stage_days: int | None,
    rng: random.Random
) -> dict:
    """
    Generate one background case ensuring:
    - 5 to 25 events strictly.
    - At least 1 STAGE_TRANSITION event.
    - At least 1 substantive event.
    - Correct taxonomy (SUMMONS_ISSUED is_substantive=False).
    """
    filing_date = _random_date_in_year(target_filing_year, rng)
    total_case_days = _days(filing_date, ENGINE_RUN_DATE)
    if total_case_days < 60:
        total_case_days = 60

    if target_stage_days is not None:
        stage_days_ago = target_stage_days
    else:
        stage_days_ago = _clamp(
            int(abs(rng.gauss(75.0, 50.0))),
            10,
            min(500, total_case_days - 30)
        )

    stage_entered_at = ENGINE_RUN_DATE - timedelta(days=stage_days_ago)

    # Days since substantive: between 0 and stage_days_ago
    days_since_sub = _clamp(
        int(abs(rng.gauss(stage_days_ago * 0.4, 30.0))),
        0,
        stage_days_ago
    )
    last_substantive_date = ENGINE_RUN_DATE - timedelta(days=days_since_sub)

    adj_streak = rng.choices([0, 1, 2, 3, 4, 5], weights=[40, 25, 15, 10, 6, 4])[0]
    judge_changes = rng.choices([0, 1, 2], weights=[75, 20, 5])[0]

    # Bottleneck assignment (heuristic)
    if days_since_sub > 150 and rng.random() < 0.4:
        bottleneck = "SUMMONS_DELAY"
    elif adj_streak >= 4:
        bottleneck = "REPEATED_ADJOURNMENT"
    elif days_since_sub > 120:
        bottleneck = "PROCEDURAL_INACTIVITY"
    elif judge_changes >= 2:
        bottleneck = "JUDGE_CHANGE"
    else:
        bottleneck = "UNKNOWN"

    # Number of events: strictly between 5 and 25
    num_events = rng.randint(6, 18)

    events: list[dict] = []

    # 1. Filing ORDER (substantive=True)
    events.append({
        "event_date": _d(filing_date),
        "event_type": "ORDER",
        "is_substantive": True,
        "new_stage": None,
        "description": "Case registered.",
        "data_label": "SYNTHETIC",
    })

    # 2. STAGE_TRANSITION event at stage_entered_at
    events.append({
        "event_date": _d(stage_entered_at),
        "event_type": "STAGE_TRANSITION",
        "is_substantive": False,
        "new_stage": target_stage,
        "description": f"Case moved to stage: {target_stage}",
        "data_label": "SYNTHETIC",
    })

    # 3. Substantive event at last_substantive_date
    events.append({
        "event_date": _d(last_substantive_date),
        "event_type": "HEARING",
        "is_substantive": True,
        "new_stage": None,
        "description": "Substantive hearing conducted.",
        "data_label": "SYNTHETIC",
    })

    # 4. Fill remaining events up to num_events
    needed = num_events - len(events)

    # Distribute dates before stage_entered_at and after stage_entered_at
    pre_stage_days = _days(filing_date, stage_entered_at)
    post_stage_days = _days(stage_entered_at, ENGINE_RUN_DATE)

    event_pool_procedural = ["ADJOURNMENT", "SUMMONS_ISSUED", "SUMMONS_RETURNED", "JUDGE_CHANGE"]
    event_pool_substantive = ["HEARING", "ORDER", "WITNESS_EXAM"]

    for k in range(needed):
        if rng.random() < 0.6 and pre_stage_days > 10:
            offset = rng.randint(5, max(10, pre_stage_days - 5))
            ev_date = filing_date + timedelta(days=offset)
        else:
            offset = rng.randint(1, max(2, post_stage_days - 1))
            ev_date = stage_entered_at + timedelta(days=offset)

        if ev_date > ENGINE_RUN_DATE:
            ev_date = ENGINE_RUN_DATE - timedelta(days=1)

        is_sub = rng.random() < 0.4
        if is_sub:
            etype = rng.choice(event_pool_substantive)
        else:
            etype = rng.choice(event_pool_procedural)

        events.append({
            "event_date": _d(ev_date),
            "event_type": etype,
            "is_substantive": is_sub,
            "new_stage": None,
            "description": f"{etype.replace('_', ' ').title()} recorded.",
            "data_label": "SYNTHETIC",
        })

    events.sort(key=lambda e: (e["event_date"], 0 if e["event_type"] == "STAGE_TRANSITION" else 1))

    cnr = f"{BACKGROUND_CNR_PREFIX}/{target_filing_year}/{1000 + index:06d}"
    next_date = ENGINE_RUN_DATE + timedelta(days=rng.randint(7, 60)) if rng.random() < 0.6 else None

    return {
        "synthetic_cnr": cnr,
        "state": STATE,
        "district": DISTRICT,
        "court_establishment": COURT_ESTABLISHMENT,
        "case_type": CASE_TYPE,
        "act_section_bucket": ACT_SECTION_BUCKET,
        "filing_date": _d(filing_date),
        "registration_date": _d(filing_date),
        "pending_since": _d(filing_date),
        "current_status": "Pending",
        "current_stage": target_stage,
        "stage_entered_at": _d(stage_entered_at),
        "next_date": _d(next_date) if next_date else None,
        "days_since_substantive_event": days_since_sub,
        "days_in_current_stage": stage_days_ago,
        "adjournment_streak": adj_streak,
        "adjournment_count": adj_streak,
        "judge_change_count": judge_changes,
        "bottleneck_type": bottleneck,
        "is_demo_stalled": False,
        "is_demo_progressing": False,
        "data_label": "SYNTHETIC",
        "events": events,
    }


# ── Dynamic CohortStat Computation ───────────────────────────────────────────

def _compute_cohort_stats(all_cases: list[dict]) -> list[dict]:
    """
    Group all 1,000 cases by:
      court_establishment + case_type + act_section_bucket + filing_year_bucket + current_stage
    Compute dynamic median_days_in_stage, median_age_days, p75_age_days, p90_age_days, cohort_size.
    Returns a list of CohortStat dicts.
    """
    from collections import defaultdict

    groups = defaultdict(list)
    for c in all_cases:
        filing_year = date.fromisoformat(c["filing_date"]).year
        y_bucket = cohort_year_bucket(filing_year)
        key = (
            c["court_establishment"],
            c["case_type"],
            c["act_section_bucket"],
            y_bucket,
            c["current_stage"]
        )
        groups[key].append(c)

    cohort_stats = []

    for (court, ctype, act_bucket, y_bucket, stage), cases in groups.items():
        ages = [_days(date.fromisoformat(c["filing_date"]), ENGINE_RUN_DATE) for c in cases]
        stage_days = [c["days_in_current_stage"] for c in cases]

        ages.sort()
        stage_days.sort()
        n = len(cases)

        def _p(slist: list[int], pct: float) -> float:
            idx = int(len(slist) * pct / 100.0)
            idx = min(idx, len(slist) - 1)
            return float(slist[idx])

        # Median calculation
        mid = n // 2
        if n % 2 == 1:
            med_stage = float(stage_days[mid])
            med_age = float(ages[mid])
        else:
            med_stage = float(stage_days[mid - 1] + stage_days[mid]) / 2.0
            med_age = float(ages[mid - 1] + ages[mid]) / 2.0

        cohort_stats.append({
            "court_establishment": court,
            "case_type": ctype,
            "act_section_bucket": act_bucket,
            "filing_year_bucket": y_bucket,
            "current_stage": stage,
            "cohort_size": n,
            "median_age_days": med_age,
            "p75_age_days": _p(ages, 75),
            "p90_age_days": _p(ages, 90),
            "median_days_in_stage": med_stage,
        })

    return cohort_stats


# ── Real Aggregate Context Records ───────────────────────────────────────────

AGGREGATE_CONTEXT_RECORDS = [
    {
        "source": "NJDG",
        "metric_name": "Total Pending Cases in Indian District Courts",
        "metric_value": "44,300,000+",
        "as_of_date": "2024-01-01",
        "data_label": "REAL_AGGREGATE",
        "notes": "Source: National Judicial Data Grid (NJDG) Public Summary Dashboard",
    },
    {
        "source": "NJDG",
        "metric_name": "Percentage of District Court Cases Pending Over 5 Years",
        "metric_value": "23.4%",
        "as_of_date": "2024-01-01",
        "data_label": "REAL_AGGREGATE",
        "notes": "Source: NJDG National Pendency Classification",
    },
    {
        "source": "DATA_GOV_IN",
        "metric_name": "Average Civil Suit Disposal Duration (Maharashtra District Courts)",
        "metric_value": "1,420 days",
        "as_of_date": "2023-12-31",
        "data_label": "REAL_AGGREGATE",
        "notes": "Source: data.gov.in eCourts Open Dataset",
    },
    {
        "source": "NJDG",
        "metric_name": "Average Stage Duration - Summons / Appearance (Civil Suits)",
        "metric_value": "68 days",
        "as_of_date": "2024-01-01",
        "data_label": "REAL_AGGREGATE",
        "notes": "Source: NJDG Stage-Wise Pendency Report",
    },
]


# ── Main Generation ───────────────────────────────────────────────────────────

def generate() -> dict[str, Any]:
    """
    Build 1,000 synthetic cases, dynamic cohort stats, and aggregate context.
    """
    rng = random.Random(SEED_RANDOM_SEED)

    alpha = _build_alpha()
    beta = _build_beta()

    background_cases: list[dict] = []

    # Assign 125 background cases to Alpha/Beta's exact cohort key:
    # (Pune District Court / CS / CPC_GENERAL / 2020 / Summons / Appearance)
    # So Alpha/Beta cohort size = 125 + 2 = 127 cases (>= 100 requirement!)
    # We calibrate stage_days for these 125 background cases so their dynamic median is ~67d.
    for i in range(1, 126):
        # Generate stage_days values centered around 67 (e.g., 20..115)
        # Evenly spread around 67 to make median exact ~67d
        stage_days_val = _clamp(int(20 + (i * 95.0 / 125.0)), 15, 120)

        # Filing year 2021 (maps to bucket 2020)
        c = _build_background_case(
            index=i,
            target_stage=CURRENT_STAGE,
            target_filing_year=2021,
            target_stage_days=stage_days_val,
            rng=rng
        )
        background_cases.append(c)

    # For remaining 873 cases (125 + 873 = 998 background cases + Alpha + Beta = 1,000 total):
    # Distribute evenly across remaining stages and filing years
    filing_years = [2018, 2019, 2020, 2021, 2022, 2023, 2024]
    idx = 126
    while len(background_cases) < BACKGROUND_CASE_COUNT:
        stage = STAGES[(idx % len(STAGES))]
        year = filing_years[(idx % len(filing_years))]
        c = _build_background_case(
            index=idx,
            target_stage=stage,
            target_filing_year=year,
            target_stage_days=None,
            rng=rng
        )
        background_cases.append(c)
        idx += 1

    all_cases = [alpha, beta] + background_cases
    assert len(all_cases) == TOTAL_TARGET_CASES, f"Expected {TOTAL_TARGET_CASES} cases, got {len(all_cases)}"

    # Dynamically compute cohort stats for EVERY cohort key generated
    cohort_stats = _compute_cohort_stats(all_cases)

    return {
        "meta": {
            "generated_by": "seed/generator.py",
            "engine_run_date": _d(ENGINE_RUN_DATE),
            "random_seed": SEED_RANDOM_SEED,
            "total_cases": len(all_cases),
            "total_cohort_stats": len(cohort_stats),
            "data_label": "SYNTHETIC",
        },
        "aggregate_context": AGGREGATE_CONTEXT_RECORDS,
        "cohort_stats": cohort_stats,
        "cases": all_cases,
    }


if __name__ == "__main__":
    data = generate()
    out_path = Path(__file__).parent / "seed_data.json"
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    print(f"seed_data.json written: {data['meta']['total_cases']} cases, "
          f"{len(data['cohort_stats'])} cohort stat rows, "
          f"{len(data['aggregate_context'])} aggregate context records -> {out_path}")
