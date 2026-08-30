import random
from datetime import datetime, date, timedelta
from sqlalchemy.orm import Session
from backend.app.models.port import Port
from backend.app.models.vessel import Vessel
from backend.app.models.freight_rate import FreightRate
from backend.app.models.disruption import Disruption
from backend.app.models.audit_log import AuditLog
from backend.app.models.recommendation import Recommendation
from backend.app.models.cargo_request import CargoRequest
from backend.app.models.forecast import Forecast

# Core Lists
PORTS_DATA = [
    # Indian East Coast Ports
    {"name": "Visakhapatnam", "country": "India", "coast": "East Coast", "latitude": 17.68, "longitude": 83.21, "max_loa": 280.0, "max_beam": 45.0, "max_draft": 14.5, "berth_capacity": 18, "cargo_handling_capacity": 150000.0, "congestion_score": 35.0, "status": "Active"},
    {"name": "Paradip", "country": "India", "coast": "East Coast", "latitude": 20.26, "longitude": 86.67, "max_loa": 300.0, "max_beam": 48.0, "max_draft": 16.0, "berth_capacity": 20, "cargo_handling_capacity": 200000.0, "congestion_score": 55.0, "status": "Active"},
    {"name": "Gangavaram", "country": "India", "coast": "East Coast", "latitude": 17.62, "longitude": 83.24, "max_loa": 290.0, "max_beam": 45.0, "max_draft": 18.0, "berth_capacity": 9, "cargo_handling_capacity": 120000.0, "congestion_score": 20.0, "status": "Active"},
    {"name": "Kakinada", "country": "India", "coast": "East Coast", "latitude": 16.98, "longitude": 82.28, "max_loa": 230.0, "max_beam": 32.2, "max_draft": 12.5, "berth_capacity": 6, "cargo_handling_capacity": 80000.0, "congestion_score": 15.0, "status": "Active"},
    {"name": "Chennai", "country": "India", "coast": "East Coast", "latitude": 13.08, "longitude": 80.30, "max_loa": 270.0, "max_beam": 40.0, "max_draft": 14.0, "berth_capacity": 12, "cargo_handling_capacity": 100000.0, "congestion_score": 40.0, "status": "Active"},
    {"name": "Krishnapatnam", "country": "India", "coast": "East Coast", "latitude": 14.25, "longitude": 80.12, "max_loa": 295.0, "max_beam": 45.0, "max_draft": 15.5, "berth_capacity": 8, "cargo_handling_capacity": 110000.0, "congestion_score": 25.0, "status": "Active"},
    # Overseas Ports (Origins)
    {"name": "Newcastle", "country": "Australia", "coast": "Overseas", "latitude": -32.92, "longitude": 151.78, "max_loa": 300.0, "max_beam": 50.0, "max_draft": 16.5, "berth_capacity": 10, "cargo_handling_capacity": 250000.0, "congestion_score": 30.0, "status": "Active"},
    {"name": "Richards Bay", "country": "South Africa", "coast": "Overseas", "latitude": -28.80, "longitude": 32.03, "max_loa": 350.0, "max_beam": 55.0, "max_draft": 17.5, "berth_capacity": 15, "cargo_handling_capacity": 300000.0, "congestion_score": 25.0, "status": "Active"},
    {"name": "Dampier", "country": "Australia", "coast": "Overseas", "latitude": -20.65, "longitude": 116.71, "max_loa": 320.0, "max_beam": 52.0, "max_draft": 19.0, "berth_capacity": 12, "cargo_handling_capacity": 400000.0, "congestion_score": 20.0, "status": "Active"},
    {"name": "Vancouver", "country": "Canada", "coast": "Overseas", "latitude": 49.28, "longitude": -123.12, "max_loa": 280.0, "max_beam": 45.0, "max_draft": 15.0, "berth_capacity": 8, "cargo_handling_capacity": 180000.0, "congestion_score": 35.0, "status": "Active"}
]

VESSELS_DATA = [
    # Handysize
    {"vessel_name": "Seaborn Trader", "vessel_type": "Handysize", "deadweight_tonnage": 35000.0, "loa": 175.0, "beam": 27.0, "draft": 10.2, "cargo_capacity": 32000.0, "speed": 12.5, "fuel_consumption": 22.0, "availability_status": "Available", "current_port": "Newcastle"},
    {"vessel_name": "Oceanic Gem", "vessel_type": "Handysize", "deadweight_tonnage": 38000.0, "loa": 180.0, "beam": 28.0, "draft": 10.5, "cargo_capacity": 35000.0, "speed": 12.8, "fuel_consumption": 23.0, "availability_status": "Available", "current_port": "Kakinada"},
    # Handymax
    {"vessel_name": "Pacific Pioneer", "vessel_type": "Handymax", "deadweight_tonnage": 48000.0, "loa": 185.0, "beam": 30.0, "draft": 11.5, "cargo_capacity": 45000.0, "speed": 13.0, "fuel_consumption": 25.0, "availability_status": "Available", "current_port": "Richards Bay"},
    # Supramax
    {"vessel_name": "Eastern Horizon", "vessel_type": "Supramax", "deadweight_tonnage": 58000.0, "loa": 190.0, "beam": 32.2, "draft": 12.2, "cargo_capacity": 55000.0, "speed": 13.5, "fuel_consumption": 28.0, "availability_status": "Available", "current_port": "Dampier"},
    {"vessel_name": "Golden Venture", "vessel_type": "Supramax", "deadweight_tonnage": 61000.0, "loa": 199.0, "beam": 32.2, "draft": 12.8, "cargo_capacity": 58000.0, "speed": 14.0, "fuel_consumption": 30.0, "availability_status": "Available", "current_port": "Visakhapatnam"},
    # Panamax
    {"vessel_name": "Southern Cross", "vessel_type": "Panamax", "deadweight_tonnage": 74000.0, "loa": 225.0, "beam": 32.2, "draft": 13.5, "cargo_capacity": 70000.0, "speed": 14.0, "fuel_consumption": 32.0, "availability_status": "Available", "current_port": "Newcastle"},
    {"vessel_name": "Iron SAILor", "vessel_type": "Panamax", "deadweight_tonnage": 78000.0, "loa": 229.0, "beam": 32.2, "draft": 14.2, "cargo_capacity": 75000.0, "speed": 14.2, "fuel_consumption": 34.0, "availability_status": "Available", "current_port": "Vancouver"},
    # Kamsarmax
    {"vessel_name": "Steel Giant", "vessel_type": "Kamsarmax", "deadweight_tonnage": 82000.0, "loa": 229.0, "beam": 32.2, "draft": 14.5, "cargo_capacity": 80000.0, "speed": 14.5, "fuel_consumption": 35.0, "availability_status": "Available", "current_port": "Paradip"},
    {"vessel_name": "Apex Voyager", "vessel_type": "Kamsarmax", "deadweight_tonnage": 85000.0, "loa": 235.0, "beam": 32.2, "draft": 15.0, "cargo_capacity": 82000.0, "speed": 14.5, "fuel_consumption": 36.0, "availability_status": "Available", "current_port": "Newcastle"}
]

ROUTES = [
    # (Origin, Destination, Commodity, Preferred Vessel, Base Rate)
    ("Newcastle", "Visakhapatnam", "Coking Coal", "Panamax", 32.0),
    ("Richards Bay", "Paradip", "Thermal Coal", "Kamsarmax", 28.0),
    ("Dampier", "Gangavaram", "Iron Ore", "Kamsarmax", 22.0),
    ("Vancouver", "Visakhapatnam", "Metallurgical Coal", "Panamax", 42.0),
    ("Newcastle", "Kakinada", "Coking Coal", "Supramax", 36.0),
    ("Richards Bay", "Chennai", "Thermal Coal", "Handymax", 30.0),
]

def generate_historical_rates(scenario="normal"):
    """
    Generates 3 years of weekly historical freight rates ending on 2026-08-30
    with realistic relationships to fuel, demand, congestion, seasonality, and disruptions.
    """
    records = []
    end_date = date(2026, 8, 30)
    start_date = end_date - timedelta(weeks=3 * 52)  # 3 years
    
    current_date = start_date
    week_idx = 0
    
    # Base indicators with random walk
    fuel_base = 600.0  # USD/ton
    fx_base = 82.5     # USD to INR
    demand_base = 100.0
    
    while current_date <= end_date:
        # Time calculations
        month = current_date.month
        day_of_year = (current_date - date(current_date.year, 1, 1)).days
        
        # Random walks for variables
        fuel_noise = random.normalvariate(0, 5)
        fx_noise = random.normalvariate(0, 0.05)
        demand_noise = random.normalvariate(0, 0.8)
        
        # Apply scenario-specific overrides towards the end of the history
        # (say, the last 4 weeks) to simulate current market shocks
        days_to_end = (end_date - current_date).days
        is_recent = days_to_end <= 30
        
        fuel_mult = 1.0
        demand_mult = 1.0
        congestion_mult = 1.0
        rate_mult = 1.0
        disruption_spike = 0.0
        
        if is_recent:
            if scenario == "freight_spike":
                rate_mult = 1.30
                demand_mult = 1.20
            elif scenario == "port_congestion":
                congestion_mult = 1.60
                rate_mult = 1.15
            elif scenario == "fuel_price_shock":
                fuel_mult = 1.50
                rate_mult = 1.25
            elif scenario == "vessel_shortage":
                rate_mult = 1.35
        
        # Seasonal Demand (Peaks in Q2 and Q4 for Steel production prep)
        seasonal_demand_factor = 1.0 + 0.08 * (1.0 if month in [4, 5, 6, 10, 11] else -0.05)
        
        fuel_index = (fuel_base + 0.3 * week_idx + fuel_noise) * fuel_mult
        fx_rate = fx_base + 0.01 * week_idx + fx_noise
        demand_index = (demand_base + 0.1 * week_idx + demand_noise) * seasonal_demand_factor * demand_mult
        
        # Occasional historical disruptions (e.g. cyclone season in India East Coast - Nov/Dec)
        # Add temporary rate spike in Nov/Dec of 2024
        if current_date.year == 2024 and month == 11:
            disruption_spike = 4.5
        
        for origin, dest, commodity, vessel_type, base_rate in ROUTES:
            # Route specific congestion
            congestion_base = 35.0 if dest == "Visakhapatnam" else (55.0 if dest == "Paradip" else 25.0)
            congestion_index = (congestion_base + random.normalvariate(0, 2)) * congestion_mult
            # Ensure boundaries
            congestion_index = max(5.0, min(100.0, congestion_index))
            
            # Rate Calculation Formula:
            # base_rate + fuel_effect + demand_effect + congestion_effect + seasonality + noise + disruption
            fuel_effect = (fuel_index - 600.0) * 0.02
            demand_effect = (demand_index - 100.0) * 0.12
            congestion_effect = (congestion_index - 30.0) * 0.08
            seasonal_rate_factor = 1.0 + 0.04 * (1.0 if month in [9, 10, 11] else -0.02)
            
            noise = random.normalvariate(0, 0.5)
            
            freight_rate = (base_rate + fuel_effect + demand_effect + congestion_effect + disruption_spike) * seasonal_rate_factor * rate_mult + noise
            freight_rate = max(12.0, round(freight_rate, 2))
            
            records.append({
                "date": current_date,
                "origin_port": origin,
                "destination_port": dest,
                "vessel_type": vessel_type,
                "commodity": commodity,
                "freight_rate": freight_rate,
                "currency": "USD",
                "fuel_index": round(fuel_index, 2),
                "fx_rate": round(fx_rate, 2),
                "congestion_index": round(congestion_index, 2),
                "demand_index": round(demand_index, 2)
            })
            
        current_date += timedelta(weeks=1)
        week_idx += 1
        
    return records

def reset_demo_data(db: Session, scenario: str = "normal"):
    """
    Clears all recommendation, forecast, rate, disruption, and cargo request tables
    and inserts a fresh set of seeded data for the specified scenario.
    """
    # 1. Clear Existing Dynamic Data
    db.query(Recommendation).delete()
    db.query(CargoRequest).delete()
    db.query(Forecast).delete()
    db.query(FreightRate).delete()
    db.query(Disruption).delete()
    db.query(AuditLog).delete()
    
    # 2. Sync/Seed Static Data (Ports & Vessels)
    # Check if Ports exist
    db_ports = db.query(Port).all()
    if not db_ports:
        for p in PORTS_DATA:
            db.add(Port(**p))
    else:
        # Update Port congestion based on scenario
        for p in db_ports:
            base_congestion = 35.0 if p.name == "Visakhapatnam" else (55.0 if p.name == "Paradip" else 25.0)
            if scenario == "port_congestion":
                p.congestion_score = base_congestion * 1.6
                p.status = "Active"
            elif scenario == "vessel_shortage":
                p.congestion_score = base_congestion * 1.2
            else:
                p.congestion_score = base_congestion
                p.status = "Active"
                
    # Check if Vessels exist
    db_vessels = db.query(Vessel).all()
    if not db_vessels:
        for v in VESSELS_DATA:
            db.add(Vessel(**v))
    else:
        # Update Vessel availability based on scenario
        for v in db_vessels:
            if scenario == "vessel_shortage":
                # Make some random key vessels unavailable
                if v.vessel_name in ["Southern Cross", "Steel Giant", "Oceanic Gem"]:
                    v.availability_status = "Chartered"
                else:
                    v.availability_status = "Available"
            else:
                v.availability_status = "Available"
                
    db.commit()

    # 3. Seed Disruptions
    disruptions = []
    if scenario == "port_congestion":
        disruptions.append(Disruption(
            port="Paradip",
            type="Congestion",
            severity="High",
            start_date=date(2026, 8, 25),
            expected_duration=10,
            description="Berth maintenance at Coal Terminal 2 causing high vessel queue times."
        ))
    elif scenario == "freight_spike":
        disruptions.append(Disruption(
            port="Newcastle",
            type="Weather",
            severity="Medium",
            start_date=date(2026, 8, 28),
            expected_duration=6,
            description="High swells at Hunter River Channel disrupting coal loading operations."
        ))
    elif scenario == "normal":
        disruptions.append(Disruption(
            port="Krishnapatnam",
            type="Maintenance",
            severity="Low",
            start_date=date(2026, 8, 20),
            expected_duration=5,
            description="Routine dredging operations near channel entrance, minimal impact."
        ))
        
    for d in disruptions:
        db.add(d)

    # 4. Generate & Seed Freight Rates
    rates_data = generate_historical_rates(scenario)
    for r in rates_data:
        db.add(FreightRate(**r))
        
    db.commit()

    # 5. Add Cargo Requests
    cargos = [
        CargoRequest(
            commodity="Coking Coal",
            quantity=75000.0,
            origin="Newcastle",
            destination="Visakhapatnam",
            required_by_date=date(2026, 9, 25),
            preferred_vessel_type="Panamax",
            max_budget=38.0,
            priority="High"
        ),
        CargoRequest(
            commodity="Thermal Coal",
            quantity=80000.0,
            origin="Richards Bay",
            destination="Paradip",
            required_by_date=date(2026, 9, 30),
            preferred_vessel_type="Kamsarmax",
            max_budget=33.0,
            priority="Medium"
        ),
        CargoRequest(
            commodity="Iron Ore",
            quantity=82000.0,
            origin="Dampier",
            destination="Gangavaram",
            required_by_date=date(2026, 9, 20),
            preferred_vessel_type="Kamsarmax",
            max_budget=26.0,
            priority="Medium"
        )
    ]
    for c in cargos:
        db.add(c)
    db.commit()

    # 6. Log Audit Trail
    log = AuditLog(
        username="Admin",
        role="Administrator",
        action="Reset",
        target="Database",
        details=f"Database reset performed with scenario '{scenario.upper()}'."
    )
    db.add(log)
    db.commit()
