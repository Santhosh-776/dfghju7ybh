from datetime import date, datetime, timezone

from fastapi import APIRouter, HTTPException, Query

from app.core.config import settings
from app.schemas.responses import (
    AnalysisMetadata,
    AnalysisResponse,
    DataQualityModel,
    MetricsModel,
    TimeseriesPoint,
)
from app.services.metrics import calculate_metrics
from app.services.pipeline import run_pipeline

router = APIRouter()


def _isnan(value) -> bool:
    """Return True if value is None, NaT, or a float NaN."""
    if value is None:
        return True
    try:
        import math
        import pandas as pd
        return math.isnan(value) or pd.isna(value)
    except (TypeError, ValueError):
        return False


@router.get("/analysis", response_model=AnalysisResponse, tags=["Analysis"])
async def get_analysis(
    start_date: date = Query(
        default=None,
        description="Start date (YYYY-MM-DD). Defaults to 2026-01-01.",
    ),
    end_date: date = Query(
        default=None,
        description="End date (YYYY-MM-DD). Defaults to 2026-01-31.",
    ),
) -> AnalysisResponse:
    if start_date is None:
        start_date = date.fromisoformat(settings.default_start_date)
    if end_date is None:
        end_date = date.fromisoformat(settings.default_end_date)

    if end_date < start_date:
        raise HTTPException(
            status_code=422,
            detail="end_date must be on or after start_date.",
        )

    df = await run_pipeline(start_date, end_date)
    metrics_result = calculate_metrics(df)

    # Build timeseries
    timeseries = [
        TimeseriesPoint(
            delivery_time=row["delivery_time"],
            forecast_mw=None if _isnan(row.get("forecast_mw")) else row.get("forecast_mw"),
            actual_mw=None if _isnan(row.get("actual_mw")) else row.get("actual_mw"),
            error_mw=None if _isnan(row.get("error_mw")) else row.get("error_mw"),
            forecast_publish_time=None
            if _isnan(row.get("forecast_publish_time"))
            else row.get("forecast_publish_time"),
            status=row.get("status", "unmatched"),
        )
        for _, row in df.iterrows()
    ]

    # Data quality counts
    status_counts = df["status"].value_counts().to_dict() if not df.empty else {}
    data_quality = DataQualityModel(
        total_intervals=len(df),
        matched_intervals=status_counts.get("matched", 0),
        missing_forecast=status_counts.get("missing_forecast", 0),
        missing_actual=status_counts.get("missing_actual", 0),
        unmatched=status_counts.get("unmatched", 0),
    )

    metrics_model = (
        MetricsModel(
            mae_mw=metrics_result.mae_mw,
            rmse_mw=metrics_result.rmse_mw,
            mbe_mw=metrics_result.mbe_mw,
            n_observations=metrics_result.n_observations,
            avg_actual_mw=metrics_result.avg_actual_mw,
        )
        if metrics_result
        else MetricsModel(
            mae_mw=0.0,
            rmse_mw=0.0,
            mbe_mw=0.0,
            n_observations=0,
            avg_actual_mw=0.0,
        )
    )

    return AnalysisResponse(
        metadata=AnalysisMetadata(
            period_start=start_date.isoformat(),
            period_end=end_date.isoformat(),
            last_refreshed=datetime.now(tz=timezone.utc),
        ),
        metrics=metrics_model,
        timeseries=timeseries,
        data_quality=data_quality,
    )
