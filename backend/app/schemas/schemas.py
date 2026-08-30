from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime, date

# 1. Port Schemas
class PortBase(BaseModel):
    name: str
    country: str
    coast: str
    latitude: float
    longitude: float
    max_loa: float
    max_beam: float
    max_draft: float
    berth_capacity: int
    cargo_handling_capacity: float
    congestion_score: float
    status: str

class PortOut(PortBase):
    id: int
    last_updated: datetime

    class Config:
        from_attributes = True

# 2. Vessel Schemas
class VesselBase(BaseModel):
    vessel_name: str
    vessel_type: str
    deadweight_tonnage: float
    loa: float
    beam: float
    draft: float
    cargo_capacity: float
    speed: float
    fuel_consumption: float
    availability_status: str
    current_port: Optional[str] = None

class VesselOut(VesselBase):
    id: int

    class Config:
        from_attributes = True

# 3. Freight Rate Schemas
class FreightRateOut(BaseModel):
    id: int
    date: date
    origin_port: str
    destination_port: str
    vessel_type: str
    commodity: str
    freight_rate: float
    currency: str
    fuel_index: float
    fx_rate: float
    congestion_index: float
    demand_index: float

    class Config:
        from_attributes = True

# 4. Cargo Request Schemas
class CargoRequestIn(BaseModel):
    commodity: str
    quantity: float
    origin: str
    destination: str
    required_by_date: date
    preferred_vessel_type: Optional[str] = None
    max_budget: Optional[float] = None
    priority: Optional[str] = "Medium"

class CargoRequestOut(CargoRequestIn):
    id: int

    class Config:
        from_attributes = True

# 5. Forecast Schemas
class ForecastIn(BaseModel):
    origin: str
    destination: str
    vessel_type: str
    commodity: str

class ForecastPoint(BaseModel):
    date: date
    predicted_rate: float
    lower_bound: float
    upper_bound: float
    horizon_days: int

class ForecastResponse(BaseModel):
    forecast: List[ForecastPoint]
    metrics: dict
    best_model: str
    confidence_score: float

# 6. Recommendation & Override Schemas
class RecommendationOut(BaseModel):
    id: int
    cargo_request_id: int
    vessel_id: Optional[int]
    charter_window_start: date
    charter_window_end: date
    recommendation_score: float
    estimated_cost: float
    risk_score: float
    idle_cost: float
    feasibility_status: str
    explanation: str
    created_at: datetime
    is_overridden: int
    override_vessel_id: Optional[int]
    override_reason: Optional[str]
    override_by: Optional[str]

    class Config:
        from_attributes = True

class OverrideIn(BaseModel):
    vessel_id: int
    reason: str
    username: str

# 7. Disruption Schemas
class DisruptionOut(BaseModel):
    id: int
    port: str
    type: str
    severity: str
    start_date: date
    expected_duration: int
    description: str

    class Config:
        from_attributes = True

# 8. Audit Log Schemas
class AuditLogOut(BaseModel):
    id: int
    timestamp: datetime
    username: str
    role: str
    action: str
    target: Optional[str]
    details: str

    class Config:
        from_attributes = True

# 9. Scenario Schemas
class ScenarioIn(BaseModel):
    request_id: int
    rate_multiplier: Optional[float] = 1.0
    fuel_price: Optional[float] = 600.0
    fx_rate: Optional[float] = 83.0
    congestion_multiplier: Optional[float] = 1.0
    idle_hours_override: Optional[float] = None
    disruption_severity: Optional[str] = "Low"

# 10. Dashboard Schemas
class AlertItem(BaseModel):
    id: str
    title: str
    type: str  # info, warning, critical
    message: str
    timestamp: str

class DashboardSummary(BaseModel):
    last_updated: str
    current_freight_index: float
    forecasted_30d_index: float
    index_change_pct: float
    market_risk_label: str
    market_risk_score: float
    average_port_congestion: float
    alerts: List[AlertItem]
