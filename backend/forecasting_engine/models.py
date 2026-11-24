"""
Statistical and ML forecasting pipeline with zero-leakage expanding-window backtesting.

Evaluates baseline, smoothing, ARIMA/SARIMA, and Ridge time-regression candidates chronologically,
applies rolling fit caps (2,000 observations for Holt-Winters/ARIMA, 730 for SARIMA) for predictable
latency, selects models via RMSE/MAE with a parsimony rule, and emits 80%/90%/95% intervals.
"""
from __future__ import annotations

import math
import warnings as py_warnings
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional, Tuple

import numpy as np
from scipy.stats import t as student_t
from sklearn.linear_model import Ridge
from statsmodels.tsa.arima.model import ARIMA
from statsmodels.tsa.holtwinters import ExponentialSmoothing
from statsmodels.tsa.statespace.sarimax import SARIMAX

from .frequency import (
    AlignedSeries,
    DAYS_PER_STEP_BY_FREQ,
    ForecastInputError,
    advance_timestamps,
    impute_causal_slice,
    resolve_horizon_steps,
)
from .prepare import PreparedSeries


ALL_MODELS = (
    "naive",
    "seasonal_naive",
    "moving_average",
    "ets",
    "holt_winters",
    "arima",
    "sarima",
    "linear_regression",
)

SEASONAL_MODELS = {"seasonal_naive", "holt_winters", "sarima"}

MODEL_LABELS: Dict[str, str] = {
    "naive": "Naive (Last Value)",
    "seasonal_naive": "Seasonal Naive",
    "moving_average": "Moving Average",
    "ets": "Exponential Smoothing (ETS)",
    "holt_winters": "Holt-Winters Seasonal",
    "arima": "ARIMA",
    "sarima": "SARIMA",
    "linear_regression": "Time-Indexed Regression",
}

MODEL_COMPLEXITY: Dict[str, int] = {
    "naive": 1,
    "seasonal_naive": 2,
    "moving_average": 2,
    "linear_regression": 3,
    "ets": 4,
    "holt_winters": 5,
    "arima": 6,
    "sarima": 7,
}

CONFIDENCE_ALPHA_LEVELS = {
    "80": 0.80,
    "90": 0.90,
    "95": 0.95,
}


@dataclass
class ModelCandidateResult:
    model: str
    label: str
    status: str  # 'evaluated' | 'skipped' | 'failed'
    skip_reason: Optional[str] = None
    mae: Optional[float] = None
    rmse: Optional[float] = None
    mase: Optional[float] = None
    mape: Optional[float] = None
    beats_baseline: Optional[bool] = None
    backtesting_windows: int = 0
    training_observations: int = 0
    validation_observations: int = 0
    residual_std: float = 0.0
    cv_horizon_steps: int = 0
    cv_step_rmse: Dict[int, float] = field(default_factory=dict)
    cv_step_abs_errors: Dict[int, List[float]] = field(default_factory=dict)
    cv_origin_abs_errors: List[Dict[int, float]] = field(default_factory=list)


def _clean_float(val: float, fallback: float = 0.0) -> float:
    if val is None or math.isnan(val) or math.isinf(val):
        return fallback
    return float(val)


def _fit_and_predict_raw(
    train: np.ndarray,
    steps: int,
    model_name: str,
    seasonal_period: int,
) -> Tuple[np.ndarray, float, Dict[str, Any]]:
    n = len(train)
    if n < 2:
        raise ValueError("Need at least 2 observations to fit a model.")

    # Constant series fast path to keep statistical models stable
    if np.allclose(train, train[0], atol=1e-9):
        const_val = float(train[-1])
        return np.full(steps, const_val, dtype=float), 0.0, {"constantSeries": True}

    m = seasonal_period

    if model_name == "naive":
        preds = np.full(steps, float(train[-1]), dtype=float)
        resids = np.diff(train)
        sigma = float(np.std(resids, ddof=1)) if len(resids) > 1 else float(np.std(train))
        return preds, sigma, {}

    if model_name == "seasonal_naive":
        if m <= 1 or n < m:
            raise ValueError(f"Seasonal Naive requires seasonal period > 1 and at least {m} observations.")
        last_season = train[-m:]
        preds = np.array([last_season[i % m] for i in range(steps)], dtype=float)
        resids = train[m:] - train[:-m]
        sigma = float(np.std(resids, ddof=1)) if len(resids) > 1 else float(np.std(np.diff(train)))
        return preds, sigma, {"seasonalPeriod": m}

    if model_name == "moving_average":
        window = min(max(2, m if (m > 1 and n >= m * 2) else min(4, max(2, n // 3))), n)
        history = list(train.astype(float))
        preds_list: List[float] = []
        for _ in range(steps):
            preds_list.append(float(np.mean(history[-window:])))
            history.append(preds_list[-1])
        fitted = np.array([np.mean(train[max(0, i - window):i]) for i in range(1, n)], dtype=float)
        resids = train[1:] - fitted
        sigma = float(np.std(resids, ddof=1)) if len(resids) > 1 else float(np.std(train))
        return np.array(preds_list, dtype=float), sigma, {"window": window}

    if model_name == "ets":
        with py_warnings.catch_warnings():
            py_warnings.simplefilter("ignore")
            best_fit = None
            best_aic = float("inf")
            configs = [
                {"trend": "add", "damped_trend": True},
                {"trend": "add", "damped_trend": False},
                {"trend": None, "damped_trend": False},
            ]
            for cfg in configs:
                if n < 5 and cfg["trend"] is not None:
                    continue
                try:
                    mod = ExponentialSmoothing(
                        train,
                        trend=cfg["trend"],
                        damped_trend=cfg["damped_trend"],
                        seasonal=None,
                        initialization_method="estimated" if n >= 6 else "heuristic",
                    )
                    fit = mod.fit(optimized=True)
                    aic = float(getattr(fit, "aic", float("inf")))
                    fc = np.asarray(fit.forecast(steps), dtype=float)
                    if np.all(np.isfinite(fc)) and aic < best_aic:
                        best_aic = aic
                        best_fit = (fit, fc, cfg)
                except Exception:
                    continue
            if best_fit is None:
                raise ValueError("ETS failed to converge on this series.")
            fit, fc, cfg = best_fit
            resids = train - np.asarray(fit.fittedvalues, dtype=float)
            sigma = float(np.std(resids, ddof=1)) if len(resids) > 1 else float(np.std(np.diff(train)))
            return fc, sigma, {"trend": cfg["trend"], "damped": cfg["damped_trend"], "aic": round(best_aic, 2)}

    if model_name == "holt_winters":
        if m <= 1 or n < 2 * m:
            raise ValueError(f"Holt-Winters requires at least {2 * m} observations for seasonal period {m}.")
        hw_train = train[-1500:] if n > 1500 else train
        hw_positive_only = bool(np.all(hw_train > 0.0))
        with py_warnings.catch_warnings():
            py_warnings.simplefilter("ignore")
            best_fit = None
            best_aic = float("inf")
            seasonal_modes = ["add", "mul"] if hw_positive_only else ["add"]
            hw_configs = [
                {"trend": "add", "damped_trend": True, "seasonal": seas}
                for seas in seasonal_modes
            ] + [
                {"trend": "add", "damped_trend": False, "seasonal": seas}
                for seas in seasonal_modes
            ] + [
                {"trend": None, "damped_trend": False, "seasonal": "add"}
            ]
            for cfg in hw_configs:
                try:
                    mod = ExponentialSmoothing(
                        hw_train,
                        trend=cfg["trend"],
                        damped_trend=cfg["damped_trend"],
                        seasonal=cfg["seasonal"],
                        seasonal_periods=m,
                        initialization_method="estimated",
                    )
                    fit = mod.fit(optimized=True)
                    aic = float(getattr(fit, "aic", float("inf")))
                    fc = np.asarray(fit.forecast(steps), dtype=float)
                    if np.all(np.isfinite(fc)) and aic < best_aic:
                        best_aic = aic
                        best_fit = (fit, fc, cfg["seasonal"], cfg["damped_trend"], cfg["trend"])
                except Exception:
                    continue
            if best_fit is None:
                raise ValueError("Holt-Winters seasonal smoothing failed to converge.")
            fit, fc, seas, damped, trend_mode = best_fit
            resids = hw_train - np.asarray(fit.fittedvalues, dtype=float)
            sigma = float(np.std(resids, ddof=1)) if len(resids) > 1 else float(np.std(np.diff(hw_train)))
            return (
                fc,
                sigma,
                {"seasonal": seas, "trend": trend_mode, "damped": damped, "seasonalPeriod": m, "aic": round(best_aic, 2)},
            )

    if model_name == "arima":
        if n < 6:
            raise ValueError("ARIMA requires at least 6 historical observations.")
        arima_train = train[-1500:] if n > 1500 else train
        with py_warnings.catch_warnings():
            py_warnings.simplefilter("ignore")
            if len(arima_train) > 400:
                candidate_orders = [(1, 1, 1), (1, 1, 0), (0, 1, 1)]
            else:
                candidate_orders = [(1, 1, 1), (1, 1, 0), (0, 1, 1), (1, 0, 1), (1, 0, 0), (0, 1, 0)]
                if len(arima_train) >= 16:
                    candidate_orders.append((2, 1, 1))
            best_fit = None
            best_aic = float("inf")
            for order in candidate_orders:
                try:
                    mod = ARIMA(arima_train, order=order, enforce_stationarity=True, enforce_invertibility=True)
                    fit = mod.fit()
                    aic = float(fit.aic)
                    fc = np.asarray(fit.forecast(steps=steps), dtype=float)
                    if np.all(np.isfinite(fc)) and aic < best_aic:
                        best_aic = aic
                        best_fit = (fit, fc, order)
                except Exception:
                    continue
            if best_fit is None:
                raise ValueError("ARIMA failed to converge on this series.")
            fit, fc, order = best_fit
            resids = np.asarray(fit.resid, dtype=float)
            p, d, _ = order
            burn_in = min(max(1, d + p), max(1, len(resids) - 3))
            clean_resids = resids[burn_in:]
            sigma = float(np.std(clean_resids, ddof=1)) if len(clean_resids) > 1 else float(np.std(np.diff(arima_train)))
            return fc, sigma, {"order": list(order), "aic": round(best_aic, 2), "isIntegrated": d > 0}

    if model_name == "sarima":
        if m <= 1 or n < 2 * m:
            raise ValueError(f"SARIMA requires at least {2 * m} observations for seasonal period {m}.")
        if m > 24:
            raise ValueError(
                f"SARIMA state-space estimation is skipped for long seasonal cycles (m={m}); use Holt-Winters, Seasonal Naive, or Regression."
            )
        sarima_train = train[-450:] if n > 450 else train
        with py_warnings.catch_warnings():
            py_warnings.simplefilter("ignore")
            candidate_specs = (
                [((1, 1, 0), (1, 0, 0, m))]
                if len(sarima_train) > 300
                else [
                    ((1, 1, 0), (1, 0, 0, m)),
                    ((0, 1, 1), (0, 1, 1, m)),
                ]
            )
            if m <= 4 and len(sarima_train) <= 300:
                candidate_specs.append(((1, 0, 0), (1, 0, 0, m)))
            best_fit = None
            best_aic = float("inf")
            for order, s_order in candidate_specs:
                try:
                    mod = SARIMAX(
                        sarima_train,
                        order=order,
                        seasonal_order=s_order,
                        enforce_stationarity=True,
                        enforce_invertibility=True,
                    )
                    fit = mod.fit(disp=False, maxiter=25, low_memory=True)
                    aic = float(fit.aic)
                    fc = np.asarray(fit.forecast(steps=steps), dtype=float)
                    if np.all(np.isfinite(fc)) and aic < best_aic:
                        best_aic = aic
                        best_fit = (fit, fc, order, s_order)
                except Exception:
                    continue
            if best_fit is None:
                raise ValueError("SARIMA failed to converge on this series.")
            fit, fc, order, s_order = best_fit
            resids = np.asarray(fit.resid, dtype=float)
            p, d, _ = order
            P, D, _, _ = s_order
            # Trim Kalman/differencing burn-in spikes so residual sigma reflects 1-step innovation noise
            burn_in = min(max(1, d + D * m + max(p, P * m)), max(1, len(resids) - 4))
            clean_resids = resids[burn_in:]
            sigma = (
                float(np.std(clean_resids, ddof=1))
                if len(clean_resids) > 1
                else float(np.std(np.diff(sarima_train)))
            )
            return (
                fc,
                sigma,
                {"order": list(order), "seasonalOrder": list(s_order), "aic": round(best_aic, 2), "isIntegrated": (d + D) > 0},
            )

    if model_name == "linear_regression":
        # Pure chronological trend + deterministic Fourier harmonics if seasonal history suffices (zero leakage)
        # Standardized in X and Y so Ridge regularization is scale-invariant from 1e-6 to 1e9.
        use_seasonality = m > 1 and n >= 2 * m

        def make_features(indices: np.ndarray) -> np.ndarray:
            cols = [indices / max(1.0, float(n))]
            if use_seasonality:
                cols.append(np.sin(2.0 * np.pi * indices / float(m)))
                cols.append(np.cos(2.0 * np.pi * indices / float(m)))
                if m >= 7 and n >= 3 * m:
                    cols.append(np.sin(4.0 * np.pi * indices / float(m)))
                    cols.append(np.cos(4.0 * np.pi * indices / float(m)))
            return np.column_stack(cols)

        x_train = make_features(np.arange(n, dtype=float))
        x_mean = np.mean(x_train, axis=0)
        x_std_raw = np.std(x_train, axis=0)
        x_std = np.where(x_std_raw > 1e-12, x_std_raw, 1.0)
        x_tr_scaled = (x_train - x_mean) / x_std

        y_mean = float(np.mean(train))
        y_std = float(np.std(train))
        if y_std <= 1e-12:
            y_std = 1.0
        y_tr_scaled = (train - y_mean) / y_std

        alpha = min(1.0, max(0.05, 1.0 / max(1.0, float(n) * 0.25)))
        reg = Ridge(alpha=alpha)
        reg.fit(x_tr_scaled, y_tr_scaled)
        fitted = y_mean + y_std * reg.predict(x_tr_scaled)
        resids = train - fitted
        dof = max(1, n - x_train.shape[1] - 1)
        sigma = float(np.sqrt(np.sum(resids ** 2) / dof))

        x_future = make_features(np.arange(n, n + steps, dtype=float))
        x_fut_scaled = (x_future - x_mean) / x_std
        fc = y_mean + y_std * reg.predict(x_fut_scaled)
        resid_autocorr = 0.0
        if len(resids) >= 8 and np.std(resids[:-1]) > 1e-12 and np.std(resids[1:]) > 1e-12:
            c = float(np.corrcoef(resids[:-1], resids[1:])[0, 1])
            if np.isfinite(c):
                resid_autocorr = max(0.0, min(0.99, c))
        return (
            np.asarray(fc, dtype=float),
            sigma,
            {
                "seasonalFourier": use_seasonality,
                "ridgeAlpha": round(alpha, 4),
                "scaled": True,
                "residualAutocorr": round(resid_autocorr, 4),
            },
        )

    raise ValueError(f"Unknown forecasting model '{model_name}'.")


def _compute_metrics(actuals: np.ndarray, preds: np.ndarray, full_train_scale: float) -> Tuple[float, float, Optional[float], Optional[float]]:
    errors = actuals - preds
    mae = float(np.mean(np.abs(errors)))
    rmse = float(np.sqrt(np.mean(errors ** 2)))
    mase = float(mae / full_train_scale) if full_train_scale > 1e-9 else (0.0 if mae <= 1e-9 else None)

    if np.any(np.abs(actuals) <= 1e-6):
        mape = None
    else:
        mape = float(np.mean(np.abs(errors / actuals)) * 100.0)
    return mae, rmse, mase, mape


def _resolve_cv_plan(
    n: int,
    seasonal_period: int,
    horizon_steps: int,
    model_name: str,
    common_min_train: Optional[int] = None,
) -> Tuple[int, int, List[int]]:
    min_train = common_min_train
    if min_train is None:
        min_train = max(3 if model_name in {"naive", "moving_average", "linear_regression"} else 6, int(math.floor(n * 0.6)))
        if model_name in SEASONAL_MODELS:
            min_train = max(min_train, min(n - 1, 2 * seasonal_period if model_name in {"holt_winters", "sarima"} else seasonal_period))
    if min_train >= n:
        min_train = max(2, n - 1)

    available_val = n - min_train
    if available_val < 1:
        return min_train, 0, []

    # Scale CV horizon proportionally toward target forecast horizon (up to 30 steps) so multi-step divergence is penalized
    if available_val >= 8:
        cv_cap = max(4, min(30, available_val // 2))
        cv_horizon = min(horizon_steps, cv_cap)
    else:
        cv_horizon = min(horizon_steps, available_val)
    cv_horizon = max(1, cv_horizon)

    max_origins = 6 if n < 500 else 3
    eval_start = max(min_train, n - cv_horizon - max(60, 6 * cv_horizon)) if n >= 200 else min_train
    span = n - eval_start - cv_horizon + 1
    if span <= 0:
        origin_indices = [max(2, n - 1)]
        cv_horizon = min(cv_horizon, n - origin_indices[0])
        return min_train, cv_horizon, origin_indices

    num_origins = min(max_origins, span)
    if num_origins <= 1:
        origin_indices = [eval_start]
    else:
        origin_indices = sorted(
            {int(x) for x in np.round(np.linspace(eval_start, n - cv_horizon, num=num_origins))}
        )
    return min_train, cv_horizon, origin_indices


def _evaluate_rolling_origin(
    series: np.ndarray,
    model_name: str,
    seasonal_period: int,
    horizon_steps: int,
    common_min_train: Optional[int] = None,
) -> ModelCandidateResult:
    """
    Runs chronological expanding-window cross-validation without future leakage.
    Accepts a raw series containing NaNs for unobserved periods: each training fold
    imputes gaps strictly inside `[:split]`, and validation metrics score ONLY observed periods.
    """
    label = MODEL_LABELS[model_name]
    raw_series = np.asarray(series, dtype=float)
    n = len(raw_series)
    obs_count_total = int(np.sum(~np.isnan(raw_series)))

    min_required_for_cv = (2 * seasonal_period + 1) if model_name in {"holt_winters", "sarima"} else (2 * seasonal_period)
    if model_name in SEASONAL_MODELS and (seasonal_period <= 1 or n < min_required_for_cv):
        reason = (
            f"Skipped because {seasonal_period == 1 and 'yearly series has no intra-year seasonal cycle' or f'requires at least {min_required_for_cv} observations (found {n})'}."
        )
        return ModelCandidateResult(
            model=model_name,
            label=label,
            status="skipped",
            skip_reason=reason,
            training_observations=obs_count_total,
        )

    if model_name == "sarima" and seasonal_period > 24:
        return ModelCandidateResult(
            model=model_name,
            label=label,
            status="skipped",
            skip_reason=f"Skipped because SARIMA state-space estimation is limited to seasonal periods <= 24 (found {seasonal_period}).",
            training_observations=obs_count_total,
        )

    _, cv_horizon, origin_indices = _resolve_cv_plan(
        n=n,
        seasonal_period=seasonal_period,
        horizon_steps=horizon_steps,
        model_name=model_name,
        common_min_train=common_min_train,
    )
    if cv_horizon < 1 or not origin_indices:
        return ModelCandidateResult(
            model=model_name,
            label=label,
            status="skipped",
            skip_reason="Insufficient history for out-of-sample backtesting.",
            training_observations=obs_count_total,
        )

    all_actuals: List[float] = []
    all_preds: List[float] = []
    naive_actuals: List[float] = []
    naive_preds: List[float] = []
    fold_naive_scales: List[float] = []
    step_sq_errors: Dict[int, List[float]] = {}
    step_abs_errors: Dict[int, List[float]] = {}
    origin_abs_errors: List[Dict[int, float]] = []
    windows_completed = 0

    for split in origin_indices:
        # Causal imputation STRICTLY inside raw_series[:split] — zero future peeking
        train_slice = impute_causal_slice(raw_series[:split])
        raw_val_slice = raw_series[split : split + cv_horizon]
        obs_val_mask = ~np.isnan(raw_val_slice)
        if not np.any(obs_val_mask):
            continue
        try:
            fc, _, _ = _fit_and_predict_raw(train_slice, len(raw_val_slice), model_name, seasonal_period)
            if not np.all(np.isfinite(fc)):
                raise ValueError("Non-finite backtest forecast produced.")

            valid_act = raw_val_slice[obs_val_mask]
            valid_pred = fc[obs_val_mask]
            all_actuals.extend(valid_act.tolist())
            all_preds.extend(valid_pred.tolist())
            naive_actuals.extend(valid_act.tolist())
            naive_preds.extend([float(train_slice[-1])] * len(valid_act))

            origin_err_map: Dict[int, float] = {}
            for step_offset in range(len(raw_val_slice)):
                if obs_val_mask[step_offset]:
                    err = float(raw_val_slice[step_offset] - fc[step_offset])
                    step_sq_errors.setdefault(step_offset + 1, []).append(err * err)
                    abs_e = abs(err)
                    step_abs_errors.setdefault(step_offset + 1, []).append(abs_e)
                    origin_err_map[step_offset + 1] = abs_e
            if origin_err_map:
                origin_abs_errors.append(origin_err_map)

            # Hyndman-Koehler seasonal MASE denominator when seasonal_period > 1
            if seasonal_period > 1 and len(train_slice) > seasonal_period:
                scale_diffs = np.abs(train_slice[seasonal_period:] - train_slice[:-seasonal_period])
            else:
                scale_diffs = np.abs(np.diff(train_slice))
            if len(scale_diffs) > 0:
                fold_naive_scales.append(float(np.mean(scale_diffs)))
            windows_completed += 1
        except Exception as exc:
            if split == origin_indices[0] and len(origin_indices) == 1:
                return ModelCandidateResult(
                    model=model_name,
                    label=label,
                    status="failed",
                    skip_reason=str(exc),
                    training_observations=obs_count_total,
                )
            continue

    if not all_actuals:
        return ModelCandidateResult(
            model=model_name,
            label=label,
            status="failed",
            skip_reason="Could not complete rolling-origin validation on observed periods.",
            training_observations=obs_count_total,
        )

    act_arr = np.array(all_actuals, dtype=float)
    pred_arr = np.array(all_preds, dtype=float)
    naive_pred_arr = np.array(naive_preds, dtype=float)

    in_sample_naive_scale = float(np.mean(fold_naive_scales)) if fold_naive_scales else 0.0
    mae, rmse, mase, mape = _compute_metrics(act_arr, pred_arr, in_sample_naive_scale)
    naive_mae = float(np.mean(np.abs(np.array(naive_actuals) - naive_pred_arr)))

    # Fit on causal full-history series to obtain clean innovation scale for final intervals
    full_series = impute_causal_slice(raw_series)
    try:
        _, sigma, _ = _fit_and_predict_raw(full_series, horizon_steps, model_name, seasonal_period)
    except Exception as exc:
        return ModelCandidateResult(
            model=model_name,
            label=label,
            status="failed",
            skip_reason=f"Full-series fit failed: {exc}",
            training_observations=obs_count_total,
        )

    cv_step_rmse = {
        h: float(np.sqrt(np.mean(errs)))
        for h, errs in step_sq_errors.items()
        if errs
    }
    effective_sigma = sigma if sigma > 1e-12 else rmse

    return ModelCandidateResult(
        model=model_name,
        label=label,
        status="evaluated",
        mae=round(_clean_float(mae), 6),
        rmse=round(_clean_float(rmse), 6),
        mase=round(mase, 6) if mase is not None else None,
        mape=round(mape, 4) if mape is not None else None,
        beats_baseline=(mae <= naive_mae + 1e-9) if model_name != "naive" else True,
        backtesting_windows=windows_completed,
        training_observations=obs_count_total,
        validation_observations=len(all_actuals),
        residual_std=_clean_float(effective_sigma),
        cv_horizon_steps=cv_horizon,
        cv_step_rmse=cv_step_rmse,
        cv_step_abs_errors=step_abs_errors,
        cv_origin_abs_errors=origin_abs_errors,
    )


def _compute_theory_mult(
    steps: int,
    n_train: int,
    seasonal_period: int,
    model_name: str,
    fit_meta: Dict[str, Any],
) -> np.ndarray:
    horizons = np.arange(1, steps + 1, dtype=float)
    is_integrated = model_name in {"naive", "seasonal_naive"} or bool(fit_meta.get("isIntegrated", False))
    if model_name == "seasonal_naive" and seasonal_period > 1:
        cycles = np.floor((horizons - 1.0) / float(seasonal_period)) + 1.0
        return np.sqrt(cycles * (1.0 + horizons / max(8.0, float(n_train))))
    if is_integrated:
        return np.sqrt(horizons * (1.0 + horizons / max(8.0, float(n_train))))
    if model_name == "ets" and fit_meta.get("trend") == "add":
        damp_cap = 0.45 if fit_meta.get("damped") else 0.70
        return np.sqrt(1.0 + damp_cap * (horizons - 1.0) + (horizons ** 2) / max(16.0, float(n_train) * 2.0))
    if model_name == "holt_winters" and fit_meta.get("trend") == "add":
        damp_cap = 0.16 if fit_meta.get("damped") else 0.28
        return np.sqrt(1.0 + damp_cap * (horizons - 1.0) + (horizons ** 2) / max(24.0, float(n_train) * 2.0))
    persist = max(0.0, float(fit_meta.get("residualAutocorr", 0.0)))
    growth = 0.06 + (0.45 * (((persist - 0.5) / 0.5) ** 2) if persist > 0.5 else 0.0)
    return np.sqrt(1.0 + growth * (horizons - 1.0) + (horizons ** 2) / max(24.0, float(n_train) * 3.0))


def _conformal_abs_quantile(abs_errors: np.ndarray, conf: float) -> float:
    m = len(abs_errors)
    if m == 0:
        return 0.0
    if m == 1:
        return float(abs_errors[0])
    # Exact finite-sample split-conformal order statistic ceil((m + 1) * conf)
    rank = min(m, max(1, int(math.ceil((m + 1) * conf))))
    return float(np.sort(abs_errors)[rank - 1])


def _compute_pooled_monotone_hw(
    errs_map: Dict[int, List[float]],
    steps: int,
    n_train: int,
    seasonal_period: int,
    model_name: str,
    fit_meta: Dict[str, Any],
) -> Dict[str, np.ndarray]:
    tot_res = sum(len(v) for v in errs_map.values())
    max_cv_h = max(errs_map.keys())
    theory_mult = _compute_theory_mult(
        steps=max(steps, max_cv_h),
        n_train=n_train,
        seasonal_period=seasonal_period,
        model_name=model_name,
        fit_meta=fit_meta,
    )
    min_bin_size = min(16, tot_res)
    raw_half_widths: Dict[str, np.ndarray] = {lvl: np.zeros(steps, dtype=float) for lvl in CONFIDENCE_ALPHA_LEVELS}

    for h in range(1, steps + 1):
        anchor_h = min(h, max_cv_h)
        extrapolate = h > max_cv_h
        target_scale = max(float(theory_mult[h - 1]), 1e-12)
        pooled: List[float] = []
        radius = 0
        while len(pooled) < min_bin_size and radius <= max_cv_h:
            lo_step = max(1, anchor_h - radius)
            hi_step = min(max_cv_h, anchor_h + radius)
            pooled = []
            for k in range(lo_step, hi_step + 1):
                errs_k = errs_map.get(k)
                if not errs_k:
                    continue
                if extrapolate:
                    k_scale = max(float(theory_mult[k - 1]), 1e-12)
                    ratio = target_scale / k_scale
                    pooled.extend(float(e) * ratio for e in errs_k)
                else:
                    pooled.extend(float(e) for e in errs_k)
            radius += 1

        pooled_arr = np.asarray(pooled, dtype=float)
        for level_str, conf in CONFIDENCE_ALPHA_LEVELS.items():
            raw_half_widths[level_str][h - 1] = _conformal_abs_quantile(pooled_arr, conf)

    hw80 = np.maximum.accumulate(raw_half_widths["80"])
    hw90 = np.maximum(hw80, np.maximum.accumulate(raw_half_widths["90"]))
    hw95 = np.maximum(hw90, np.maximum.accumulate(raw_half_widths["95"]))
    return {"80": hw80, "90": hw90, "95": hw95}


def _build_intervals(
    point_forecasts: np.ndarray,
    residual_sigma: float,
    cv_rmse: Optional[float],
    cv_step_rmse: Dict[int, float],
    cv_step_abs_errors: Dict[int, List[float]],
    validation_obs: int,
    n_train: int,
    seasonal_period: int,
    model_name: str,
    fit_meta: Dict[str, Any],
    cv_origin_abs_errors: Optional[List[Dict[int, float]]] = None,
) -> Tuple[Dict[str, List[Dict[str, float]]], str, Dict[str, float]]:
    """
    Constructs symmetric split-conformal prediction intervals from rolling-origin CV
    absolute residuals of the selected model per horizon step h (neighbor-step pooling
    without theory_mult distortion inside observed CV horizons, monotone width enforcement,
    and leave-one-origin-out CV coverage calibration). Falls back to analytical Student-t
    intervals when fewer than 20 CV residuals are available.
    """
    steps = len(point_forecasts)
    total_cv_residuals = sum(len(v) for v in cv_step_abs_errors.values()) if cv_step_abs_errors else 0

    if total_cv_residuals >= 20:
        max_cv_h = max(cv_step_abs_errors.keys())
        monotone_hw = _compute_pooled_monotone_hw(
            cv_step_abs_errors,
            steps,
            n_train,
            seasonal_period,
            model_name,
            fit_meta,
        )

        # Leave-one-origin-out calibration scale factor so out-of-sample CV coverage matches nominal
        calibration_scales: Dict[str, float] = {"80": 1.0, "90": 1.0, "95": 1.0}
        ratios_by_lvl: Dict[str, List[float]] = {"80": [], "90": [], "95": []}
        if cv_origin_abs_errors and len(cv_origin_abs_errors) >= 3:
            loo_steps = min(steps, max_cv_h)
            for j in range(len(cv_origin_abs_errors)):
                loo_map: Dict[int, List[float]] = {}
                for jj, oe in enumerate(cv_origin_abs_errors):
                    if jj == j:
                        continue
                    for hk, ae in oe.items():
                        loo_map.setdefault(hk, []).append(ae)
                if not loo_map:
                    continue
                hw_loo = _compute_pooled_monotone_hw(
                    loo_map,
                    loo_steps,
                    n_train,
                    seasonal_period,
                    model_name,
                    fit_meta,
                )
                for level_str in ("80", "90", "95"):
                    for hk, ae in cv_origin_abs_errors[j].items():
                        if 1 <= hk <= len(hw_loo[level_str]) and hw_loo[level_str][hk - 1] > 1e-12:
                            ratios_by_lvl[level_str].append(float(ae) / float(hw_loo[level_str][hk - 1]))
        else:
            for level_str in ("80", "90", "95"):
                base_hw = monotone_hw[level_str]
                for h_k, errs_k in cv_step_abs_errors.items():
                    if 1 <= h_k <= len(base_hw) and base_hw[h_k - 1] > 1e-12:
                        denom = float(base_hw[h_k - 1])
                        for err_val in errs_k:
                            ratios_by_lvl[level_str].append(float(err_val) / denom)

        for level_str, conf in CONFIDENCE_ALPHA_LEVELS.items():
            rs = ratios_by_lvl[level_str]
            if len(rs) >= 12:
                raw_scale = _conformal_abs_quantile(np.asarray(rs, dtype=float), conf)
                bounded_scale = max(0.75, min(1.50, float(raw_scale)))
                monotone_hw[level_str] = np.maximum.accumulate(monotone_hw[level_str] * bounded_scale)
                calibration_scales[level_str] = round(bounded_scale, 4)

        monotone_hw["90"] = np.maximum(monotone_hw["80"], monotone_hw["90"])
        monotone_hw["95"] = np.maximum(monotone_hw["90"], monotone_hw["95"])

        intervals: Dict[str, List[Dict[str, float]]] = {}
        for level_str in ("80", "90", "95"):
            rows: List[Dict[str, float]] = []
            hw_arr = monotone_hw[level_str]
            for idx in range(steps):
                pt = float(point_forecasts[idx])
                hw = float(hw_arr[idx])
                rows.append({"lower": round(pt - hw, 4), "upper": round(pt + hw, 4)})
            intervals[level_str] = rows
        return intervals, "empirical_cv_quantile", calibration_scales

    # Fallback (< 20 pooled CV residuals): analytical/heuristic Student-t bounds
    fallback_scales = {"80": 1.0, "90": 1.0, "95": 1.0}
    if residual_sigma <= 1e-12 and (cv_rmse is None or cv_rmse <= 1e-12):
        zeros = [{"lower": round(float(pt), 4), "upper": round(float(pt), 4)} for pt in point_forecasts]
        return {"80": zeros, "90": list(zeros), "95": list(zeros)}, "heuristic_fallback", fallback_scales

    base_sigma = residual_sigma if residual_sigma > 1e-12 else float(cv_rmse or 0.0)
    theory_mult = _compute_theory_mult(steps, n_train, seasonal_period, model_name, fit_meta)
    raw_step_scales = base_sigma * theory_mult

    if cv_step_rmse and validation_obs >= 2:
        matched_pairs = [
            (obs_rmse, raw_step_scales[h - 1])
            for h, obs_rmse in cv_step_rmse.items()
            if 1 <= h <= steps and raw_step_scales[h - 1] > 1e-12
        ]
        if matched_pairs:
            rms_obs = float(np.sqrt(np.mean([p[0] ** 2 for p in matched_pairs])))
            rms_theo = float(np.sqrt(np.mean([p[1] ** 2 for p in matched_pairs])))
            raw_ratio = rms_obs / max(rms_theo, 1e-12)
            weight = validation_obs / (validation_obs + 8.0)
            calib_ratio = max(0.85, min(2.4, 1.0 + weight * (raw_ratio - 1.0)))
            raw_step_scales = raw_step_scales * calib_ratio
            fallback_scales = {lvl: round(float(calib_ratio), 4) for lvl in ("80", "90", "95")}

    raw_step_scales = np.maximum.accumulate(raw_step_scales)
    df = max(4, min(120, n_train - 2))
    intervals = {}
    for level_str, conf in CONFIDENCE_ALPHA_LEVELS.items():
        crit = float(student_t.ppf(0.5 + conf / 2.0, df=df))
        rows = []
        for idx in range(steps):
            pt = float(point_forecasts[idx])
            half_width = float(crit * raw_step_scales[idx])
            rows.append(
                {
                    "lower": round(pt - half_width, 4),
                    "upper": round(pt + half_width, 4),
                }
            )
        intervals[level_str] = rows
    return intervals, "heuristic_fallback", fallback_scales


def run_forecast_pipeline(
    prepared: PreparedSeries,
    aligned: AlignedSeries,
    horizon_days: Optional[int] = 30,
    requested_model: str = "auto",
    business_template: Optional[str] = None,
    horizon_steps: Optional[int] = None,
) -> Dict[str, Any]:
    """Orchestrates candidate model evaluation, final full-series fit, uncertainty bounds, and telemetry."""
    req_model = (requested_model or "auto").lower()
    if req_model != "auto" and req_model not in ALL_MODELS:
        raise ForecastInputError(
            "INVALID_MODEL",
            f"Unsupported model '{requested_model}'. Choose auto or one of: {', '.join(ALL_MODELS)}.",
        )

    resolved_steps = resolve_horizon_steps(
        aligned.frequency,
        horizon_days=horizon_days,
        horizon_steps=horizon_steps,
    )
    resolved_horizon_days = (
        int(horizon_days)
        if (horizon_steps is None and horizon_days is not None)
        else int(resolved_steps * DAYS_PER_STEP_BY_FREQ[aligned.frequency])
    )

    # Build raw grid array preserving NaNs at unobserved dates for leakage-free CV
    if aligned.raw_grid_values and len(aligned.raw_grid_values) == len(aligned.grid_timestamps):
        raw_series = np.array([np.nan if v is None else float(v) for v in aligned.raw_grid_values], dtype=float)
    else:
        raw_series = np.array(aligned.grid_values, dtype=float)

    n_grid = len(raw_series)
    n_obs = len(aligned.observed_values)
    m = aligned.seasonal_period

    if req_model in SEASONAL_MODELS and (m <= 1 or n_grid < 2 * m):
        if m <= 1:
            raise ForecastInputError(
                "INCOMPATIBLE_MODEL",
                f"{MODEL_LABELS[req_model]} cannot run on yearly frequency because there is no intra-year seasonal cycle. Select Auto or a non-seasonal model.",
            )
        raise ForecastInputError(
            "INSUFFICIENT_SEASONAL_HISTORY",
            f"{MODEL_LABELS[req_model]} requires at least {2 * m} {aligned.frequency} periods to model seasonality reliably (found {n_grid}). Select Auto or a non-seasonal model.",
        )

    warnings = list(aligned.warnings)
    notes = list(aligned.notes)

    if n_obs < 8:
        warnings.append(
            f"Short historical sample ({n_obs} observed periods). Forecast uncertainty may be wide."
        )
    if resolved_steps > 0.5 * n_obs:
        warnings.append("Forecast is long relative to the history")
    if business_template == "inventory":
        notes.append(
            "Inventory forecast projects historical net inventory levels/usage only; replenishment lead times, safety stock, and supplier orders require external inventory policy inputs."
        )

    # Align all eligible Auto candidates to the exact same validation cutoffs when seasonal history supports it
    common_min_train: Optional[int] = None
    if m > 1 and n_grid >= 2 * m + 4:
        common_min_train = min(n_grid - 2, max(6, int(math.floor(n_grid * 0.6)), 2 * m))
    else:
        common_min_train = min(n_grid - 1, max(4, int(math.floor(n_grid * 0.6))))

    candidates: List[ModelCandidateResult] = []
    if req_model == "auto":
        for candidate_name in ALL_MODELS:
            candidates.append(
                _evaluate_rolling_origin(
                    raw_series,
                    candidate_name,
                    m,
                    resolved_steps,
                    common_min_train=common_min_train,
                )
            )
        evaluated = [c for c in candidates if c.status == "evaluated" and c.rmse is not None]
        if not evaluated:
            raise ForecastInputError(
                "MODEL_EXECUTION_FAILED",
                "None of the candidate forecasting models succeeded on this series.",
            )

        # Prefer models evaluated on full validation count when scoring apples-to-apples
        max_val_obs = max(c.validation_observations for c in evaluated)
        comparable = [c for c in evaluated if c.validation_observations == max_val_obs] or evaluated
        comparable.sort(
            key=lambda c: (
                c.rmse if c.rmse is not None else float("inf"),
                c.mae if c.mae is not None else float("inf"),
                MODEL_COMPLEXITY.get(c.model, 99),
            )
        )
        selected = comparable[0]

        # Parsimony check: prefer a simpler model if the complex winner improves RMSE by <= 1%
        best_rmse = selected.rmse if selected.rmse is not None else float("inf")
        selected_complexity = MODEL_COMPLEXITY.get(selected.model, 99)
        simpler_near_ties = [
            c
            for c in comparable
            if MODEL_COMPLEXITY.get(c.model, 99) < selected_complexity
            and c.rmse is not None
            and c.rmse <= best_rmse * 1.01 + 1e-9
        ]
        if simpler_near_ties:
            simpler_near_ties.sort(key=lambda c: (MODEL_COMPLEXITY.get(c.model, 99), c.rmse or float("inf")))
            chosen_simple = simpler_near_ties[0]
            if chosen_simple.model != selected.model:
                notes.append(
                    f"Preferred simpler model '{chosen_simple.label}' because more complex candidates improved rolling-origin RMSE by less than 1%."
                )
                selected = chosen_simple

        naive_res = next((c for c in comparable if c.model == "naive"), None)
        if naive_res and selected.model != "naive" and selected.mae is not None and naive_res.mae is not None:
            if selected.mae > naive_res.mae * 1.02 and selected.rmse is not None and naive_res.rmse is not None and selected.rmse > naive_res.rmse * 1.02:
                selected = naive_res
                notes.append("Fallback to Naive baseline because no complex candidate outperformed baseline on rolling-origin validation.")
            elif not selected.beats_baseline:
                notes.append(
                    f"Selected {selected.label} by lowest RMSE ({selected.rmse:.2f}), though Naive baseline achieved a comparable MAE ({naive_res.mae:.2f})."
                )
    else:
        selected = _evaluate_rolling_origin(
            raw_series,
            req_model,
            m,
            resolved_steps,
            common_min_train=common_min_train,
        )
        candidates.append(selected)
        if req_model != "naive":
            candidates.append(
                _evaluate_rolling_origin(
                    raw_series,
                    "naive",
                    m,
                    resolved_steps,
                    common_min_train=common_min_train,
                )
            )
        if selected.status != "evaluated":
            raise ForecastInputError(
                "MODEL_EXECUTION_FAILED",
                selected.skip_reason or f"Selected model '{MODEL_LABELS[req_model]}' could not be fitted on this dataset.",
            )

    full_series = impute_causal_slice(raw_series)
    raw_preds, final_sigma, fit_meta = _fit_and_predict_raw(full_series, resolved_steps, selected.model, m)
    future_dates = advance_timestamps(
        aligned.grid_timestamps[-1],
        aligned.frequency,
        resolved_steps,
        grid_pandas_freq=aligned.grid_pandas_freq,
    )
    intervals, interval_method, calibration_scales = _build_intervals(
        point_forecasts=raw_preds,
        residual_sigma=final_sigma,
        cv_rmse=selected.rmse,
        cv_step_rmse=selected.cv_step_rmse,
        cv_step_abs_errors=selected.cv_step_abs_errors,
        validation_obs=selected.validation_observations,
        n_train=n_grid,
        seasonal_period=m,
        model_name=selected.model,
        fit_meta=fit_meta,
        cv_origin_abs_errors=selected.cv_origin_abs_errors,
    )

    if interval_method == "heuristic_fallback":
        warnings.append("Intervals are approximate (short history).")

    non_negative = (
        (prepared.negative_count == 0)
        and all(v >= 0.0 for v in aligned.observed_values)
        and (business_template != "profit")
    )
    if non_negative:
        raw_preds = np.maximum(raw_preds, 0.0)
        for idx in range(resolved_steps):
            pt = round(float(raw_preds[idx]), 4)
            for lvl in ("80", "90", "95"):
                lo = max(0.0, float(intervals[lvl][idx]["lower"]))
                hi = max(pt, float(intervals[lvl][idx]["upper"]))
                lo = min(lo, pt)
                intervals[lvl][idx]["lower"] = round(lo, 4)
                intervals[lvl][idx]["upper"] = round(hi, 4)
            # Enforce nested interval ordering after rounding
            l80 = min(intervals["80"][idx]["lower"], pt)
            l90 = min(intervals["90"][idx]["lower"], l80)
            l95 = min(intervals["95"][idx]["lower"], l90)
            u80 = max(intervals["80"][idx]["upper"], pt)
            u90 = max(intervals["90"][idx]["upper"], u80)
            u95 = max(intervals["95"][idx]["upper"], u90)
            intervals["80"][idx]["lower"], intervals["80"][idx]["upper"] = max(0.0, l80), u80
            intervals["90"][idx]["lower"], intervals["90"][idx]["upper"] = max(0.0, l90), u90
            intervals["95"][idx]["lower"], intervals["95"][idx]["upper"] = max(0.0, l95), u95
        notes.append("Lower bounds were limited to zero because this series has no negative values.")

    predicted_data = []
    for i, dt in enumerate(future_dates):
        predicted_data.append(
            {
                "date": dt,
                "value": round(float(raw_preds[i]), 4),
                "lower80": intervals["80"][i]["lower"],
                "upper80": intervals["80"][i]["upper"],
                "lower90": intervals["90"][i]["lower"],
                "upper90": intervals["90"][i]["upper"],
                "lower95": intervals["95"][i]["lower"],
                "upper95": intervals["95"][i]["upper"],
            }
        )

    historical_data = [
        {"date": dt, "value": round(float(val), 4), "isObserved": True}
        for dt, val in zip(aligned.observed_timestamps, aligned.observed_values)
    ]

    last_actual = float(aligned.observed_values[-1])
    total_predicted = float(np.sum(raw_preds))
    avg_predicted = float(np.mean(raw_preds))
    first_pred = float(raw_preds[0])
    last_pred = float(raw_preds[-1])
    pct_change_vs_last = ((last_pred - last_actual) / abs(last_actual) * 100.0) if abs(last_actual) > 1e-9 else None

    candidate_dicts = [
        {
            "model": c.model,
            "label": c.label,
            "status": c.status,
            "skipReason": c.skip_reason,
            "mae": c.mae,
            "rmse": c.rmse,
            "mase": c.mase,
            "mape": c.mape,
            "beatsBaseline": c.beats_baseline,
            "backtestingWindows": c.backtesting_windows,
            "trainingObservations": c.training_observations,
            "validationObservations": c.validation_observations,
            "selected": c.model == selected.model,
        }
        for c in candidates
    ]

    return {
        "status": "completed",
        "selectedModel": selected.model,
        "selectedModelLabel": selected.label,
        "frequency": aligned.frequency,
        "detectedFrequency": aligned.detected_frequency,
        "frequencyConfidence": aligned.frequency_confidence,
        "frequencyOverridden": aligned.frequency_overridden,
        "seasonalPeriod": aligned.seasonal_period,
        "horizonDays": resolved_horizon_days,
        "horizonSteps": resolved_steps,
        "trainingPeriod": {
            "start": aligned.observed_timestamps[0],
            "end": aligned.observed_timestamps[-1],
            "observedPeriods": len(aligned.observed_values),
            "calendarPeriods": len(aligned.grid_values),
        },
        "historicalData": historical_data,
        "predictedData": predicted_data,
        "predictionIntervals": intervals,
        "summary": {
            "lastActualDate": aligned.observed_timestamps[-1],
            "lastActualValue": round(last_actual, 4),
            "firstPredictedValue": round(first_pred, 4),
            "endPredictedValue": round(last_pred, 4),
            "totalForecastedValue": round(total_predicted, 4),
            "averageForecastedValue": round(avg_predicted, 4),
            "projectedChangePct": round(pct_change_vs_last, 2) if pct_change_vs_last is not None else None,
            "expectedRange95Start": [intervals["95"][0]["lower"], intervals["95"][0]["upper"]],
            "expectedRange95End": [intervals["95"][-1]["lower"], intervals["95"][-1]["upper"]],
        },
        "evaluationMetrics": {
            "mae": selected.mae,
            "rmse": selected.rmse,
            "mase": selected.mase,
            "mape": selected.mape,
            "mapeNote": (
                "MAPE omitted because historical validation windows include zero values."
                if selected.mape is None
                else None
            ),
            "beatsBaseline": selected.beats_baseline,
            "backtestingWindows": selected.backtesting_windows,
            "trainingObservations": selected.training_observations,
            "validationObservations": selected.validation_observations,
            "cvHorizonSteps": selected.cv_horizon_steps,
            "candidates": candidate_dicts,
        },
        "modelMetadata": {
            "fitDetails": fit_meta,
            "intervalMethod": interval_method,
            "intervalCalibrationFactor": round(float(np.mean(list(calibration_scales.values()))), 4),
            "intervalCalibrationScales": calibration_scales,
            "nonNegativeClamped": bool(non_negative),
            "businessDaysOnly": aligned.business_days_only,
            "availableModels": list(ALL_MODELS),
            "seasonalityEnabled": aligned.seasonal_period > 1 and n_grid >= 2 * aligned.seasonal_period,
            "availableGroups": prepared.available_groups,
            "selectedGroup": prepared.selected_group,
        },
        "dataQuality": {
            "rawRowCount": prepared.raw_row_count,
            "validRowCount": prepared.valid_row_count,
            "observedPeriods": len(aligned.observed_values),
            "calendarPeriods": len(aligned.grid_values),
            "invalidDateCount": prepared.invalid_date_count,
            "invalidTargetCount": prepared.invalid_target_count,
            "duplicateTimestampCount": prepared.duplicate_timestamp_count,
            "periodCollapsedCount": aligned.period_collapsed_count,
            "missingPeriodCount": aligned.missing_period_count,
            "missingPeriods": aligned.missing_periods,
            "unsortedInput": prepared.unsorted_input,
            "zeroCount": prepared.zero_count,
            "negativeCount": prepared.negative_count,
            "outlierCount": prepared.outlier_count,
            "outlierDates": prepared.outlier_dates,
        },
        "warnings": warnings,
        "notes": notes,
    }
