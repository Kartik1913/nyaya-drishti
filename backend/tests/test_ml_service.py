import os
import pytest
from datetime import date
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from models import Base, Case, CaseEvent, CohortStat
from triage.engine import run_triage_for_case
from triage.config import ENGINE_RUN_DATE
from ml.service import MLStallDetector, get_ml_service, predict_stall_risk


@pytest.fixture
def test_db():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)
    Session = sessionmaker(bind=engine)
    session = Session()
    yield session
    session.close()


def test_model_loads_successfully():
    service = MLStallDetector.get_instance()
    loaded = service.load_model()
    assert loaded is True
    assert service._model is not None


def test_valid_case_produces_probability(test_db):
    case = Case(
        synthetic_cnr="SYN/PUN/CS/2021/000001",
        state="Maharashtra",
        district="Pune",
        court_establishment="DISTRICT AND SESSIONS COURT PUNE MAHARASHTRA",
        case_type="CS",
        filing_date=date(2021, 1, 15),
        pending_since=date(2021, 1, 15),
        current_stage="Summons / Appearance",
        stage_entered_at=date(2021, 2, 1),
        is_demo_stalled=True,
    )
    test_db.add(case)
    test_db.commit()

    stall_metrics = {
        "adjournment_count": 8,
        "judge_change_count": 2,
        "days_in_current_stage": 400
    }

    result = predict_stall_risk(case, stall_metrics)
    prob = result["structural_stall_probability"]
    risk = result["ml_stall_risk_level"]

    assert prob is not None
    assert 0.0 <= prob <= 1.0
    assert risk in ("HIGH", "LOW")


def test_threshold_classification():
    service = MLStallDetector.get_instance()
    service.load_model()

    mock_case_low = Case(
        synthetic_cnr="SYN/PUN/CS/2024/000099",
        state="Maharashtra",
        district="Pune",
        court_establishment="DISTRICT AND SESSIONS COURT PUNE MAHARASHTRA",
        case_type="CS",
        filing_date=date(2024, 1, 1),
        pending_since=date(2024, 1, 1),
        current_stage="Final Arguments / Judgment",
    )
    res_low = predict_stall_risk(mock_case_low, {"adjournment_count": 0, "judge_change_count": 0})
    if res_low["structural_stall_probability"] < 0.40:
        assert res_low["ml_stall_risk_level"] == "LOW"
    else:
        assert res_low["ml_stall_risk_level"] == "HIGH"


def test_unknown_categorical_values_do_not_crash():
    mock_case_unknown = Case(
        synthetic_cnr="SYN/UNK/CS/2023/000099",
        state="CompletelyUnknownState99",
        district="UnknownDistrict99",
        court_establishment="UNKNOWN_ESTABLISHMENT_XYZ",
        case_type="UNKNOWN_TYPE",
        filing_date=date(2023, 5, 10),
        pending_since=date(2023, 5, 10),
        current_stage="UnknownStageName",
    )
    res = predict_stall_risk(mock_case_unknown, {"adjournment_count": 1, "judge_change_count": 0})
    assert res["structural_stall_probability"] is not None
    assert 0.0 <= res["structural_stall_probability"] <= 1.0
    assert res["ml_stall_risk_level"] in ("HIGH", "LOW")


def test_missing_model_fails_gracefully():
    detector = MLStallDetector()
    detector._model_loaded = True
    detector._model = None  # simulate missing model

    mock_case = Case(
        synthetic_cnr="SYN/PUN/CS/2022/000001",
        state="Maharashtra",
        case_type="CS",
        filing_date=date(2022, 1, 1),
        pending_since=date(2022, 1, 1),
    )
    res = detector.predict_stall_risk(mock_case, {"adjournment_count": 0, "judge_change_count": 0})

    assert res["structural_stall_probability"] is None
    assert res["ml_stall_risk_level"] == "UNKNOWN"


def test_triage_engine_populates_evidence_and_preserves_score(test_db):
    cohort = CohortStat(
        court_establishment="DISTRICT AND SESSIONS COURT PUNE MAHARASHTRA",
        case_type="CS",
        act_section_bucket="CPC_GENERAL",
        filing_year_bucket="2021",
        current_stage="Summons / Appearance",
        cohort_size=50,
        median_age_days=300.0,
        median_days_in_stage=60.0
    )
    test_db.add(cohort)

    case = Case(
        synthetic_cnr="SYN/PUN/CS/2021/000002",
        state="Maharashtra",
        district="Pune",
        court_establishment="DISTRICT AND SESSIONS COURT PUNE MAHARASHTRA",
        case_type="CS",
        act_section_bucket="CPC_GENERAL",
        filing_date=date(2021, 1, 15),
        pending_since=date(2021, 1, 15),
        current_stage="Summons / Appearance",
        stage_entered_at=date(2021, 2, 1),
        is_demo_stalled=False,
    )
    test_db.add(case)
    test_db.commit()

    ev = run_triage_for_case(test_db, case, all_cohorts=[cohort], all_cases=[case])

    assert "ml_stall_probability" in ev
    assert "ml_stall_risk_level" in ev
    assert ev["ml_stall_probability"] is not None
    assert ev["ml_stall_risk_level"] in ("HIGH", "LOW")

    # Verify deterministic score and explanation
    assert case.triage_score is not None
    assert 0.0 <= case.triage_score <= 100.0
    assert case.explanation_text is not None
    assert "ML structural-stall assessment:" in case.explanation_text


def test_deterministic_consistency(test_db):
    case = Case(
        synthetic_cnr="SYN/PUN/CS/2021/000003",
        state="Maharashtra",
        district="Pune",
        court_establishment="DISTRICT AND SESSIONS COURT PUNE MAHARASHTRA",
        case_type="CS",
        filing_date=date(2021, 1, 15),
        pending_since=date(2021, 1, 15),
        current_stage="Summons / Appearance",
    )
    stall_metrics = {"adjournment_count": 3, "judge_change_count": 1}

    res1 = predict_stall_risk(case, stall_metrics)
    res2 = predict_stall_risk(case, stall_metrics)

    assert res1["structural_stall_probability"] == res2["structural_stall_probability"]
    assert res1["ml_stall_risk_level"] == res2["ml_stall_risk_level"]
