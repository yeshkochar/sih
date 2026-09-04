import pytest
from datetime import date, timedelta
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.database.connection import get_db, Base, engine, SessionLocal, init_db
from backend.app.utils.demo_data import reset_demo_data

client = TestClient(app)

@pytest.fixture(scope="module", autouse=True)
def setup_test_db():
    init_db()
    db = SessionLocal()
    reset_demo_data(db, scenario="normal")
    db.close()
    yield

def test_probabilistic_forecasting_endpoint():
    response = client.post("/api/forecast", json={
        "origin": "Newcastle",
        "destination": "Visakhapatnam",
        "vessel_type": "Panamax",
        "commodity": "Coking Coal"
    })
    assert response.status_code == 200
    data = response.json()
    assert "forecast" in data
    assert len(data["forecast"]) > 0
    first_pt = data["forecast"][0]
    assert "predicted_rate" in first_pt
    assert "p10_rate" in first_pt
    assert "p90_rate" in first_pt
    assert first_pt["p10_rate"] <= first_pt["p50_rate"] <= first_pt["p90_rate"]
    assert "model_version" in data
    assert "walk_forward_metrics" in data

def test_multi_objective_pareto_optimization():
    req_res = client.post("/api/optimizer/recommend", json={
        "commodity": "Coking Coal",
        "quantity": 75000,
        "origin": "Newcastle",
        "destination": "Visakhapatnam",
        "required_by_date": (date.today() + timedelta(days=20)).isoformat(),
        "preferred_vessel_type": "Panamax",
        "max_budget": 3500000.0,
        "priority": "Cost"
    })
    assert req_res.status_code == 200
    data = req_res.json()
    assert "recommendation_id" in data
    assert "ranked_vessels" in data
    top_v = data["ranked_vessels"][0]
    assert "is_pareto_optimal" in top_v
    assert "dominance_explanation" in top_v
    assert top_v["is_pareto_optimal"] is True

def test_monte_carlo_risk_simulation():
    # Trigger optimization first to get a request_id
    opt_res = client.post("/api/optimizer/recommend", json={
        "commodity": "Iron Ore",
        "quantity": 60000,
        "origin": "Dampier",
        "destination": "Paradip",
        "required_by_date": (date.today() + timedelta(days=15)).isoformat(),
        "preferred_vessel_type": "Panamax"
    })
    assert opt_res.status_code == 200
    cargo_req_id = opt_res.json()["cargo_request"]["id"]

    mc_res = client.post("/api/scenarios/monte-carlo", json={
        "request_id": cargo_req_id,
        "n_simulations": 500,
        "freight_volatility_pct": 10.0,
        "fuel_volatility_pct": 12.0
    })
    assert mc_res.status_code == 200
    mc_data = mc_res.json()
    assert "n_simulations" in mc_data
    assert mc_data["n_simulations"] == 500
    assert "p10_cost" in mc_data
    assert "p50_cost" in mc_data
    assert "p90_cost" in mc_data
    assert "prob_budget_breach_pct" in mc_data
    assert "histogram" in mc_data
    assert len(mc_data["histogram"]) > 0

def test_decision_replay_and_freshness():
    opt_res = client.post("/api/optimizer/recommend", json={
        "commodity": "Coking Coal",
        "quantity": 70000,
        "origin": "Richards Bay",
        "destination": "Gangavaram",
        "required_by_date": (date.today() + timedelta(days=18)).isoformat(),
        "preferred_vessel_type": "Supramax"
    })
    assert opt_res.status_code == 200
    rec_id = opt_res.json()["recommendation_id"]

    replay_res = client.get(f"/api/optimizer/recommendations/{rec_id}/replay")
    assert replay_res.status_code == 200
    r_data = replay_res.json()
    assert "freshness_status" in r_data
    assert "full_snapshot" in r_data
    assert "diff_summary" in r_data

    fresh_res = client.get(f"/api/optimizer/recommendations/{rec_id}/freshness")
    assert fresh_res.status_code == 200
    assert fresh_res.json()["freshness_status"] in ["CURRENT", "STALE", "REQUIRES REVIEW"]


def test_prediction_vs_actual_outcomes():
    post_res = client.post("/api/actuals", json={
        "origin_port": "Newcastle",
        "destination_port": "Visakhapatnam",
        "vessel_name": "MV Steel Pioneer",
        "commodity": "Coking Coal",
        "quantity_mt": 75000.0,
        "predicted_freight_rate": 32.5,
        "predicted_total_cost": 2800000.0,
        "predicted_transit_days": 14.2,
        "predicted_idle_hours": 18.0,
        "actual_freight_rate": 33.1,
        "actual_total_cost": 2850000.0,
        "actual_transit_days": 14.8,
        "actual_idle_hours": 22.0,
        "actual_arrival_date": date.today().isoformat(),
        "notes": "Slight weather delay near Visakhapatnam anchorage."
    })
    assert post_res.status_code == 200
    actual_data = post_res.json()
    assert "rate_error_pct" in actual_data
    assert "cost_error_pct" in actual_data

    metrics_res = client.get("/api/actuals/metrics")
    assert metrics_res.status_code == 200
    m_data = metrics_res.json()
    assert m_data["total_records"] >= 1
    assert "mae_freight_rate" in m_data
