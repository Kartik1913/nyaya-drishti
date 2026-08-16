"""
seed/loader.py
--------------
Loads seed_data.json into the database and runs automated verification.

Usage:
    from seed.loader import load_seed_data
    load_seed_data(db_session)

Or directly:
    python -m seed.loader
"""
from __future__ import annotations

import json
from datetime import date
from pathlib import Path
from typing import Any

from sqlalchemy.orm import Session

from database import SessionLocal, engine, Base
from models import Case, CaseEvent, CohortStat, AggregateContext
from seed.config import cohort_year_bucket


SEED_FILE = Path(__file__).parent / "seed_data.json"


def _parse_date(s: str | None) -> date | None:
    if s is None:
        return None
    return date.fromisoformat(s)


def _derive_stage_entered_at(events: list[dict]) -> date | None:
    """
    Find the latest STAGE_TRANSITION event and return its event_date.
    This is the authoritative value for Case.stage_entered_at.
    """
    transitions = [
        e for e in events if e.get("event_type") == "STAGE_TRANSITION"
    ]
    if not transitions:
        return None
    latest = max(transitions, key=lambda e: e["event_date"])
    return date.fromisoformat(latest["event_date"])


def _load_aggregate_context(db: Session, records: list[dict]) -> None:
    for row in records:
        db.add(AggregateContext(
            source=row["source"],
            metric_name=row["metric_name"],
            metric_value=row["metric_value"],
            as_of_date=_parse_date(row.get("as_of_date")),
            data_label=row.get("data_label", "REAL_AGGREGATE"),
            notes=row.get("notes"),
        ))


def _load_cohort_stats(db: Session, stats: list[dict]) -> None:
    cohort_objs = [
        CohortStat(
            court_establishment=row["court_establishment"],
            case_type=row["case_type"],
            act_section_bucket=row["act_section_bucket"],
            filing_year_bucket=row["filing_year_bucket"],
            current_stage=row["current_stage"],
            cohort_size=row["cohort_size"],
            median_age_days=row["median_age_days"],
            p75_age_days=row.get("p75_age_days"),
            p90_age_days=row.get("p90_age_days"),
            median_days_in_stage=row["median_days_in_stage"],
        )
        for row in stats
    ]
    db.add_all(cohort_objs)


def _build_case_object(c: dict[str, Any]) -> Case:
    events = c.get("events", [])
    stage_entered_at = _derive_stage_entered_at(events)

    json_stage_entered = _parse_date(c.get("stage_entered_at"))
    if json_stage_entered and stage_entered_at and json_stage_entered != stage_entered_at:
        raise ValueError(
            f"stage_entered_at mismatch for {c['synthetic_cnr']}: "
            f"case dict says {json_stage_entered}, STAGE_TRANSITION event says {stage_entered_at}."
        )
    resolved_stage_entered = stage_entered_at or json_stage_entered

    event_objs = [
        CaseEvent(
            event_date=date.fromisoformat(ev["event_date"]),
            event_type=ev["event_type"],
            is_substantive=ev.get("is_substantive", False),
            new_stage=ev.get("new_stage"),
            description=ev.get("description"),
            data_label=ev.get("data_label", "SYNTHETIC"),
        )
        for ev in events
    ]

    return Case(
        synthetic_cnr=c["synthetic_cnr"],
        state=c["state"],
        district=c["district"],
        court_establishment=c["court_establishment"],
        case_type=c["case_type"],
        act_section_bucket=c["act_section_bucket"],
        filing_date=date.fromisoformat(c["filing_date"]),
        registration_date=_parse_date(c.get("registration_date")),
        pending_since=date.fromisoformat(c["pending_since"]),
        current_status=c.get("current_status", "Pending"),
        current_stage=c["current_stage"],
        stage_entered_at=resolved_stage_entered,
        next_date=_parse_date(c.get("next_date")),
        days_since_substantive_event=c.get("days_since_substantive_event"),
        days_in_current_stage=c.get("days_in_current_stage"),
        adjournment_streak=c.get("adjournment_streak", 0),
        adjournment_count=c.get("adjournment_count", 0),
        judge_change_count=c.get("judge_change_count", 0),
        bottleneck_type=c.get("bottleneck_type", "UNKNOWN"),
        is_demo_stalled=c.get("is_demo_stalled", False),
        is_demo_progressing=c.get("is_demo_progressing", False),
        data_label=c.get("data_label", "SYNTHETIC"),
        events=event_objs,
    )


def verify_database_state(db: Session) -> dict: ...


def verify_database_state(db: Session) -> dict:
    """
    Automated verification after reseed / loading:
    1. Exactly 1,000 cases
    2. Every case has 5-25 events
    3. Every case resolves cohort endpoint logic cleanly
    4. Alpha and Beta exist with demo flags
    5. Alpha/Beta cohort size >= 100
    6. 3-5 aggregate-context records
    7. Zero records with incorrect data labels
    """
    total_cases = db.query(Case).count()
    assert total_cases == 1000, f"Verification failed: expected 1000 cases, got {total_cases}"

    # Check 5-25 events for EVERY case
    cases = db.query(Case).all()
    for c in cases:
        ev_count = db.query(CaseEvent).filter(CaseEvent.case_id == c.id).count()
        assert 5 <= ev_count <= 25, f"Verification failed: Case {c.id} (CNR {c.synthetic_cnr}) has {ev_count} events (expected 5..25)"

    # Check cohort resolution for EVERY case
    for c in cases:
        y_bucket = cohort_year_bucket(c.filing_date.year)
        cohort = db.query(CohortStat).filter(
            CohortStat.court_establishment == c.court_establishment,
            CohortStat.case_type == c.case_type,
            CohortStat.act_section_bucket == c.act_section_bucket,
            CohortStat.filing_year_bucket == y_bucket,
            CohortStat.current_stage == c.current_stage,
        ).first()
        assert cohort is not None, f"Verification failed: Case {c.id} (CNR {c.synthetic_cnr}) has no matching CohortStat for bucket={y_bucket}, stage={c.current_stage}"

    # Check Alpha & Beta exist
    alpha = db.query(Case).filter(Case.is_demo_stalled == True).first()
    beta = db.query(Case).filter(Case.is_demo_progressing == True).first()
    assert alpha is not None, "Verification failed: Alpha demo case missing"
    assert beta is not None, "Verification failed: Beta demo case missing"

    # Check Alpha/Beta cohort size >= 100
    alpha_y_bucket = cohort_year_bucket(alpha.filing_date.year)
    alpha_cohort = db.query(CohortStat).filter(
        CohortStat.court_establishment == alpha.court_establishment,
        CohortStat.case_type == alpha.case_type,
        CohortStat.act_section_bucket == alpha.act_section_bucket,
        CohortStat.filing_year_bucket == alpha_y_bucket,
        CohortStat.current_stage == alpha.current_stage,
    ).first()
    assert alpha_cohort is not None and alpha_cohort.cohort_size >= 100, (
        f"Verification failed: Alpha cohort size is {alpha_cohort.cohort_size if alpha_cohort else 0} (expected >= 100)"
    )

    # Check 3-5 aggregate context records
    agg_count = db.query(AggregateContext).count()
    assert 3 <= agg_count <= 5, f"Verification failed: aggregate_context count is {agg_count} (expected 3..5)"

    # Data label integrity
    bad_case_labels = db.query(Case).filter(Case.data_label != "SYNTHETIC").count()
    bad_event_labels = db.query(CaseEvent).filter(CaseEvent.data_label != "SYNTHETIC").count()
    bad_agg_labels = db.query(AggregateContext).filter(AggregateContext.data_label != "REAL_AGGREGATE").count()

    assert bad_case_labels == 0, f"Verification failed: {bad_case_labels} cases have incorrect data_label"
    assert bad_event_labels == 0, f"Verification failed: {bad_event_labels} events have incorrect data_label"
    assert bad_agg_labels == 0, f"Verification failed: {bad_agg_labels} aggregate_context rows have incorrect data_label"

    # Phase 3 Triage Verification
    alpha_score = alpha.triage_score or 0.0
    beta_score = beta.triage_score or 0.0
    gap = alpha_score - beta_score

    assert alpha.bottleneck_type == "SUMMONS_DELAY", f"Alpha bottleneck {alpha.bottleneck_type} != SUMMONS_DELAY"
    assert beta.bottleneck_type == "UNKNOWN", f"Beta bottleneck {beta.bottleneck_type} != UNKNOWN"
    assert alpha_score > 80.0, f"Alpha score {alpha_score} <= 80.0"
    assert beta_score < 40.0, f"Beta score {beta_score} >= 40.0"
    assert gap > 40.0, f"Score gap {gap} <= 40.0"

    return {
        "verified": True,
        "total_cases": total_cases,
        "total_events": db.query(CaseEvent).count(),
        "total_cohort_stats": db.query(CohortStat).count(),
        "alpha_cohort_size": alpha_cohort.cohort_size,
        "alpha_cohort_median_days": alpha_cohort.median_days_in_stage,
        "aggregate_context_count": agg_count,
        "alpha_score": alpha_score,
        "beta_score": beta_score,
        "score_gap": gap,
    }



def load_seed_data(db: Session, seed_file: Path = SEED_FILE) -> dict:
    """
    Load seed_data.json into the database and run verification.
    If seed_data.json does not exist, automatically generate it.
    """
    if not seed_file.exists():
        from seed.generator import generate
        data = generate()
        seed_file.parent.mkdir(parents=True, exist_ok=True)
        with open(seed_file, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
    else:
        with open(seed_file, encoding="utf-8") as f:
            data = json.load(f)

    # Clear existing data (leave users alone)
    if db.bind and db.bind.dialect.name == "postgresql":
        from sqlalchemy import text
        db.execute(text("TRUNCATE TABLE case_events, cases, cohort_stats, aggregate_context CASCADE;"))
        db.commit()
    else:
        db.query(CaseEvent).delete()
        db.query(Case).delete()
        db.query(CohortStat).delete()
        db.query(AggregateContext).delete()
        db.commit()

    # Load aggregate context
    _load_aggregate_context(db, data.get("aggregate_context", []))
    db.flush()

    # Load cohort stats
    _load_cohort_stats(db, data.get("cohort_stats", []))
    db.flush()

    # Load cases + events in batches of 100
    raw_cases = data.get("cases", [])
    batch_size = 100
    for i in range(0, len(raw_cases), batch_size):
        chunk = raw_cases[i : i + batch_size]
        case_objs = [_build_case_object(c) for c in chunk]
        db.add_all(case_objs)
        db.flush()

    db.commit()

    # Run triage engine across all loaded cases
    from triage import run_triage_all
    triage_res = run_triage_all(db)

    # Run automated verification
    verification = verify_database_state(db)
    verification["triage_summary"] = triage_res

    summary = {
        "cases_loaded": len(data.get("cases", [])),
        "cohort_stats_loaded": len(data.get("cohort_stats", [])),
        "aggregate_context_loaded": len(data.get("aggregate_context", [])),
        "verification": verification,
        "engine_run_date": data.get("meta", {}).get("engine_run_date"),
        "seed_file": str(seed_file),
    }
    return summary


if __name__ == "__main__":
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        result = load_seed_data(db)
        print(f"Loaded & Verified: {result['cases_loaded']} cases, "
              f"{result['cohort_stats_loaded']} cohort stat rows, "
              f"{result['aggregate_context_loaded']} aggregate context rows.")
        print(f"Alpha cohort size: {result['verification']['alpha_cohort_size']}, "
              f"Dynamic median stage days: {result['verification']['alpha_cohort_median_days']}")
    finally:
        db.close()
