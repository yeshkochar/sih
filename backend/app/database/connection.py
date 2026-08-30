import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from backend.app.database.base import Base

# Load environment variable or fall back to local SQLite
DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    # Use a SQLite database inside the backend folder for local fallback
    db_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../freightsense.db"))
    DATABASE_URL = f"sqlite:///{db_path}"

# For SQLite, we need connect_args to allow multithreading access
connect_args = {}
if DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

engine = create_engine(DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    # Import models here to register them with Base
    from backend.app.models.port import Port
    from backend.app.models.vessel import Vessel
    from backend.app.models.freight_rate import FreightRate
    from backend.app.models.cargo_request import CargoRequest
    from backend.app.models.forecast import Forecast
    from backend.app.models.recommendation import Recommendation
    from backend.app.models.disruption import Disruption
    from backend.app.models.audit_log import AuditLog
    
    Base.metadata.create_all(bind=engine)
