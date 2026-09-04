from sqlalchemy import Column, Integer, String, Float, Date, DateTime, ForeignKey
from datetime import datetime
from backend.app.database.base import Base

class ActualVoyageData(Base):
    __tablename__ = "actual_voyage_data"

    id = Column(Integer, primary_key=True, index=True)
    recommendation_id = Column(Integer, ForeignKey("recommendations.id"), nullable=True)
    origin_port = Column(String, nullable=False)
    destination_port = Column(String, nullable=False)
    vessel_name = Column(String, nullable=False)
    commodity = Column(String, nullable=False)
    quantity_mt = Column(Float, nullable=False)
    
    # Predicted targets (at recommendation time)
    predicted_freight_rate = Column(Float, nullable=False)
    predicted_total_cost = Column(Float, nullable=False)
    predicted_transit_days = Column(Float, nullable=False)
    predicted_idle_hours = Column(Float, nullable=False)

    # Actual outcome values recorded post-voyage
    actual_freight_rate = Column(Float, nullable=False)
    actual_total_cost = Column(Float, nullable=False)
    actual_transit_days = Column(Float, nullable=False)
    actual_idle_hours = Column(Float, nullable=False)
    actual_arrival_date = Column(Date, nullable=False)
    
    # Performance errors
    rate_error_pct = Column(Float, nullable=False)
    cost_error_pct = Column(Float, nullable=False)
    time_error_days = Column(Float, nullable=False)

    notes = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
