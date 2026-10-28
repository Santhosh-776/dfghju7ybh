from datetime import date, datetime, timezone
from unittest.mock import AsyncMock, patch

import numpy as np
import pandas as pd
import pytest

from app.services.pipeline import (
    aggregate_actuals_to_hourly,
    build_comparison,
    normalise_actuals,
    normalise_forecasts,
    run_pipeline,
    select_day_ahead_forecasts,
)

UTC = timezone.utc


def test_normalise_actuals_empty():
    df = normalise_actuals([])
    assert df.empty
    assert list(df.columns) == ["startTime", "generation"]


def test_normalise_actuals_valid():
    records = [
        {"startTime": "2026-01-01T00:00:00Z", "generation": "1200.5"},
        {"startTime": "2026-01-01T00:30:00Z", "generation": "1300.5"},
    ]
    df = normalise_actuals(records)
    assert len(df) == 2
    assert df.iloc[0]["generation"] == 1200.5
    assert df.iloc[1]["generation"] == 1300.5


def test_normalise_forecasts_valid():
    records = [
        {
            "startTime": "2026-01-01T00:00:00Z",
            "publishTime": "2025-12-31T11:00:00Z",
            "generation": "1250.0",
        }
    ]
    df = normalise_forecasts(records)
    assert len(df) == 1
    assert df.iloc[0]["generation"] == 1250.0


def test_aggregate_actuals_to_hourly():
    df = pd.DataFrame({
        "startTime": pd.to_datetime([
            "2026-01-01T00:00:00Z",
            "2026-01-01T00:30:00Z",
            "2026-01-01T01:00:00Z",
            "2026-01-01T01:30:00Z",
        ]),
        "generation": [1000.0, 1200.0, 800.0, 900.0],
    })
    hourly = aggregate_actuals_to_hourly(df)
    assert len(hourly) == 2
    assert hourly.iloc[0]["actual_mw"] == pytest.approx(1100.0)
    assert hourly.iloc[1]["actual_mw"] == pytest.approx(850.0)


def test_select_day_ahead_forecasts_cutoff_enforcement():
    # Delivery date: 2026-01-02
    # Cutoff: 2026-01-01 12:00:00 UTC
    delivery_date = date(2026, 1, 2)
    cutoff_hour = 12

    forecasts_df = pd.DataFrame({
        "startTime": pd.to_datetime([
            "2026-01-02T00:00:00Z",
            "2026-01-02T00:00:00Z",
            "2026-01-02T00:00:00Z",
        ]),
        "publishTime": pd.to_datetime([
            "2026-01-01T10:00:00Z",  # Eligible
            "2026-01-01T11:30:00Z",  # Eligible and latest
            "2026-01-01T13:00:00Z",  # After cutoff (should be excluded)
        ]),
        "generation": [1000.0, 1150.0, 1400.0],
    })

    selected = select_day_ahead_forecasts(forecasts_df, [delivery_date], cutoff_hour)
    assert len(selected) == 1
    assert selected.iloc[0]["forecast_mw"] == 1150.0
    assert selected.iloc[0]["forecast_publish_time"] == pd.Timestamp("2026-01-01T11:30:00Z")


def test_build_comparison_statuses_and_error():
    actuals = pd.DataFrame({
        "delivery_time": pd.to_datetime([
            "2026-01-01T00:00:00Z",
            "2026-01-01T01:00:00Z",
        ]),
        "actual_mw": [1000.0, 1500.0],
    })
    forecasts = pd.DataFrame({
        "startTime": pd.to_datetime([
            "2026-01-01T00:00:00Z",
            "2026-01-01T02:00:00Z",
        ]),
        "forecast_mw": [1200.0, 1800.0],
        "forecast_publish_time": pd.to_datetime([
            "2025-12-31T11:00:00Z",
            "2025-12-31T11:00:00Z",
        ]),
    })

    comparison = build_comparison(actuals, forecasts)
    assert len(comparison) == 3

    # Matched row (00:00): error = 1200 - 1000 = +200
    r0 = comparison.iloc[0]
    assert r0["status"] == "matched"
    assert r0["error_mw"] == pytest.approx(200.0)

    # Missing forecast row (01:00)
    r1 = comparison.iloc[1]
    assert r1["status"] == "missing_forecast"
    assert np.isnan(r1["error_mw"])

    # Missing actual row (02:00)
    r2 = comparison.iloc[2]
    assert r2["status"] == "missing_actual"
    assert np.isnan(r2["error_mw"])


@pytest.mark.asyncio
@patch("app.services.pipeline.fetch_wind_forecasts", new_callable=AsyncMock)
@patch("app.services.pipeline.fetch_wind_actuals", new_callable=AsyncMock)
async def test_run_pipeline_end_to_end(mock_actuals, mock_forecasts):
    mock_actuals.return_value = [
        {"startTime": "2026-01-01T00:00:00Z", "generation": 1000.0},
        {"startTime": "2026-01-01T00:30:00Z", "generation": 1200.0},
    ]
    mock_forecasts.return_value = [
        {
            "startTime": "2026-01-01T00:00:00Z",
            "publishTime": "2025-12-31T11:00:00Z",
            "generation": 1150.0,
        }
    ]

    df = await run_pipeline(date(2026, 1, 1), date(2026, 1, 1))
    assert not df.empty
    assert len(df) == 1
    assert df.iloc[0]["status"] == "matched"
    assert df.iloc[0]["actual_mw"] == pytest.approx(1100.0)
    assert df.iloc[0]["forecast_mw"] == pytest.approx(1150.0)
    assert df.iloc[0]["error_mw"] == pytest.approx(50.0)
