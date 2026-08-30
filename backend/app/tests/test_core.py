import pytest
from datetime import date
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from backend.app.main import app
from backend.app.database.base import Base
from backend.app.database.connection import get_db
from backend.app.models.port import Port
from backend.app.models.vessel import Vessel
from backend.app.services.feasibility import check_feasibility
from backend.app.services.optimization import haversine_distance, calculate_voyage_metrics

# 1. Setup Test Database (In-Memory SQLite)
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="module")
def db_session():
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)

@pytest.fixture(scope="module")
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass
    app.dependency_overrides[get_db] = override_get_db
    yield TestClient(app)
    app.dependency_overrides.clear()


# 2. Test Feasibility constraint checking
def test_check_feasibility():
    # Setup test vessel and ports
    vessel_panamax = Vessel(
        vessel_name="Test Panamax",
        vessel_type="Panamax",
        loa=229.0,
        beam=32.2,
        draft=14.5,
        cargo_capacity=75000.0,
        speed=14.0,
        fuel_consumption=32.0,
        availability_status="Available"
    )
    
    port_small = Port(
        name="Small Port",
        country="India",
        coast="East Coast",
        latitude=16.0,
        longitude=80.0,
        max_loa=200.0,  # too short
        max_beam=30.0,  # too narrow
        max_draft=12.0, # too shallow
        berth_capacity=2,
        cargo_handling_capacity=50000.0,
        congestion_score=10.0,
        status="Active"
    )
    
    port_large = Port(
        name="Large Port",
        country="India",
        coast="East Coast",
        latitude=17.0,
        longitude=83.0,
        max_loa=300.0,
        max_beam=45.0,
        max_draft=16.0,
        berth_capacity=10,
        cargo_handling_capacity=150000.0,
        congestion_score=20.0,
        status="Active"
    )
    
    # Check Infeasible case
    res_inf = check_feasibility(vessel_panamax, port_small, cargo_qty=70000.0)
    assert res_inf["feasible"] is False
    assert len(res_inf["reasons"]) >= 3
    assert "draft" in res_inf["reasons"][0] or "draft" in res_inf["reasons"][1] or "draft" in res_inf["reasons"][2]
    
    # Check Feasible case
    res_feas = check_feasibility(vessel_panamax, port_large, cargo_qty=70000.0)
    assert res_feas["feasible"] is True
    assert len(res_feas["reasons"]) == 0


# 3. Test Haversine calculations
def test_distance_calculations():
    # Newcastle, Australia coordinates
    lat1, lon1 = -32.92, 151.78
    # Visakhapatnam, India coordinates
    lat2, lon2 = 17.68, 83.21
    
    dist = haversine_distance(lat1, lon1, lat2, lon2)
    # Geodesic distance Newcastle to Visakhapatnam is roughly 4900-5400 nautical miles
    assert 4800.0 < dist < 5600.0


# 4. Test Voyage Cost Calculator
def test_calculate_voyage_metrics():
    v = Vessel(speed=14.0, fuel_consumption=30.0)
    p_orig = Port(latitude=-32.92, longitude=151.78)
    p_dest = Port(latitude=17.68, longitude=83.21)
    
    metrics = calculate_voyage_metrics(v, p_orig, p_dest, cargo_qty=70000.0, current_rate=32.0, idle_hours=24.0)
    
    assert metrics["freight_cost"] == 70000.0 * 32.0
    assert metrics["transit_days"] > 14.0 # 5200nm / (14knots * 24h) = 15.4 days
    assert metrics["idle_cost"] == 15000.0 # 1 idle day * $15k opcost
    assert metrics["total_cost"] > metrics["freight_cost"]


# 5. Test API Integration endpoints
def test_api_endpoints(client, db_session):
    # Setup baseline entities in database
    p1 = Port(name="Newcastle", country="Australia", coast="Overseas", latitude=-32.92, longitude=151.78, max_loa=300, max_beam=50, max_draft=16, berth_capacity=5, cargo_handling_capacity=200000, congestion_score=10, status="Active")
    p2 = Port(name="Visakhapatnam", country="India", coast="East Coast", latitude=17.68, longitude=83.21, max_loa=300, max_beam=50, max_draft=16, berth_capacity=5, cargo_handling_capacity=200000, congestion_score=10, status="Active")
    v1 = Vessel(vessel_name="SAILor Panamax", vessel_type="Panamax", deadweight_tonnage=75000, loa=225, beam=32.2, draft=13.5, cargo_capacity=72000, speed=14, fuel_consumption=30, availability_status="Available")
    
    db_session.add(p1)
    db_session.add(p2)
    db_session.add(v1)
    db_session.commit()
    
    # Test GET Ports
    response = client.get("/api/ports")
    assert response.status_code == 200
    assert len(response.json()) >= 2
    
    # Test GET Vessels
    response = client.get("/api/vessels")
    assert response.status_code == 200
    assert len(response.json()) >= 1
    
    # Test auth login
    response = client.post("/api/auth/login", json={"email": "demo@sail.in", "password": "demo123"})
    assert response.status_code == 200
    assert "access_token" in response.json()
