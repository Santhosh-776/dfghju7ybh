from __future__ import annotations

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse


class ElexonAPIError(Exception):
    """Raised when the Elexon BMRS API is unreachable or returns an error."""

    def __init__(self, detail: str, status_code: int = 502) -> None:
        self.detail = detail
        self.status_code = status_code
        super().__init__(detail)


class DataUnavailableError(Exception):
    """Raised when no data is available for the requested date range."""

    def __init__(self, detail: str) -> None:
        self.detail = detail
        super().__init__(detail)


def register_exception_handlers(app: FastAPI) -> None:
    """Register all custom exception handlers on the FastAPI application."""

    @app.exception_handler(ElexonAPIError)
    async def elexon_api_error_handler(
        request: Request, exc: ElexonAPIError
    ) -> JSONResponse:
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "error": "ElexonAPIError",
                "detail": exc.detail,
                "status_code": exc.status_code,
            },
        )

    @app.exception_handler(DataUnavailableError)
    async def data_unavailable_error_handler(
        request: Request, exc: DataUnavailableError
    ) -> JSONResponse:
        return JSONResponse(
            status_code=404,
            content={
                "error": "DataUnavailableError",
                "detail": exc.detail,
                "status_code": 404,
            },
        )

    @app.exception_handler(Exception)
    async def generic_error_handler(
        request: Request, exc: Exception
    ) -> JSONResponse:
        return JSONResponse(
            status_code=500,
            content={
                "error": "InternalServerError",
                "detail": "An unexpected error occurred.",
                "status_code": 500,
            },
        )
