import math
from datetime import datetime, date, timedelta
from sqlalchemy.orm import Session
from backend.app.models.port import Port
from backend.app.models.vessel import Vessel
from backend.app.models.freight_rate import FreightRate
from backend.app.models.cargo_request import CargoRequest
from backend.app.services.feasibility import check_feasibility
from backend.app.services.forecasting import get_forecast, get_disruption_impact

# Default Configurable Weights
DEFAULT_WEIGHTS = {
    "cost": 0.30,
    "compatibility": 0.20,
    "schedule_fit": 0.15,
    "risk": 0.15,
    "fuel_efficiency": 0.10,
    "idle_time": 0.10
}

def haversine_distance(lat1, lon1, lat2, lon2):
    """Calculates geodesic distance between two coordinates in nautical miles."""
    R = 6371.0 # Earth radius in km
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2)**2
    c = 2 * math.asin(math.sqrt(a))
    distance_km = R * c
    return distance_km * 0.539957 # Convert km to nautical miles

def calculate_voyage_metrics(vessel: Vessel, origin_port: Port, dest_port: Port, cargo_qty: float, current_rate: float, idle_hours: float):
    """
    Calculates transit days, fuel consumption, idle cost, and total voyage cost.
    """
    distance_nm = haversine_distance(origin_port.latitude, origin_port.longitude, dest_port.latitude, dest_port.longitude)
    
    # Transit time (days)
    transit_days = distance_nm / (vessel.speed * 24.0)
    
    # Fuel consumption (Bunker fuel price: demo base is 600 USD/ton)
    # Total fuel = transit_days * daily_sea_consumption + idle_days * daily_port_consumption (approx 3.0 tons/day in port)
    idle_days = idle_hours / 24.0
    fuel_price = 600.0  # Default base fuel cost
    total_fuel_tons = (transit_days * vessel.fuel_consumption) + (idle_days * 3.0)
    fuel_cost = total_fuel_tons * fuel_price
    
    # Port idle cost (vessel operating cost is approx $15,000/day for Panamax/Supramax)
    daily_vessel_op_cost = 15000.0
    idle_cost = idle_days * daily_vessel_op_cost
    
    # Freight rate cost
    freight_cost = cargo_qty * current_rate
    
    # Total Cost
    total_cost = freight_cost + fuel_cost + idle_cost
    
    return {
        "distance_nm": round(distance_nm, 1),
        "transit_days": round(transit_days, 1),
        "idle_days": round(idle_days, 2),
        "fuel_cost": round(fuel_cost, 2),
        "idle_cost": round(idle_cost, 2),
        "freight_cost": round(freight_cost, 2),
        "total_cost": round(total_cost, 2)
    }

def optimize_charter(db: Session, request_id: int, custom_weights: dict = None):
    """
    Evaluates all vessels against cargo request, sorts into feasible and infeasible,
    calculates ranked recommendation scores, and constructs the explainability payload.
    """
    weights = custom_weights if custom_weights else DEFAULT_WEIGHTS
    
    req = db.query(CargoRequest).filter(CargoRequest.id == request_id).first()
    if not req:
        return None
        
    origin_port = db.query(Port).filter(Port.name == req.origin).first()
    dest_port = db.query(Port).filter(Port.name == req.destination).first()
    
    if not origin_port or not dest_port:
        return None
        
    # Get active disruptions for destination
    disruption_score = get_disruption_impact(db, dest_port.name, date.today())
    
    # 1. Fetch Forecast Rates for Route
    # We will use the forecast for the cargo's preferred vessel type or Panamax as fallback
    vessel_type_for_forecast = req.preferred_vessel_type if req.preferred_vessel_type else "Panamax"
    forecast_results = get_forecast(db, req.origin, req.destination, vessel_type_for_forecast, req.commodity)
    
    # Get current rate and forecasted 30-day rate
    recent_rate_rec = db.query(FreightRate).filter(
        FreightRate.origin_port == req.origin,
        FreightRate.destination_port == req.destination,
        FreightRate.vessel_type == vessel_type_for_forecast
    ).order_by(FreightRate.date.desc()).first()
    
    current_rate = recent_rate_rec.freight_rate if recent_rate_rec else 30.0
    
    # Forecast values
    forecast_list = forecast_results.get("forecast", [])
    predicted_30d_rate = current_rate
    forecast_confidence = forecast_results.get("confidence_score", 80.0)
    best_model = forecast_results.get("best_model", "Baseline")
    
    if len(forecast_list) >= 4:
        # Week 4 is approx 30 days
        predicted_30d_rate = forecast_list[3]["predicted_rate"]
    elif len(forecast_list) > 0:
        predicted_30d_rate = forecast_list[-1]["predicted_rate"]
        
    # 2. Evaluate Idle Hours based on port congestion
    # Visakhapatnam base congestion is 35% -> ~12 hours idle
    # Paradip congestion is 55% -> ~36 hours idle
    # Let's map congestion directly to idle hours:
    idle_hours = max(2.0, (dest_port.congestion_score / 100.0) * 48.0)
    
    vessels = db.query(Vessel).all()
    
    feasible_vessels = []
    infeasible_vessels = []
    
    for v in vessels:
        feasibility = check_feasibility(v, dest_port, req.quantity)
        
        # Calculate voyage metrics
        metrics = calculate_voyage_metrics(v, origin_port, dest_port, req.quantity, current_rate, idle_hours)
        
        if not feasibility["feasible"]:
            infeasible_vessels.append({
                "vessel": v,
                "reasons": feasibility["reasons"],
                "details": feasibility["details"],
                "metrics": metrics
            })
        else:
            feasible_vessels.append({
                "vessel": v,
                "metrics": metrics,
                "draft_buffer": round(dest_port.max_draft - v.draft, 2),
                "loa_buffer": round(dest_port.max_loa - v.loa, 2)
            })
            
    # If no feasible vessels, exit early or return clean empty response
    if not feasible_vessels:
        return {
            "feasible_vessels": [],
            "infeasible_vessels": infeasible_vessels,
            "recommendation": None,
            "forecast_summary": {
                "current_rate": current_rate,
                "forecast_30d": predicted_30d_rate,
                "confidence": forecast_confidence,
                "model": best_model
            }
        }
        
    # 3. Score Feasible Vessels
    min_cost = min([fv["metrics"]["total_cost"] for fv in feasible_vessels])
    min_fuel_consumption = min([fv["vessel"].fuel_consumption for fv in feasible_vessels])
    
    scored_vessels = []
    
    # Calculate days left until cargo required_by_date
    days_to_deadline = (req.required_by_date - date.today()).days
    if days_to_deadline <= 0:
        days_to_deadline = 15 # fallback
        
    for fv in feasible_vessels:
        v = fv["vessel"]
        m = fv["metrics"]
        
        # A. Cost Score (0-100) - lower cost is better
        cost_score = (min_cost / m["total_cost"]) * 100.0
        
        # B. Compatibility Score (0-100)
        # Ratio of Cargo quantity to vessel cargo capacity (higher is better, meaning less wasted space)
        cargo_utilization = req.quantity / v.cargo_capacity
        utilization_score = 100.0 if cargo_utilization >= 0.90 else (cargo_utilization * 100.0)
        
        # Preferred Vessel type match bonus
        preferred_match = 100.0 if v.vessel_type == req.preferred_vessel_type else 60.0
        
        # Operational buffers
        draft_score = 100.0 if fv["draft_buffer"] >= 1.0 else (fv["draft_buffer"] / 1.0) * 100.0
        compat_score = 0.4 * utilization_score + 0.3 * preferred_match + 0.3 * draft_score
        
        # C. Schedule Fit Score (0-100)
        # Total travel time + idle waiting days + 2 days cargo loading/unloading
        total_time_needed = m["transit_days"] + m["idle_days"] + 2.0
        if total_time_needed <= days_to_deadline:
            schedule_score = 100.0
        else:
            delay_days = total_time_needed - days_to_deadline
            schedule_score = max(10.0, 100.0 - (delay_days * 15.0))
            
        # D. Risk Score Component (Optimization favors LOW risk)
        # Risk factors: port congestion, active disruptions, vessel age/speed stability, schedule pressure
        delay_risk = 30.0 if schedule_score < 80.0 else 0.0
        port_risk = dest_port.congestion_score * 0.5
        disruption_risk = disruption_score * 4.0
        
        vessel_risk = port_risk + disruption_risk + delay_risk
        vessel_risk = max(10.0, min(95.0, vessel_risk))
        risk_score_component = 100.0 - vessel_risk
        
        # E. Fuel Efficiency Score (0-100)
        fuel_score = (min_fuel_consumption / v.fuel_consumption) * 100.0
        
        # F. Idle Time Score (0-100)
        idle_time_score = max(10.0, 100.0 - (m["idle_days"] * 10.0))
        
        # Total Weighted Score
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
        
    # Sort feasible vessels by score descending
    scored_vessels = sorted(scored_vessels, key=lambda x: x["scores"]["total"], reverse=True)
    
    # 4. Determine Recommended Charter Window
    # Analyze the rate change trend over the next 30 days
    rate_change_pct = ((predicted_30d_rate - current_rate) / current_rate) * 100.0
    
    expected_savings = 0.0
    action = "BUY NOW"
    window_start = date.today()
    window_end = date.today() + timedelta(days=5)
    window_explanation = ""
    
    # If freight forecast is dropping and confidence is decent, suggest waiting
    if rate_change_pct <= -3.0 and forecast_confidence >= 70.0:
        action = "WAIT 8-12 DAYS"
        window_start = date.today() + timedelta(days=8)
        window_end = date.today() + timedelta(days=12)
        expected_savings = (current_rate - predicted_30d_rate) * req.quantity
        window_explanation = f"Freight rates on this route are expected to drop by {-rate_change_pct:.1f}% over the next 30 days. Waiting to book could save up to ${expected_savings:,.2f} USD."
    # If rates are spiking, lock now
    elif rate_change_pct >= 3.0:
        action = "BUY NOW / SECURE IMMEDIATE"
        window_explanation = f"Freight rates are on an upward trend (+{rate_change_pct:.1f}% expected in 30 days). Lock rates immediately to prevent budget overrun."
    else:
        action = "BUY NOW (STABLE MARKET)"
        window_explanation = f"Market is highly stable (forecast change is {rate_change_pct:.1f}%). Book within standard window to ensure vessel availability."
        
    # 5. Spot vs Multi-Voyage contract recommendation
    contract_type = "SPOT"
    contract_explanation = ""
    # If demand is high, route has high volatility, and we have multiple voyages (handled conceptually here)
    if abs(rate_change_pct) > 8.0 and forecast_confidence > 75.0:
        contract_type = "MULTI-VOYAGE (COA)"
        contract_explanation = "High forecasted market volatility indicates securing a Multi-Voyage Contract (Contract of Affreightment) is optimal to hedge rate spikes."
    else:
        contract_type = "SPOT CHARTER"
        contract_explanation = "Low volatility and downward or stable rate trends make Spot Chartering the most cost-effective and flexible option."
        
    # 6. Construct Recommendation Explainability & AI Drivers
    top_vessel_data = scored_vessels[0]
    best_v = top_vessel_data["vessel"]
    
    explanation_drivers = [
        f"Freight forecast for the route indicates a rate of ${predicted_30d_rate:.2f}/MT, which is {abs(rate_change_pct):.1f}% {'below' if rate_change_pct < 0 else 'above'} current market.",
        f"Vessel {best_v.vessel_name} satisfies port draft limits with a buffer of {top_vessel_data['draft_buffer']}m.",
        f"Cargo utilization is at {req.quantity/best_v.cargo_capacity*100:.1f}%, minimizing ballast/space penalty.",
        f"Expected port waiting/idle time is {top_vessel_data['metrics']['idle_days']*24.0:.1f} hours, which incurs an estimated idle cost of ${top_vessel_data['metrics']['idle_cost']:,.2f}.",
        f"Route risk score is {top_vessel_data['risk_score']}/100, driven mainly by destination port congestion."
    ]
    
    # Save recommendation to database for persistence
    db_rec = Recommendation(
        cargo_request_id=req.id,
        vessel_id=best_v.id,
        charter_window_start=window_start,
        charter_window_end=window_end,
        recommendation_score=top_vessel_data["scores"]["total"],
        estimated_cost=top_vessel_data["metrics"]["total_cost"],
        risk_score=top_vessel_data["risk_score"],
        idle_cost=top_vessel_data["metrics"]["idle_cost"],
        feasibility_status="Feasible",
        explanation=" || ".join(explanation_drivers)
    )
    db.add(db_rec)
    db.commit()
    db.refresh(db_rec)
    
    return {
        "recommendation_id": db_rec.id,
        "cargo_request": req,
        "ranked_vessels": scored_vessels,
        "infeasible_vessels": infeasible_vessels,
        "recommended_vessel": top_vessel_data,
        "charter_window": {
            "action": action,
            "start_date": window_start,
            "end_date": window_end,
            "expected_savings": round(expected_savings, 2),
            "explanation": window_explanation
        },
        "spot_vs_multivoyage": {
            "recommendation": contract_type,
            "explanation": contract_explanation
        },
        "forecast_summary": {
            "current_rate": current_rate,
            "forecast_30d": predicted_30d_rate,
            "confidence": forecast_confidence,
            "model": best_model
        },
        "explainability_drivers": explanation_drivers
    }
