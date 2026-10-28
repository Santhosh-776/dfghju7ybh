import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.router import api_router
from app.core.config import settings
from app.core.exceptions import register_exception_handlers

logging.basicConfig(
    level=getattr(logging, settings.log_level.upper(), logging.INFO),
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)

logger = logging.getLogger(__name__)


def create_app() -> FastAPI:
    app = FastAPI(
        title="Wind Generation Forecast Monitor",
        description=(
            "API for comparing national wind generation forecasts against actuals "
            "for UK day-ahead purchasing decisions. Data sourced from Elexon BMRS."
        ),
        version="1.0.0",
        docs_url="/docs",
        redoc_url="/redoc",
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins_list,
        allow_credentials=True,
        allow_methods=["GET"],
        allow_headers=["*"],
    )

    register_exception_handlers(app)

    app.include_router(api_router)

    @app.on_event("startup")
    async def on_startup() -> None:
        logger.info(
            "Wind Forecast Monitor backend started — ENV=%s | CORS=%s",
            settings.env,
            settings.cors_origins_list,
        )

    return app


app = create_app()
