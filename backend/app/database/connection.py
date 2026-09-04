import os
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
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
    # Attempt to enable pgvector extension on PostgreSQL
    if DATABASE_URL.startswith("postgresql"):
        try:
            with engine.connect() as conn:
                conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector;"))
                conn.commit()
                print("PGVector extension verified/created.")
        except Exception as e:
            print("PGVector extension note:", e)

    # Import models here to register them with Base
    from backend.app.models.port import Port
    from backend.app.models.vessel import Vessel
    from backend.app.models.freight_rate import FreightRate
    from backend.app.models.cargo_request import CargoRequest
    from backend.app.models.forecast import Forecast
    from backend.app.models.recommendation import Recommendation
    from backend.app.models.disruption import Disruption
    from backend.app.models.audit_log import AuditLog
    from backend.app.models.rag_document import Document, DocumentChunk
    
    Base.metadata.create_all(bind=engine)

    # Auto-migrate missing columns for SQLite
    if DATABASE_URL.startswith("sqlite"):
        with engine.connect() as conn:
            try:
                res_p = conn.execute(text("PRAGMA table_info(ports)")).fetchall()
                port_cols = [r[1] for r in res_p]
                if "data_source" not in port_cols:
                    conn.execute(text("ALTER TABLE ports ADD COLUMN data_source VARCHAR DEFAULT 'Port Authority / NLP Marine'"))
                if "data_status" not in port_cols:
                    conn.execute(text("ALTER TABLE ports ADD COLUMN data_status VARCHAR DEFAULT 'LIVE'"))

                res_v = conn.execute(text("PRAGMA table_info(vessels)")).fetchall()
                vessel_cols = [r[1] for r in res_v]
                if "latitude" not in vessel_cols:
                    conn.execute(text("ALTER TABLE vessels ADD COLUMN latitude FLOAT DEFAULT 0.0"))
                if "longitude" not in vessel_cols:
                    conn.execute(text("ALTER TABLE vessels ADD COLUMN longitude FLOAT DEFAULT 0.0"))
                if "destination_port" not in vessel_cols:
                    conn.execute(text("ALTER TABLE vessels ADD COLUMN destination_port VARCHAR"))
                if "eta" not in vessel_cols:
                    conn.execute(text("ALTER TABLE vessels ADD COLUMN eta VARCHAR"))
                if "last_position_update" not in vessel_cols:
                    conn.execute(text("ALTER TABLE vessels ADD COLUMN last_position_update DATETIME"))
                if "data_source" not in vessel_cols:
                    conn.execute(text("ALTER TABLE vessels ADD COLUMN data_source VARCHAR DEFAULT 'MarineTraffic AIS'"))
                if "data_status" not in vessel_cols:
                    conn.execute(text("ALTER TABLE vessels ADD COLUMN data_status VARCHAR DEFAULT 'LIVE'"))

                conn.commit()
            except Exception as e:
                print("Auto-migration note:", e)
