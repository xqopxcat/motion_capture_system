from contextlib import asynccontextmanager
import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.router import api_router
from app.core.config import settings
from app.db.engine import check_database_readiness
from app.db.runtime import get_runtime_engine


logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.repository_adapter = settings.repository_adapter
    if settings.repository_adapter != "postgresql":
        raise RuntimeError("Normal application runtime requires PostgreSQL repositories.")
    readiness = check_database_readiness(get_runtime_engine())
    if not readiness.connection_available:
        raise RuntimeError("PostgreSQL readiness check failed.")
    if not readiness.migrations_at_head and settings.migration_policy == "require_head":
        raise RuntimeError("PostgreSQL schema is not at the required Alembic head.")
    if not readiness.migrations_at_head:
        logger.warning("PostgreSQL schema is not at Alembic head.")
    logger.info("Repository adapter selected: postgresql")
    yield


def create_app() -> FastAPI:
    app = FastAPI(title=settings.app_name, lifespan=lifespan)

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(api_router, prefix="/api")
    return app


app = create_app()
