from datetime import datetime, date, timedelta
from sqlalchemy.orm import Session
from backend.app.models.port import Port
from backend.app.models.vessel import Vessel
from backend.app.models.cargo_request import CargoRequest
from backend.app.services.feasibility import check_feasibility
from backend.app.services.optimization import haversine_distance, DEFAULT_WEIGHTS

def simulate_scenario(
    db: Session,
    request_id: int,
    rate_multiplier: float = 1.0,      # e.g., 1.2 (+20%)
    fuel_price: float = 600.0,         # Bunker fuel cost
    fx_rate: float = 83.0,
    congestion_multiplier: float = 1.0, # e.g., 1.5 (+50% congestion)
    idle_hours_override: float = None,  # Direct override
    disruption_severity: str = "Low",   # Low, Medium, High, Critical
    custom_weights: dict = None
):
    """
    Simulates cargo charter optimization with custom scenario overrides.
    Returns ranked vessel listings under simulated constraints.
    """
    weights = custom_weights if custom_weights else DEFAULT_WEIGHTS
    
    req = db.query(CargoRequest).filter(CargoRequest.id == request_id).first()
    if not req:
        return None
        
    origin_port = db.query(Port).filter(Port.name == req.origin).first()
    dest_port = db.query(Port).filter(Port.name == req.destination).first()
    
    if not origin_port or not dest_port:
        return None
        
    # Standard base rate for route
    # We query the rates to get base rates
    from backend.app.models.freight_rate import FreightRate
    recent_rate_rec = db.query(FreightRate).filter(
        FreightRate.origin_port == req.origin,
        FreightRate.destination_port == req.destination
    ).order_by(FreightRate.date.desc()).first()
    
    base_rate = recent_rate_rec.freight_rate if recent_rate_rec else 30.0
    simulated_rate = base_rate * rate_multiplier
    
    # Calculate simulated idle hours
    base_idle_hours = max(2.0, (dest_port.congestion_score / 100.0) * 48.0)
    simulated_idle_hours = base_idle_hours * congestion_multiplier
    if idle_hours_override is not None:
        simulated_idle_hours = idle_hours_override
        
    # Map disruption severity to score
    severity_map = {"Low": 2.0, "Medium": 5.0, "High": 10.0, "Critical": 20.0}
    simulated_disruption_score = severity_map.get(disruption_severity, 2.0)
    
    vessels = db.query(Vessel).all()
    
    feasible_vessels = []
    infeasible_vessels = []
    
    distance_nm = haversine_distance(origin_port.latitude, origin_port.longitude, dest_port.latitude, dest_port.longitude)
    days_to_deadline = (req.required_by_date - date.today()).days
    if days_to_deadline <= 0:
        days_to_deadline = 15
        
    for v in vessels:
        # Feasibility check uses unchanged physical port attributes
        # (unless port status is affected, which we assume is active)
        feasibility = check_feasibility(v, dest_port, req.quantity)
        
        # Calculate simulated voyage costs
        transit_days = distance_nm / (v.speed * 24.0)
        idle_days = simulated_idle_hours / 24.0
        total_fuel_tons = (transit_days * v.fuel_consumption) + (idle_days * 3.0)
        fuel_cost = total_fuel_tons * fuel_price
        
        daily_vessel_op_cost = 15000.0
        idle_cost = idle_days * daily_vessel_op_cost
        freight_cost = req.quantity * simulated_rate
        total_cost = freight_cost + fuel_cost + idle_cost
        
        metrics = {
            "distance_nm": round(distance_nm, 1),
            "transit_days": round(transit_days, 1),
            "idle_days": round(idle_days, 2),
            "fuel_cost": round(fuel_cost, 2),
            "idle_cost": round(idle_cost, 2),
            "freight_cost": round(freight_cost, 2),
            "total_cost": round(total_cost, 2)
        }
        
        if not feasibility["feasible"]:
            infeasible_vessels.append({
                "vessel": v,
                "reasons": feasibility["reasons"],
                "details": feasibility["details"],
                "metrics": metrics
            })
        else:
            # Score Feasible Vessel under Simulated values
            feasible_vessels.append({
                "vessel": v,
                "metrics": metrics,
                "draft_buffer": round(dest_port.max_draft - v.draft, 2),
                "loa_buffer": round(dest_port.max_loa - v.loa, 2)
            })
            
    if not feasible_vessels:
        return {
            "feasible_vessels": [],
            "infeasible_vessels": infeasible_vessels,
            "best_vessel": None
        }
        
    # Scored listings
    min_cost = min([fv["metrics"]["total_cost"] for fv in feasible_vessels])
    min_fuel_consumption = min([fv["vessel"].fuel_consumption for fv in feasible_vessels])
    
    scored_vessels = []
    for fv in feasible_vessels:
        v = fv["vessel"]
        m = fv["metrics"]
        
        cost_score = (min_cost / m["total_cost"]) * 100.0
        
        cargo_utilization = req.quantity / v.cargo_capacity
        utilization_score = 100.0 if cargo_utilization >= 0.90 else (cargo_utilization * 100.0)
        preferred_match = 100.0 if v.vessel_type == req.preferred_vessel_type else 60.0
        draft_score = 100.0 if fv["draft_buffer"] >= 1.0 else (fv["draft_buffer"] / 1.0) * 100.0
        compat_score = 0.4 * utilization_score + 0.3 * preferred_match + 0.3 * draft_score
        
        total_time_needed = m["transit_days"] + m["idle_days"] + 2.0
        schedule_score = 100.0 if total_time_needed <= days_to_deadline else max(10.0, 100.0 - ((total_time_needed - days_to_deadline) * 15.0))
        
        # Risk component (affected by simulated disruption and congestion)
        delay_risk = 30.0 if schedule_score < 80.0 else 0.0
        port_risk = (dest_port.congestion_score * congestion_multiplier) * 0.5
        disruption_risk = simulated_disruption_score * 4.0
        
        vessel_risk = port_risk + disruption_risk + delay_risk
        vessel_risk = max(10.0, min(95.0, vessel_risk))
        risk_score_component = 100.0 - vessel_risk
        
        fuel_score = (min_fuel_consumption / v.fuel_consumption) * 100.0
        idle_time_score = max(10.0, 100.0 - (m["idle_days"] * 10.0))
        
        total_score = (
            weights["cost"] * cost_score +
            weights["compatibility"] * compat_score +
            weights["schedule_fit"] * schedule_score +
            weights["risk"] * risk_score_component +
            weights["fuel_efficiency"] * fuel_score +
            weights["idle_time"] * idle_time_score
        )
        
        scored_vessels.append({
            "vessel": v,
            "metrics": m,
            "scores": {
                "total": round(total_score, 1),
                "cost": round(cost_score, 1),
                "compatibility": round(compat_score, 1),
                "schedule_fit": round(schedule_score, 1),
                "risk_component": round(risk_score_component, 1),
                "fuel_efficiency": round(fuel_score, 1),
                "idle_time": round(idle_time_score, 1)
            },
            "risk_score": round(vessel_risk, 1)
        })
        
    scored_vessels = sorted(scored_vessels, key=lambda x: x["scores"]["total"], reverse=True)
    
    return {
        "feasible_vessels": scored_vessels,
        "infeasible_vessels": infeasible_vessels,
        "best_vessel": scored_vessels[0] if scored_vessels else None
    }
