from __future__ import annotations

from datetime import datetime
from typing import List, Literal, Optional

from pydantic import BaseModel, Field


class HealthResponse(BaseModel):
    status: Literal["ok", "degraded", "error"] = "ok"
    timestamp: datetime
    version: str = "1.0.0"




class MetricsModel(BaseModel):
    mae_mw: float = Field(description="Mean Absolute Error in MW")
    rmse_mw: float = Field(description="Root Mean Squared Error in MW")
    mbe_mw: float = Field(
        description=(
            "Mean Bias Error in MW — positive = overforecast, negative = underforecast"
        )
    )
    n_observations: int = Field(
        description="Number of matched intervals used for metrics"
    )
    avg_actual_mw: float = Field(
        description="Average actual wind generation in MW"
    )




class TimeseriesPoint(BaseModel):
    delivery_time: datetime = Field(
        description="UTC start of the delivery hour"
    )
    forecast_mw: Optional[float] = Field(
        None, description="Selected forecast in MW"
    )
    actual_mw: Optional[float] = Field(
        None,
        description="Actual wind generation in MW (hourly average of two 30-min FUELHH periods)",
    )
    error_mw: Optional[float] = Field(
        None,
        description="Forecast error in MW: forecast - actual. Positive = overforecast.",
    )
    forecast_publish_time: Optional[datetime] = Field(
        None, description="UTC publishTime of the selected forecast"
    )
    status: Literal[
        "matched", "missing_forecast", "missing_actual", "unmatched"
    ] = "matched"




class DataQualityModel(BaseModel):
    total_intervals: int
    matched_intervals: int
    missing_forecast: int
    missing_actual: int
    unmatched: int




class AnalysisMetadata(BaseModel):
    period_start: str
    period_end: str
    cutoff_rule: str = (
        "Latest WINDFOR forecast published strictly before 12:00 UTC "
        "on the day prior to the delivery date"
    )
    cutoff_timezone: str = "UTC"
    units: str = "MW"
    granularity: str = (
        "1-hour delivery intervals (actuals averaged from 30-min FUELHH data)"
    )
    last_refreshed: datetime




class AnalysisResponse(BaseModel):
    metadata: AnalysisMetadata
    metrics: MetricsModel
    timeseries: List[TimeseriesPoint]
    data_quality: DataQualityModel


class DataQualityResponse(BaseModel):
    period_start: str
    period_end: str
    data_quality: DataQualityModel
    last_refreshed: datetime
