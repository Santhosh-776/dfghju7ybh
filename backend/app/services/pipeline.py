from __future__ import annotations

import logging
from datetime import date, datetime, timedelta, timezone
from typing import Optional

import numpy as np
import pandas as pd

from app.core.config import settings
from app.services.elexon_client import fetch_wind_actuals, fetch_wind_forecasts

logger = logging.getLogger(__name__)

UTC = timezone.utc


def normalise_actuals(records: list[dict]) -> pd.DataFrame:
    if not records:
        return pd.DataFrame(columns=["startTime", "generation"])

    df = pd.DataFrame(records)
    required = {"startTime", "generation"}
    if not required.issubset(df.columns):
        logger.warning("FUELHH records missing columns: %s", required - set(df.columns))
        return pd.DataFrame(columns=["startTime", "generation"])

    df["startTime"] = pd.to_datetime(df["startTime"], utc=True, errors="coerce")
    df["generation"] = pd.to_numeric(df["generation"], errors="coerce")
    df = df.dropna(subset=["startTime", "generation"])

    if "publishTime" in df.columns:
        df["publishTime"] = pd.to_datetime(df["publishTime"], utc=True, errors="coerce")
        df = df.sort_values("publishTime", ascending=False)
        df = df.drop_duplicates(subset=["startTime"], keep="first")

    return df[["startTime", "generation"]].sort_values("startTime").reset_index(drop=True)


def normalise_forecasts(records: list[dict]) -> pd.DataFrame:
    if not records:
        return pd.DataFrame(columns=["startTime", "publishTime", "generation"])

    df = pd.DataFrame(records)
    required = {"startTime", "publishTime", "generation"}
    if not required.issubset(df.columns):
        logger.warning("WINDFOR records missing columns: %s", required - set(df.columns))
        return pd.DataFrame(columns=["startTime", "publishTime", "generation"])

    df["startTime"] = pd.to_datetime(df["startTime"], utc=True, errors="coerce")
    df["publishTime"] = pd.to_datetime(df["publishTime"], utc=True, errors="coerce")
    df["generation"] = pd.to_numeric(df["generation"], errors="coerce")
    df = df.dropna(subset=["startTime", "publishTime", "generation"])

    return (
        df[["startTime", "publishTime", "generation"]]
        .sort_values(["startTime", "publishTime"])
        .reset_index(drop=True)
    )


def aggregate_actuals_to_hourly(df: pd.DataFrame) -> pd.DataFrame:
    """Average two 30-min FUELHH periods per hour → hourly MW average."""
    if df.empty:
        return pd.DataFrame(columns=["delivery_time", "actual_mw"])

    df = df.copy()
    df["delivery_time"] = df["startTime"].dt.floor("h")
    hourly = (
        df.groupby("delivery_time", as_index=False)["generation"]
        .mean()
        .rename(columns={"generation": "actual_mw"})
    )
    return hourly.sort_values("delivery_time").reset_index(drop=True)


def select_day_ahead_forecasts(
    forecasts_df: pd.DataFrame,
    delivery_dates: list[date],
    cutoff_hour_utc: int,
) -> pd.DataFrame:
    """
    For each delivery date, select the latest WINDFOR forecast run published
    strictly before cutoff_hour_utc:00 UTC on (delivery_date - 1 day).
    Approved cutoff assumption: 12:00 UTC, documented in README.
    """
    if forecasts_df.empty:
        return pd.DataFrame(columns=["startTime", "forecast_mw", "forecast_publish_time"])

    selected_rows = []

    for d in delivery_dates:
        cutoff_dt = datetime(d.year, d.month, d.day, cutoff_hour_utc, 0, 0, tzinfo=UTC) - timedelta(days=1)

        eligible = forecasts_df[forecasts_df["publishTime"] < cutoff_dt]
        if eligible.empty:
            logger.warning("No eligible forecast for delivery date %s (cutoff: %s)", d, cutoff_dt)
            continue

        latest_publish = eligible["publishTime"].max()
        run = eligible[eligible["publishTime"] == latest_publish].copy()

        # Keep only slots that fall on this delivery date
        run = run[run["startTime"].dt.date == d]
        if run.empty:
            logger.warning("Selected run (%s) has no slots for %s", latest_publish, d)
            continue

        run = run.rename(columns={
            "generation": "forecast_mw",
            "publishTime": "forecast_publish_time",
        })
        selected_rows.append(run[["startTime", "forecast_mw", "forecast_publish_time"]])

    if not selected_rows:
        return pd.DataFrame(columns=["startTime", "forecast_mw", "forecast_publish_time"])

    return (
        pd.concat(selected_rows, ignore_index=True)
        .sort_values("startTime")
        .reset_index(drop=True)
    )


def build_comparison(
    actuals_hourly: pd.DataFrame,
    selected_forecasts: pd.DataFrame,
) -> pd.DataFrame:
    """
    Outer-join hourly actuals and selected forecasts on delivery_time.
    Assigns status: matched | missing_forecast | missing_actual | unmatched
    Computes signed error_mw = forecast - actual for matched intervals only.
    """
    forecasts = selected_forecasts.rename(columns={"startTime": "delivery_time"})

    merged = pd.merge(actuals_hourly, forecasts, on="delivery_time", how="outer")

    def assign_status(row: pd.Series) -> str:
        has_actual = pd.notna(row.get("actual_mw"))
        has_forecast = pd.notna(row.get("forecast_mw"))
        if has_actual and has_forecast:
            return "matched"
        if has_actual:
            return "missing_forecast"
        if has_forecast:
            return "missing_actual"
        return "unmatched"

    merged["status"] = merged.apply(assign_status, axis=1)
    merged["error_mw"] = np.where(
        merged["status"] == "matched",
        merged["forecast_mw"] - merged["actual_mw"],
        np.nan,
    )

    logger.info(
        "Comparison: %d total | %d matched | %d missing_forecast | %d missing_actual",
        len(merged),
        (merged["status"] == "matched").sum(),
        (merged["status"] == "missing_forecast").sum(),
        (merged["status"] == "missing_actual").sum(),
    )
    return merged.sort_values("delivery_time").reset_index(drop=True)


async def run_pipeline(start_date: date, end_date: date) -> pd.DataFrame:
    """Orchestrates the full data pipeline and returns the comparison DataFrame."""
    actuals_raw = await fetch_wind_actuals(start_date, end_date)

    publish_from = datetime(start_date.year, start_date.month, start_date.day, tzinfo=UTC) - timedelta(days=1)
    publish_to = datetime(end_date.year, end_date.month, end_date.day, 23, 59, 59, tzinfo=UTC)
    forecasts_raw = await fetch_wind_forecasts(publish_from, publish_to)

    actuals_df = normalise_actuals(actuals_raw)
    forecasts_df = normalise_forecasts(forecasts_raw)

    actuals_hourly = aggregate_actuals_to_hourly(actuals_df)

    delivery_dates = [
        start_date + timedelta(days=i)
        for i in range((end_date - start_date).days + 1)
    ]
    selected_forecasts = select_day_ahead_forecasts(
        forecasts_df, delivery_dates, settings.cutoff_hour_utc
    )

    return build_comparison(actuals_hourly, selected_forecasts)
