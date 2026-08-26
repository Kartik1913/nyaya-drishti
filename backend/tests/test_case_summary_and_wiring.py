import pytest
from datetime import date

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from models import Base, Case
from triage.engine import run_triage_for_case
from triage.templates import generate_case_summary


@pytest.fixture
def db_session():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)
    Session = sessionmaker(bind=engine)
    session = Session()
    yield session
    session.close()


def _make_case(**overrides):
    defaults = dict(
        synthetic_cnr="SYN/SETTLEMENT-WIRING-TEST",
        court_establishment="Test Court",
        case_type="Civil Suit",
        act_section_bucket="Test Act",
        current_stage="Test Stage",
        filing_date=date(2021, 1, 1),
        registration_date=date(2021, 1, 2),
        pending_since=date(2021, 1, 2),
        stage_entered_at=date(2021, 6, 1),
        is_demo_stalled=False,
        is_demo_progressing=False,
    )
    defaults.update(overrides)
    return Case(**defaults)


def test_run_triage_populates_settlement_and_summary_fields(db_session):
    """The whole point of wiring settlement.py and generate_case_summary into
    engine.py is that a normal triage run populates them automatically —
    this is the regression test that would catch someone accidentally
    removing that wiring later."""
    case = _make_case()
    db_session.add(case)
    db_session.commit()

    run_triage_for_case(db_session, case)

    assert case.settlement_score is not None
    assert 0.0 <= case.settlement_score <= 100.0
    assert case.settlement_likelihood in ("HIGH", "MODERATE", "LOW")
    assert case.case_summary is not None
    assert len(case.case_summary) > 0


def test_case_summary_reflects_filing_year_and_stage():
    """generate_case_summary must actually read the case's real filing year
    and current stage rather than emitting boilerplate — a summary that
    doesn't mention either would be useless to a reader."""
    case = _make_case(filing_date=date(2019, 3, 10), current_stage="Evidence / Argument")
    evidence = {
        "current_stage": "Evidence / Argument",
        "days_in_current_stage": 45,
        "stage_deviation_ratio": 1.0,
        "bottleneck_type": "UNKNOWN",
        "triage_confidence": "HIGH",
    }

    summary = generate_case_summary(case, evidence)

    assert "2019" in summary
    assert "Evidence / Argument" in summary
    assert "normal" in summary.lower()


def test_case_summary_names_the_actual_bottleneck():
    """A stalled case's summary should say which bottleneck was flagged, not
    a generic 'something is wrong' — a registrar needs to know what to act
    on without opening the full evidence breakdown."""
    case = _make_case()
    evidence = {
        "current_stage": "Summons / Appearance",
        "days_in_current_stage": 287,
        "stage_deviation_ratio": 4.4,
        "bottleneck_type": "SUMMONS_DELAY",
        "triage_confidence": "HIGH",
    }

    summary = generate_case_summary(case, evidence)

    assert "summons" in summary.lower()
