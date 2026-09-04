import json
from datetime import date
from sqlalchemy.orm import Session
from backend.app.models.recommendation import Recommendation
from backend.app.models.cargo_request import CargoRequest
from backend.app.models.freight_rate import FreightRate
from backend.app.models.port import Port
from backend.app.services.forecasting import get_disruption_impact

def evaluate_recommendation_freshness(db: Session, rec_id: int):
    """
    Evaluates recommendation freshness against current live market and port conditions.
    Never alters historical business recommendation; returns freshness status tag and input diff.
    """
    rec = db.query(Recommendation).filter(Recommendation.id == rec_id).first()
    if not rec:
        return None

    cargo = db.query(CargoRequest).filter(CargoRequest.id == rec.cargo_request_id).first()
    if not cargo:
        return None

    snap_dict = {}
    if rec.snapshot_json:
        try:
            snap_dict = json.loads(rec.snapshot_json)
        except Exception:
            pass

    # Current Live Inputs
    recent_rate_rec = db.query(FreightRate).filter(
        FreightRate.origin_port == cargo.origin,
        FreightRate.destination_port == cargo.destination
    ).order_by(FreightRate.date.desc()).first()
    live_rate = recent_rate_rec.freight_rate if recent_rate_rec else 30.0

    dest_port = db.query(Port).filter(Port.name == cargo.destination).first()
    live_congestion = dest_port.congestion_score if dest_port else 35.0
    live_disruption_score = get_disruption_impact(db, cargo.destination, date.today())

    # Snapshot Inputs
    market_snap = snap_dict.get("market_snapshot", {})
    snap_rate = market_snap.get("current_rate", rec.estimated_cost / max(1.0, cargo.quantity))
    snap_congestion = market_snap.get("port_congestion", live_congestion)
    snap_disruption = market_snap.get("disruption_score", 0.0)

    # Diff calculation
    rate_diff_pct = abs(live_rate - snap_rate) / max(0.1, snap_rate) * 100.0
    congestion_diff = abs(live_congestion - snap_congestion)

    diff_summary = []
    if rate_diff_pct > 0.5:
        direction = "increased" if live_rate > snap_rate else "decreased"
        diff_summary.append(f"Spot freight rate {direction} by {rate_diff_pct:.1f}% (from ${snap_rate:.2f}/MT to ${live_rate:.2f}/MT).")

    if congestion_diff > 1.0:
        c_direction = "increased" if live_congestion > snap_congestion else "decreased"
        diff_summary.append(f"Port congestion at {cargo.destination} {c_direction} by {congestion_diff:.1f}% (from {snap_congestion}% to {live_congestion}%).")

    if live_disruption_score != snap_disruption:
        diff_summary.append(f"Port disruption severity changed (score shifted from {snap_disruption} to {live_disruption_score}).")

    if not diff_summary:
        diff_summary.append("All market and port inputs remain identical to recommendation time.")

    # Freshness Classification
    if rate_diff_pct > 7.0 or congestion_diff > 15.0 or live_disruption_score > 10.0:
        freshness_status = "REQUIRES REVIEW"
    elif rate_diff_pct > 2.0 or congestion_diff > 5.0:
        freshness_status = "STALE"
    else:
        freshness_status = "CURRENT"

    # Persist updated status
    rec.freshness_status = freshness_status
    db.commit()

    return {
        "recommendation_id": rec.id,
        "cargo_request_id": cargo.id,
        "freshness_status": freshness_status,
        "diff_summary": diff_summary,
        "snapshot_created_at": rec.created_at.isoformat() if rec.created_at else None,
        "historical_inputs": {
            "freight_rate": snap_rate,
            "port_congestion": snap_congestion,
            "disruption_score": snap_disruption
        },
        "live_inputs": {
            "freight_rate": live_rate,
            "port_congestion": live_congestion,
            "disruption_score": live_disruption_score
        },
        "full_snapshot": snap_dict
    }
