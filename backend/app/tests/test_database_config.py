import pytest
from pydantic import ValidationError

from app.core.config import Settings
from app.db.testing import validate_test_database_target


def test_local_import_does_not_require_database_url() -> None:
    settings = Settings(app_env="local", database_url=None)
    assert settings.database_url is None


def test_production_requires_postgresql_and_migration_head() -> None:
    with pytest.raises(ValidationError, match="DATABASE_URL"):
        Settings(app_env="production", database_url=None, migration_policy="require_head")

    with pytest.raises(ValidationError, match="PostgreSQL"):
        Settings(
            app_env="production_like",
            database_url="sqlite:///unsafe.db",
            migration_policy="require_head",
        )

    with pytest.raises(ValidationError, match="MIGRATION_POLICY"):
        Settings(
            app_env="production",
            database_url="postgresql+psycopg://user:pass@db/app",
            migration_policy="warn",
        )


def test_database_pool_values_are_validated() -> None:
    with pytest.raises(ValidationError, match="DATABASE_POOL_SIZE"):
        Settings(database_pool_size=0)


def test_test_database_guard_rejects_unsafe_targets() -> None:
    with pytest.raises(RuntimeError, match="APP_ENV=test"):
        validate_test_database_target(
            app_env="production",
            database_url="postgresql+psycopg://user:pass@db/app_test",
        )
    with pytest.raises(RuntimeError, match="end with '_test'"):
        validate_test_database_target(
            app_env="test",
            database_url="postgresql+psycopg://user:pass@db/production",
        )


def test_safe_test_database_target_gets_unique_schema() -> None:
    target = validate_test_database_target(
        app_env="test",
        database_url="postgresql+psycopg://user:pass@localhost/motion_capture_test",
    )
    assert target.schema_name.startswith("test_")
