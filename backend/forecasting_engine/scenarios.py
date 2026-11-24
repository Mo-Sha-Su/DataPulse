"""
What-If scenario simulation overlay for Forecast Studio.

Computes template-aware directional adjustments (growth, volume, price + price elasticity,
and cost) on top of completed baseline forecast points without mutating stored baseline runs.
"""
from __future__ import annotations

import math
from typing import Any, Dict, List, Optional, Set

from .frequency import ForecastInputError


APPLICABLE_DRIVERS_BY_TEMPLATE: Dict[Optional[str], Set[str]] = {
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


def get_applicable_drivers(business_template: Optional[str]) -> Set[str]:
    if business_template in APPLICABLE_DRIVERS_BY_TEMPLATE:
        return APPLICABLE_DRIVERS_BY_TEMPLATE[business_template]
    return APPLICABLE_DRIVERS_BY_TEMPLATE[None]


def apply_what_if_scenario(
    predicted_data: List[Dict[str, Any]],
    assumptions: Dict[str, Any],
    business_template: Optional[str] = None,
    non_negative: Optional[bool] = None,
) -> Dict[str, Any]:
    """
    Applies template-aware What-If scenario adjustments on top of an existing baseline forecast
    without overwriting the baseline predictions.

    Canonical directional drivers:
      - growthRateDeltaPct: compounding per-step % adjustment
      - volumeDeltaPct: level shift % across forecast horizon (merges legacy salesDeltaPct + demandDeltaPct)
      - priceChangePct: explicit price multiplier %
      - priceElasticity: optional elasticity exponent applied to volume via (1 + priceChangePct/100) ** priceElasticity
      - costDeltaPct: level shift % for cost/expense adjustments (replaces legacy expenseDeltaPct)
    """
    if not predicted_data:
        raise ValueError("Cannot compute a scenario without baseline forecast points.")

    growth_delta = float(assumptions.get("growthRateDeltaPct") or 0.0)
    volume_raw = float(assumptions.get("volumeDeltaPct") or 0.0)
    demand_raw = float(assumptions.get("demandDeltaPct") or 0.0)
    sales_raw = float(assumptions.get("salesDeltaPct") or 0.0)
    price_delta = float(assumptions.get("priceChangePct") or 0.0)
    price_elasticity = float(assumptions.get("priceElasticity") or 0.0)
    cost_raw = float(assumptions.get("costDeltaPct") or 0.0)
    expense_raw = float(assumptions.get("expenseDeltaPct") or 0.0)

    for key, val in (
        ("growthRateDeltaPct", growth_delta),
        ("volumeDeltaPct", volume_raw),
        ("demandDeltaPct", demand_raw),
        ("salesDeltaPct", sales_raw),
        ("priceChangePct", price_delta),
        ("costDeltaPct", cost_raw),
        ("expenseDeltaPct", expense_raw),
    ):
        if math.isnan(val) or math.isinf(val):
            raise ValueError(f"Scenario assumption '{key}' must be a finite number.")
        if val < -95.0 or val > 500.0:
            raise ValueError(f"Scenario assumption '{key}' must be between -95% and +500%.")

    if math.isnan(price_elasticity) or math.isinf(price_elasticity):
        raise ValueError("Scenario assumption 'priceElasticity' must be a finite number.")
    if price_elasticity < -10.0 or price_elasticity > 5.0:
        raise ValueError("Scenario assumption 'priceElasticity' must be between -10 and +5.")

    # Normalize legacy keys alongside canonical keys
    volume_factor = (
        (1.0 + volume_raw / 100.0)
        * (1.0 + sales_raw / 100.0)
        * (1.0 + demand_raw / 100.0)
    )
    volume_delta = (volume_factor - 1.0) * 100.0

    cost_factor = (1.0 + cost_raw / 100.0) * (1.0 + expense_raw / 100.0)
    cost_delta = (cost_factor - 1.0) * 100.0

    allowed = get_applicable_drivers(business_template)
    tpl_label = business_template or "general"

    if abs(growth_delta) > 1e-12 and "growthRateDeltaPct" not in allowed:
        raise ForecastInputError(
            "SCENARIO_DRIVER_NOT_APPLICABLE",
            f"Driver 'growthRateDeltaPct' is not applicable to '{tpl_label}' forecasts.",
            details={"driver": "growthRateDeltaPct", "businessTemplate": business_template, "allowedDrivers": sorted(allowed)},
        )
    if abs(volume_delta) > 1e-12 and "volumeDeltaPct" not in allowed:
        raise ForecastInputError(
            "SCENARIO_DRIVER_NOT_APPLICABLE",
            f"Driver 'volumeDeltaPct' is not applicable to '{tpl_label}' forecasts.",
            details={"driver": "volumeDeltaPct", "businessTemplate": business_template, "allowedDrivers": sorted(allowed)},
        )
    if abs(price_delta) > 1e-12 and "priceChangePct" not in allowed:
        raise ForecastInputError(
            "SCENARIO_DRIVER_NOT_APPLICABLE",
            f"Driver 'priceChangePct' is not applicable to '{tpl_label}' forecasts.",
            details={"driver": "priceChangePct", "businessTemplate": business_template, "allowedDrivers": sorted(allowed)},
        )
    if abs(price_elasticity) > 1e-12 and "priceChangePct" not in allowed:
        raise ForecastInputError(
            "SCENARIO_DRIVER_NOT_APPLICABLE",
            f"Driver 'priceElasticity' is not applicable to '{tpl_label}' forecasts.",
            details={"driver": "priceElasticity", "businessTemplate": business_template, "allowedDrivers": sorted(allowed)},
        )
    if abs(cost_delta) > 1e-12 and "costDeltaPct" not in allowed:
        bad_name = "expenseDeltaPct" if (abs(expense_raw) > 1e-12 and abs(cost_raw) <= 1e-12) else "costDeltaPct"
        raise ForecastInputError(
            "SCENARIO_DRIVER_NOT_APPLICABLE",
            f"Driver '{bad_name}' is not applicable to '{tpl_label}' forecasts.",
            details={"driver": bad_name, "businessTemplate": business_template, "allowedDrivers": sorted(allowed)},
        )

    notes: List[str] = []
    warnings: List[str] = []

    elasticity_volume_factor = 1.0
    if "priceChangePct" in allowed and abs(price_delta) > 1e-12:
        if abs(price_elasticity) > 1e-12:
            elasticity_volume_factor = (1.0 + price_delta / 100.0) ** price_elasticity
            notes.append(
                f"Applied price elasticity assumption ({price_elasticity:g}): a {price_delta:+.1f}% price change adjusts volume by {(elasticity_volume_factor - 1.0) * 100.0:+.2f}%."
            )
        else:
            warnings.append(
                "Price change adjustment assumes zero price elasticity (volume unaffected by price) unless priceElasticity is set."
            )

    if business_template == "profit" and (
        abs(volume_delta) > 1e-12 or abs(price_delta) > 1e-12 or abs(cost_delta) > 1e-12
    ):
        notes.append(
            "Profit scenario applies additive directional assumptions (volume/price uplift minus cost change) relative to baseline profit magnitude; separate revenue and cost ledgers are not modeled."
        )
    if business_template == "expenses" and abs(volume_delta) > 1e-12:
        notes.append(
            "On an expenses forecast, positive volume adjustments increase projected spend proportionally."
        )
    if business_template == "inventory":
        notes.append(
            "Inventory What-If adjustments shift projected stock usage/levels only; replenishment lead time and supplier reorder constraints remain outside historical series scope."
        )

    is_profit_tpl = business_template == "profit"
    if non_negative is None:
        is_non_negative = (not is_profit_tpl) and all(
            float(pt.get("value", 0.0)) >= 0.0 and float(pt.get("lower95", pt.get("value", 0.0))) >= 0.0
            for pt in predicted_data
        )
    else:
        is_non_negative = bool(non_negative) and (not is_profit_tpl)

    if is_non_negative:
        notes.append("Lower bounds were limited to zero because this series has no negative values.")

    adjusted_points: List[Dict[str, Any]] = []
    baseline_total = 0.0
    scenario_total = 0.0

    effective_volume_factor = volume_factor * elasticity_volume_factor
    effective_volume_pct = (effective_volume_factor - 1.0) * 100.0
    flat_factor = (
        effective_volume_factor
        * (1.0 + price_delta / 100.0)
        * (1.0 + cost_delta / 100.0)
    )
    additive_level_pct = effective_volume_pct + price_delta + (-cost_delta if is_profit_tpl else cost_delta)

    for step_idx, pt in enumerate(predicted_data, start=1):
        base_val = float(pt["value"])
        compound_factor = (1.0 + growth_delta / 100.0) ** step_idx

        if is_profit_tpl or base_val < 0.0:
            growth_pct = (compound_factor - 1.0) * 100.0
            total_pct = additive_level_pct + growth_pct
            adj_val = base_val + abs(base_val) * (total_pct / 100.0)
        else:
            combined_factor = flat_factor * compound_factor
            adj_val = base_val * combined_factor

        if is_non_negative:
            adj_val = max(0.0, adj_val)

        # Preserve predictive uncertainty around the adjusted scenario point without collapsing to [0, 0]
        if abs(base_val) > 1e-6:
            hw_scale = max(0.5, min(3.0, abs(adj_val) / abs(base_val)))
        else:
            hw_scale = 1.0

        def _shift_interval(low_key: str, up_key: str) -> tuple[float, float]:
            base_low = float(pt.get(low_key, base_val))
            base_up = float(pt.get(up_key, base_val))
            low_hw = max(0.0, base_val - base_low) * hw_scale
            up_hw = max(0.0, base_up - base_val) * hw_scale
            lo = adj_val - low_hw
            hi = adj_val + up_hw
            if is_non_negative:
                lo = max(0.0, lo)
                hi = max(adj_val, hi)
                lo = min(lo, adj_val)
            return (hi, lo) if lo > hi else (lo, hi)

        l95, u95 = _shift_interval("lower95", "upper95")
        l90, u90 = _shift_interval("lower90", "upper90")
        l80, u80 = _shift_interval("lower80", "upper80")

        # Guarantee strict nesting lower95 <= lower90 <= lower80 <= value <= upper80 <= upper90 <= upper95
        l80 = min(l80, adj_val)
        l90 = min(l90, l80)
        l95 = min(l95, l90)
        u80 = max(u80, adj_val)
        u90 = max(u90, u80)
        u95 = max(u95, u90)
        if is_non_negative:
            l80 = max(0.0, l80)
            l90 = max(0.0, l90)
            l95 = max(0.0, l95)

        baseline_total += base_val
        scenario_total += adj_val

        adjusted_points.append(
            {
                "date": pt["date"],
                "baselineValue": round(base_val, 4),
                "value": round(adj_val, 4),
                "delta": round(adj_val - base_val, 4),
                "lower80": round(l80, 4),
                "upper80": round(u80, 4),
                "lower90": round(l90, 4),
                "upper90": round(u90, 4),
                "lower95": round(l95, 4),
                "upper95": round(u95, 4),
            }
        )

    total_delta = scenario_total - baseline_total
    total_delta_pct = (total_delta / abs(baseline_total) * 100.0) if abs(baseline_total) > 1e-9 else None

    return {
        "predictedData": adjusted_points,
        "summary": {
            "baselineTotal": round(baseline_total, 4),
            "scenarioTotal": round(scenario_total, 4),
            "totalDelta": round(total_delta, 4),
            "totalDeltaPct": round(total_delta_pct, 2) if total_delta_pct is not None else None,
            "endBaselineValue": round(float(predicted_data[-1]["value"]), 4),
            "endScenarioValue": adjusted_points[-1]["value"],
        },
        "warnings": warnings,
        "notes": notes,
    }
