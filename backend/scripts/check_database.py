"""Explicit release/readiness check for PostgreSQL connectivity and Alembic head."""

from app.core.config import Settings
from app.db.engine import build_engine, check_database_readiness


def main() -> int:
    settings = Settings()
    engine = build_engine(settings)
    try:
        readiness = check_database_readiness(engine)
    finally:
        engine.dispose()

    if not readiness.connection_available:
        print(f"database connection unavailable: {readiness.error}")
        return 1

    print(f"database revision: {readiness.current_revision or 'unversioned'}")
    print(f"expected revision: {readiness.expected_revision}")

    if settings.migration_policy == "require_head" and not readiness.migrations_at_head:
        print("database migration policy failed: schema is not at Alembic head")
        return 1
    if settings.migration_policy == "warn" and not readiness.migrations_at_head:
        print("warning: database schema is not at Alembic head")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
