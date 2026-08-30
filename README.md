# FreightSense AI 🚢💡

**Smart India Hackathon 2026**
* **Problem Statement ID**: 26006
* **Organization**: Ministry of Steel / SAIL
* **Theme**: Transportation & Logistics
* **Team**: THE MAVERICKS

FreightSense AI is an AI-powered freight decision-support and charter optimization platform for bulk cargo procurement (e.g., coking coal, iron ore) from overseas origins (Australia, South Africa, Canada) to ports on the East Coast of India.

---

## Key Features

1. **Analytical & ML Freight Forecasting**: Generates recursive 7-day, 30-day, and 90-day freight forecasts. Compares **Seasonal Naive Baseline**, **SARIMAX**, and **ML Lag/Rolling Regressors (Ridge/Random Forest)** with chronological split evaluation (RMSE, MAE, MAPE).
2. **Rule-Based Port-Vessel Feasibility Check**: Dynamically checks vessel physical dimensions (LOA, beam, draft) and cargo requirements against destination port limits. Rejected vessels display exact constraint overruns (e.g. `+0.7m draft overrun`).
3. **Multi-Factor Scoring & Optimization**: Ranks feasible vessels using a weighted algorithm (30% Cost, 20% Compatibility, 15% Schedule Fit, 15% Risk, 10% Fuel, 10% Idle time).
4. **Charter Window Advisory**: Recommends `BUY NOW` or `WAIT X DAYS` (with expected savings) based on forecast trends.
5. **Spot vs. Contract Recommendation**: Advises between spot chartering or multi-voyage contract of affreightment (COA) based on rate volatility.
6. **Scenario Simulator**: Slider-driven simulation workspace (overriding fuel, FX, congestion, and disruptions) to see vessel rankings update dynamically in real-time.
7. **Human-in-the-Loop Override & Audit Logs**: Allows procurement managers to override AI recommendations, logging justifications (e.g. supplier relationship) to an audit trail.
8. **Interactive Port Map**: Displays East Coast Indian ports and overseas cargo origins with route arcs using a custom Leaflet map.

---

## Tech Stack

* **Frontend**: React, TypeScript, Vite, Tailwind CSS, Recharts (data charts), Leaflet (geographic map), Lucide React (icon library)
* **Backend**: Python 3.10, FastAPI (REST API), SQLAlchemy ORM, Pydantic (data validation)
* **Database**: PostgreSQL (Docker environment) or SQLite (automatic fallback for local execution)
* **Machine Learning**: pandas, numpy, scikit-learn, statsmodels, joblib

---

## Folder Structure

```
freightsense-ai/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── api.py           # Combined router endpoints
│   │   ├── database/
│   │   │   ├── base.py          # Declarative Base
│   │   │   └── connection.py    # DB engine & session fallback
│   │   ├── models/              # SQLAlchemy DB models
│   │   ├── schemas/             # Pydantic schema validation
│   │   ├── services/
│   │   │   ├── forecasting.py   # ML pipeline & lag calculations
│   │   │   ├── feasibility.py   # Port-vessel rule checks
│   │   │   ├── optimization.py  # Score ranking & window advice
│   │   │   └── scenarios.py     # Slide simulators re-calc
│   │   ├── utils/
│   │   │   └── demo_data.py     # DB reset & scenario seedings
│   │   ├── tests/
│   │   │   └── test_core.py     # Pytest unit tests
│   │   └── main.py              # FastAPI app initialization
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── components/          # Reusable components (e.g. PortMap)
│   │   ├── pages/               # Tab pages (Dashboard, Forecast, etc.)
│   │   ├── index.css            # Styles, scrollbars & dark theme
│   │   ├── App.tsx              # Sidebar layout & state routes
│   │   └── main.tsx             # React boostrap
│   ├── package.json
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   └── Dockerfile
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## Setup & Running Guide

Ensure you have **Docker** and **Docker Compose** installed.

### Option A: Run via Docker Compose (Recommended)

1. Clone or copy the project files to your directory.
2. In the project root, run:
   ```bash
   docker compose up --build
   ```
3. Once running, open your browser:
   * **Frontend Dashboard**: [http://localhost:3000](http://localhost:3000)
   * **FastAPI Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)

---

### Option B: Run Locally without Docker (Standalone Fallback)

To run the application directly using local Python and Node runtimes:

#### 1. Setup Backend
1. Navigate to the `backend` directory:
   ```bash
   cd backend
   ```
2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows use: venv\Scripts\activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Run the FastAPI development server:
   ```bash
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```
   *(Note: Without Docker, SQLAlchemy automatically falls back to an SQLite database file `freightsense.db` inside the project root and seeds it on startup).*

#### 2. Setup Frontend
1. Navigate to the `frontend` directory:
   ```bash
   cd ../frontend
   ```
2. Install npm dependencies:
   ```bash
   npm install
   ```
3. Start the Vite React development server:
   ```bash
   npm run dev
   ```
4. Access the web interface at [http://localhost:3000](http://localhost:3000).

---

## Smart India Hackathon Demo Guide

Follow these steps for a complete evaluation demonstration:

### Step 1: Secure Login
1. Navigate to [http://localhost:3000](http://localhost:3000).
2. Enter the demo credentials:
   * **Email**: `demo@sail.in`
   * **Password**: `demo123`
3. Upon clicking **Sign In**, the platform loads the main dashboard control tower.

### Step 2: Dashboard Overview
* Show the **KPI cards**: benchmark rates, 30-day forecast changes, average port congestion, and risk indices.
* Inspect the **Port Map**: click on a marker (e.g. Visakhapatnam) to view max draft constraints, operational status, and active disruptions.
* Point out the **Recent AI Charter Runs** log showing history of optimization requests.

### Step 3: Run Freight Forecasting
1. Go to **Freight Forecasting** tab.
2. Select parameters:
   * **Origin**: `Newcastle`
   * **Destination**: `Visakhapatnam`
   * **Commodity**: `Coking Coal`
   * **Vessel**: `Panamax`
3. Click **Generate Forecast**.
4. Show the chart: solid line represents historical rates, dashed represents forecast, dotted lines represent the 95% confidence intervals.
5. Highlight the **Chronological Evaluation Metrics** table showing MAE, RMSE, and MAPE comparisons across Ridge ML, SARIMAX, and Seasonal Naive models.

### Step 4: Run Vessel Optimizer
1. Go to **Vessel Optimizer** tab.
2. Set cargo volume to `75,000 MT`, destination to `Visakhapatnam`, required date to `2026-09-25`.
3. Click **Generate Charter Recommendation**.
4. The system calculates physical and operational constraints:
   * Explains **Why We Recommend This Option** showing decision drivers.
   * Renders the **Ranked Feasible Vessels Options** table.
   * Expand the **Infeasible Rejected Vessels Accordion** showing why vessels were rejected (e.g., draft exceeds port maximum with exact deviations).
5. Click **Override Recommendation** on the recommended card, select an alternative vessel, choose the reason (e.g. "Existing supplier relationship"), type user name, and confirm.
6. The dashboard instantly updates to show the override status, and logs the action to the **System Audit Trail**.

### Step 5: Test Shock Scenarios
1. Go to **Scenario Simulator** tab.
2. Move the **Port Congestion Factor** slider to `2.0x` and set **Disruption Level** to `High`.
3. Click **Run Scenario Simulation**.
4. Notice how the port waiting time spikes, the risk index increases, and the recommended vessel shifts to a smaller class or alternative because the original Panamax option has become too risky.
5. Evaluators can select different seed scenarios from the top navbar dropdown (e.g. "Fuel Price Shock") and trigger a complete database reset to normal state.
