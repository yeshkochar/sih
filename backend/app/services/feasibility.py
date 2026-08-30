from backend.app.models.vessel import Vessel
from backend.app.models.port import Port

def check_feasibility(vessel: Vessel, port: Port, cargo_qty: float) -> dict:
    """
    Evaluates physical and operational constraints for a vessel at a destination port.
    Returns:
        dict: {
            "feasible": bool,
            "reasons": list[str],
            "details": {
                "draft": {"vessel": float, "port": float, "feasible": bool, "diff": float},
                "loa": {"vessel": float, "port": float, "feasible": bool, "diff": float},
                "beam": {"vessel": float, "port": float, "feasible": bool, "diff": float},
                "capacity": {"vessel": float, "required": float, "feasible": bool, "diff": float},
                "port_status": {"status": str, "feasible": bool}
            }
        }
    """
    reasons = []
    details = {}
    
    # 1. Draft Constraint
    draft_feasible = vessel.draft <= port.max_draft
    draft_diff = round(vessel.draft - port.max_draft, 2)
    details["draft"] = {
        "vessel": vessel.draft,
        "port": port.max_draft,
        "feasible": draft_feasible,
        "diff": draft_diff if draft_diff > 0 else 0.0
    }
    if not draft_feasible:
        reasons.append(f"Vessel draft ({vessel.draft}m) exceeds port limit ({port.max_draft}m) by +{draft_diff}m.")
        
    # 2. LOA Constraint
    loa_feasible = vessel.loa <= port.max_loa
    loa_diff = round(vessel.loa - port.max_loa, 2)
    details["loa"] = {
        "vessel": vessel.loa,
        "port": port.max_loa,
        "feasible": loa_feasible,
        "diff": loa_diff if loa_diff > 0 else 0.0
    }
    if not loa_feasible:
        reasons.append(f"Vessel length (LOA={vessel.loa}m) exceeds berth length limit ({port.max_loa}m) by +{loa_diff}m.")
        
    # 3. Beam Constraint
    beam_feasible = vessel.beam <= port.max_beam
    beam_diff = round(vessel.beam - port.max_beam, 2)
    details["beam"] = {
        "vessel": vessel.beam,
        "port": port.max_beam,
        "feasible": beam_feasible,
        "diff": beam_diff if beam_diff > 0 else 0.0
    }
    if not beam_feasible:
        reasons.append(f"Vessel beam ({vessel.beam}m) exceeds channel/berth limit ({port.max_beam}m) by +{beam_diff}m.")
        
    # 4. Cargo Capacity Constraint (vessel must be able to carry the requested cargo in a single voyage)
    # Give it a 5% margin for tolerance or check strictly
    capacity_feasible = vessel.cargo_capacity >= cargo_qty
    capacity_diff = round(cargo_qty - vessel.cargo_capacity, 2)
    details["capacity"] = {
        "vessel": vessel.cargo_capacity,
        "required": cargo_qty,
        "feasible": capacity_feasible,
        "diff": capacity_diff if capacity_diff > 0 else 0.0
    }
    if not capacity_feasible:
        reasons.append(f"Cargo quantity ({cargo_qty:,.0f} MT) exceeds vessel capacity ({vessel.cargo_capacity:,.0f} MT) by +{capacity_diff:,.0f} MT.")
        
    # 5. Port Operational Status
    port_active = port.status == "Active"
    details["port_status"] = {
        "status": port.status,
        "feasible": port_active
    }
    if not port_active:
        reasons.append(f"Destination port status is currently non-operational: '{port.status}'.")
        
    feasible = all([draft_feasible, loa_feasible, beam_feasible, capacity_feasible, port_active])
    
    return {
        "feasible": feasible,
        "reasons": reasons,
        "details": details
    }
