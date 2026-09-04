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

MODEL_VERSION = "v2.1-walkforward-ensemble"

def get_disruption_impact(db: Session, port_name: str, query_date: date) -> float:
    """Calculates active disruption severity score for a port at a given date."""
    active = db.query(Disruption).filter(
        Disruption.port == port_name,
        Disruption.start_date <= query_date
    ).all()
    
    score = 0.0
    for d in active:
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
    
    # Target lags
    df["lag_1"] = df["freight_rate"].shift(1)
    df["lag_2"] = df["freight_rate"].shift(2)
    df["lag_4"] = df["freight_rate"].shift(4)
    df["lag_52"] = df["freight_rate"].shift(52)  # Seasonal naive lag
    
    # Rolling stats
    df["rolling_mean_4"] = df["freight_rate"].shift(1).rolling(4).mean()
    df["rolling_mean_12"] = df["freight_rate"].shift(1).rolling(12).mean()
    df["rolling_std_4"] = df["freight_rate"].shift(1).rolling(4).std()
    
    # Date parts
    df["month"] = df["date"].dt.month
    df["week_of_year"] = df["date"].dt.isocalendar().week.astype(float)
    df["quarter"] = df["date"].dt.quarter
    
    # Fallback for lag_52 if history is short
    df["lag_52"] = df["lag_52"].fillna(df["freight_rate"].shift(4))
    df = df.dropna(subset=["lag_1", "lag_4", "rolling_mean_12"]).reset_index(drop=True)
    return df

def walk_forward_validation(df_feat: pd.DataFrame, feature_cols: list, n_splits: int = 3):
    """
    Performs expanding-window walk-forward validation across n_splits folds.
    Evaluates Seasonal Naive, Ridge, Ensemble (Ridge + Random Forest), and SARIMAX.
    Returns out-of-fold metrics and residual errors.
    """
    n_samples = len(df_feat)
    min_train = int(n_samples * 0.5)
    step_size = max(1, (n_samples - min_train) // n_splits)

    fold_errors = {
        "Baseline": {"true": [], "pred": []},
        "ML (Ridge)": {"true": [], "pred": []},
        "Ensemble (RF+Ridge)": {"true": [], "pred": []},
        "SARIMAX": {"true": [], "pred": []}
    }

    for fold in range(n_splits):
        train_end = min_train + fold * step_size
        test_end = min(n_samples, train_end + step_size) if fold < n_splits - 1 else n_samples

        if train_end >= n_samples:
            break

        train_df = df_feat.iloc[:train_end]
        test_df = df_feat.iloc[train_end:test_end]
        if len(test_df) == 0:
            continue

        y_true = test_df["freight_rate"].values

        # 1. Baseline
        base_pred = test_df["lag_52"].values
        fold_errors["Baseline"]["true"].extend(y_true)
        fold_errors["Baseline"]["pred"].extend(base_pred)

        # 2. Ridge
        ridge = Ridge(alpha=1.0)
        ridge.fit(train_df[feature_cols], train_df["freight_rate"])
        ridge_pred = ridge.predict(test_df[feature_cols])
        fold_errors["ML (Ridge)"]["true"].extend(y_true)
        fold_errors["ML (Ridge)"]["pred"].extend(ridge_pred)

        # 3. Ensemble (RF + Ridge)
        rf = RandomForestRegressor(n_estimators=50, random_state=42)
        rf.fit(train_df[feature_cols], train_df["freight_rate"])
        rf_pred = rf.predict(test_df[feature_cols])
        ensemble_pred = 0.5 * ridge_pred + 0.5 * rf_pred
        fold_errors["Ensemble (RF+Ridge)"]["true"].extend(y_true)
        fold_errors["Ensemble (RF+Ridge)"]["pred"].extend(ensemble_pred)

        # 4. SARIMAX
        sarimax_pred = ridge_pred.copy()
        if HAS_STATSMODELS:
            try:
                exog_tr = train_df[["fuel_index", "demand_index", "congestion_index"]]
                exog_te = test_df[["fuel_index", "demand_index", "congestion_index"]]
                sm = SARIMAX(
                    train_df["freight_rate"],
                    exog=exog_tr,
                    order=(1, 1, 1),
                    seasonal_order=(1, 0, 0, 12),
                    enforce_stationarity=False,
                    enforce_invertibility=False
                ).fit(disp=False)
                sarimax_pred = sm.forecast(steps=len(test_df), exog=exog_te).values
            except Exception:
                pass
        fold_errors["SARIMAX"]["true"].extend(y_true)
        fold_errors["SARIMAX"]["pred"].extend(sarimax_pred)

    metrics = {}
    best_name = "Ensemble (RF+Ridge)"
    min_rmse = float("inf")

    for model_name, data in fold_errors.items():
        if len(data["true"]) == 0:
            metrics[model_name] = {"MAE": 0.0, "RMSE": 0.0, "MAPE": 0.0}
            continue
        y_tr = np.array(data["true"])
        y_pr = np.array(data["pred"])

        mae = float(mean_absolute_error(y_tr, y_pr))
        rmse = float(np.sqrt(mean_squared_error(y_tr, y_pr)))
        mape = float(np.mean(np.abs((y_tr - y_pr) / np.where(y_tr == 0, 1, y_tr))) * 100)

        metrics[model_name] = {
            "MAE": round(mae, 3),
            "RMSE": round(rmse, 3),
            "MAPE": round(mape, 3)
        }

        if rmse < min_rmse:
            min_rmse = rmse
            best_name = model_name

    return metrics, best_name

def train_and_evaluate(db: Session, origin: str, destination: str, vessel_type: str, commodity: str):
    """
    Loads historical rates, engineers time series features, runs walk-forward validation,
    and returns evaluation metrics + trained full model.
    """
    rates = db.query(FreightRate).filter(
        FreightRate.origin_port == origin,
        FreightRate.destination_port == destination,
        FreightRate.vessel_type == vessel_type,
        FreightRate.commodity == commodity
    ).order_by(FreightRate.date).all()
    
    if len(rates) < 60:
        return None
        
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
    df_feat = prepare_features(df)
    
    if len(df_feat) < 20:
        return None
        
    feature_cols = [
        "lag_1", "lag_2", "lag_4", "rolling_mean_4", "rolling_mean_12", 
        "rolling_std_4", "month", "week_of_year", "quarter", 
        "fuel_index", "fx_rate", "congestion_index", "demand_index", "disruption_score"
    ]

    # Walk-forward cross validation
    wf_metrics, best_model_name = walk_forward_validation(df_feat, feature_cols, n_splits=3)
    
    # Train final full models
    ridge_full = Ridge(alpha=1.0).fit(df_feat[feature_cols], df_feat["freight_rate"])
    rf_full = RandomForestRegressor(n_estimators=50, random_state=42).fit(df_feat[feature_cols], df_feat["freight_rate"])

    sarimax_full = None
    if HAS_STATSMODELS:
        try:
            exog_full = df_feat[["fuel_index", "demand_index", "congestion_index"]]
            sarimax_full = SARIMAX(
                df_feat["freight_rate"],
                exog=exog_full,
                order=(1, 1, 1),
                seasonal_order=(1, 0, 0, 12),
                enforce_stationarity=False,
                enforce_invertibility=False
            ).fit(disp=False)
        except Exception:
            pass

    return {
        "best_model_name": best_model_name,
        "metrics": wf_metrics,
        "ridge_full": ridge_full,
        "rf_full": rf_full,
        "sarimax_full": sarimax_full,
        "df_feat": df_feat,
        "feature_cols": feature_cols
    }

def get_forecast(db: Session, origin: str, destination: str, vessel_type: str, commodity: str):
    """
    Generates 7, 30, and 90 day probabilistic forecasts for the selected route.
    Returns P10, P50 (median), and P90 prediction intervals alongside walk-forward evaluation metrics.
    """
    eval_results = train_and_evaluate(db, origin, destination, vessel_type, commodity)
    
    if not eval_results:
        return {
            "forecast": [],
            "metrics": {
                "Baseline": {"MAE": 0.0, "RMSE": 0.0, "MAPE": 0.0},
                "ML (Ridge)": {"MAE": 0.0, "RMSE": 0.0, "MAPE": 0.0},
                "Ensemble (RF+Ridge)": {"MAE": 0.0, "RMSE": 0.0, "MAPE": 0.0},
                "SARIMAX": {"MAE": 0.0, "RMSE": 0.0, "MAPE": 0.0}
            },
            "best_model": "Baseline",
            "confidence_score": 50.0,
            "model_version": MODEL_VERSION
        }
        
    df_feat = eval_results["df_feat"]
    best_model_name = eval_results["best_model_name"]
    feature_cols = eval_results["feature_cols"]
    metrics = eval_results["metrics"]
    ridge_full = eval_results["ridge_full"]
    rf_full = eval_results["rf_full"]
    sarimax_full = eval_results["sarimax_full"]
    
    last_row = df_feat.iloc[-1].copy()
    last_date = last_row["date"]
    
    best_rmse = metrics.get(best_model_name, {}).get("RMSE", 1.5)
    rmse = max(0.5, float(best_rmse))
    
    forecasts = []
    recent_rates = list(df_feat["freight_rate"].values[-12:])
    
    exog_fuel = float(last_row["fuel_index"])
    exog_fx = float(last_row["fx_rate"])
    exog_congestion = float(last_row["congestion_index"])
    exog_demand = float(last_row["demand_index"])
    exog_disruption = float(last_row["disruption_score"])
    
    for step in range(1, 14):
        step_date = last_date + timedelta(weeks=step)
        
        month = step_date.month
        week_of_year = float(step_date.isocalendar()[1])
        quarter = (month - 1) // 3 + 1
        
        lag_1 = recent_rates[-1]
        lag_2 = recent_rates[-2]
        lag_4 = recent_rates[-4]
        
        rolling_mean_4 = float(np.mean(recent_rates[-4:]))
        rolling_mean_12 = float(np.mean(recent_rates[-12:]))
        rolling_std_4 = float(np.std(recent_rates[-4:]))
        
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
        
        feat_df = pd.DataFrame([feat_dict])[feature_cols]

        if best_model_name == "ML (Ridge)":
            p50_val = float(ridge_full.predict(feat_df)[0])
        elif best_model_name == "SARIMAX" and sarimax_full is not None:
            try:
                exog_step = pd.DataFrame([[exog_fuel, exog_demand, exog_congestion]], columns=["fuel_index", "demand_index", "congestion_index"])
                p50_val = float(sarimax_full.forecast(steps=step, exog=exog_step).values[-1])
            except Exception:
                p50_val = float(ridge_full.predict(feat_df)[0])
        elif best_model_name == "Baseline":
            hist_idx = len(df_feat) - 52 + step
            if 0 <= hist_idx < len(df_feat):
                p50_val = float(df_feat.iloc[hist_idx]["freight_rate"])
            else:
                p50_val = float(lag_1)
        else: # Default Ensemble (RF + Ridge)
            ridge_p = float(ridge_full.predict(feat_df)[0])
            rf_p = float(rf_full.predict(feat_df)[0])
            p50_val = 0.5 * ridge_p + 0.5 * rf_p

        p50_val = max(10.0, round(p50_val, 2))
        recent_rates.append(p50_val)

        # Horizon multiplier for prediction intervals (increases with horizon sqrt(step))
        std_err = rmse * np.sqrt(step)
        
        # P10 (10th percentile, z = -1.282), P90 (90th percentile, z = +1.282)
        p10_val = max(8.0, round(p50_val - 1.282 * std_err, 2))
        p90_val = round(p50_val + 1.282 * std_err, 2)
        
        # 95% Confidence Interval for lower/upper bounds
        lower_bound = max(8.0, round(p50_val - 1.96 * std_err, 2))
        upper_bound = round(p50_val + 1.96 * std_err, 2)

        forecasts.append({
            "date": step_date.date().isoformat(),
            "predicted_rate": p50_val,
            "p10_rate": p10_val,
            "p50_rate": p50_val,
            "p90_rate": p90_val,
            "lower_bound": lower_bound,
            "upper_bound": upper_bound,
            "lower_ci": lower_bound,
            "upper_ci": upper_bound,
            "horizon_days": step * 7
        })

    val_mape = metrics.get(best_model_name, {}).get("MAPE", 10.0)
    confidence_score = max(50.0, min(98.0, 100.0 - val_mape))
    
    return {
        "forecast": forecasts,
        "metrics": metrics,
        "best_model": best_model_name,
        "confidence_score": round(confidence_score, 1),
        "model_version": MODEL_VERSION,
        "walk_forward_metrics": metrics
    }
