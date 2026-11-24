"""
Calendar and cultural holiday regressors (Ramadan, Eid al-Fitr, Eid al-Adha, and country public holidays).

Used optionally by the Time-Indexed Regression candidate when calendar effects are enabled.
"""
from __future__ import annotations

import calendar
from datetime import date, timedelta
from typing import Any, Dict, List, Optional, Tuple

import holidays
from hijridate import Gregorian
import numpy as np


SUPPORTED_HOLIDAY_COUNTRIES = ("EG", "SA", "AE", "US", "GB")

HOLIDAY_SPECS = (
    ("ramadan", "Ramadan"),
    ("eid_fitr", "Eid al-Fitr"),
    ("eid_adha", "Eid al-Adha"),
    ("public_holiday", "Public Holiday"),
)

_EID_OR_RAMADAN_TOKENS = ("fitr", "adha", "arafat", "arafah", "ramadan", "فطر", "أضحى", "عرفة", "رمضان")


def _period_day_span(anchor: date, frequency: str, grid_pandas_freq: Optional[str]) -> Tuple[date, date]:
    if frequency == "weekly":
        return anchor, anchor + timedelta(days=6)
    if frequency == "monthly":
        last_day = calendar.monthrange(anchor.year, anchor.month)[1]
        return date(anchor.year, anchor.month, 1), date(anchor.year, anchor.month, last_day)
    if frequency == "quarterly":
        q_start_month = ((anchor.month - 1) // 3) * 3 + 1
        q_end_month = q_start_month + 2
        last_day = calendar.monthrange(anchor.year, q_end_month)[1]
        return date(anchor.year, q_start_month, 1), date(anchor.year, q_end_month, last_day)
    if frequency == "yearly":
        return date(anchor.year, 1, 1), date(anchor.year, 12, 31)
    # daily / business-day
    return anchor, anchor


def _classify_day(
    d: date,
    country_holidays: Any,
) -> Tuple[float, float, float, float]:
    """Returns (ramadan, eid_fitr, eid_adha, public_holiday) indicators for a single calendar date."""
    ramadan = 0.0
    eid_fitr = 0.0
    eid_adha = 0.0
    try:
        h = Gregorian(d.year, d.month, d.day).to_hijri()
        if h.month == 9:
            ramadan = 1.0
        elif h.month == 10 and 1 <= h.day <= 3:
            eid_fitr = 1.0
        elif h.month == 12 and 10 <= h.day <= 13:
            eid_adha = 1.0
    except Exception:
        pass

    public_hol = 0.0
    hol_name = country_holidays.get(d)
    if hol_name:
        lowered = str(hol_name).lower()
        if not any(tok in lowered for tok in _EID_OR_RAMADAN_TOKENS):
            public_hol = 1.0

    return ramadan, eid_fitr, eid_adha, public_hol


def build_calendar_regressor_matrix(
    timestamps: List[str],
    frequency: str,
    country: str = "EG",
    grid_pandas_freq: Optional[str] = None,
) -> Tuple[np.ndarray, List[Dict[str, str]]]:
    """
    Constructs a dense (len(timestamps), 4) matrix of calendar/holiday features:
    [ramadan, eid_fitr, eid_adha, public_holiday], scaled in [0, 1] per period.
    """
    if not timestamps:
        return np.zeros((0, len(HOLIDAY_SPECS)), dtype=float), [
            {"id": hid, "label": label} for hid, label in HOLIDAY_SPECS
        ]

    resolved_country = country.upper() if country and country.upper() in SUPPORTED_HOLIDAY_COUNTRIES else "EG"
    parsed_dates = [date.fromisoformat(str(ts)[:10]) for ts in timestamps]
    min_year = min(d.year for d in parsed_dates) - 1
    max_year = max(d.year for d in parsed_dates) + 1
    country_hols = holidays.country_holidays(resolved_country, years=list(range(min_year, max_year + 1)))

    matrix = np.zeros((len(parsed_dates), len(HOLIDAY_SPECS)), dtype=float)
    day_cache: Dict[date, Tuple[float, float, float, float]] = {}

    for row_idx, anchor in enumerate(parsed_dates):
        start_d, end_d = _period_day_span(anchor, frequency, grid_pandas_freq)
        span_days = max(1, (end_d - start_d).days + 1)
        sums = [0.0, 0.0, 0.0, 0.0]
        cur = start_d
        while cur <= end_d:
            vals = day_cache.get(cur)
            if vals is None:
                vals = _classify_day(cur, country_hols)
                day_cache[cur] = vals
            sums[0] += vals[0]
            sums[1] += vals[1]
            sums[2] += vals[2]
            sums[3] += vals[3]
            cur += timedelta(days=1)
        for col_idx in range(len(HOLIDAY_SPECS)):
            matrix[row_idx, col_idx] = sums[col_idx] / float(span_days)

    specs = [{"id": hid, "label": label} for hid, label in HOLIDAY_SPECS]
    return matrix, specs
