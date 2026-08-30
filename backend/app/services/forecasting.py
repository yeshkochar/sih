import numpy as np
import pandas as pd
from datetime import datetime, date, timedelta
from sqlalchemy.orm import Session
from sklearn.linear_model import Ridge
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error
try:
    from statsmodels.tsa.statespace.sarimax import SARIMAX
    HAS_STATSMODELS = True
except ImportError:
    HAS_STATSMODELS = False

from backend.app.models.freight_rate import FreightRate
from backend.app.models.disruption import Disruption

def get_disruption_impact(db: Session, port_name: str, query_date: date) -> float:
    """Calculates active disruption severity score for a port at a given date."""
    active = db.query(Disruption).filter(
        Disruption.port == port_name,
        Disruption.start_date <= query_date
    ).all()
    
    score = 0.0
    for d in active:
        # Check if still active
        end = d.start_date + timedelta(days=d.expected_duration)
        if query_date <= end:
            severity_map = {"Low": 2.0, "Medium": 5.0, "High": 10.0, "Critical": 20.0}
            score += severity_map.get(d.severity, 0.0)
    return score

def prepare_features(df: pd.DataFrame):
    """
    Applies feature engineering for the time series.
    Creates weekly lags, rolling averages, rolling std, and calendar variables.
    """
    df = df.sort_values("date").reset_index(drop=True)
    
    # Target lags (weekly observations)
    df["lag_1"] = df["freight_rate"].shift(1)
    df["lag_2"] = df["freight_rate"].shift(2)
    df["lag_4"] = df["freight_rate"].shift(4)
    df["lag_52"] = df["freight_rate"].shift(52)  # Seasonal naive lag (1 year ago)
    
    # Rolling stats
    df["rolling_mean_4"] = df["freight_rate"].shift(1).rolling(4).mean()
    df["rolling_mean_12"] = df["freight_rate"].shift(1).rolling(12).mean()
    df["rolling_std_4"] = df["freight_rate"].shift(1).rolling(4).std()
    
    # Date parts
    df["month"] = df["date"].dt.month
    df["week_of_year"] = df["date"].dt.isocalendar().week.astype(float)
    df["quarter"] = df["date"].dt.quarter
    
    # Drop rows with NaN (due to lags/rolling window)
    # We keep rows where at least lag_4 and rolling_mean_12 are present.
    # lag_52 might be NaN for the first year, so we backfill lag_52 or use fallback.
    df["lag_52"] = df["lag_52"].fillna(df["freight_rate"].shift(4)) # Fallback if first year
    df = df.dropna(subset=["lag_1", "lag_4", "rolling_mean_12"]).reset_index(drop=True)
    return df

def train_and_evaluate(db: Session, origin: str, destination: str, vessel_type: str, commodity: str):
    """
    Loads history, splits chronologically, trains models (Baseline, ML, SARIMAX),
    evaluates performance on test data, and returns evaluation metrics + trained models.
    """
    rates = db.query(FreightRate).filter(
        FreightRate.origin_port == origin,
        FreightRate.destination_port == destination,
        FreightRate.vessel_type == vessel_type,
        FreightRate.commodity == commodity
    ).order_by(FreightRate.date).all()
    
    if len(rates) < 60:  # Need enough history (at least ~1 year of weekly data)
        return None
        
    # Convert to DataFrame
    data = []
    for r in rates:
        disruption_score = get_disruption_impact(db, destination, r.date)
        data.append({
            "date": pd.to_datetime(r.date),
            "freight_rate": r.freight_rate,
            "fuel_index": r.fuel_index,
            "fx_rate": r.fx_rate,
            "congestion_index": r.congestion_index,
            "demand_index": r.demand_index,
            "disruption_score": disruption_score
        })
    df = pd.DataFrame(data)
    
    # Engineer Features
    df_feat = prepare_features(df)
    
    if len(df_feat) < 20:
        return None
        
    # Chronological Split (Train: 80%, Test: 20%)
    split_idx = int(len(df_feat) * 0.8)
    train_df = df_feat.iloc[:split_idx]
    test_df = df_feat.iloc[split_idx:]
    
    feature_cols = [
        "lag_1", "lag_2", "lag_4", "rolling_mean_4", "rolling_mean_12", 
        "rolling_std_4", "month", "week_of_year", "quarter", 
        "fuel_index", "fx_rate", "congestion_index", "demand_index", "disruption_score"
    ]
    
    # 1. Baseline Model (Seasonal Naive)
    baseline_pred = test_df["lag_52"].values
    
    # 2. ML Regressor (Ridge Regression with Lags)
    ml_model = Ridge(alpha=1.0)
    ml_model.fit(train_df[feature_cols], train_df["freight_rate"])
    ml_pred = ml_model.predict(test_df[feature_cols])
    
    # 3. SARIMAX Model (with fuel_index and demand_index as exogenous)
    sarimax_pred = np.copy(ml_pred) # Default fallback
    sarimax_model_fitted = None
    
    if HAS_STATSMODELS:
        try:
            # We fit on train, using endog=freight_rate and exog=[fuel_index, demand_index]
            exog_train = train_df[["fuel_index", "demand_index", "congestion_index"]]
            exog_test = test_df[["fuel_index", "demand_index", "congestion_index"]]
            
            sarimax = SARIMAX(
                train_df["freight_rate"],
                exog=exog_train,
                order=(1, 1, 1),
                seasonal_order=(1, 0, 0, 12),
                enforce_stationarity=False,
                enforce_invertibility=False
            )
            sarimax_model_fitted = sarimax.fit(disp=False)
            
            # Predict
            sarimax_pred = sarimax_model_fitted.forecast(steps=len(test_df), exog=exog_test).values
        except Exception:
            pass # Use ML model fallback
            
    # Evaluation Metrics
    y_true = test_df["freight_rate"].values
    
    metrics = {}
    for name, pred in [("Baseline", baseline_pred), ("ML (Ridge)", ml_pred), ("SARIMAX", sarimax_pred)]:
        # Prevent division by zero for MAPE
        mape = np.mean(np.abs((y_true - pred) / np.where(y_true == 0, 1, y_true))) * 100
        mae = mean_absolute_error(y_true, pred)
        rmse = np.sqrt(mean_squared_error(y_true, pred))
        metrics[name] = {
            "MAE": round(float(mae), 3),
            "RMSE": round(float(rmse), 3),
            "MAPE": round(float(mape), 3)
        }
        
    # Select best model based on RMSE
    best_model_name = min(metrics, key=lambda k: metrics[k]["RMSE"])
    
    # Train the best model on full dataset
    full_model = None
    if best_model_name == "ML (Ridge)":
        full_model = Ridge(alpha=1.0)
        full_model.fit(df_feat[feature_cols], df_feat["freight_rate"])
    elif best_model_name == "SARIMAX" and HAS_STATSMODELS:
        try:
            exog_full = df_feat[["fuel_index", "demand_index", "congestion_index"]]
            sarimax = SARIMAX(
                df_feat["freight_rate"],
                exog=exog_full,
                order=(1, 1, 1),
                seasonal_order=(1, 0, 0, 12),
                enforce_stationarity=False,
                enforce_invertibility=False
            )
            full_model = sarimax.fit(disp=False)
        except Exception:
            # Fallback to Ridge
            best_model_name = "ML (Ridge)"
            full_model = Ridge(alpha=1.0)
            full_model.fit(df_feat[feature_cols], df_feat["freight_rate"])
            
    return {
        "best_model_name": best_model_name,
        "metrics": metrics,
        "full_model": full_model,
        "df_feat": df_feat,
        "feature_cols": feature_cols
    }

def get_forecast(db: Session, origin: str, destination: str, vessel_type: str, commodity: str):
    """
    Generates 7, 30, and 90 day forecasts for the selected route.
    Uses recursive forecast for multi-step predictions.
    """
    eval_results = train_and_evaluate(db, origin, destination, vessel_type, commodity)
    
    if not eval_results:
        # Fallback empty forecast if database data is insufficient
        return {
            "forecast": [],
            "metrics": {
                "Baseline": {"MAE": 0.0, "RMSE": 0.0, "MAPE": 0.0},
                "ML (Ridge)": {"MAE": 0.0, "RMSE": 0.0, "MAPE": 0.0},
                "SARIMAX": {"MAE": 0.0, "RMSE": 0.0, "MAPE": 0.0}
            },
            "best_model": "Baseline",
            "confidence_score": 50.0
        }
        
    df_feat = eval_results["df_feat"]
    best_model_name = eval_results["best_model_name"]
    full_model = eval_results["full_model"]
    feature_cols = eval_results["feature_cols"]
    metrics = eval_results["metrics"]
    
    # Get last known state (most recent row)
    last_row = df_feat.iloc[-1].copy()
    last_date = last_row["date"]
    
    # Standard deviation of test residuals as base uncertainty
    rmse = metrics[best_model_name]["RMSE"]
    # Ensure a minimum rmse for formatting
    rmse = max(0.5, rmse)
    
    forecasts = []
    current_state = last_row.to_dict()
    
    # Keep rolling values in memory for recursive lags
    recent_rates = list(df_feat["freight_rate"].values[-12:]) # Last 12 weeks of rates
    
    # Exogenous values remain stable or carry a minor drift
    exog_fuel = current_state["fuel_index"]
    exog_fx = current_state["fx_rate"]
    exog_congestion = current_state["congestion_index"]
    exog_demand = current_state["demand_index"]
    exog_disruption = current_state["disruption_score"]
    
    # Predict for 13 weeks (covering 7, 30, 90 days)
    # 7 days -> week 1
    # 30 days -> week 4
    # 90 days -> week 13
    for step in range(1, 14):
        step_date = last_date + timedelta(weeks=step)
        
        # Calculate calendar features
        month = step_date.month
        week_of_year = float(step_date.isocalendar()[1])
        quarter = (month - 1) // 3 + 1
        
        # Lags
        lag_1 = recent_rates[-1]
        lag_2 = recent_rates[-2]
        lag_4 = recent_rates[-4]
        
        # Rolling averages
        rolling_mean_4 = np.mean(recent_rates[-4:])
        rolling_mean_12 = np.mean(recent_rates[-12:])
        rolling_std_4 = np.std(recent_rates[-4:])
        
        feat_dict = {
            "lag_1": lag_1,
            "lag_2": lag_2,
            "lag_4": lag_4,
            "rolling_mean_4": rolling_mean_4,
            "rolling_mean_12": rolling_mean_12,
            "rolling_std_4": rolling_std_4,
            "month": month,
            "week_of_year": week_of_year,
            "quarter": quarter,
            "fuel_index": exog_fuel,
            "fx_rate": exog_fx,
            "congestion_index": exog_congestion,
            "demand_index": exog_demand,
            "disruption_score": exog_disruption
        }
        
        # Predict
        if best_model_name == "ML (Ridge)":
            feat_df = pd.DataFrame([feat_dict])[feature_cols]
            pred_val = float(full_model.predict(feat_df)[0])
        elif best_model_name == "SARIMAX" and HAS_STATSMODELS:
            try:
                # Statsmodels SARIMAX forecast
                # For simplicity, if recursive exog gets complicated, fallback to exog prediction
                exog_step = pd.DataFrame([[exog_fuel, exog_demand, exog_congestion]], columns=["fuel_index", "demand_index", "congestion_index"])
                pred_val = float(full_model.forecast(steps=step, exog=exog_step).values[-1])
            except Exception:
                # Fallback to ML calculation
                ml_fallback = Ridge(alpha=1.0).fit(df_feat[feature_cols], df_feat["freight_rate"])
                feat_df = pd.DataFrame([feat_dict])[feature_cols]
                pred_val = float(ml_fallback.predict(feat_df)[0])
        else: # Seasonal Naive or fallback
            # Look back 52 weeks in history, or fallback to lag_4 if history too short
            hist_idx = len(df_feat) - 52 + step
            if hist_idx >= 0 and hist_idx < len(df_feat):
                pred_val = float(df_feat.iloc[hist_idx]["freight_rate"])
            else:
                pred_val = float(lag_1)
                
        pred_val = max(10.0, round(pred_val, 2))
        
        # Update rolling memory
        recent_rates.append(pred_val)
        
        # Calculate Confidence Interval (increases with time horizon root-h)
        uncertainty = rmse * np.sqrt(step)
        lower_bound = max(8.0, round(pred_val - 1.96 * uncertainty, 2))
        upper_bound = round(pred_val + 1.96 * uncertainty, 2)
        
        # Forecast record
        forecasts.append({
            "date": step_date.date(),
            "predicted_rate": pred_val,
            "lower_bound": lower_bound,
            "upper_bound": upper_bound,
            "horizon_days": step * 7
        })
        
    # Calculate confidence score (scale 0-100) based on MAPE on validation set
    validation_mape = metrics[best_model_name]["MAPE"]
    confidence_score = max(50.0, min(98.0, 100.0 - validation_mape))
    
    return {
        "forecast": forecasts,
        "metrics": metrics,
        "best_model": best_model_name,
        "confidence_score": round(confidence_score, 1)
    }
