from __future__ import annotations

import math
from datetime import date, timedelta

import numpy as np
import pytest

from forecasting_engine.cli import handle_request
from forecasting_engine.frequency import ForecastInputError, align_and_validate_frequency, resolve_horizon_steps
from forecasting_engine.models import ALL_MODELS, SEASONAL_MODELS, run_forecast_pipeline
from forecasting_engine.prepare import prepare_time_series
from forecasting_engine.scenarios import apply_what_if_scenario


def _make_daily_rows(n: int = 45, seasonal: bool = True, start: date = date(2025, 1, 1)):
    rows = []
    for i in range(n):
        d = start + timedelta(days=i)
        base = 100.0 + 1.5 * i
        seas = 18.0 * math.sin(2 * math.pi * i / 7.0) if seasonal else 0.0
        rows.append({"date": d.isoformat(), "value": round(base + seas, 2), "category": "North" if i % 2 == 0 else "South"})
    return rows


def _make_monthly_rows(n: int = 36):
    rows = []
    y, m = 2023, 1
    for i in range(n):
        dt = date(y + (m - 1) // 12, ((m - 1) % 12) + 1, 1)
        val = 1000.0 + 25.0 * i + 180.0 * math.sin(2 * math.pi * i / 12.0)
        rows.append({"date": dt.isoformat(), "revenue": round(val, 2)})
        m += 1
    return rows


def test_frequencies_daily_weekly_monthly_quarterly_yearly():
    # Daily
    res_d = handle_request({
        "action": "run_forecast",
        "rows": _make_daily_rows(35),
        "dateColumn": "date",
        "targetColumn": "value",
        "horizonDays": 7,
    })
    assert res_d["ok"]
    assert res_d["data"]["frequency"] == "daily"
    assert res_d["data"]["horizonSteps"] == 7

    # Weekly
    weekly_rows = [
        {"dt": (date(2024, 1, 1) + timedelta(days=7 * i)).isoformat(), "sales": 500 + 8 * i}
        for i in range(30)
    ]
    res_w = handle_request({
        "action": "run_forecast",
        "rows": weekly_rows,
        "dateColumn": "dt",
        "targetColumn": "sales",
        "horizonDays": 30,
    })
    assert res_w["ok"]
    assert res_w["data"]["frequency"] == "weekly"
    assert res_w["data"]["horizonSteps"] == 4

    # Monthly
    res_m = handle_request({
        "action": "run_forecast",
        "rows": _make_monthly_rows(30),
        "dateColumn": "date",
        "targetColumn": "revenue",
        "horizonDays": 90,
    })
    assert res_m["ok"]
    assert res_m["data"]["frequency"] == "monthly"
    assert res_m["data"]["horizonSteps"] == 3

    # Quarterly
    quarterly_rows = []
    for i in range(16):
        yr = 2021 + i // 4
        q = (i % 4) + 1
        quarterly_rows.append({"period": f"{yr}-Q{q}", "amt": 2000 + 120 * i})
    res_q = handle_request({
        "action": "run_forecast",
        "rows": quarterly_rows,
        "dateColumn": "period",
        "targetColumn": "amt",
        "horizonDays": 180,
    })
    assert res_q["ok"]
    assert res_q["data"]["frequency"] == "quarterly"
    assert res_q["data"]["horizonSteps"] == 2

    # Yearly
    yearly_rows = [{"yr": 2016 + i, "total": 10000 + 900 * i} for i in range(9)]
    res_y = handle_request({
        "action": "run_forecast",
        "rows": yearly_rows,
        "dateColumn": "yr",
        "targetColumn": "total",
        "horizonDays": 365,
    })
    assert res_y["ok"]
    assert res_y["data"]["frequency"] == "yearly"
    assert res_y["data"]["horizonSteps"] == 1


def test_trend_only_seasonal_and_constant_series():
    # Pure upward trend daily
    trend_rows = [{"date": (date(2025, 1, 1) + timedelta(days=i)).isoformat(), "y": 50 + 5 * i} for i in range(25)]
    res_t = handle_request({
        "action": "run_forecast",
        "rows": trend_rows,
        "dateColumn": "date",
        "targetColumn": "y",
        "horizonDays": 7,
    })
    assert res_t["ok"]
    assert res_t["data"]["predictedData"][-1]["value"] > 170

    # Constant series
    const_rows = [{"date": (date(2025, 1, 1) + timedelta(days=i)).isoformat(), "y": 42.0} for i in range(20)]
    res_c = handle_request({
        "action": "run_forecast",
        "rows": const_rows,
        "dateColumn": "date",
        "targetColumn": "y",
        "horizonDays": 7,
    })
    assert res_c["ok"]
    for pt in res_c["data"]["predictedData"]:
        assert abs(pt["value"] - 42.0) < 1e-4
        assert pt["lower95"] <= pt["value"] <= pt["upper95"]

    # Seasonal monthly series with >= 2*12 observations triggers seasonality eligibility
    res_s = handle_request({
        "action": "run_forecast",
        "rows": _make_monthly_rows(30),
        "dateColumn": "date",
        "targetColumn": "revenue",
        "horizonDays": 180,
    })
    assert res_s["ok"]
    assert res_s["data"]["modelMetadata"]["seasonalityEnabled"] is True


def test_missing_duplicate_unsorted_numeric_strings_zeros_and_negatives():
    rows = [
        {"date": "2025-01-05", "val": "$1,200.50"},
        {"date": "2025-01-01", "val": "1000"},
        {"date": "2025-01-02", "val": "(200)"},  # negative in parentheses
        {"date": "2025-01-02", "val": "300"},    # duplicate timestamp -> sum = 100
        # 2025-01-03 intentionally missing!
        {"date": "2025-01-04", "val": "0"},      # zero -> MAPE should be None
        {"date": "2025-01-06", "val": None},     # missing target -> excluded
        {"date": "2025-01-07", "val": "1,400"},
        {"date": "2025-01-08", "val": "1500"},
        {"date": "2025-01-09", "val": "1600"},
        {"date": "2025-01-10", "val": "1700"},
        {"date": "2025-01-11", "val": "1800"},
        {"date": "2025-01-12", "val": "1900"},
        {"date": "2025-01-13", "val": "2000"},
        {"date": "2025-01-14", "val": "2100"},
        {"date": "2025-01-15", "val": "2200"},
    ]
    res = handle_request({
        "action": "run_forecast",
        "rows": rows,
        "dateColumn": "date",
        "targetColumn": "val",
        "frequency": "daily",
        "aggregation": "sum",
        "horizonDays": 7,
    })
    assert res["ok"]
    data = res["data"]
    dq = data["dataQuality"]
    assert dq["unsortedInput"] is True
    assert dq["duplicateTimestampCount"] == 2
    assert dq["invalidTargetCount"] == 1
    assert dq["missingPeriodCount"] == 2
    assert "2025-01-03" in dq["missingPeriods"]
    assert "2025-01-06" in dq["missingPeriods"]
    assert dq["zeroCount"] >= 1
    assert dq["negativeCount"] == 0  # -200 + 300 = +100 after duplicate aggregation
    # Missing date 2025-01-03 must NEVER appear in observed historicalData
    hist_dates = [p["date"] for p in data["historicalData"]]
    assert "2025-01-03" not in hist_dates
    assert all(p["isObserved"] is True for p in data["historicalData"])

    # Series with negative profit values should succeed cleanly; zeros in validation windows omit MAPE
    neg_rows = [
        {"date": (date(2025, 1, 1) + timedelta(days=i)).isoformat(), "profit": 0.0 if i == 16 else (-100 + 25 * i)}
        for i in range(20)
    ]
    res_neg = handle_request({
        "action": "run_forecast",
        "rows": neg_rows,
        "dateColumn": "date",
        "targetColumn": "profit",
        "horizonDays": 7,
    })
    assert res_neg["ok"]
    assert res_neg["data"]["dataQuality"]["negativeCount"] > 0
    assert res_neg["data"]["evaluationMetrics"]["mape"] is None
    assert res_neg["data"]["evaluationMetrics"]["mapeNote"] is not None


def test_insufficient_history_invalid_dates_and_irregular_spacing():
    # Insufficient history (< 4 points)
    with pytest.raises(ForecastInputError) as exc_short:
        prep = prepare_time_series(
            [{"date": "2025-01-01", "y": 10}, {"date": "2025-01-02", "y": 20}, {"date": "2025-01-03", "y": 30}],
            "date",
            "y",
        )
        align_and_validate_frequency(prep, "auto")
    assert exc_short.value.code == "INSUFFICIENT_HISTORY"

    # Invalid date column
    with pytest.raises(ValueError):
        prepare_time_series(
            [{"date": "not-a-date", "y": 10}, {"date": "still-bad", "y": 20}],
            "date",
            "y",
        )

    # Irregular spacing triggers NEEDS_FREQUENCY_OVERRIDE when auto
    irregular_rows = [
        {"date": "2025-01-01", "y": 100},
        {"date": "2025-01-03", "y": 110},
        {"date": "2025-01-19", "y": 130},
        {"date": "2025-02-02", "y": 125},
        {"date": "2025-03-29", "y": 145},
        {"date": "2025-04-04", "y": 150},
        {"date": "2025-06-15", "y": 170},
        {"date": "2025-06-18", "y": 175},
    ]
    with pytest.raises(ForecastInputError) as exc_irreg:
        prep_i = prepare_time_series(irregular_rows, "date", "y")
        align_and_validate_frequency(prep_i, "auto")
    assert exc_irreg.value.code == "NEEDS_FREQUENCY_OVERRIDE"

    # Incompatible horizon for monthly
    with pytest.raises(ForecastInputError) as exc_hor:
        resolve_horizon_steps("monthly", 7)
    assert exc_hor.value.code == "INCOMPATIBLE_HORIZON"


def test_seasonality_gating_and_all_8_models_and_intervals():
    # Monthly series with only 10 months (< 2*12=24): auto must skip seasonal models cleanly
    short_monthly = _make_monthly_rows(10)
    prep_sm = prepare_time_series(short_monthly, "date", "revenue")
    aligned_sm = align_and_validate_frequency(prep_sm, "monthly")
    res_sm = run_forecast_pipeline(prep_sm, aligned_sm, horizon_days=90, requested_model="auto")
    assert res_sm["modelMetadata"]["seasonalityEnabled"] is False
    assert res_sm["selectedModel"] not in SEASONAL_MODELS
    skipped = {c["model"]: c for c in res_sm["evaluationMetrics"]["candidates"] if c["status"] == "skipped"}
    for s_mod in SEASONAL_MODELS:
        assert s_mod in skipped

    # Manual seasonal selection with insufficient seasonal history returns clear error
    with pytest.raises(ForecastInputError) as exc_seas:
        run_forecast_pipeline(prep_sm, aligned_sm, horizon_days=90, requested_model="holt_winters")
    assert exc_seas.value.code == "INSUFFICIENT_SEASONAL_HISTORY"

    # Daily series with 30 days (>= 2*7=14): every one of all 8 models executes and preserves strict interval ordering
    daily_30 = _make_daily_rows(30, seasonal=True)
    prep_d = prepare_time_series(daily_30, "date", "value")
    aligned_d = align_and_validate_frequency(prep_d, "daily")
    for model_name in ALL_MODELS:
        out = run_forecast_pipeline(prep_d, aligned_d, horizon_days=7, requested_model=model_name)
        assert out["selectedModel"] == model_name
        assert out["evaluationMetrics"]["backtestingWindows"] >= 1
        assert out["evaluationMetrics"]["trainingObservations"] == 30
        assert out["evaluationMetrics"]["validationObservations"] >= 1
        for pt in out["predictedData"]:
            assert pt["lower95"] <= pt["lower90"] <= pt["lower80"] <= pt["value"] <= pt["upper80"] <= pt["upper90"] <= pt["upper95"]
            w80 = pt["upper80"] - pt["lower80"]
            w90 = pt["upper90"] - pt["lower90"]
            w95 = pt["upper95"] - pt["lower95"]
            assert w80 <= w90 + 1e-9 <= w95 + 2e-9


def test_what_if_scenario_preserves_baseline():
    res = handle_request({
        "action": "run_forecast",
        "rows": _make_daily_rows(28),
        "dateColumn": "date",
        "targetColumn": "value",
        "horizonDays": 7,
    })
    assert res["ok"]
    baseline_points = res["data"]["predictedData"]
    baseline_copy = [dict(p) for p in baseline_points]

    scen = apply_what_if_scenario(
        predicted_data=baseline_points,
        assumptions={"salesDeltaPct": 10, "growthRateDeltaPct": 1, "priceChangePct": 5},
        business_template="sales",
    )
    assert len(scen["predictedData"]) == len(baseline_points)
    assert scen["summary"]["scenarioTotal"] > scen["summary"]["baselineTotal"]
    assert len(scen["warnings"]) >= 1  # elasticity warning for priceChangePct
    # Baseline unchanged
    assert baseline_points == baseline_copy


def test_backtesting_no_leakage_outliers_and_structured_output():
    from forecasting_engine.models import _evaluate_rolling_origin, _fit_and_predict_raw

    # 1. Zero-leakage check: prefix fit & prediction on series[:split] is invariant to corrupting future points
    base_series = np.array([100.0 + 3.0 * i + 5.0 * math.sin(i) for i in range(32)], dtype=float)
    perturbed_series = base_series.copy()
    perturbed_series[24:] = 999999.0  # Extreme shock strictly in the future

    for model_name in ("naive", "moving_average", "ets", "arima", "linear_regression"):
        fc_base, _, _ = _fit_and_predict_raw(base_series[:24], 4, model_name, 7)
        fc_pert, _, _ = _fit_and_predict_raw(perturbed_series[:24], 4, model_name, 7)
        assert np.allclose(fc_base, fc_pert, atol=1e-9)

    # 2. Outlier handling preserves original dataset & counts all >10 outliers accurately
    rows = [{"date": (date(2025, 1, 1) + timedelta(days=i)).isoformat(), "metric": 100.0 + (i % 3)} for i in range(120)]
    outlier_indices = list(range(5, 65, 5))  # 12 statistical outliers (10% of series)
    for idx in outlier_indices:
        rows[idx]["metric"] = 5000.0
    rows_snapshot = [dict(r) for r in rows]

    out = handle_request({
        "action": "run_forecast",
        "rows": rows,
        "dateColumn": "date",
        "targetColumn": "metric",
        "frequency": "daily",
        "horizonDays": 7,
    })
    assert out["ok"]
    data = out["data"]
    assert rows == rows_snapshot  # original input never mutated
    assert data["dataQuality"]["outlierCount"] == len(outlier_indices)
    assert any("outlier" in w.lower() for w in data["warnings"])
    assert len(data["historicalData"]) == 120
    # Structured trainingPeriod & ISO 8601 timestamps
    tp = data["trainingPeriod"]
    assert tp["start"] == "2025-01-01"
    assert tp["end"] == "2025-04-30"
    assert tp["observedPeriods"] == 120
    assert tp["calendarPeriods"] == 120
    for pt in data["predictedData"]:
        assert date.fromisoformat(pt["date"]) > date(2025, 4, 30)

    # 3. Parsimony: constant series selects baseline naive rather than overfitting complex seasonal/ARIMA models
    const_series = np.full(24, 250.0, dtype=float)
    res_const = handle_request({
        "action": "run_forecast",
        "rows": [{"date": (date(2025, 1, 1) + timedelta(days=i)).isoformat(), "v": float(const_series[i])} for i in range(24)],
        "dateColumn": "date",
        "targetColumn": "v",
        "horizonDays": 7,
    })
    assert res_const["ok"]
    assert res_const["data"]["selectedModel"] in {"naive", "moving_average"}
    eval_res = _evaluate_rolling_origin(base_series, "naive", 7, 7)
    assert eval_res.status == "evaluated"
    assert eval_res.mase is not None


def test_audit_regressions_prep_frequency_models_and_scenarios():
    from forecasting_engine.frequency import impute_causal_slice
    from forecasting_engine.prepare import coerce_numeric

    # 1. count aggregation excludes string missing markers & unicode minus parses cleanly
    rows_cnt = [{"date": (date(2025, 1, 1) + timedelta(days=i)).isoformat(), "v": str(100 + i)} for i in range(12)] + [
        {"date": "2025-01-20", "v": "null"},
        {"date": "2025-01-21", "v": "N/A"},
        {"date": "2025-01-22", "v": "-"},
    ]
    prep_cnt = prepare_time_series(rows_cnt, "date", "v", aggregation="count")
    assert prep_cnt.valid_row_count == 12
    assert prep_cnt.invalid_target_count == 3
    assert coerce_numeric("−125.50") == -125.5

    # 2. IQR=0 constant core with spikes still flags statistical outliers
    rows_iqr0 = [
        {"date": (date(2025, 1, 1) + timedelta(days=i)).isoformat(), "v": 5000.0 if i in (5, 15, 25) else 100.0}
        for i in range(40)
    ]
    prep_iqr0 = prepare_time_series(rows_iqr0, "date", "v")
    assert prep_iqr0.outlier_count == 3

    # 3. Causal imputation eliminates future leakage across gaps inside CV prefixes
    def make_gap_rows(future_shock: float):
        out = []
        for i in range(30):
            if i == 20:
                continue
            out.append({
                "date": (date(2025, 1, 1) + timedelta(days=i)).isoformat(),
                "v": future_shock if i >= 21 else 100.0 + 2.0 * i,
            })
        return out

    al_a = align_and_validate_frequency(prepare_time_series(make_gap_rows(150.0), "date", "v"), "daily")
    al_b = align_and_validate_frequency(prepare_time_series(make_gap_rows(99999.0), "date", "v"), "daily")
    raw_a = np.array([np.nan if v is None else float(v) for v in al_a.raw_grid_values])
    raw_b = np.array([np.nan if v is None else float(v) for v in al_b.raw_grid_values])
    assert np.allclose(impute_causal_slice(raw_a[:21]), impute_causal_slice(raw_b[:21]), atol=1e-9)

    # 4. Mon-Fri business-day cadence uses 'B' without fabricating weekend missing periods
    bday_rows = []
    cur = date(2025, 1, 1)
    while len(bday_rows) < 40:
        if cur.weekday() < 5:
            bday_rows.append({"date": cur.isoformat(), "v": 100.0 + len(bday_rows)})
        cur += timedelta(days=1)
    al_bd = align_and_validate_frequency(prepare_time_series(bday_rows, "date", "v"), "auto")
    assert al_bd.frequency == "daily"
    assert al_bd.business_days_only is True
    assert al_bd.grid_pandas_freq == "B"
    assert al_bd.seasonal_period == 5
    assert al_bd.missing_period_count == 0

    # 5. Quarter-end calendar alignment is preserved
    q_dates = ["2022-03-31", "2022-06-30", "2022-09-30", "2022-12-31", "2023-03-31", "2023-06-30", "2023-09-30", "2023-12-31"]
    al_q = align_and_validate_frequency(
        prepare_time_series([{"date": dt, "v": 100 + i * 10} for i, dt in enumerate(q_dates)], "date", "v"),
        "auto",
    )
    assert al_q.frequency == "quarterly"
    assert al_q.grid_pandas_freq == "Q"
    assert al_q.observed_timestamps[0] == "2022-03-31"

    # 6. >75% missing calendar periods rejected regardless of total observed count
    sparse_rows = [{"date": (date(2025, 1, 1) + timedelta(days=12 * i)).isoformat(), "v": 100 + i} for i in range(9)]
    with pytest.raises(ForecastInputError) as exc_sparse:
        align_and_validate_frequency(prepare_time_series(sparse_rows, "date", "v"), "daily")
    assert exc_sparse.value.code == "TOO_MANY_MISSING_PERIODS"

    # 7. ARIMA/SARIMA burn-in trimming produces realistic innovation scale; Ridge stays accurate on tiny scales
    from forecasting_engine.models import _fit_and_predict_raw

    rng = np.random.default_rng(7)
    s_linear = 1000.0 + 5.0 * np.arange(60) + rng.normal(0.0, 2.0, 60)
    _, sig_arima, _ = _fit_and_predict_raw(s_linear, 7, "arima", 7)
    _, sig_sarima, _ = _fit_and_predict_raw(s_linear, 7, "sarima", 7)
    assert 0.5 < sig_arima < 6.0
    assert 0.5 < sig_sarima < 6.0

    s_tiny = np.array([0.001 + 0.0001 * i for i in range(30)], dtype=float)
    fc_tiny, _, _ = _fit_and_predict_raw(s_tiny, 3, "linear_regression", 7)
    assert abs(fc_tiny[0] - 0.004) < 1e-4

    # 8. What-If scenarios handle negative baselines/profit cleanly, avoid interval collapse, and validate bounds
    base_neg = [{"date": "2025-01-01", "value": -100.0, "lower80": -120.0, "upper80": -80.0, "lower90": -130.0, "upper90": -70.0, "lower95": -140.0, "upper95": -60.0}]
    sc_profit = apply_what_if_scenario(base_neg, {"salesDeltaPct": 20}, business_template="profit")
    assert sc_profit["predictedData"][0]["value"] == -80.0

    base_pos = [{"date": "2025-01-01", "value": 100.0, "lower80": 80.0, "upper80": 120.0, "lower90": 75.0, "upper90": 125.0, "lower95": 70.0, "upper95": 130.0}]
    sc_drop = apply_what_if_scenario(base_pos, {"salesDeltaPct": -95}, business_template="sales")
    assert sc_drop["predictedData"][0]["lower95"] < sc_drop["predictedData"][0]["value"] < sc_drop["predictedData"][0]["upper95"]

    with pytest.raises(ValueError):
        apply_what_if_scenario(base_pos, {"salesDeltaPct": -99}, business_template="sales")


def test_non_negative_clamping_and_profit_exception():
    # Sharply declining non-negative series so linear_regression forecasts < 0
    rows = [
        {"date": (date(2025, 1, 1) + timedelta(days=i)).isoformat(), "metric": max(2.0, 100.0 - 4.0 * i)}
        for i in range(25)
    ]
    res_sales = handle_request({
        "action": "run_forecast",
        "rows": rows,
        "dateColumn": "date",
        "targetColumn": "metric",
        "frequency": "daily",
        "horizonSteps": 10,
        "model": "linear_regression",
        "businessTemplate": "sales",
    })
    assert res_sales["ok"]
    data_sales = res_sales["data"]
    assert data_sales["modelMetadata"]["nonNegativeClamped"] is True
    assert "Lower bounds were limited to zero because this series has no negative values." in data_sales["notes"]
    for pt in data_sales["predictedData"]:
        assert pt["value"] >= 0.0
        assert pt["lower80"] >= 0.0
        assert pt["lower90"] >= 0.0
        assert pt["lower95"] >= 0.0
        assert pt["lower95"] <= pt["lower90"] <= pt["lower80"] <= pt["value"] <= pt["upper80"] <= pt["upper90"] <= pt["upper95"]

    # Same series under 'profit' template permits negative forecasts and bounds
    res_profit = handle_request({
        "action": "run_forecast",
        "rows": rows,
        "dateColumn": "date",
        "targetColumn": "metric",
        "frequency": "daily",
        "horizonSteps": 10,
        "model": "linear_regression",
        "businessTemplate": "profit",
    })
    assert res_profit["ok"]
    data_profit = res_profit["data"]
    assert data_profit["modelMetadata"]["nonNegativeClamped"] is False
    assert data_profit["predictedData"][-1]["lower95"] < 0.0

    # Scenario clamping respects non_negative baselines vs profit
    pos_baseline = [{"date": "2025-02-01", "value": 10.0, "lower80": 4.0, "upper80": 16.0, "lower90": 2.0, "upper90": 18.0, "lower95": 0.0, "upper95": 20.0}]
    scen_nonneg = apply_what_if_scenario(pos_baseline, {"volumeDeltaPct": -90}, business_template="sales", non_negative=True)
    assert scen_nonneg["predictedData"][0]["value"] >= 0.0
    assert scen_nonneg["predictedData"][0]["lower95"] >= 0.0
    assert "Lower bounds were limited to zero because this series has no negative values." in scen_nonneg["notes"]


def test_interval_method_fallback_monotone_and_performance():
    import time

    # 1. Short series -> < 20 pooled CV residuals -> heuristic_fallback + warning
    short_rows = _make_daily_rows(12, seasonal=False)
    res_short = handle_request({
        "action": "run_forecast",
        "rows": short_rows,
        "dateColumn": "date",
        "targetColumn": "value",
        "frequency": "daily",
        "horizonSteps": 5,
        "model": "naive",
    })
    assert res_short["ok"]
    assert res_short["data"]["modelMetadata"]["intervalMethod"] == "heuristic_fallback"
    assert "Intervals are approximate (short history)." in res_short["data"]["warnings"]

    # 2. Sufficient history -> empirical_cv_quantile + monotone widths across horizon h
    long_rows = _make_daily_rows(60, seasonal=True)
    res_long = handle_request({
        "action": "run_forecast",
        "rows": long_rows,
        "dateColumn": "date",
        "targetColumn": "value",
        "frequency": "daily",
        "horizonSteps": 10,
        "model": "ets",
    })
    assert res_long["ok"]
    assert res_long["data"]["modelMetadata"]["intervalMethod"] == "empirical_cv_quantile"
    calib_factor = res_long["data"]["modelMetadata"].get("intervalCalibrationFactor")
    calib_scales = res_long["data"]["modelMetadata"].get("intervalCalibrationScales")
    assert isinstance(calib_factor, float) and 0.75 <= calib_factor <= 1.5
    assert isinstance(calib_scales, dict) and set(calib_scales.keys()) == {"80", "90", "95"}
    assert all(0.75 <= v <= 1.5 for v in calib_scales.values())
    assert "Intervals are approximate (short history)." not in res_long["data"]["warnings"]
    preds = res_long["data"]["predictedData"]
    for idx in range(1, len(preds)):
        assert (preds[idx]["upper80"] - preds[idx]["lower80"]) >= (preds[idx - 1]["upper80"] - preds[idx - 1]["lower80"]) - 1e-3
        assert (preds[idx]["upper90"] - preds[idx]["lower90"]) >= (preds[idx - 1]["upper90"] - preds[idx - 1]["lower90"]) - 1e-3
        assert (preds[idx]["upper95"] - preds[idx]["lower95"]) >= (preds[idx - 1]["upper95"] - preds[idx - 1]["lower95"]) - 1e-3

    # 3. 5,000 daily points run completes under 15 seconds
    rng = np.random.default_rng(123)
    start_dt = date(2012, 1, 1)
    rows_5k = [
        {
            "date": (start_dt + timedelta(days=i)).isoformat(),
            "value": round(1000.0 + 0.2 * i + 25.0 * math.sin(2 * math.pi * i / 7.0) + float(rng.normal(0.0, 5.0)), 2),
        }
        for i in range(5000)
    ]
    t0 = time.perf_counter()
    res_5k = handle_request({
        "action": "run_forecast",
        "rows": rows_5k,
        "dateColumn": "date",
        "targetColumn": "value",
        "frequency": "daily",
        "horizonSteps": 30,
        "model": "auto",
    })
    elapsed = time.perf_counter() - t0
    assert res_5k["ok"]
    assert elapsed < 15.0, f"5000-point daily run took {elapsed:.2f}s (limit 15s)"


def test_scenario_driver_applicability_per_template_and_elasticity():
    base_pts = [
        {"date": f"2025-02-0{i + 1}", "value": 100.0, "lower80": 85.0, "upper80": 115.0, "lower90": 80.0, "upper90": 120.0, "lower95": 75.0, "upper95": 125.0}
        for i in range(5)
    ]

    expected_allowed = {
        "sales": {"growthRateDeltaPct", "volumeDeltaPct", "priceChangePct"},
        "revenue": {"growthRateDeltaPct", "volumeDeltaPct", "priceChangePct"},
        "demand": {"growthRateDeltaPct", "volumeDeltaPct"},
        "inventory": {"growthRateDeltaPct", "volumeDeltaPct"},
        "website_traffic": {"growthRateDeltaPct", "volumeDeltaPct"},
        "general_business": {"growthRateDeltaPct", "volumeDeltaPct"},
        None: {"growthRateDeltaPct", "volumeDeltaPct"},
        "expenses": {"growthRateDeltaPct", "volumeDeltaPct", "costDeltaPct"},
        "profit": {"growthRateDeltaPct", "volumeDeltaPct", "priceChangePct", "costDeltaPct"},
    }
    all_drivers = ("growthRateDeltaPct", "volumeDeltaPct", "priceChangePct", "costDeltaPct")

    for tpl, allowed in expected_allowed.items():
        for drv in all_drivers:
            payload = {drv: 10.0}
            if drv in allowed:
                out = apply_what_if_scenario(base_pts, payload, business_template=tpl)
                assert out["summary"]["scenarioTotal"] != out["summary"]["baselineTotal"]
            else:
                with pytest.raises(ForecastInputError) as exc:
                    apply_what_if_scenario(base_pts, payload, business_template=tpl)
                assert exc.value.code == "SCENARIO_DRIVER_NOT_APPLICABLE"

    # Explicit rejection of costDeltaPct and legacy expenseDeltaPct (+10%) on sales
    for bad_key in ("costDeltaPct", "expenseDeltaPct"):
        with pytest.raises(ForecastInputError) as exc_bad:
            apply_what_if_scenario(base_pts, {bad_key: 10.0}, business_template="sales")
        assert exc_bad.value.code == "SCENARIO_DRIVER_NOT_APPLICABLE"

    # Price elasticity shifts volume cleanly via (1 + priceChangePct/100) ** priceElasticity and emits note
    res_el = apply_what_if_scenario(
        base_pts,
        {"priceChangePct": 10.0, "priceElasticity": -1.5},
        business_template="sales",
    )
    expected_val = round(100.0 * (1.1 ** (-1.5)) * 1.1, 4)
    assert abs(res_el["predictedData"][0]["value"] - expected_val) < 1e-3
    assert any("elasticity" in n.lower() for n in res_el["notes"])

    # Legacy keys remain backward compatible on applicable templates
    assert apply_what_if_scenario(base_pts, {"salesDeltaPct": 10}, business_template="sales")["summary"]["totalDelta"] > 0
    assert apply_what_if_scenario(base_pts, {"demandDeltaPct": 10}, business_template="demand")["summary"]["totalDelta"] > 0
    assert apply_what_if_scenario(base_pts, {"expenseDeltaPct": 10}, business_template="expenses")["summary"]["totalDelta"] > 0


def test_horizon_periods_presets_caps_and_long_history_warning():
    assert resolve_horizon_steps("daily", horizon_steps=365) == 365
    assert resolve_horizon_steps("weekly", horizon_steps=104) == 104
    assert resolve_horizon_steps("monthly", horizon_steps=36) == 36
    assert resolve_horizon_steps("quarterly", horizon_steps=12) == 12
    assert resolve_horizon_steps("yearly", horizon_steps=5) == 5

    for freq, over in (("daily", 366), ("weekly", 105), ("monthly", 37), ("quarterly", 13), ("yearly", 6)):
        with pytest.raises(ForecastInputError) as exc:
            resolve_horizon_steps(freq, horizon_steps=over)
        assert exc.value.code == "INVALID_HORIZON"

    # Long horizon warning (> 0.5 * observed_periods)
    rows_20 = _make_daily_rows(20, seasonal=False)
    res_long_h = handle_request({
        "action": "run_forecast",
        "rows": rows_20,
        "dateColumn": "date",
        "targetColumn": "value",
        "frequency": "daily",
        "horizonSteps": 12,
        "model": "ets",
    })
    assert res_long_h["ok"]
    assert res_long_h["data"]["horizonSteps"] == 12
    assert "Forecast is long relative to the history" in res_long_h["data"]["warnings"]

    res_short_h = handle_request({
        "action": "run_forecast",
        "rows": rows_20,
        "dateColumn": "date",
        "targetColumn": "value",
        "frequency": "daily",
        "horizonSteps": 10,
        "model": "ets",
    })
    assert res_short_h["ok"]
    assert "Forecast is long relative to the history" not in res_short_h["data"]["warnings"]


@pytest.mark.slow
def test_empirical_interval_coverage_benchmark_slow():
    """
    Slow statistical calibration benchmark (fixed seeds, >=20 series per DGP) validating
    80% coverage in [0.72, 0.88] and 95% coverage in [0.88, 0.99] across:
    1) Seasonal monthly
    2) Random-walk monthly
    3) Heavy-tailed (t_3) monthly
    4) Daily with weekly pattern
    """
    rng = np.random.default_rng(20261122)

    def _run_dgp_coverage(series_list, dates, freq_name: str, train_len: int, horizon_steps: int) -> tuple[float, float]:
        hits80 = 0
        hits95 = 0
        total = 0
        for ys in series_list:
            train_rows = [{"date": dates[i], "y": float(ys[i])} for i in range(train_len)]
            prep = prepare_time_series(train_rows, "date", "y")
            aligned = align_and_validate_frequency(prep, freq_name)
            res = run_forecast_pipeline(
                prep,
                aligned,
                horizon_steps=horizon_steps,
                requested_model="auto",
                business_template="profit",
            )
            for h_idx, pt in enumerate(res["predictedData"]):
                actual = float(ys[train_len + h_idx])
                if pt["lower80"] <= actual <= pt["upper80"]:
                    hits80 += 1
                if pt["lower95"] <= actual <= pt["upper95"]:
                    hits95 += 1
                total += 1
        return hits80 / total, hits95 / total

    # Monthly dates helper (60 months)
    m_dates = []
    yy, mm = 2020, 1
    for _ in range(60):
        m_dates.append(date(yy, mm, 1).isoformat())
        mm += 1
        if mm > 12:
            mm = 1
            yy += 1

    # 1. Seasonal monthly (n_series=24, 48 train + 12 test)
    seas_monthly = []
    t_m = np.arange(60, dtype=float)
    for _ in range(24):
        noise = rng.normal(0.0, 20.0, 60)
        ys = 1200.0 + 12.0 * t_m + 140.0 * np.sin(2 * np.pi * t_m / 12.0) + noise
        seas_monthly.append(ys)
    cov80_sm, cov95_sm = _run_dgp_coverage(seas_monthly, m_dates, "monthly", 48, 12)
    print(f"[coverage] seasonal_monthly: 80%={cov80_sm:.3f}, 95%={cov95_sm:.3f}", flush=True)
    assert 0.72 <= cov80_sm <= 0.88, f"Seasonal monthly 80% coverage out of range: {cov80_sm:.3f}"
    assert 0.88 <= cov95_sm <= 0.99, f"Seasonal monthly 95% coverage out of range: {cov95_sm:.3f}"

    # 2. Random-walk monthly (n_series=24, 48 train + 6 test)
    rw_monthly = []
    for _ in range(24):
        steps_noise = rng.normal(3.0, 22.0, 54)
        ys = 1500.0 + np.cumsum(steps_noise)
        rw_monthly.append(ys)
    cov80_rw, cov95_rw = _run_dgp_coverage(rw_monthly, m_dates[:54], "monthly", 48, 6)
    print(f"[coverage] random_walk_monthly: 80%={cov80_rw:.3f}, 95%={cov95_rw:.3f}", flush=True)
    assert 0.72 <= cov80_rw <= 0.88, f"Random-walk monthly 80% coverage out of range: {cov80_rw:.3f}"
    assert 0.88 <= cov95_rw <= 0.99, f"Random-walk monthly 95% coverage out of range: {cov95_rw:.3f}"

    # 3. Heavy-tailed (t_3) monthly (n_series=24, 48 train + 6 test)
    t3_monthly = []
    t_54 = np.arange(54, dtype=float)
    for _ in range(24):
        shocks = rng.standard_t(3, size=54) * 18.0
        ys = 2000.0 + 8.0 * t_54 + shocks
        t3_monthly.append(ys)
    cov80_t3, cov95_t3 = _run_dgp_coverage(t3_monthly, m_dates[:54], "monthly", 48, 6)
    print(f"[coverage] heavy_tailed_t3_monthly: 80%={cov80_t3:.3f}, 95%={cov95_t3:.3f}", flush=True)
    assert 0.72 <= cov80_t3 <= 0.88, f"Heavy-tailed t3 monthly 80% coverage out of range: {cov80_t3:.3f}"
    assert 0.88 <= cov95_t3 <= 0.99, f"Heavy-tailed t3 monthly 95% coverage out of range: {cov95_t3:.3f}"

    # 4. Daily with weekly pattern (n_series=24, 90 train + 14 test)
    d_dates = [(date(2025, 1, 1) + timedelta(days=i)).isoformat() for i in range(104)]
    daily_weekly = []
    t_d = np.arange(104, dtype=float)
    for _ in range(24):
        noise = rng.normal(0.0, 15.0, 104)
        ys = 1000.0 + 2.5 * t_d + 60.0 * np.sin(2 * np.pi * t_d / 7.0) + noise
        daily_weekly.append(ys)
    cov80_dw, cov95_dw = _run_dgp_coverage(daily_weekly, d_dates, "daily", 90, 14)
    print(f"[coverage] daily_weekly: 80%={cov80_dw:.3f}, 95%={cov95_dw:.3f}", flush=True)
    assert 0.72 <= cov80_dw <= 0.88, f"Daily weekly 80% coverage out of range: {cov80_dw:.3f}"
    assert 0.88 <= cov95_dw <= 0.99, f"Daily weekly 95% coverage out of range: {cov95_dw:.3f}"


@pytest.mark.slow
def test_empirical_interval_coverage_benchmark_six_dgps_new_seeds_slow():
    """
    Step 1 validation benchmark using fresh seeds (!= 20261122) across 6 DGPs (>=24 series each):
    1) Seasonal monthly
    2) Random-walk monthly
    3) Heavy-tailed (t_3) monthly
    4) Daily with weekly pattern
    5) Monthly level shift
    6) Low-count Poisson series
    Requires 80% coverage in [0.70, 0.90] and 95% coverage in [0.87, 0.99] on all six,
    and reports how often intervalCalibrationFactor hits 0.75 and 1.50 bounds.
    """
    rng = np.random.default_rng(77889911)
    bound_stats = {"total": 0, "factor_at_lo": 0, "factor_at_hi": 0, "scale_at_lo": 0, "scale_at_hi": 0}

    def _run_dgp(series_list, dates, freq_name: str, train_len: int, horizon_steps: int, template: str = "profit"):
        hits80 = 0
        hits95 = 0
        total = 0
        for ys in series_list:
            train_rows = [{"date": dates[i], "y": float(ys[i])} for i in range(train_len)]
            prep = prepare_time_series(train_rows, "date", "y")
            aligned = align_and_validate_frequency(prep, freq_name)
            res = run_forecast_pipeline(
                prep,
                aligned,
                horizon_steps=horizon_steps,
                requested_model="auto",
                business_template=template,
            )
            meta = res["modelMetadata"]
            factor = float(meta.get("intervalCalibrationFactor", 1.0))
            scales = meta.get("intervalCalibrationScales") or {}
            bound_stats["total"] += 1
            if factor <= 0.75 + 1e-6:
                bound_stats["factor_at_lo"] += 1
            if factor >= 1.50 - 1e-6:
                bound_stats["factor_at_hi"] += 1
            for sv in scales.values():
                if float(sv) <= 0.75 + 1e-6:
                    bound_stats["scale_at_lo"] += 1
                if float(sv) >= 1.50 - 1e-6:
                    bound_stats["scale_at_hi"] += 1

            for h_idx, pt in enumerate(res["predictedData"]):
                actual = float(ys[train_len + h_idx])
                if pt["lower80"] <= actual <= pt["upper80"]:
                    hits80 += 1
                if pt["lower95"] <= actual <= pt["upper95"]:
                    hits95 += 1
                total += 1
        return hits80 / total, hits95 / total

    m_dates = []
    yy, mm = 2020, 1
    for _ in range(60):
        m_dates.append(date(yy, mm, 1).isoformat())
        mm += 1
        if mm > 12:
            mm = 1
            yy += 1

    # 1. Seasonal monthly
    seas_monthly = []
    t_m = np.arange(60, dtype=float)
    for _ in range(24):
        ys = 1250.0 + 10.0 * t_m + 150.0 * np.sin(2 * np.pi * t_m / 12.0) + rng.normal(0.0, 22.0, 60)
        seas_monthly.append(ys)
    c80, c95 = _run_dgp(seas_monthly, m_dates, "monthly", 48, 12)
    print(f"[new-seed] seasonal_monthly: 80%={c80:.3f}, 95%={c95:.3f}", flush=True)
    assert 0.70 <= c80 <= 0.90, f"seasonal_monthly 80%={c80:.3f}"
    assert 0.87 <= c95 <= 0.99, f"seasonal_monthly 95%={c95:.3f}"

    # 2. Random-walk monthly
    rw_monthly = [1500.0 + np.cumsum(rng.normal(2.5, 20.0, 54)) for _ in range(24)]
    c80, c95 = _run_dgp(rw_monthly, m_dates[:54], "monthly", 48, 6)
    print(f"[new-seed] random_walk_monthly: 80%={c80:.3f}, 95%={c95:.3f}", flush=True)
    assert 0.70 <= c80 <= 0.90, f"random_walk_monthly 80%={c80:.3f}"
    assert 0.87 <= c95 <= 0.99, f"random_walk_monthly 95%={c95:.3f}"

    # 3. Heavy-tailed t3 monthly
    t_54 = np.arange(54, dtype=float)
    t3_monthly = [2000.0 + 9.0 * t_54 + rng.standard_t(3, size=54) * 18.0 for _ in range(24)]
    c80, c95 = _run_dgp(t3_monthly, m_dates[:54], "monthly", 48, 6)
    print(f"[new-seed] heavy_tailed_t3_monthly: 80%={c80:.3f}, 95%={c95:.3f}", flush=True)
    assert 0.70 <= c80 <= 0.90, f"heavy_tailed_t3_monthly 80%={c80:.3f}"
    assert 0.87 <= c95 <= 0.99, f"heavy_tailed_t3_monthly 95%={c95:.3f}"

    # 4. Daily with weekly pattern
    d_dates = [(date(2025, 1, 1) + timedelta(days=i)).isoformat() for i in range(104)]
    t_d = np.arange(104, dtype=float)
    daily_weekly = [
        1000.0 + 2.0 * t_d + 55.0 * np.sin(2 * np.pi * t_d / 7.0) + rng.normal(0.0, 15.0, 104)
        for _ in range(24)
    ]
    c80, c95 = _run_dgp(daily_weekly, d_dates, "daily", 90, 14)
    print(f"[new-seed] daily_weekly: 80%={c80:.3f}, 95%={c95:.3f}", flush=True)
    assert 0.70 <= c80 <= 0.90, f"daily_weekly 80%={c80:.3f}"
    assert 0.87 <= c95 <= 0.99, f"daily_weekly 95%={c95:.3f}"

    # 5. Monthly level shift (step change mid-history)
    level_shift_monthly = []
    for _ in range(24):
        shift = np.where(t_54 >= 26, 260.0, 0.0)
        ys = 1200.0 + 6.0 * t_54 + shift + rng.normal(0.0, 22.0, 54)
        level_shift_monthly.append(ys)
    c80, c95 = _run_dgp(level_shift_monthly, m_dates[:54], "monthly", 48, 6)
    print(f"[new-seed] level_shift_monthly: 80%={c80:.3f}, 95%={c95:.3f}", flush=True)
    assert 0.70 <= c80 <= 0.90, f"level_shift_monthly 80%={c80:.3f}"
    assert 0.87 <= c95 <= 0.99, f"level_shift_monthly 95%={c95:.3f}"

    # 6. Low-count Poisson daily series (non-negative demand counts)
    poisson_daily = []
    for _ in range(24):
        lam = 4.2 + 0.8 * np.sin(2 * np.pi * t_d / 7.0)
        ys = rng.poisson(lam=lam).astype(float)
        poisson_daily.append(ys)
    c80, c95 = _run_dgp(poisson_daily, d_dates, "daily", 90, 14, template="demand")
    print(f"[new-seed] low_count_poisson_daily: 80%={c80:.3f}, 95%={c95:.3f}", flush=True)
    assert 0.70 <= c80 <= 0.90, f"low_count_poisson_daily 80%={c80:.3f}"
    assert 0.87 <= c95 <= 0.99, f"low_count_poisson_daily 95%={c95:.3f}"

    print(f"[new-seed] calibration bound hits across {bound_stats['total']} series: {bound_stats}", flush=True)

