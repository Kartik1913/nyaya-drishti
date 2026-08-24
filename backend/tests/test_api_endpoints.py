import json
import pytest
from fastapi.testclient import TestClient
from main import app
from database import SessionLocal
from models import Case


@pytest.fixture(scope="session")
def client():
    # TestClient triggers the FastAPI lifespan handler which ensures DB tables & seed users/data
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture(scope="session")
def admin_token(client):
    response = client.post(
        "/auth/token",
        data={"username": "admin", "password": "admin123"},
        headers={"Content-Type": "application/x-www-form-urlencoded"}
    )
    assert response.status_code == 200, f"Admin login failed: {response.text}"
    data = response.json()
    assert "access_token" in data
    assert data["role"] == "admin"
    return data["access_token"]


@pytest.fixture(scope="session")
def registry_token(client):
    response = client.post(
        "/auth/token",
        data={"username": "registry", "password": "registry123"},
        headers={"Content-Type": "application/x-www-form-urlencoded"}
    )
    assert response.status_code == 200, f"Registry login failed: {response.text}"
    data = response.json()
    assert "access_token" in data
    assert data["role"] == "registry_staff"
    return data["access_token"]


# =====================================================================
# 1. Auth & Role-Based Access Control Tests
# =====================================================================

def test_auth_token_success_and_role_claim(client):
    res_admin = client.post(
        "/auth/token",
        data={"username": "admin", "password": "admin123"},
    )
    assert res_admin.status_code == 200
    body_admin = res_admin.json()
    assert body_admin["token_type"] == "bearer"
    assert body_admin["role"] == "admin"
    assert len(body_admin["access_token"]) > 20

    res_reg = client.post(
        "/auth/token",
        data={"username": "registry", "password": "registry123"},
    )
    assert res_reg.status_code == 200
    body_reg = res_reg.json()
    assert body_reg["token_type"] == "bearer"
    assert body_reg["role"] == "registry_staff"


def test_auth_token_invalid_credentials(client):
    res = client.post(
        "/auth/token",
        data={"username": "admin", "password": "wrongpassword"},
    )
    assert res.status_code == 401
    assert "Incorrect username or password" in res.json()["detail"]

    res_unknown = client.post(
        "/auth/token",
        data={"username": "nonexistent", "password": "admin123"},
    )
    assert res_unknown.status_code == 401


def test_auth_me_authenticated(client, admin_token, registry_token):
    res_admin = client.get("/auth/me", headers={"Authorization": f"Bearer {admin_token}"})
    assert res_admin.status_code == 200
    admin_user = res_admin.json()
    assert admin_user["username"] == "admin"
    assert admin_user["role"] == "admin"

    res_reg = client.get("/auth/me", headers={"Authorization": f"Bearer {registry_token}"})
    assert res_reg.status_code == 200
    reg_user = res_reg.json()
    assert reg_user["username"] == "registry"
    assert reg_user["role"] == "registry_staff"


def test_unauthenticated_requests_return_401(client):
    endpoints = [
        ("GET", "/auth/me"),
        ("GET", "/queue"),
        ("GET", "/cases/1"),
        ("GET", "/cases/1/timeline"),
        ("GET", "/cases/1/cohort"),
        ("GET", "/stats/aggregate"),
        ("GET", "/demo/comparison"),
        ("POST", "/admin/reseed"),
    ]
    for method, url in endpoints:
        if method == "GET":
            res = client.get(url)
        else:
            res = client.post(url)
        assert res.status_code == 401, f"{method} {url} expected 401, got {res.status_code}"


def test_admin_reseed_rbac_and_summary(client, admin_token, registry_token):
    # Registry user must receive 403 Forbidden
    res_forbidden = client.post(
        "/admin/reseed",
        headers={"Authorization": f"Bearer {registry_token}"}
    )
    assert res_forbidden.status_code == 403, f"Expected 403 for registry staff, got {res_forbidden.status_code}"

    # Admin user must receive 200 OK and verification summary
    res_ok = client.post(
        "/admin/reseed",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert res_ok.status_code == 200
    data = res_ok.json()
    assert data["status"] == "ok"
    assert data["cases_loaded"] == 1000
    assert data["cohort_stats_loaded"] > 0
    assert data["aggregate_context_loaded"] >= 3
    assert "verification" in data
    assert data["verification"]["verified"] is True
    assert data["verification"]["alpha_score"] > 80.0
    assert data["verification"]["beta_score"] < 40.0
    assert data["verification"]["score_gap"] > 40.0


# =====================================================================
# 2. Priority Queue Endpoint Tests (/queue)
# =====================================================================

def test_queue_sorting_and_alpha_first(client, admin_token):
    res = client.get("/queue?page=1&limit=20", headers={"Authorization": f"Bearer {admin_token}"})
    assert res.status_code == 200
    body = res.json()
    assert body["total"] == 1000
    assert body["page"] == 1
    assert body["limit"] == 20
    cases = body["cases"]
    assert len(cases) == 20

    # Ensure queue is strictly descending by triage_score
    scores = [c["triage_score"] for c in cases if c["triage_score"] is not None]
    assert scores == sorted(scores, reverse=True), "Queue is not descending by triage_score"

    # CASE-ALPHA must be the #1 case in the entire queue
    alpha = cases[0]
    assert alpha["is_demo_stalled"] is True
    assert alpha["bottleneck_type"] == "SUMMONS_DELAY"
    assert alpha["triage_score"] > 80.0
    assert alpha["data_label"] == "SYNTHETIC"


def test_queue_filtering_and_pagination(client, admin_token):
    # Filter by bottleneck
    res_summons = client.get(
        "/queue?bottleneck_filter=SUMMONS_DELAY",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert res_summons.status_code == 200
    for c in res_summons.json()["cases"]:
        assert c["bottleneck_type"] == "SUMMONS_DELAY"

    # Filter by confidence
    res_conf = client.get(
        "/queue?confidence_filter=HIGH",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert res_conf.status_code == 200
    for c in res_conf.json()["cases"]:
        assert c["triage_confidence"] == "HIGH"

    # Pagination validation errors (422)
    res_inv_page = client.get("/queue?page=0", headers={"Authorization": f"Bearer {admin_token}"})
    assert res_inv_page.status_code == 422

    res_inv_limit = client.get("/queue?limit=150", headers={"Authorization": f"Bearer {admin_token}"})
    assert res_inv_limit.status_code == 422


# =====================================================================
# 3. Case Detail & Timeline Endpoint Tests (/cases/{id}, /cases/{id}/timeline)
# =====================================================================

def test_case_detail_alpha_and_beta(client, admin_token):
    # Get Alpha and Beta from demo comparison first to get their IDs dynamically
    comp_res = client.get("/demo/comparison", headers={"Authorization": f"Bearer {admin_token}"})
    assert comp_res.status_code == 200
    comp_data = comp_res.json()
    alpha_id = comp_data["stalled_case"]["id"]
    beta_id = comp_data["progressing_case"]["id"]

    # Alpha detail
    res_alpha = client.get(f"/cases/{alpha_id}", headers={"Authorization": f"Bearer {admin_token}"})
    assert res_alpha.status_code == 200
    alpha = res_alpha.json()
    assert alpha["is_demo_stalled"] is True
    assert alpha["data_label"] == "SYNTHETIC"
    assert alpha["bottleneck_type"] == "SUMMONS_DELAY"
    assert alpha["days_in_current_stage"] == 287
    assert alpha["days_since_substantive_event"] == 287
    assert alpha["adjournment_streak"] == 5
    assert alpha["stage_deviation_ratio"] is not None
    assert round(alpha["stage_deviation_ratio"], 1) == 4.4
    assert alpha["explanation_text"] is not None

    # Evidence JSON validation (at least 10 traceable fields)
    evidence = json.loads(alpha["evidence_json"])
    assert evidence["synthetic_cnr"] == alpha["synthetic_cnr"]
    assert evidence["current_stage"] == alpha["current_stage"]
    assert evidence["days_in_current_stage"] == 287
    assert evidence["days_since_substantive_event"] == 287
    assert evidence["adjournment_streak"] == 5
    assert evidence["bottleneck_type"] == "SUMMONS_DELAY"
    assert evidence["actionability_level"] == "HIGH"
    assert evidence["triage_confidence"] == "HIGH"
    assert "component_scores" in evidence
    assert len(evidence) >= 10

    # Beta detail
    res_beta = client.get(f"/cases/{beta_id}", headers={"Authorization": f"Bearer {admin_token}"})
    assert res_beta.status_code == 200
    beta = res_beta.json()
    assert beta["is_demo_progressing"] is True
    assert beta["bottleneck_type"] == "UNKNOWN"
    assert beta["triage_score"] < 40.0


def test_case_detail_invalid_id_behavior(client, admin_token):
    # Non-existent ID -> 404
    res_404 = client.get("/cases/999999", headers={"Authorization": f"Bearer {admin_token}"})
    assert res_404.status_code == 404
    assert res_404.json()["detail"] == "Case not found"

    # Non-integer ID -> 422
    res_422 = client.get("/cases/invalid-id", headers={"Authorization": f"Bearer {admin_token}"})
    assert res_422.status_code == 422


def test_case_timeline_provenance_and_stage_transitions(client, admin_token):
    comp_res = client.get("/demo/comparison", headers={"Authorization": f"Bearer {admin_token}"})
    alpha_id = comp_res.json()["stalled_case"]["id"]

    res = client.get(f"/cases/{alpha_id}/timeline", headers={"Authorization": f"Bearer {admin_token}"})
    assert res.status_code == 200
    timeline = res.json()
    assert len(timeline) >= 5

    # Check chronological ordering
    event_dates = [e["event_date"] for e in timeline]
    assert event_dates == sorted(event_dates), "Timeline events are not in chronological order"

    # Verify STAGE_TRANSITION event exposes new_stage and all events have data_label='SYNTHETIC'
    has_stage_transition = False
    for event in timeline:
        assert event["data_label"] == "SYNTHETIC"
        if event["event_type"] == "STAGE_TRANSITION":
            has_stage_transition = True
            assert event["new_stage"] is not None
            assert event["new_stage"] == "Summons / Appearance"

    assert has_stage_transition, "STAGE_TRANSITION event missing from Alpha timeline"

    # Invalid ID checks
    res_404 = client.get("/cases/999999/timeline", headers={"Authorization": f"Bearer {admin_token}"})
    assert res_404.status_code == 404

    res_422 = client.get("/cases/invalid-id/timeline", headers={"Authorization": f"Bearer {admin_token}"})
    assert res_422.status_code == 422


# =====================================================================
# 4. Cohort Endpoint Tests (/cases/{id}/cohort)
# =====================================================================

def test_case_cohort_endpoint(client, admin_token):
    comp_res = client.get("/demo/comparison", headers={"Authorization": f"Bearer {admin_token}"})
    alpha_id = comp_res.json()["stalled_case"]["id"]

    res = client.get(f"/cases/{alpha_id}/cohort", headers={"Authorization": f"Bearer {admin_token}"})
    assert res.status_code == 200
    cohort = res.json()
    assert cohort["data_label"] == "SYNTHETIC"
    assert cohort["cohort_size"] >= 100
    assert cohort["median_days_in_stage"] == 65.0
    assert cohort["court_establishment"] == "Pune District Court"
    assert cohort["case_type"] == "CS"
    assert cohort["current_stage"] == "Summons / Appearance"

    # Invalid ID checks
    res_404 = client.get("/cases/999999/cohort", headers={"Authorization": f"Bearer {admin_token}"})
    assert res_404.status_code == 404

    res_422 = client.get("/cases/invalid-id/cohort", headers={"Authorization": f"Bearer {admin_token}"})
    assert res_422.status_code == 422


# =====================================================================
# 5. Aggregate Stats Endpoint Tests (/stats/aggregate)
# =====================================================================

def test_stats_aggregate_endpoint(client, admin_token):
    res = client.get("/stats/aggregate", headers={"Authorization": f"Bearer {admin_token}"})
    assert res.status_code == 200
    items = res.json()
    assert 3 <= len(items) <= 5

    # Every item must have data_label='REAL_AGGREGATE'
    for item in items:
        assert item["data_label"] == "REAL_AGGREGATE"
        assert item["source"] in ["NJDG", "DATA_GOV_IN"]
        assert len(item["metric_name"]) > 0
        assert len(item["metric_value"]) > 0


# =====================================================================
# 6. Demo Comparison Endpoint Tests (/demo/comparison)
# =====================================================================

def test_demo_comparison_endpoint(client, admin_token):
    res = client.get("/demo/comparison", headers={"Authorization": f"Bearer {admin_token}"})
    assert res.status_code == 200
    data = res.json()

    stalled = data["stalled_case"]
    progressing = data["progressing_case"]

    assert stalled is not None
    assert progressing is not None

    # Verify Alpha (Stalled) properties
    assert stalled["is_demo_stalled"] is True
    assert stalled["data_label"] == "SYNTHETIC"
    assert stalled["bottleneck_type"] == "SUMMONS_DELAY"
    assert stalled["triage_score"] > 80.0
    assert stalled["adjournment_streak"] == 5
    assert stalled["days_in_current_stage"] == 287
    assert stalled["days_since_substantive_event"] == 287
    assert "Summons was issued with no return of service" in stalled["explanation_text"]

    # Verify Beta (Progressing) properties
    assert progressing["is_demo_progressing"] is True
    assert progressing["data_label"] == "SYNTHETIC"
    assert progressing["bottleneck_type"] == "UNKNOWN"
    assert progressing["triage_score"] < 40.0
    assert progressing["adjournment_streak"] == 0
    assert "Case exhibits normal progression" in progressing["explanation_text"]

    # Verify score gap exceeds 40 points
    gap = stalled["triage_score"] - progressing["triage_score"]
    assert gap > 40.0, f"Score gap {gap} is not > 40.0"


# =====================================================================
# 7. Triage Stats Endpoint Tests (/stats/triage)
# =====================================================================

def test_get_triage_stats(client, admin_token):
    res = client.get("/stats/triage", headers={"Authorization": f"Bearer {admin_token}"})
    assert res.status_code == 200
    data = res.json()

    assert "total_cases" in data
    assert "stalled_cases" in data
    assert "stalled_percentage" in data
    assert "bottlenecks" in data

    assert data["total_cases"] >= 2
    assert data["stalled_cases"] >= 1
    assert data["stalled_percentage"] >= 0.1
    assert "SUMMONS_DELAY" in data["bottlenecks"]
    assert data["bottlenecks"]["SUMMONS_DELAY"] >= 1
