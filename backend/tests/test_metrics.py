import numpy as np
import pandas as pd
import pytest

from app.services.metrics import (
    calculate_mae,
    calculate_mbe,
    calculate_metrics,
    calculate_rmse,
)


def test_calculate_mae():
    errors = np.array([100.0, -100.0, 50.0, -50.0])
    assert calculate_mae(errors) == pytest.approx(75.0)


def test_calculate_rmse():
    errors = np.array([3.0, -4.0])
    # sqrt((9 + 16)/2) = sqrt(12.5) ≈ 3.5355...
    assert calculate_rmse(errors) == pytest.approx(3.5355, rel=1e-3)


def test_calculate_mbe_positive_bias():
    # positive error means forecast > actual
    errors = np.array([100.0, 200.0, 300.0])
    assert calculate_mbe(errors) == pytest.approx(200.0)


def test_calculate_mbe_negative_bias():
    errors = np.array([-100.0, -200.0, -300.0])
    assert calculate_mbe(errors) == pytest.approx(-200.0)


def test_calculate_metrics_empty():
    df = pd.DataFrame(columns=["status", "error_mw", "actual_mw", "forecast_mw"])
    assert calculate_metrics(df) is None


def test_calculate_metrics_no_matched():
    df = pd.DataFrame({
        "status": ["missing_forecast", "missing_actual"],
        "error_mw": [float("nan"), float("nan")],
        "actual_mw": [100.0, float("nan")],
        "forecast_mw": [float("nan"), 120.0],
    })
    assert calculate_metrics(df) is None


def test_calculate_metrics_success():
    df = pd.DataFrame({
        "status": ["matched", "matched"],
        "error_mw": [100.0, -200.0],
        "actual_mw": [1000.0, 2000.0],
        "forecast_mw": [1100.0, 1800.0],
    })
    result = calculate_metrics(df)
    assert result is not None
    assert result.n_observations == 2
    assert result.mae_mw == pytest.approx(150.0)
    assert result.rmse_mw == pytest.approx(158.11, rel=1e-2)
    assert result.mbe_mw == pytest.approx(-50.0)
    assert result.avg_actual_mw == pytest.approx(1500.0)


def test_calculate_metrics_ignores_unmatched():
    df = pd.DataFrame({
        "status": ["matched", "missing_forecast", "matched"],
        "error_mw": [100.0, float("nan"), 200.0],
        "actual_mw": [1000.0, 500.0, 2000.0],
        "forecast_mw": [1100.0, float("nan"), 2200.0],
    })
    result = calculate_metrics(df)
    assert result is not None
    assert result.n_observations == 2
    assert result.mae_mw == pytest.approx(150.0)
