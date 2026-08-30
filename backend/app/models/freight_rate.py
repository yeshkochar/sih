from sqlalchemy import Column, Integer, String, Float, Date
from backend.app.database.base import Base

class FreightRate(Base):
    __tablename__ = "freight_rates"

    id = Column(Integer, primary_key=True, index=True)
    date = Column(Date, nullable=False, index=True)
    origin_port = Column(String, nullable=False, index=True)
    destination_port = Column(String, nullable=False, index=True)
    vessel_type = Column(String, nullable=False, index=True)
    commodity = Column(String, nullable=False, index=True)
    freight_rate = Column(Float, nullable=False)  # rate in USD per Metric Ton
    currency = Column(String, default="USD")
    fuel_index = Column(Float, nullable=False)  # Bunker fuel price index
    fx_rate = Column(Float, nullable=False)  # FX exchange rate (e.g. USD/INR)
    congestion_index = Column(Float, nullable=False)  # Congestion score at destination
    demand_index = Column(Float, nullable=False)  # Global/regional commodity demand index
