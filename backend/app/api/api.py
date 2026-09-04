import datetime
from fastapi import APIRouter, Depends, HTTPException, status, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session
from typing import List, Optional
from backend.app.database.connection import get_db
from backend.app.database.connection import init_db
from backend.app.models.port import Port
from backend.app.models.vessel import Vessel
from backend.app.models.freight_rate import FreightRate
from backend.app.models.cargo_request import CargoRequest
from backend.app.models.forecast import Forecast
from backend.app.models.recommendation import Recommendation
from backend.app.models.disruption import Disruption
from backend.app.models.audit_log import AuditLog
from backend.app.models.actual_voyage import ActualVoyageData
from backend.app.schemas.schemas import (
    PortOut, VesselOut, FreightRateOut, CargoRequestIn, CargoRequestOut,
    ForecastIn, ForecastResponse, RecommendationOut, OverrideIn,
    DisruptionOut, AuditLogOut, ScenarioIn, DashboardSummary, AlertItem,
    DataHealthResponse, DataMetadata, RAGQueryIn, RAGQueryResponse,
    MonteCarloIn, ActualVoyageIn, ActualVoyageOut
)
from backend.app.services.forecasting import get_forecast
from backend.app.services.feasibility import check_feasibility
from backend.app.services.optimization import optimize_charter
from backend.app.services.scenarios import simulate_scenario, run_monte_carlo_simulation
from backend.app.services.freshness import evaluate_recommendation_freshness
from backend.app.services.ingestion import get_data_health_summary
from backend.app.api.websocket_manager import manager
from backend.app.utils.demo_data import reset_demo_data
from backend.app.rag.service import execute_rag_query

router = APIRouter()

# 0. REAL-TIME WEBSOCKET & DATA HEALTH CONTRACT
@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            # Keep connection alive & listen for client messages
            data = await websocket.receive_text()
            await websocket.send_json({"event": "pong", "timestamp": datetime.datetime.utcnow().isoformat() + "Z"})
    except WebSocketDisconnect:
        manager.disconnect(websocket)

@router.get("/data-health", response_model=DataHealthResponse)
def get_data_health():
    return get_data_health_summary()

# 1. AUTHENTICATION (Simulated JWT for SIH MVP)
@router.post("/auth/login")
def login(payload: dict):
    email = payload.get("email")
    password = payload.get("password")
    if email == "demo@sail.in" and password == "demo123":
        return {
            "access_token": "freightsense-sih-token-12345",
            "token_type": "bearer",
            "user": {
                "email": "demo@sail.in",
                "username": "Procurement Manager",
                "role": "Procurement Manager"
            }
        }
    raise HTTPException(status_code=400, detail="Invalid email or password")

# 2. PORTS
@router.get("/ports", response_model=List[PortOut])
def get_ports(db: Session = Depends(get_db)):
    return db.query(Port).all()

@router.get("/ports/{port_id}", response_model=PortOut)
def get_port(port_id: int, db: Session = Depends(get_db)):
    port = db.query(Port).filter(Port.id == port_id).first()
    if not port:
        raise HTTPException(status_code=404, detail="Port not found")
    return port

# 3. VESSELS
@router.get("/vessels", response_model=List[VesselOut])
def get_vessels(db: Session = Depends(get_db)):
    return db.query(Vessel).all()

@router.get("/vessels/{vessel_id}", response_model=VesselOut)
def get_vessel(vessel_id: int, db: Session = Depends(get_db)):
    vessel = db.query(Vessel).filter(Vessel.id == vessel_id).first()
    if not vessel:
        raise HTTPException(status_code=404, detail="Vessel not found")
    return vessel

# 4. FREIGHT RATE HISTORY
@router.get("/freight/history", response_model=List[FreightRateOut])
def get_freight_history(
    origin: str, 
    destination: str, 
    vessel_type: str, 
    commodity: str, 
    db: Session = Depends(get_db)
):
    rates = db.query(FreightRate).filter(
        FreightRate.origin_port == origin,
        FreightRate.destination_port == destination,
        FreightRate.vessel_type == vessel_type,
        FreightRate.commodity == commodity
    ).order_by(FreightRate.date.asc()).all()
    return rates

# 5. ML FORECASTING
@router.post("/forecast", response_model=ForecastResponse)
def generate_freight_forecast(payload: ForecastIn, db: Session = Depends(get_db)):
    res = get_forecast(db, payload.origin, payload.destination, payload.vessel_type, payload.commodity)
    if not res.get("forecast"):
        raise HTTPException(status_code=400, detail="Insufficient historical data to generate forecast")
    return res

# 6. PORT-VESSEL FEASIBILITY CHECK
@router.post("/feasibility/check")
def check_port_vessel_feasibility(payload: dict, db: Session = Depends(get_db)):
    vessel_id = payload.get("vessel_id")
    port_id = payload.get("port_id")
    cargo_qty = payload.get("cargo_qty")
    
    v = db.query(Vessel).filter(Vessel.id == vessel_id).first()
    p = db.query(Port).filter(Port.id == port_id).first()
    
    if not v or not p:
        raise HTTPException(status_code=404, detail="Vessel or Port not found")
        
    return check_feasibility(v, p, cargo_qty)

# 7. OPTIMIZER: RECOMMENDATION ENGINE
@router.post("/optimizer/recommend")
def get_optimizer_recommendation(payload: CargoRequestIn, db: Session = Depends(get_db)):
    # 1. Create a Cargo Request record in DB
    req = CargoRequest(
        commodity=payload.commodity,
        quantity=payload.quantity,
        origin=payload.origin,
        destination=payload.destination,
        required_by_date=payload.required_by_date,
        preferred_vessel_type=payload.preferred_vessel_type,
        max_budget=payload.max_budget,
        priority=payload.priority
    )
    db.add(req)
    db.commit()
    db.refresh(req)
    
    # 2. Run optimization calculations
    rec_results = optimize_charter(db, req.id)
    if not rec_results:
        raise HTTPException(status_code=500, detail="Failed to run charter optimization engine.")
        
    # Write Audit Trail
    audit = AuditLog(
        username="Procurement Manager",
        role="Procurement Manager",
        action="Optimize",
        target=str(rec_results["recommendation_id"]),
        details=f"Triggered optimization for {req.quantity:,.0f} MT of {req.commodity} from {req.origin} to {req.destination}."
    )
    db.add(audit)
    db.commit()
    
    return rec_results

# 8. OVERRIDE RECOMMENDATION
@router.post("/optimizer/recommend/{rec_id}/override")
def override_recommendation(rec_id: int, payload: OverrideIn, db: Session = Depends(get_db)):
    rec = db.query(Recommendation).filter(Recommendation.id == rec_id).first()
    if not rec:
        raise HTTPException(status_code=404, detail="Recommendation not found")
        
    # Verify vessel exists
    vessel = db.query(Vessel).filter(Vessel.id == payload.vessel_id).first()
    if not vessel:
        raise HTTPException(status_code=404, detail="Selected override vessel does not exist")
        
    # Apply Override
    rec.is_overridden = 1
    rec.override_vessel_id = payload.vessel_id
    rec.override_reason = payload.reason
    rec.override_by = payload.username
    db.commit()
    
    # Write Audit Log
    audit = AuditLog(
        username=payload.username,
        role="Procurement Manager",
        action="Override",
        target=str(rec_id),
        details=f"Overrode recommended vessel to '{vessel.vessel_name}'. Reason: '{payload.reason}'"
    )
    db.add(audit)
    db.commit()
    
    return {"status": "Success", "message": f"Recommendation overridden to vessel {vessel.vessel_name}."}

# 9. SCENARIO ANALYSIS SIMULATION
@router.post("/scenarios/simulate")
def simulate_custom_scenario(payload: ScenarioIn, db: Session = Depends(get_db)):
    res = simulate_scenario(
        db=db,
        request_id=payload.request_id,
        rate_multiplier=payload.rate_multiplier,
        fuel_price=payload.fuel_price,
        fx_rate=payload.fx_rate,
        congestion_multiplier=payload.congestion_multiplier,
        idle_hours_override=payload.idle_hours_override,
        disruption_severity=payload.disruption_severity
    )
    if not res:
        raise HTTPException(status_code=404, detail="Cargo request context not found")
        
    # Write Audit Log
    audit = AuditLog(
        username="Procurement Manager",
        role="Procurement Manager",
        action="Scenario",
        target=str(payload.request_id),
        details=f"Simulated custom scenario (fuel: ${payload.fuel_price}/T, congestion mult: {payload.congestion_multiplier}x)."
    )
    db.add(audit)
    db.commit()
    
    return res

# 10. RECOMMENDATIONS LIST
@router.get("/recommendations", response_model=List[RecommendationOut])
def get_recommendations_list(db: Session = Depends(get_db)):
    return db.query(Recommendation).order_by(Recommendation.created_at.desc()).all()

# 11. AUDIT TRAIL
@router.get("/audit", response_model=List[AuditLogOut])
def get_audit_trail(db: Session = Depends(get_db)):
    return db.query(AuditLog).order_by(AuditLog.timestamp.desc()).all()

# 12. ALERTS LIST
@router.get("/alerts", response_model=List[AlertItem])
def get_alerts(db: Session = Depends(get_db)):
    # Dynamically query indicators to build realistic, non-hardcoded alerts
    alerts = []
    
    # 1. Congestion Check
    congested_ports = db.query(Port).filter(Port.congestion_score > 50.0).all()
    for cp in congested_ports:
        alerts.append(AlertItem(
            id=f"alert-cong-{cp.id}",
            title="HIGH CONGESTION",
            type="warning",
            message=f"{cp.name} congestion has increased to {cp.congestion_score:.0f}%. Expect cargo delays.",
            timestamp="Just Now"
        ))
        
    # 2. Disruptions Check
    disruptions = db.query(Disruption).all()
    for d in disruptions:
        alerts.append(AlertItem(
            id=f"alert-disr-{d.id}",
            title=f"{d.type.upper()} ALERT",
            type="critical" if d.severity in ["High", "Critical"] else "info",
            message=f"{d.port} disruption: {d.description} (Severity: {d.severity})",
            timestamp="Active"
        ))
        
    # 3. Forecast Trend Check (Check Newcastle to Visakhapatnam Panamax trend)
    fore = get_forecast(db, "Newcastle", "Visakhapatnam", "Panamax", "Coking Coal")
    fore_list = fore.get("forecast", [])
    if len(fore_list) >= 4:
        recent_rate_rec = db.query(FreightRate).filter(
            FreightRate.origin_port == "Newcastle",
            FreightRate.destination_port == "Visakhapatnam",
            FreightRate.vessel_type == "Panamax"
        ).order_by(FreightRate.date.desc()).first()
        
        current = recent_rate_rec.freight_rate if recent_rate_rec else 32.0
        fore_30d = fore_list[3]["predicted_rate"]
        change = ((fore_30d - current) / current) * 100.0
        if abs(change) >= 5.0:
            alerts.append(AlertItem(
                id="alert-trend-1",
                title="FREIGHT RATE ALERT",
                type="warning" if change > 0 else "info",
                message=f"30-day forecast for Newcastle to Visakhapatnam indicates a {abs(change):.1f}% {'increase' if change > 0 else 'decrease'} (from ${current:.1f}/MT to ${fore_30d:.1f}/MT).",
                timestamp="System Alert"
            ))
            
    # Default alert if list empty
    if not alerts:
        alerts.append(AlertItem(
            id="alert-info-1",
            title="SYSTEM STATUS",
            type="info",
            message="All systems operational. No active route constraints detected.",
            timestamp="10m ago"
        ))
        
    return alerts

# 13. DASHBOARD SUMMARY
@router.get("/dashboard/summary", response_model=DashboardSummary)
def get_dashboard_summary(db: Session = Depends(get_db)):
    # Query rates for Newcastle to Visakhapatnam as our index benchmark
    recent_rate_rec = db.query(FreightRate).filter(
        FreightRate.origin_port == "Newcastle",
        FreightRate.destination_port == "Visakhapatnam",
        FreightRate.vessel_type == "Panamax"
    ).order_by(FreightRate.date.desc()).first()
    
    current_index = recent_rate_rec.freight_rate if recent_rate_rec else 32.0
    
    fore = get_forecast(db, "Newcastle", "Visakhapatnam", "Panamax", "Coking Coal")
    fore_list = fore.get("forecast", [])
    forecast_30d = current_index
    if len(fore_list) >= 4:
        forecast_30d = fore_list[3]["predicted_rate"]
    elif len(fore_list) > 0:
        forecast_30d = fore_list[-1]["predicted_rate"]
        
    change_pct = ((forecast_30d - current_index) / current_index) * 100.0
    
    ports = db.query(Port).all()
    avg_congestion = sum([p.congestion_score for p in ports]) / len(ports) if ports else 0.0
    
    # Risk Score calculation
    disruptions = db.query(Disruption).all()
    high_disr_count = sum([1 for d in disruptions if d.severity in ["High", "Critical"]])
    risk_score = 30.0 + (high_disr_count * 15.0) + (avg_congestion * 0.4)
    risk_score = max(10.0, min(95.0, risk_score))
    
    risk_label = "LOW"
    if risk_score > 65.0:
        risk_label = "HIGH"
    elif risk_score > 40.0:
        risk_label = "MEDIUM"
        
    # Get Alerts
    alerts = get_alerts(db)
    
    return DashboardSummary(
        last_updated=datetime.datetime.now().strftime("%d %b %Y, %H:%M IST") + " (DEMO)",
        current_freight_index=round(current_index, 2),
        forecasted_30d_index=round(forecast_30d, 2),
        index_change_pct=round(change_pct, 1),
        market_risk_label=risk_label,
        market_risk_score=round(risk_score, 1),
        average_port_congestion=round(avg_congestion, 1),
        alerts=alerts
    )

# 14. RESET / LOAD DEMO SCENARIO
@router.post("/demo/reset")
def trigger_demo_reset(payload: dict, db: Session = Depends(get_db)):
    scenario = payload.get("scenario", "normal")
    reset_demo_data(db, scenario)
    return {"status": "Success", "message": f"Demo environment reseeded successfully for scenario '{scenario}'."}

# 15. RAG QUERY ENDPOINT
@router.post("/rag/query", response_model=RAGQueryResponse)
def handle_rag_query(payload: RAGQueryIn, db: Session = Depends(get_db)):
    if not payload.question or not payload.question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty.")
    
    res = execute_rag_query(db, payload.question, payload.recommendation_id)
    return res

# 16. MONTE CARLO RISK SIMULATION
@router.post("/scenarios/monte-carlo")
def handle_monte_carlo_simulation(payload: MonteCarloIn, db: Session = Depends(get_db)):
    res = run_monte_carlo_simulation(
        db=db,
        request_id=payload.request_id,
        n_simulations=payload.n_simulations if payload.n_simulations else 1000,
        freight_volatility_pct=payload.freight_volatility_pct if payload.freight_volatility_pct else 10.0,
        fuel_volatility_pct=payload.fuel_volatility_pct if payload.fuel_volatility_pct else 12.0,
        fx_volatility_pct=payload.fx_volatility_pct if payload.fx_volatility_pct else 5.0,
        congestion_std_hours=payload.congestion_std_hours if payload.congestion_std_hours else 12.0
    )
    if not res:
        raise HTTPException(status_code=404, detail="Cargo request context not found")
    return res

# 17. DECISION REPLAY & FRESHNESS
@router.get("/optimizer/recommendations/{rec_id}/replay")
def replay_decision(rec_id: int, db: Session = Depends(get_db)):
    res = evaluate_recommendation_freshness(db, rec_id)
    if not res:
        raise HTTPException(status_code=404, detail="Recommendation decision snapshot not found")
    return res

@router.get("/optimizer/recommendations/{rec_id}/freshness")
def check_freshness(rec_id: int, db: Session = Depends(get_db)):
    res = evaluate_recommendation_freshness(db, rec_id)
    if not res:
        raise HTTPException(status_code=404, detail="Recommendation not found")
    return {
        "recommendation_id": rec_id,
        "freshness_status": res["freshness_status"],
        "diff_summary": res["diff_summary"],
        "historical_inputs": res["historical_inputs"],
        "live_inputs": res["live_inputs"]
    }

# 18. PREDICTION VS ACTUAL (ACTUAL VOYAGE OUTCOMES)
@router.post("/actuals", response_model=ActualVoyageOut)
def record_actual_voyage(payload: ActualVoyageIn, db: Session = Depends(get_db)):
    rate_err = ((payload.actual_freight_rate - payload.predicted_freight_rate) / max(0.1, payload.predicted_freight_rate)) * 100.0
    cost_err = ((payload.actual_total_cost - payload.predicted_total_cost) / max(1.0, payload.predicted_total_cost)) * 100.0
    time_err = payload.actual_transit_days - payload.predicted_transit_days

    actual_rec = ActualVoyageData(
        recommendation_id=payload.recommendation_id,
        origin_port=payload.origin_port,
        destination_port=payload.destination_port,
        vessel_name=payload.vessel_name,
        commodity=payload.commodity,
        quantity_mt=payload.quantity_mt,
        predicted_freight_rate=payload.predicted_freight_rate,
        predicted_total_cost=payload.predicted_total_cost,
        predicted_transit_days=payload.predicted_transit_days,
        predicted_idle_hours=payload.predicted_idle_hours,
        actual_freight_rate=payload.actual_freight_rate,
        actual_total_cost=payload.actual_total_cost,
        actual_transit_days=payload.actual_transit_days,
        actual_idle_hours=payload.actual_idle_hours,
        actual_arrival_date=payload.actual_arrival_date,
        rate_error_pct=round(rate_err, 2),
        cost_error_pct=round(cost_err, 2),
        time_error_days=round(time_err, 1),
        notes=payload.notes
    )
    db.add(actual_rec)
    db.commit()
    db.refresh(actual_rec)
    return actual_rec

@router.get("/actuals", response_model=List[ActualVoyageOut])
def get_actual_voyages(db: Session = Depends(get_db)):
    return db.query(ActualVoyageData).order_by(ActualVoyageData.created_at.desc()).all()

@router.get("/actuals/metrics")
def get_actuals_evaluation_metrics(db: Session = Depends(get_db)):
    actuals = db.query(ActualVoyageData).all()
    if not actuals:
        return {
            "total_records": 0,
            "mae_freight_rate": 0.0,
            "rmse_freight_rate": 0.0,
            "mape_freight_rate": 0.0,
            "mape_total_cost": 0.0,
            "mean_time_error_days": 0.0
        }

    import numpy as np
    rate_errs = [abs(a.actual_freight_rate - a.predicted_freight_rate) for a in actuals]
    rate_pcts = [abs(a.rate_error_pct) for a in actuals]
    cost_pcts = [abs(a.cost_error_pct) for a in actuals]
    time_errs = [a.time_error_days for a in actuals]

    return {
        "total_records": len(actuals),
        "mae_freight_rate": round(float(np.mean(rate_errs)), 2),
        "rmse_freight_rate": round(float(np.sqrt(np.mean([e**2 for e in rate_errs]))), 2),
        "mape_freight_rate": round(float(np.mean(rate_pcts)), 2),
        "mape_total_cost": round(float(np.mean(cost_pcts)), 2),
        "mean_time_error_days": round(float(np.mean(time_errs)), 1)
    }

