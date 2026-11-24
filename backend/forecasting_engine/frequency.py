"""
Frequency inference, horizon step mapping, and calendar grid alignment.

Keeps observed historical points untouched while building an evenly spaced internal grid
for statistical state-space models and stepping future forecast timestamps cleanly.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional, Tuple

import numpy as np
import pandas as pd

from .prepare import PreparedSeries, AGGREGATIONS


SUPPORTED_FREQUENCIES = ("daily", "weekly", "monthly", "quarterly", "yearly")
VALID_HORIZON_DAYS = (7, 30, 90, 180, 365)

SEASONAL_PERIODS: Dict[str, int] = {
    "daily": 7,
    "weekly": 52,
    "monthly": 12,
    "quarterly": 4,
    "yearly": 1,
}

PRESET_HORIZON_STEPS_BY_FREQ: Dict[str, Tuple[int, ...]] = {
    "daily": (7, 14, 30, 90),
    "weekly": (4, 8, 13, 26),
    "monthly": (3, 6, 12, 24),
    "quarterly": (2, 4, 8),
    "yearly": (1, 3, 5),
}

MAX_HORIZON_STEPS_BY_FREQ: Dict[str, int] = {
    "daily": 365,
    "weekly": 104,
    "monthly": 36,
    "quarterly": 12,
    "yearly": 5,
}

DAYS_PER_STEP_BY_FREQ: Dict[str, int] = {
    "daily": 1,
    "weekly": 7,
    "monthly": 30,
    "quarterly": 90,
    "yearly": 365,
}

HORIZON_STEPS_BY_FREQ: Dict[str, Dict[int, Optional[int]]] = {
    "daily": {7: 7, 30: 30, 90: 90, 180: 180, 365: 365},
    "weekly": {7: 1, 30: 4, 90: 13, 180: 26, 365: 52},
    "monthly": {7: None, 30: 1, 90: 3, 180: 6, 365: 12},
    "quarterly": {7: None, 30: None, 90: 1, 180: 2, 365: 4},
    "yearly": {7: None, 30: None, 90: None, 180: None, 365: 1},
}


class ForecastInputError(ValueError):
    def __init__(self, code: str, message: str, details: Optional[Dict[str, Any]] = None) -> None:
        super().__init__(message)
        self.code = code
        self.message = message
        self.details = details or {}


@dataclass
class AlignedSeries:
    frequency: str
    detected_frequency: Optional[str]
    frequency_confidence: float
    frequency_overridden: bool
    seasonal_period: int
    # Observed historical points (never fabricated)
    observed_timestamps: List[str]
    observed_values: List[float]
    # Evenly spaced calendar timestamps & model series (only used for internal modeling grid)
    grid_timestamps: List[str]
    grid_values: List[float]
    grid_observed_mask: List[bool]
    missing_period_count: int
    missing_periods: List[str]
    period_collapsed_count: int
    warnings: List[str] = field(default_factory=list)
    notes: List[str] = field(default_factory=list)
    raw_grid_values: List[Optional[float]] = field(default_factory=list)
    grid_pandas_freq: str = "D"
    business_days_only: bool = False


def impute_causal_slice(raw_slice: np.ndarray) -> np.ndarray:
    """
    Imputes missing values strictly within `raw_slice` without ever peeking beyond `len(raw_slice)`.
    Trailing gaps after the last observed value in `raw_slice` are forward-filled (zero future leakage).
    """
    arr = np.asarray(raw_slice, dtype=float)
    if not np.any(np.isnan(arr)):
        return arr.copy()
    s = pd.Series(arr)
    # limit_area='inside' only interpolates gaps bounded on both sides INSIDE `raw_slice`;
    # trailing gaps are forward-filled strictly from the past.
    filled = s.interpolate(method="linear", limit_area="inside").ffill().bfill()
    return filled.to_numpy(dtype=float)


def get_valid_horizons(frequency: str) -> List[int]:
    mapping = HORIZON_STEPS_BY_FREQ.get(frequency)
    if not mapping:
        return []
    return [days for days, steps in mapping.items() if steps is not None]


def resolve_horizon_steps(
    frequency: str,
    horizon_days: Optional[int] = 30,
    horizon_steps: Optional[int] = None,
) -> int:
    if frequency not in SUPPORTED_FREQUENCIES:
        raise ForecastInputError("INVALID_FREQUENCY", f"Unsupported frequency '{frequency}'.")

    if horizon_steps is not None:
        max_steps = MAX_HORIZON_STEPS_BY_FREQ[frequency]
        steps_int = int(horizon_steps)
        if steps_int < 1 or steps_int > max_steps:
            raise ForecastInputError(
                "INVALID_HORIZON",
                f"Forecast horizon for {frequency} frequency must be between 1 and {max_steps} periods (received {steps_int}).",
                details={
                    "frequency": frequency,
                    "horizonSteps": steps_int,
                    "maxHorizonSteps": max_steps,
                    "presets": list(PRESET_HORIZON_STEPS_BY_FREQ[frequency]),
                },
            )
        return steps_int

    resolved_days = 30 if horizon_days is None else int(horizon_days)
    if resolved_days not in VALID_HORIZON_DAYS:
        raise ForecastInputError(
            "INVALID_HORIZON",
            f"Unsupported horizon '{resolved_days}' days. Allowed horizons: {', '.join(map(str, VALID_HORIZON_DAYS))}.",
        )
    steps = HORIZON_STEPS_BY_FREQ[frequency].get(resolved_days)
    if steps is None:
        valid = ", ".join(f"{d}d" for d in get_valid_horizons(frequency))
        raise ForecastInputError(
            "INCOMPATIBLE_HORIZON",
            f"A {resolved_days}-day horizon is shorter than one {frequency} period. Choose one of: {valid}.",
            details={"frequency": frequency, "horizonDays": resolved_days, "validHorizons": get_valid_horizons(frequency)},
        )
    return steps


def _is_business_days_only(ts_index: pd.DatetimeIndex) -> bool:
    if len(ts_index) < 6:
        return False
    span_days = int((ts_index.max() - ts_index.min()).days)
    if span_days < 10:
        return False
    return bool(np.all(ts_index.dayofweek < 5))


def _detect_from_timestamps(ts_index: pd.DatetimeIndex) -> Tuple[Optional[str], float, Dict[str, Any]]:
    if len(ts_index) < 3:
        return None, 0.0, {"reason": "At least 3 unique timestamps are required to auto-detect frequency."}

    diffs = np.diff(ts_index.values).astype("timedelta64[s]").astype(float) / 86400.0
    diffs = diffs[diffs > 0]
    if len(diffs) == 0:
        return None, 0.0, {"reason": "Timestamps do not advance over time."}

    median_diff = float(np.median(diffs))
    p25, p75 = np.percentile(diffs, [25, 75])

    # Score candidate frequencies by how consistently timestamps fall near expected spacing
    candidates: List[Tuple[str, float, Tuple[float, float]]] = [
        ("daily", 1.0, (0.75, 4.5)),
        ("weekly", 7.0, (5.0, 9.5)),
        ("monthly", 30.4375, (25.0, 35.0)),
        ("quarterly", 91.3125, (80.0, 100.0)),
        ("yearly", 365.25, (350.0, 380.0)),
    ]

    scores: Dict[str, float] = {}
    for name, target_days, (lo, hi) in candidates:
        within = float(np.mean((diffs >= lo) & (diffs <= hi)))
        # Allow occasional small gaps (e.g., 2x or 3x step multiples) cleanly for daily/weekly/monthly
        ratios = diffs / target_days
        rounded = np.maximum(1.0, np.round(ratios))
        grid_error = np.abs(ratios - rounded) / rounded
        on_grid = float(np.mean(grid_error <= 0.18))
        # Penalty if median is far from target_days
        med_dist = abs(median_diff - target_days) / target_days
        med_bonus = max(0.0, 1.0 - min(med_dist, 1.0))
        # Monthly calendar alignment bonus
        if name == "monthly" and float(np.mean(ts_index.is_month_start | ts_index.is_month_end | (ts_index.day == ts_index[0].day))) >= 0.8:
            on_grid = max(on_grid, 0.9)
        if name == "quarterly":
            q_start = ts_index.month.isin([1, 4, 7, 10]) & (ts_index.day <= 3)
            q_end = ts_index.is_quarter_end | (ts_index.month.isin([3, 6, 9, 12]) & (ts_index.day >= 28))
            if float(np.mean(q_start)) >= 0.8 or float(np.mean(q_end)) >= 0.8:
                on_grid = max(on_grid, 0.9)
        if name == "yearly" and float(np.mean(np.diff(ts_index.year) >= 1)) == 1.0 and float(np.median(np.diff(ts_index.year))) == 1.0:
            on_grid = max(on_grid, 0.92)
            med_bonus = max(med_bonus, 0.92)

        scores[name] = 0.45 * within + 0.35 * on_grid + 0.20 * med_bonus

    ranked = sorted(scores.items(), key=lambda kv: kv[1], reverse=True)
    best_freq, best_score = ranked[0]
    second_freq, second_score = ranked[1]

    # Check extreme irregularity (IQR too wide relative to median)
    iqr_ratio = (p75 - p25) / max(median_diff, 1e-6)
    ambiguous = (best_score - second_score) < 0.08 and second_score > 0.55
    business_days = best_freq == "daily" and _is_business_days_only(ts_index)

    details = {
        "medianIntervalDays": round(median_diff, 2),
        "p25IntervalDays": round(float(p25), 2),
        "p75IntervalDays": round(float(p75), 2),
        "candidateScores": {k: round(v, 3) for k, v in ranked},
        "bestCandidate": best_freq,
        "confidence": round(best_score, 3),
        "ambiguous": ambiguous,
        "iqrRatio": round(float(iqr_ratio), 3),
        "businessDaysOnly": business_days,
    }

    if best_score < 0.58 or ambiguous or (iqr_ratio > 2.2 and best_score < 0.78):
        return None, round(best_score, 3), details

    return best_freq, round(best_score, 3), details


def detect_frequency_info(timestamps: List[str]) -> Dict[str, Any]:
    if len(timestamps) < 3:
        return {
            "detectedFrequency": None,
            "confidence": 0.0,
            "needsOverride": True,
            "message": "At least 3 unique dates are needed to auto-detect time series frequency.",
            "details": {},
        }
    idx = pd.DatetimeIndex(pd.to_datetime(timestamps)).sort_values().unique()
    detected, confidence, details = _detect_from_timestamps(idx)
    bday_suffix = " (Mon–Fri business days)" if details.get("businessDaysOnly") else ""
    return {
        "detectedFrequency": detected,
        "confidence": confidence,
        "needsOverride": detected is None,
        "message": (
            f"Detected {detected}{bday_suffix} frequency ({int(confidence * 100)}% confidence)."
            if detected
            else "Time spacing is irregular or ambiguous. Please select a frequency manually."
        ),
        "details": details,
    }


def _to_period_anchor(ts_series: pd.Series, frequency: str, business_days_only: bool = False) -> Tuple[pd.Series, str]:
    if frequency == "daily":
        return ts_series.dt.normalize(), ("B" if business_days_only else "D")
    if frequency == "weekly":
        # Preserve dominant weekday when >=80% of points land on the same weekday (e.g. Fridays)
        wd_counts = ts_series.dt.dayofweek.value_counts()
        if len(wd_counts) > 0 and (wd_counts.iloc[0] / max(1, len(ts_series))) >= 0.8:
            dom_wd = int(wd_counts.index[0])
            anchored = ts_series.dt.normalize() - pd.to_timedelta((ts_series.dt.dayofweek - dom_wd) % 7, unit="D")
            return anchored, "7D"
        anchored = ts_series.dt.to_period("W-SUN").dt.start_time.dt.normalize()
        return anchored, "7D"
    if frequency == "monthly":
        if float(np.mean(ts_series.dt.is_month_end)) >= 0.8:
            anchored = ts_series.dt.to_period("M").dt.end_time.dt.normalize()
            return anchored, "M"
        anchored = ts_series.dt.to_period("M").dt.start_time.dt.normalize()
        return anchored, "MS"
    if frequency == "quarterly":
        is_qend = ts_series.dt.is_quarter_end | (ts_series.dt.month.isin([3, 6, 9, 12]) & (ts_series.dt.day >= 28))
        if float(np.mean(is_qend)) >= 0.8:
            anchored = ts_series.dt.to_period("Q").dt.end_time.dt.normalize()
            return anchored, "Q"
        anchored = ts_series.dt.to_period("Q").dt.start_time.dt.normalize()
        return anchored, "QS"
    if frequency == "yearly":
        is_yend = ts_series.dt.is_year_end | ((ts_series.dt.month == 12) & (ts_series.dt.day >= 30))
        if float(np.mean(is_yend)) >= 0.8:
            anchored = ts_series.dt.to_period("Y").dt.end_time.dt.normalize()
            return anchored, "Y"
        anchored = ts_series.dt.to_period("Y").dt.start_time.dt.normalize()
        return anchored, "YS"
    raise ForecastInputError("INVALID_FREQUENCY", f"Unsupported frequency '{frequency}'.")


def _date_range_freq(freq_code: str) -> str:
    return {"M": "ME", "Q": "QE", "Y": "YE"}.get(freq_code, freq_code)


def advance_timestamps(
    last_timestamp: str,
    frequency: str,
    steps: int,
    grid_pandas_freq: Optional[str] = None,
) -> List[str]:
    last_ts = pd.Timestamp(last_timestamp)
    pf = grid_pandas_freq
    if frequency == "daily":
        if pf == "B":
            future = pd.bdate_range(last_ts + pd.offsets.BDay(1), periods=steps)
        else:
            future = pd.date_range(last_ts + pd.Timedelta(days=1), periods=steps, freq="D")
    elif frequency == "weekly":
        future = pd.date_range(last_ts + pd.Timedelta(days=7), periods=steps, freq="7D")
    elif frequency == "monthly":
        if pf == "M":
            start = (last_ts + pd.offsets.MonthEnd(1)).normalize()
            future = pd.date_range(start, periods=steps, freq=_date_range_freq("M"))
        else:
            start = (last_ts + pd.offsets.MonthBegin(1)).normalize()
            future = pd.date_range(start, periods=steps, freq="MS")
    elif frequency == "quarterly":
        if pf == "Q":
            start = (last_ts + pd.offsets.QuarterEnd(1)).normalize()
            future = pd.date_range(start, periods=steps, freq=_date_range_freq("Q"))
        else:
            start = (last_ts + pd.offsets.QuarterBegin(startingMonth=1)).normalize()
            if start <= last_ts:
                start = (last_ts + pd.offsets.QuarterBegin(2, startingMonth=1)).normalize()
            future = pd.date_range(start, periods=steps, freq="QS")
    elif frequency == "yearly":
        if pf == "Y":
            start = pd.Timestamp(year=last_ts.year + 1, month=12, day=31)
            future = pd.date_range(start, periods=steps, freq=_date_range_freq("Y"))
        else:
            start = pd.Timestamp(year=last_ts.year + 1, month=1, day=1)
            future = pd.date_range(start, periods=steps, freq="YS")
    else:
        raise ForecastInputError("INVALID_FREQUENCY", f"Unsupported frequency '{frequency}'.")
    return [ts.date().isoformat() for ts in future]


def align_and_validate_frequency(
    prepared: PreparedSeries,
    requested_frequency: str = "auto",
    aggregation: str = "sum",
) -> AlignedSeries:
    """
    Resolves target cadence (auto-detected or user-overridden), collapses intra-period rows,
    records missing calendar gaps, and preserves raw observed grid values alongside a
    full-history interpolated grid so rolling-origin CV never leaks future observations.
    """
    req_freq = (requested_frequency or "auto").lower()
    if req_freq != "auto" and req_freq not in SUPPORTED_FREQUENCIES:
        raise ForecastInputError(
            "INVALID_FREQUENCY",
            f"Unsupported frequency '{requested_frequency}'. Choose auto or one of {', '.join(SUPPORTED_FREQUENCIES)}.",
        )
    agg = (aggregation or "sum").lower()
    if agg not in AGGREGATIONS:
        agg = "sum"

    raw_ts = pd.DatetimeIndex(pd.to_datetime(prepared.timestamps))
    if len(raw_ts) < 4:
        raise ForecastInputError(
            "INSUFFICIENT_HISTORY",
            f"At least 4 valid time periods are required to build a forecast (found {len(raw_ts)}).",
        )

    detected, confidence, details = _detect_from_timestamps(raw_ts)
    if req_freq == "auto":
        if detected is None:
            raise ForecastInputError(
                "NEEDS_FREQUENCY_OVERRIDE",
                "Time series spacing is irregular or ambiguous. Select Daily, Weekly, Monthly, Quarterly, or Yearly manually to continue.",
                details={**details, "suggestedFrequency": details.get("bestCandidate")},
            )
        frequency = detected
        overridden = False
    else:
        frequency = req_freq
        overridden = detected is not None and detected != req_freq

    warnings = list(prepared.warnings)
    notes = list(prepared.notes)

    if overridden:
        notes.append(
            f"Frequency manually set to '{frequency}' (auto-detection suggested '{detected}' at {int(confidence * 100)}% confidence)."
        )
    elif req_freq != "auto" and detected is None:
        notes.append(f"Frequency manually set to '{frequency}' due to irregular input spacing.")

    business_days_only = frequency == "daily" and _is_business_days_only(raw_ts)
    if business_days_only:
        notes.append(
            "Detected Monday–Friday business-day cadence; calendar grid and weekly seasonality (m=5) follow business days without fabricating weekend values."
        )

    df = pd.DataFrame({"ts": pd.to_datetime(prepared.timestamps), "y": prepared.values})
    anchored, pandas_freq = _to_period_anchor(df["ts"], frequency, business_days_only=business_days_only)
    df["period"] = anchored

    before_len = len(df)
    agg_fn = "mean" if agg == "avg" else agg
    bucketed = df.groupby("period", sort=True)["y"].agg(agg_fn).reset_index()
    period_collapsed_count = before_len - len(bucketed)
    if period_collapsed_count > 0:
        notes.append(
            f"Aggregated {period_collapsed_count} intra-{frequency} record(s) into {len(bucketed)} {frequency} period(s) using '{agg}'."
        )

    if len(bucketed) < 4:
        raise ForecastInputError(
            "INSUFFICIENT_HISTORY",
            f"After aligning to {frequency} periods, only {len(bucketed)} unique period(s) remain. At least 4 {frequency} periods are required.",
        )

    full_grid = pd.date_range(bucketed["period"].min(), bucketed["period"].max(), freq=_date_range_freq(pandas_freq))
    grid_df = pd.DataFrame({"period": full_grid}).merge(bucketed, on="period", how="left")

    observed_mask = grid_df["y"].notna().tolist()
    missing_periods = [
        ts.date().isoformat() for ts, obs in zip(grid_df["period"], observed_mask) if not obs
    ]
    missing_count = len(missing_periods)

    if missing_count > 0:
        missing_ratio = missing_count / max(1, len(grid_df))
        if missing_ratio > 0.75 or (missing_ratio > 0.70 and len(bucketed) < 8):
            raise ForecastInputError(
                "TOO_MANY_MISSING_PERIODS",
                f"{missing_count} of {len(grid_df)} {frequency} periods are missing ({int(missing_ratio * 100)}%). Choose a coarser frequency (e.g. Monthly or Quarterly) or provide denser history.",
            )
        warnings.append(
            f"Detected {missing_count} missing {frequency} period(s) in the historical calendar range. Historical records are kept strictly as observed; cross-validation evaluates strictly on observed periods."
        )

    raw_grid_arr = grid_df["y"].astype(float).to_numpy()
    raw_grid_values: List[Optional[float]] = [
        None if np.isnan(v) else float(v) for v in raw_grid_arr.tolist()
    ]
    # Causal full-history imputation for the final full-series fit (never used inside CV folds)
    model_series = impute_causal_slice(raw_grid_arr)

    observed_timestamps = [ts.date().isoformat() for ts in bucketed["period"]]
    observed_values = [float(v) for v in bucketed["y"].astype(float).tolist()]
    grid_timestamps = [ts.date().isoformat() for ts in grid_df["period"]]
    grid_values = [float(v) for v in model_series.tolist()]
    seasonal_period = 5 if business_days_only else SEASONAL_PERIODS[frequency]

    return AlignedSeries(
        frequency=frequency,
        detected_frequency=detected,
        frequency_confidence=confidence,
        frequency_overridden=overridden,
        seasonal_period=seasonal_period,
        observed_timestamps=observed_timestamps,
        observed_values=observed_values,
        grid_timestamps=grid_timestamps,
        grid_values=grid_values,
        grid_observed_mask=observed_mask,
        missing_period_count=missing_count,
        missing_periods=missing_periods[:50],
        period_collapsed_count=period_collapsed_count,
        warnings=warnings,
        notes=notes,
        raw_grid_values=raw_grid_values,
        grid_pandas_freq=pandas_freq,
        business_days_only=business_days_only,
    )
