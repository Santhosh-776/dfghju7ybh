from datetime import date, datetime, timezone

from fastapi import APIRouter, HTTPException, Query

from app.core.config import settings
from app.schemas.responses import DataQualityModel, DataQualityResponse
from app.services.pipeline import run_pipeline

router = APIRouter()


@router.get("/data-quality", response_model=DataQualityResponse, tags=["Data Quality"])
async def get_data_quality(
    start_date: date = Query(default=None, description="Start date (YYYY-MM-DD)."),
    end_date: date = Query(default=None, description="End date (YYYY-MM-DD)."),
) -> DataQualityResponse:
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
    status_counts = df["status"].value_counts().to_dict() if not df.empty else {}

    return DataQualityResponse(
        period_start=start_date.isoformat(),
        period_end=end_date.isoformat(),
        data_quality=DataQualityModel(
            total_intervals=len(df),
            matched_intervals=status_counts.get("matched", 0),
            missing_forecast=status_counts.get("missing_forecast", 0),
            missing_actual=status_counts.get("missing_actual", 0),
            unmatched=status_counts.get("unmatched", 0),
        ),
        last_refreshed=datetime.now(tz=timezone.utc),
    )
