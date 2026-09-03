from sqlalchemy import Column, Integer, String, Float, DateTime
from datetime import datetime
from backend.app.database.base import Base

class Port(Base):
    __tablename__ = "ports"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
    country = Column(String, nullable=False)
    coast = Column(String, nullable=False)  # East Coast, West Coast, Overseas
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    max_loa = Column(Float, nullable=False)  # in meters
    max_beam = Column(Float, nullable=False)  # in meters
    max_draft = Column(Float, nullable=False)  # in meters
    berth_capacity = Column(Integer, nullable=False)  # number of berths
    cargo_handling_capacity = Column(Float, nullable=False)  # Metric tons/day
    congestion_score = Column(Float, default=0.0)  # 0 to 100
    status = Column(String, default="Active")  # Active, Closed, Maintenance
    last_updated = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    data_source = Column(String, default="Port Authority / NLP Marine")
    data_status = Column(String, default="LIVE")
