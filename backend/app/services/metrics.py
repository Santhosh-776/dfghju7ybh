from __future__ import annotations

import logging
import math
from dataclasses import dataclass
from typing import Optional

import numpy as np
import pandas as pd

logger = logging.getLogger(__name__)


@dataclass
class MetricsResult:
    mae_mw: float
    rmse_mw: float
    mbe_mw: float
    n_observations: int
    avg_actual_mw: float


def calculate_mae(errors: np.ndarray) -> float:
    return float(np.mean(np.abs(errors)))


def calculate_rmse(errors: np.ndarray) -> float:
    return float(math.sqrt(np.mean(errors**2)))


def calculate_mbe(errors: np.ndarray) -> float:
    """Mean Bias Error — positive = overforecast, negative = underforecast."""
    return float(np.mean(errors))


def calculate_metrics(df: pd.DataFrame) -> Optional[MetricsResult]:
    """
    Calculate MAE, RMSE, MBE and average actual from the comparison DataFrame.
    Only matched intervals (status == 'matched') are used.
    Returns None if there are no matched intervals.
    """
    matched = df[df["status"] == "matched"].copy()

    if matched.empty:
        logger.warning("No matched intervals — cannot calculate metrics")
        return None

    errors = matched["error_mw"].dropna().values
    if len(errors) == 0:
        return None

    return MetricsResult(
        mae_mw=round(calculate_mae(errors), 2),
        rmse_mw=round(calculate_rmse(errors), 2),
        mbe_mw=round(calculate_mbe(errors), 2),
        n_observations=int(len(errors)),
        avg_actual_mw=round(float(matched["actual_mw"].mean()), 2),
    )
