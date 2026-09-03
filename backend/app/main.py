from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.app.database.connection import init_db, SessionLocal
from backend.app.api.api import router as api_router
from backend.app.utils.demo_data import reset_demo_data

app = FastAPI(
    title="FreightSense AI Backend",
    description="Intelligent Freight Forecasting, Vessel Feasibility & Charter Optimizer Platform for SAIL / SIH 2026",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For dev environment convenience
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Startup Seeding, Table Initialization, and Background Ingestion Engine
@app.on_event("startup")
def on_startup():
    print("Initializing Database...")
    init_db()
    
    # Check if there is data. If not, auto-seed with normal scenario.
    db = SessionLocal()
    try:
        from backend.app.models.freight_rate import FreightRate
        count = db.query(FreightRate).count()
        if count == 0:
            print("No data found, seeding with default scenario...")
            reset_demo_data(db, "normal")
            print("Database seeded.")
        else:
            print("Database already contains data.")
    finally:
        db.close()
        
    # Start Background Real-time Data Ingestion Engine
    from backend.app.services.ingestion import ingestion_engine
    ingestion_engine.start()
    print("Background Ingestion Engine Started.")

@app.on_event("shutdown")
def on_shutdown():
    from backend.app.services.ingestion import ingestion_engine
    ingestion_engine.stop()
    print("Background Ingestion Engine Stopped.")

# Include Routers
app.include_router(api_router, prefix="/api")

@app.get("/")
def read_root():
    return {"message": "FreightSense AI API is running."}
