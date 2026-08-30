from sqlalchemy import Column, Integer, String, Float, Date
from backend.app.database.base import Base

class Forecast(Base):
    __tablename__ = "forecasts"

    id = Column(Integer, primary_key=True, index=True)
    route = Column(String, nullable=False, index=True)  # "Origin to Destination"
    vessel_type = Column(String, nullable=False, index=True)
    forecast_date = Column(Date, nullable=False, index=True)
    predicted_rate = Column(Float, nullable=False)
    lower_bound = Column(Float, nullable=False)
    upper_bound = Column(Float, nullable=False)
    confidence = Column(Float, nullable=False)  # confidence percentage (e.g., 85.0)
    model_name = Column(String, nullable=False)  # LightGBM, SARIMAX, Baseline
