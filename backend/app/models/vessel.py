from sqlalchemy import Column, Integer, String, Float
from backend.app.database.base import Base

class Vessel(Base):
    __tablename__ = "vessels"

    id = Column(Integer, primary_key=True, index=True)
    vessel_name = Column(String, unique=True, index=True, nullable=False)
    vessel_type = Column(String, nullable=False)  # Handysize, Supramax, Panamax, etc.
    deadweight_tonnage = Column(Float, nullable=False)  # DWT in metric tons
    loa = Column(Float, nullable=False)  # Length Overall in meters
    beam = Column(Float, nullable=False)  # Beam in meters
    draft = Column(Float, nullable=False)  # Draft in meters
    cargo_capacity = Column(Float, nullable=False)  # Max cargo capacity in MT
    speed = Column(Float, nullable=False)  # Average speed in knots
    fuel_consumption = Column(Float, nullable=False)  # Fuel consumption in tons per day at sea
    availability_status = Column(String, default="Available")  # Available, Chartered, Maintenance
    current_port = Column(String, nullable=True)
