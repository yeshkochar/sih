from sqlalchemy import Column, Integer, String, Date
from backend.app.database.base import Base

class Disruption(Base):
    __tablename__ = "disruptions"

    id = Column(Integer, primary_key=True, index=True)
    port = Column(String, nullable=False, index=True)  # Port name
    type = Column(String, nullable=False)  # Weather, Strike, Geopolitical, Maintenance
    severity = Column(String, nullable=False)  # Low, Medium, High, Critical
    start_date = Column(Date, nullable=False)
    expected_duration = Column(Integer, nullable=False)  # In days
    description = Column(String, nullable=False)
