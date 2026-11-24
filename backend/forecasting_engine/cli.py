"""
Command-line JSON bridge for the Data Pulse Python forecasting engine.

Reads a single JSON payload from stdin, dispatches `detect_frequency`, `run_forecast`,
or `run_scenario`, and emits `{ "ok": true, "data": ... }` or structured validation errors on stdout.
"""
from __future__ import annotations

import json
import sys
from typing import Any, Dict

from .frequency import ForecastInputError, align_and_validate_frequency, detect_frequency_info
from .models import run_forecast_pipeline
from .prepare import prepare_time_series
from .scenarios import apply_what_if_scenario


def handle_request(payload: Dict[str, Any]) -> Dict[str, Any]:
    """Routes an incoming engine action payload to the corresponding forecasting pipeline."""
    action = payload.get("action", "run_forecast")

    if action == "detect_frequency":
        rows = payload.get("rows") or []
        date_column = payload.get("dateColumn") or ""
        target_column = payload.get("targetColumn") or ""
        aggregation = payload.get("aggregation") or "sum"
        group_column = payload.get("groupColumn")
        group_value = payload.get("groupValue")
        max_observations = int(payload.get("maxObservations") or 10000)

        prepared = prepare_time_series(
            rows=rows,
            date_column=date_column,
            target_column=target_column,
            aggregation=aggregation,
            group_column=group_column,
            group_value=group_value,
            max_observations=max_observations,
        )
        info = detect_frequency_info(prepared.timestamps)
        return {
            "ok": True,
            "data": {
                **info,
                "availableGroups": prepared.available_groups,
                "validObservations": len(prepared.timestamps),
                "warnings": prepared.warnings,
            },
        }

    if action == "run_forecast":
        rows = payload.get("rows") or []
        date_column = payload.get("dateColumn") or ""
        target_column = payload.get("targetColumn") or ""
        aggregation = payload.get("aggregation") or "sum"
        frequency = payload.get("frequency") or "auto"
        raw_horizon_days = payload.get("horizonDays")
        raw_horizon_steps = payload.get("horizonSteps")
        horizon_days = int(raw_horizon_days) if raw_horizon_days is not None else 30
        horizon_steps = int(raw_horizon_steps) if raw_horizon_steps is not None else None
        model = payload.get("model") or "auto"
        group_column = payload.get("groupColumn")
        group_value = payload.get("groupValue")
        business_template = payload.get("businessTemplate")
        max_observations = int(payload.get("maxObservations") or 10000)

        prepared = prepare_time_series(
            rows=rows,
            date_column=date_column,
            target_column=target_column,
            aggregation=aggregation,
            group_column=group_column,
            group_value=group_value,
            max_observations=max_observations,
        )
        aligned = align_and_validate_frequency(
            prepared=prepared,
            requested_frequency=frequency,
            aggregation=aggregation,
        )
        result = run_forecast_pipeline(
            prepared=prepared,
            aligned=aligned,
            horizon_days=horizon_days,
            horizon_steps=horizon_steps,
            requested_model=model,
            business_template=business_template,
        )
        return {"ok": True, "data": result}

    if action == "run_scenario":
        predicted_data = payload.get("predictedData") or []
        assumptions = payload.get("assumptions") or {}
        business_template = payload.get("businessTemplate")
        non_negative = payload.get("nonNegative")
        result = apply_what_if_scenario(
            predicted_data=predicted_data,
            assumptions=assumptions,
            business_template=business_template,
            non_negative=non_negative,
        )
        return {"ok": True, "data": result}

    raise ForecastInputError("UNKNOWN_ACTION", f"Unsupported engine action '{action}'.")


def main() -> int:
    try:
        raw = sys.stdin.read()
        if not raw.strip():
            raise ForecastInputError("EMPTY_INPUT", "Forecasting engine received empty input.")
        payload = json.loads(raw)
        response = handle_request(payload)
        sys.stdout.write(json.dumps(response))
        return 0
    except ForecastInputError as exc:
        sys.stdout.write(
            json.dumps(
                {
                    "ok": False,
                    "error": {
                        "code": exc.code,
                        "message": exc.message,
                        "details": exc.details,
                    },
                }
            )
        )
        return 0
    except ValueError as exc:
        sys.stdout.write(
            json.dumps(
                {
                    "ok": False,
                    "error": {
                        "code": "INVALID_INPUT",
                        "message": str(exc),
                        "details": {},
                    },
                }
            )
        )
        return 0
    except Exception as exc:
        sys.stdout.write(
            json.dumps(
                {
                    "ok": False,
                    "error": {
                        "code": "ENGINE_ERROR",
                        "message": f"Forecasting engine error: {exc}",
                        "details": {},
                    },
                }
            )
        )
        return 0


if __name__ == "__main__":
    raise SystemExit(main())
