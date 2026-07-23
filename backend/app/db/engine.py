from dataclasses import dataclass

from sqlalchemy import Engine, create_engine, text
from sqlalchemy.engine import make_url
from sqlalchemy.exc import SQLAlchemyError

from app.core.config import Settings
from app.db.version import get_database_revision, get_expected_head_revision


@dataclass(frozen=True)
class DatabaseReadiness:
    connection_available: bool
    current_revision: str | None
    expected_revision: str
    migrations_at_head: bool
    error: str | None = None


def build_engine(settings: Settings) -> Engine:
    if settings.database_url is None:
        raise RuntimeError("DATABASE_URL is required to create a database engine.")

    url = make_url(settings.database_url)
    if url.get_backend_name() != "postgresql":
        raise RuntimeError("DATABASE_URL must target PostgreSQL.")

    connect_args = {"connect_timeout": settings.database_connect_timeout_seconds}
    return create_engine(
        url,
        connect_args=connect_args,
        max_overflow=settings.database_max_overflow,
        pool_pre_ping=True,
        pool_size=settings.database_pool_size,
        pool_timeout=settings.database_pool_timeout_seconds,
    )


def check_database_readiness(engine: Engine) -> DatabaseReadiness:
    expected = get_expected_head_revision()
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
            current = get_database_revision(connection)
    except SQLAlchemyError as error:
        return DatabaseReadiness(
            connection_available=False,
            current_revision=None,
            expected_revision=expected,
            migrations_at_head=False,
            error=str(error),
        )

    return DatabaseReadiness(
        connection_available=True,
        current_revision=current,
        expected_revision=expected,
        migrations_at_head=current == expected,
    )
