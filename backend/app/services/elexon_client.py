from __future__ import annotations

import logging
from datetime import date, datetime
from typing import Any

import httpx

from app.core.config import settings
from app.core.exceptions import ElexonAPIError

logger = logging.getLogger(__name__)

_TIMEOUT = httpx.Timeout(60.0, connect=10.0)


async def _get(url: str, params: dict[str, Any]) -> list[dict]:
    """
    Shared GET helper with one retry on timeout.

    Returns the parsed JSON list on success.
    Raises ElexonAPIError on HTTP errors, timeouts, or unexpected response shapes.
    """
    for attempt in (1, 2):
        try:
            async with httpx.AsyncClient(timeout=_TIMEOUT) as client:
                response = await client.get(url, params=params)

            if response.status_code != 200:
                raise ElexonAPIError(
                    f"Elexon API returned HTTP {response.status_code} for {url}",
                    status_code=502,
                )

            data = response.json()

            if not isinstance(data, list):
                raise ElexonAPIError(
                    f"Unexpected response format from Elexon API: "
                    f"expected list, got {type(data).__name__}",
                    status_code=502,
                )

            return data

        except httpx.TimeoutException:
            if attempt == 2:
                raise ElexonAPIError(
                    f"Elexon API timed out after 60 s (URL: {url})", status_code=504
                )
            logger.warning("Elexon API timeout on attempt %d — retrying…", attempt)

        except ElexonAPIError:
            raise

        except Exception as exc:
            raise ElexonAPIError(
                f"Unexpected error fetching Elexon data: {exc}", status_code=502
            ) from exc

    return []  


async def fetch_wind_actuals(start_date: date, end_date: date) -> list[dict]:

    url = f"{settings.elexon_base_url}/datasets/FUELHH/stream"
    params = {
        "fuelType": "WIND",
        "settlementDateFrom": start_date.isoformat(),
        "settlementDateTo": end_date.isoformat(),
        "format": "json",
    }
    logger.info("Fetching FUELHH actuals: %s → %s", start_date, end_date)
    records = await _get(url, params)
    logger.info("FUELHH: received %d raw records", len(records))
    return records


async def fetch_wind_forecasts(
    publish_from: datetime,
    publish_to: datetime,
) -> list[dict]:
    """
    Fetch wind generation forecasts from the WINDFOR stream by publishDateTime range.

    The query window starts one day before the delivery period begins so that
    pre-midnight forecast runs (e.g. 2025-12-31T22:30Z covering 2026-01-01
    delivery slots) are captured.

    Returns raw records; each record has:
      startTime (hourly delivery slot), publishTime, generation (MW)
    """
    url = f"{settings.elexon_base_url}/datasets/WINDFOR/stream"
    params = {
        "publishDateTimeFrom": publish_from.strftime("%Y-%m-%dT%H:%M:%SZ"),
        "publishDateTimeTo": publish_to.strftime("%Y-%m-%dT%H:%M:%SZ"),
        "format": "json",
    }
    logger.info(
        "Fetching WINDFOR forecasts: publishTime %s → %s",
        publish_from.isoformat(),
        publish_to.isoformat(),
    )
    records = await _get(url, params)
    logger.info("WINDFOR: received %d raw records", len(records))
    return records
