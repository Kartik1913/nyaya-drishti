import pytest
from datetime import date
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from models import Base, Case, CaseEvent, CohortStat
from triage.engine import run_triage_for_case
from triage.config import ENGINE_RUN_DATE


@pytest.fixture
def db_session():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)
    Session = sessionmaker(bind=engine)
    session = Session()
    yield session
    session.close()


def test_triage_low_confidence_missing_cohort(db_session):
    """Test when no cohort data is available (effectively n=0)."""
    case = Case(
        synthetic_cnr="SYN/MISSING-COHORT",
        court_establishment="Test Court",
        case_type="Civil Suit",
        act_section_bucket="Test Act",
        current_stage="Test Stage",
        filing_date=date(2020, 1, 1),
        registration_date=date(2020, 1, 2),
        pending_since=date(2020, 1, 2),
        stage_entered_at=date(2023, 1, 1),
        is_demo_stalled=False,
        is_demo_progressing=False,
    )
    db_session.add(case)
    db_session.commit()

    ev = run_triage_for_case(db_session, case)

    assert ev["triage_confidence"] == "LOW"
    assert ev["cohort_age_percentile"] is None
    assert ev["component_scores"]["score_age_deviation"] == 0.0
    assert ev["component_scores"]["score_structural_deviation"] == 0.0
    assert "(Low confidence: cohort data missing/invalid)" in case.explanation_text


def test_triage_low_confidence_small_cohort(db_session):
    """Test when cohort data exists but size is < 15."""
    case = Case(
        synthetic_cnr="SYN/SMALL-COHORT",
        court_establishment="Test Court",
        case_type="Civil Suit",
        act_section_bucket="Test Act",
        current_stage="Test Stage",
        filing_date=date(2020, 1, 1),
        registration_date=date(2020, 1, 2),
        pending_since=date(2020, 1, 2),
        stage_entered_at=date(2023, 1, 1),
        is_demo_stalled=False,
        is_demo_progressing=False,
    )
    db_session.add(case)
    
    # Add a cohort stat with size = 10 (< 15)
    from triage.config import cohort_year_bucket
    y_bucket = cohort_year_bucket(2020)
    
    cohort = CohortStat(
        court_establishment="Test Court",
        case_type="Civil Suit",
        act_section_bucket="Test Act",
        filing_year_bucket=y_bucket,
        current_stage="Test Stage",
        cohort_size=10,
        median_age_days=1000.0,
        median_days_in_stage=200.0
    )
    db_session.add(cohort)
    db_session.commit()

    ev = run_triage_for_case(db_session, case)

    assert ev["triage_confidence"] == "LOW"
    assert ev["cohort_age_percentile"] is None
    assert ev["component_scores"]["score_age_deviation"] == 0.0
    # structural deviation is calculated since median_days_in_stage > 0
    assert "(Low confidence cohort: n < 15)" in case.explanation_text
