"""
Time-series input preparation and quality auditing.

Handles currency/numeric coercion, ISO/quarter timestamp parsing, category filtering,
chronological sorting, duplicate timestamp aggregation, and non-destructive IQR outlier flagging.
"""
from __future__ import annotations

import math
import re
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional, Tuple

import numpy as np
import pandas as pd


AGGREGATIONS = {"sum", "avg", "count", "min", "max"}
CURRENCY_RE = re.compile(r"[,$€£¥₹\s%]")
MISSING_STRINGS = {"null", "nan", "none", "n/a", "na", "-", "—", "--"}


@dataclass
class PreparedSeries:
    timestamps: List[str]  # ISO 8601 date strings (YYYY-MM-DD or full ISO)
    values: List[float]
    raw_row_count: int
    valid_row_count: int
    invalid_date_count: int
    invalid_target_count: int
    duplicate_timestamp_count: int
    unsorted_input: bool
    zero_count: int
    negative_count: int
    outlier_count: int
    outlier_dates: List[str]
    available_groups: List[str] = field(default_factory=list)
    selected_group: Optional[str] = None
    warnings: List[str] = field(default_factory=list)
    notes: List[str] = field(default_factory=list)


def _is_missing_target_raw(value: Any) -> bool:
    if value is None or isinstance(value, bool):
        return True
    if isinstance(value, (int, float)):
        return math.isnan(value) or math.isinf(value)
    text = str(value).strip()
    return not text or text.lower() in MISSING_STRINGS


def coerce_numeric(value: Any) -> Optional[float]:
    if value is None or isinstance(value, bool):
        return None
    if isinstance(value, (int, float)):
        if math.isnan(value) or math.isinf(value):
            return None
        return float(value)
    text = str(value).strip()
    if not text or text.lower() in MISSING_STRINGS:
        return None
    # Normalize Unicode minus sign (U+2212) before parenthesis/currency stripping
    text = text.replace("\u2212", "-")
    is_negative_parens = text.startswith("(") and text.endswith(")")
    if is_negative_parens:
        text = text[1:-1].strip()
    cleaned = CURRENCY_RE.sub("", text)
    if not cleaned or cleaned.lower() in MISSING_STRINGS:
        return None
    try:
        num = float(cleaned)
        if math.isnan(num) or math.isinf(num):
            return None
        return -abs(num) if is_negative_parens else num
    except ValueError:
        return None


def parse_timestamp(value: Any) -> Optional[pd.Timestamp]:
    if value is None or isinstance(value, bool):
        return None
    if isinstance(value, (int, float)):
        if math.isnan(value) or math.isinf(value):
            return None
        # Handle reasonable epoch ms/s or YYYYMMDD integers; avoid mistaking small counts for 1970 dates
        iv = int(value)
        if 1900 <= iv <= 2100 and float(value) == iv:
            return pd.Timestamp(year=iv, month=1, day=1)
        if 19000101 <= iv <= 21001231 and float(value) == iv:
            try:
                return pd.to_datetime(str(iv), format="%Y%m%d", errors="raise")
            except Exception:
                return None
        return None

    text = str(value).strip()
    if not text or text.lower() in {"null", "nan", "none", "n/a", "na"}:
        return None

    # Quarter notation like 2025-Q1 or Q1 2025
    q_match = re.match(r"^(\d{4})[-/ ]?Q([1-4])$", text, re.IGNORECASE)
    if q_match:
        yr, q = int(q_match.group(1)), int(q_match.group(2))
        return pd.Timestamp(year=yr, month=(q - 1) * 3 + 1, day=1)

    q_rev = re.match(r"^Q([1-4])[-/ ]?(\d{4})$", text, re.IGNORECASE)
    if q_rev:
        q, yr = int(q_rev.group(1)), int(q_rev.group(2))
        return pd.Timestamp(year=yr, month=(q - 1) * 3 + 1, day=1)

    try:
        ts = pd.to_datetime(text, errors="raise")
        if pd.isna(ts):
            return None
        if getattr(ts, "tzinfo", None) is not None:
            ts = ts.tz_convert(None)
        return ts.normalize() if ts.hour == 0 and ts.minute == 0 and ts.second == 0 else ts
    except Exception:
        return None


def prepare_time_series(
    rows: List[Dict[str, Any]],
    date_column: str,
    target_column: str,
    aggregation: str = "sum",
    group_column: Optional[str] = None,
    group_value: Optional[str] = None,
    max_observations: int = 10000,
) -> PreparedSeries:
    """
    Validates, parses, chronologically sorts, deduplicates, and audits raw table rows into a series.
    Statistical outliers are counted and surfaced as warnings via IQR fences without modifying data points.
    """
    if not isinstance(rows, list) or len(rows) == 0:
        raise ValueError("Dataset contains no rows to forecast.")
    if not date_column:
        raise ValueError("A date/time column must be selected.")
    if not target_column:
        raise ValueError("A numerical target column must be selected.")
    agg = (aggregation or "sum").lower()
    if agg not in AGGREGATIONS:
        raise ValueError(f"Unsupported aggregation '{aggregation}'. Choose sum, avg, count, min, or max.")

    available_groups: List[str] = []
    selected_group: Optional[str] = None
    filtered_rows = rows
    warnings: List[str] = []
    notes: List[str] = []

    if group_column:
        group_vals = sorted(
            {
                str(r.get(group_column)).strip()
                for r in rows
                if isinstance(r, dict) and r.get(group_column) is not None and str(r.get(group_column)).strip() != ""
            }
        )
        available_groups = group_vals[:100]
        if group_value is not None and str(group_value).strip() != "" and str(group_value) != "__ALL__":
            selected_group = str(group_value).strip()
            filtered_rows = [
                r for r in rows if isinstance(r, dict) and str(r.get(group_column, "")).strip() == selected_group
            ]
            if not filtered_rows:
                raise ValueError(f"No rows matched category '{selected_group}' in '{group_column}'.")
            notes.append(f"Filtered series to {group_column} = {selected_group} ({len(filtered_rows)} source rows).")
        elif len(group_vals) > 1:
            notes.append(
                f"Aggregating across all {len(group_vals)} categories in '{group_column}' using '{agg}'. Select a specific category to forecast an individual series."
            )

    raw_row_count = len(filtered_rows)
    if raw_row_count > max_observations * 5:
        raise ValueError(
            f"Dataset exceeds the processing row limit ({raw_row_count:,} rows; maximum {max_observations * 5:,} source rows)."
        )

    parsed_records: List[Tuple[pd.Timestamp, float]] = []
    invalid_date_count = 0
    invalid_target_count = 0

    for row in filtered_rows:
        if not isinstance(row, dict):
            continue
        ts = parse_timestamp(row.get(date_column))
        if ts is None:
            invalid_date_count += 1
            continue
        if agg == "count":
            val = None if _is_missing_target_raw(row.get(target_column)) else 1.0
        else:
            val = coerce_numeric(row.get(target_column))
        if val is None:
            invalid_target_count += 1
            continue
        parsed_records.append((ts, val))

    if invalid_date_count == raw_row_count:
        raise ValueError(f"Column '{date_column}' does not contain recognizable date/time values.")
    if len(parsed_records) == 0:
        raise ValueError(
            f"No valid numeric observations found for '{target_column}' with valid dates in '{date_column}'."
        )

    invalid_ratio = (invalid_date_count + invalid_target_count) / max(1, raw_row_count)
    if invalid_date_count > 0:
        warnings.append(
            f"Skipped {invalid_date_count} row(s) with missing or unparseable timestamps in '{date_column}'."
        )
    if invalid_target_count > 0:
        warnings.append(
            f"Excluded {invalid_target_count} row(s) with missing or non-numeric values in '{target_column}'."
        )
    if invalid_ratio > 0.4 and len(parsed_records) < 12:
        raise ValueError(
            f"Too many invalid or missing records ({invalid_date_count + invalid_target_count} of {raw_row_count} rows) to construct a reliable series."
        )

    raw_ts_order = [rec[0] for rec in parsed_records]
    unsorted_input = any(raw_ts_order[i] > raw_ts_order[i + 1] for i in range(len(raw_ts_order) - 1))
    if unsorted_input:
        notes.append("Chronologically sorted timestamps before modeling (input rows were unsorted).")

    df = pd.DataFrame(parsed_records, columns=["ds", "y"])
    duplicate_timestamp_count = int(df["ds"].duplicated(keep=False).sum())
    unique_ts_count = int(df["ds"].nunique())

    if duplicate_timestamp_count > 0:
        agg_fn = "mean" if agg == "avg" else agg
        grouped = df.groupby("ds", sort=True)["y"].agg(agg_fn).reset_index()
        notes.append(
            f"Combined {len(df) - len(grouped)} duplicate timestamp rows across {unique_ts_count} unique periods using '{agg}'."
        )
    else:
        grouped = df.sort_values("ds", kind="mergesort").reset_index(drop=True)

    if len(grouped) > max_observations:
        warnings.append(
            f"Series truncated to the most recent {max_observations:,} observations out of {len(grouped):,} to stay within compute limits."
        )
        grouped = grouped.iloc[-max_observations:].reset_index(drop=True)

    vals = grouped["y"].astype(float).to_numpy()
    zero_count = int(np.sum(np.isclose(vals, 0.0, atol=1e-9)))
    negative_count = int(np.sum(vals < 0.0))

    if zero_count > 0:
        notes.append(f"Series includes {zero_count} zero value(s); percentage error (MAPE) is omitted when division by zero would distort results.")
    if negative_count > 0:
        notes.append(f"Series includes {negative_count} negative value(s); multiplicative seasonality and log transforms are disabled automatically.")

    # Outlier detection via IQR, with MAD / standard-deviation fallback when IQR == 0
    outlier_count = 0
    outlier_dates: List[str] = []
    if len(vals) >= 6:
        q1, med, q3 = np.percentile(vals, [25, 50, 75])
        iqr = q3 - q1
        mask = None
        if iqr > 0:
            lower_fence = q1 - 2.5 * iqr
            upper_fence = q3 + 2.5 * iqr
            mask = (vals < lower_fence) | (vals > upper_fence)
        else:
            mad = float(np.median(np.abs(vals - med)))
            if mad > 1e-12:
                mod_z = 0.6745 * np.abs(vals - med) / mad
                mask = mod_z > 3.5
            else:
                sigma_all = float(np.std(vals, ddof=1))
                if sigma_all > 1e-12:
                    mask = np.abs(vals - med) > 3.0 * sigma_all
        if mask is not None:
            outlier_idx = np.where(mask)[0]
            if len(outlier_idx) > 0:
                outlier_count = int(len(outlier_idx))
                outlier_dates = [grouped["ds"].iloc[i].isoformat() for i in outlier_idx[:20]]
                warnings.append(
                    f"Detected {outlier_count} statistical outlier observation(s) (preserved in history, not deleted)."
                )

    timestamps = [ts.isoformat() for ts in grouped["ds"]]
    values = [float(v) for v in vals]

    return PreparedSeries(
        timestamps=timestamps,
        values=values,
        raw_row_count=raw_row_count,
        valid_row_count=len(parsed_records),
        invalid_date_count=invalid_date_count,
        invalid_target_count=invalid_target_count,
        duplicate_timestamp_count=duplicate_timestamp_count,
        unsorted_input=unsorted_input,
        zero_count=zero_count,
        negative_count=negative_count,
        outlier_count=outlier_count,
        outlier_dates=outlier_dates,
        available_groups=available_groups,
        selected_group=selected_group,
        warnings=warnings,
        notes=notes,
    )
