from sqlalchemy import Column, Integer, String, Float, Date
from backend.app.database.base import Base

class CargoRequest(Base):
    __tablename__ = "cargo_requests"

    id = Column(Integer, primary_key=True, index=True)
    commodity = Column(String, nullable=False)
    quantity = Column(Float, nullable=False)  # in MT
    origin = Column(String, nullable=False)
    destination = Column(String, nullable=False)
    required_by_date = Column(Date, nullable=False)
    preferred_vessel_type = Column(String, nullable=True)
    max_budget = Column(Float, nullable=True)  # max rate in USD/MT
    priority = Column(String, default="Medium")  # Low, Medium, High
