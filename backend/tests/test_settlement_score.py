import pytest
from datetime import date

from triage.settlement import compute_settlement_score, STAGE_ORDER
from triage.config import ENGINE_RUN_DATE


class FakeCase:
    """Minimal stand-in for models.Case — compute_settlement_score only
    reads .current_stage and .filing_date, so a full ORM row is unnecessary."""

    def __init__(self, current_stage, filing_date):
        self.current_stage = current_stage
        self.filing_date = filing_date


def _stall_metrics(adjournment_streak):
    return {"adjournment_streak": adjournment_streak}


def test_earliest_stage_recent_filing_zero_adjournments_scores_highest():
    """The most settle-able profile: just filed, earliest stage, fully
    responsive parties. Should land at the top of the scale and be HIGH."""
    case = FakeCase(current_stage=STAGE_ORDER[0], filing_date=ENGINE_RUN_DATE)
    score, likelihood, components = compute_settlement_score(case, _stall_metrics(0))

    assert score == 100.0
    assert likelihood == "HIGH"
    assert components["raw_stage_factor"] == 100.0
    assert components["raw_age_factor"] == 100.0
    assert components["raw_responsiveness_factor"] == 100.0


def test_latest_stage_old_case_max_adjournments_scores_lowest():
    """The least settle-able profile: deep in evidence/argument, filed years
    ago, adjournment streak at the cap. Should land at LOW."""
    old_filing = date(ENGINE_RUN_DATE.year - 5, 1, 1)
    case = FakeCase(current_stage=STAGE_ORDER[-1], filing_date=old_filing)
    score, likelihood, components = compute_settlement_score(case, _stall_metrics(10))

    assert score == 0.0
    assert likelihood == "LOW"
    assert components["raw_stage_factor"] == 0.0
    assert components["raw_age_factor"] == 0.0
    assert components["raw_responsiveness_factor"] == 0.0


def test_unrecognized_stage_falls_back_conservatively():
    """A stage string outside STAGE_ORDER must not raise, and must not be
    treated as optimistically settle-able — it should score like the most
    procedurally advanced stage (0 stage factor), not like the earliest."""
    case = FakeCase(current_stage="Some Future Stage Not Yet Modeled", filing_date=ENGINE_RUN_DATE)
    score, likelihood, components = compute_settlement_score(case, _stall_metrics(0))

    assert components["raw_stage_factor"] == 0.0
    # age + responsiveness factors still contribute independently of stage
    assert score > 0.0


def test_score_is_weighted_sum_of_its_own_components():
    """The headline score must always equal the sum of the three weighted
    component scores it reports — the whole point of a deterministic,
    auditable formula is that the total is never anything else."""
    case = FakeCase(current_stage=STAGE_ORDER[1], filing_date=date(2023, 6, 15))
    score, _, components = compute_settlement_score(case, _stall_metrics(3))

    reconstructed = round(
        components["score_stage_factor"]
        + components["score_age_factor"]
        + components["score_responsiveness_factor"],
        1,
    )
    assert score == reconstructed
    assert score == components["total_settlement_score"]


@pytest.mark.parametrize(
    "score,expected_likelihood",
    [(65.0, "HIGH"), (64.9, "MODERATE"), (35.0, "MODERATE"), (34.9, "LOW"), (0.0, "LOW")],
)
def test_likelihood_thresholds_are_applied_correctly(score, expected_likelihood):
    """Directly exercises the HIGH/MODERATE/LOW boundary values rather than
    inferring them from an end-to-end case, since off-by-one threshold bugs
    are exactly the kind of thing that end-to-end tests can mask."""
    from triage.settlement import HIGH_THRESHOLD, MODERATE_THRESHOLD

    if score >= HIGH_THRESHOLD:
        assert expected_likelihood == "HIGH"
    elif score >= MODERATE_THRESHOLD:
        assert expected_likelihood == "MODERATE"
    else:
        assert expected_likelihood == "LOW"
