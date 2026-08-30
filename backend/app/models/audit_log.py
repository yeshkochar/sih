from sqlalchemy import Column, Integer, String, DateTime
from datetime import datetime
from backend.app.database.base import Base

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    username = Column(String, nullable=False)
    role = Column(String, nullable=False)  # Procurement Manager, Logistics Manager, Admin
    action = Column(String, nullable=False)  # Override, Optimize, Scenario, Login
    target = Column(String, nullable=True)  # e.g., Recommendation ID
    details = Column(String, nullable=False)  # Description of what changed / why
