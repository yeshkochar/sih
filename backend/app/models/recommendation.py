from sqlalchemy import Column, Integer, String, Float, Date, DateTime, ForeignKey
from datetime import datetime
from backend.app.database.base import Base

class Recommendation(Base):
    __tablename__ = "recommendations"

    id = Column(Integer, primary_key=True, index=True)
    cargo_request_id = Column(Integer, ForeignKey("cargo_requests.id"), nullable=False)
    vessel_id = Column(Integer, ForeignKey("vessels.id"), nullable=True)  # Feasible vessel
    charter_window_start = Column(Date, nullable=False)
    charter_window_end = Column(Date, nullable=False)
    recommendation_score = Column(Float, nullable=False)
    estimated_cost = Column(Float, nullable=False)
    risk_score = Column(Float, nullable=False)
    idle_cost = Column(Float, nullable=False)
    feasibility_status = Column(String, default="Feasible")  # Feasible, Infeasible
    explanation = Column(String, nullable=False)  # JSON-formatted or long text explainability
    created_at = Column(DateTime, default=datetime.utcnow)

    # Human-in-the-loop overrides
    is_overridden = Column(Integer, default=0)  # 0 = False, 1 = True
    override_vessel_id = Column(Integer, ForeignKey("vessels.id"), nullable=True)
    override_reason = Column(String, nullable=True)
    override_by = Column(String, nullable=True)

    # Replay & Freshness metadata
    snapshot_json = Column(String, nullable=True)
    freshness_status = Column(String, default="CURRENT")

