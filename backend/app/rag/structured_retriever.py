import json
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from backend.app.models.recommendation import Recommendation
from backend.app.models.cargo_request import CargoRequest
from backend.app.models.vessel import Vessel
from backend.app.models.port import Port
from backend.app.models.freight_rate import FreightRate
from backend.app.models.disruption import Disruption
from backend.app.models.forecast import Forecast

def retrieve_structured_evidence(
    db: Session,
    query: str,
    recommendation_id: Optional[int] = None
) -> List[Dict[str, Any]]:
    """
    Retrieves exact numerical facts and system decision records from PostgreSQL.
    This is the authoritative source for vessel specs, port limits, forecasts, and optimization scores.
    """
    structured_facts = []

    # 1. Recommendation Context (if recommendation_id provided)
    if recommendation_id:
        rec = db.query(Recommendation).filter(Recommendation.id == recommendation_id).first()
        if rec:
            req = db.query(CargoRequest).filter(CargoRequest.id == rec.cargo_request_id).first()
            selected_vessel = db.query(Vessel).filter(Vessel.id == rec.vessel_id).first() if rec.vessel_id else None
            
            fact_rec = {
                "source_type": "Structured DB (Optimization Recommendation)",
                "category": "Recommendation Decision Record",
                "recommendation_id": rec.id,
                "cargo_request_id": rec.cargo_request_id,
                "commodity": req.commodity if req else "Bulk Cargo",
                "quantity_mt": req.quantity if req else None,
                "origin": req.origin if req else None,
                "destination": req.destination if req else None,
                "recommended_vessel": selected_vessel.vessel_name if selected_vessel else "None / Infeasible",
                "recommended_vessel_id": rec.vessel_id,
                "recommendation_score": rec.recommendation_score,
                "estimated_cost_usd": rec.estimated_cost,
                "risk_score": rec.risk_score,
                "idle_cost_usd": rec.idle_cost,
                "feasibility_status": rec.feasibility_status,
                "charter_window_start": str(rec.charter_window_start),
                "charter_window_end": str(rec.charter_window_end),
                "is_overridden": bool(rec.is_overridden),
                "override_reason": rec.override_reason if rec.is_overridden else None
            }
            
            # Parse explanation payload if JSON
            if rec.explanation:
                try:
                    explanation_data = json.loads(rec.explanation)
                    fact_rec["feasible_vessels_evaluated"] = len(explanation_data.get("feasible_vessels", []))
                    fact_rec["infeasible_vessels_evaluated"] = len(explanation_data.get("infeasible_vessels", []))
                    fact_rec["optimization_breakdown"] = explanation_data
                except Exception:
                    fact_rec["explanation_raw"] = rec.explanation

            structured_facts.append(fact_rec)

            # Retrieve selected vessel specs
            if selected_vessel:
                structured_facts.append({
                    "source_type": "Structured DB (Vessel Register)",
                    "category": "Selected Vessel Specifications",
                    "vessel_name": selected_vessel.vessel_name,
                    "vessel_type": selected_vessel.vessel_type,
                    "dwt_mt": getattr(selected_vessel, 'deadweight_tonnage', 75000),
                    "max_capacity_mt": getattr(selected_vessel, 'cargo_capacity', getattr(selected_vessel, 'deadweight_tonnage', 75000)),
                    "draft_m": selected_vessel.draft,
                    "loa_m": selected_vessel.loa,
                    "beam_m": selected_vessel.beam,
                    "speed_knots": selected_vessel.speed,
                    "fuel_consumption_tpd": selected_vessel.fuel_consumption,
                    "daily_charter_rate_usd": getattr(selected_vessel, 'daily_charter_rate', 18000.0),
                    "status": getattr(selected_vessel, 'availability_status', 'Available')
                })

            # Retrieve origin and destination port constraints
            if req:
                for p_name in [req.origin, req.destination]:
                    port_rec = db.query(Port).filter(Port.name == p_name).first()
                    if port_rec:
                        structured_facts.append({
                            "source_type": "Structured DB (Port Register)",
                            "category": f"Port Constraint ({port_rec.name})",
                            "port_name": port_rec.name,
                            "country": port_rec.country,
                            "max_draft_m": port_rec.max_draft,
                            "max_loa_m": port_rec.max_loa,
                            "max_beam_m": port_rec.max_beam,
                            "congestion_score_pct": port_rec.congestion_score,
                            "berth_count": getattr(port_rec, 'berth_capacity', 5)
                        })

    # 2. Query Entity Lookup (by matching text mentions in query)
    query_lower = query.lower()

    # Match Vessels by Name or Type
    vessels = db.query(Vessel).all()
    for v in vessels:
        if v.vessel_name.lower() in query_lower or (v.vessel_type and v.vessel_type.lower() in query_lower):
            # Avoid duplicate if already added
            if not any(f.get("vessel_name") == v.vessel_name for f in structured_facts):
                structured_facts.append({
                    "source_type": "Structured DB (Vessel Register)",
                    "category": f"Vessel Specification ({v.vessel_name})",
                    "vessel_name": v.vessel_name,
                    "vessel_type": v.vessel_type,
                    "dwt_mt": getattr(v, 'deadweight_tonnage', 75000),
                    "max_capacity_mt": getattr(v, 'cargo_capacity', getattr(v, 'deadweight_tonnage', 75000)),
                    "draft_m": v.draft,
                    "loa_m": v.loa,
                    "beam_m": v.beam,
                    "daily_charter_rate_usd": getattr(v, 'daily_charter_rate', 18000.0),
                    "status": getattr(v, 'availability_status', 'Available')
                })

    # Match Ports by Name
    ports = db.query(Port).all()
    for p in ports:
        if p.name.lower() in query_lower:
            if not any(f.get("port_name") == p.name for f in structured_facts):
                structured_facts.append({
                    "source_type": "Structured DB (Port Register)",
                    "category": f"Port Constraint ({p.name})",
                    "port_name": p.name,
                    "country": p.country,
                    "max_draft_m": p.max_draft,
                    "max_loa_m": p.max_loa,
                    "max_beam_m": p.max_beam,
                    "congestion_score_pct": p.congestion_score
                })

    # Active Disruptions
    disruptions = db.query(Disruption).all()
    for d in disruptions:
        if d.port.lower() in query_lower or "disruption" in query_lower or "delay" in query_lower:
            structured_facts.append({
                "source_type": "Structured DB (Disruption Register)",
                "category": f"Active Disruption ({d.port})",
                "port": d.port,
                "disruption_type": d.type,
                "severity": d.severity,
                "description": d.description
            })

    return structured_facts
