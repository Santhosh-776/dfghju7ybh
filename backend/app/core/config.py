from __future__ import annotations

from functools import lru_cache
from typing import List

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # Elexon API
    elexon_base_url: str = "https://data.elexon.co.uk/bmrs/api/v1"

    # CORS — stored as comma-separated string in env, parsed to list
    cors_origins: str = "http://localhost:5173,http://localhost:3000"

    # Logging
    log_level: str = "INFO"

    # Environment
    env: str = "development"

    # Server
    port: int = 8000

    # ── Forecast cutoff rule ──────────────────────────────────────────────────
    # The latest WINDFOR forecast whose publishTime is strictly before
    # CUTOFF_HOUR_UTC:00 UTC on the day PRIOR to the delivery date is selected.
    # This reflects the UK day-ahead auction gate closure (~12:00 UTC).
    # Assumption documented in README.
    cutoff_hour_utc: int = 12

    # ── Default analysis period ───────────────────────────────────────────────
    default_start_date: str = "2026-01-01"
    default_end_date: str = "2026-01-31"

    @property
    def cors_origins_list(self) -> List[str]:
        """Parse comma-separated CORS_ORIGINS into a Python list."""
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    @property
    def is_production(self) -> bool:
        return self.env.lower() == "production"


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """Return a cached Settings instance (singleton)."""
    return Settings()


# Module-level singleton for convenient import
settings = get_settings()
