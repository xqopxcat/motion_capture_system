import pytest
from pydantic import ValidationError

from app.core.config import Settings
from app.db.testing import validate_test_database_target


def test_local_postgresql_runtime_requires_database_url() -> None:
    with pytest.raises(ValidationError, match="DATABASE_URL"):
        Settings(app_env="local", database_url=None, repository_adapter="postgresql")


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


@pytest.mark.parametrize("environment", ["local", "production_like", "production"])
def test_database_bound_environments_select_postgresql(environment: str) -> None:
    production_auth = {}
    if environment != "local":
        production_auth = {
            "google_client_id": "placeholder.apps.googleusercontent.com",
            "google_client_secret": "placeholder",
            "google_oauth_redirect_uri": "https://api.example.com/api/auth/google/callback",
            "google_oauth_allowed_redirect_uris": ["https://api.example.com/api/auth/google/callback"],
            "frontend_origin": "https://app.example.com",
            "auth_allowed_origins": ["https://app.example.com"],
            "csrf_allowed_origins": ["https://app.example.com"],
            "session_cookie_secure": True,
            "csrf_mode": "origin",
        }
    settings = Settings(
        app_env=environment,
        database_url="postgresql+psycopg://user:pass@db/app",
        migration_policy="require_head" if environment != "local" else "warn",
        repository_adapter="postgresql",
        auth_adapter="google",
        **production_auth,
    )
    assert settings.repository_adapter == "postgresql"


@pytest.mark.parametrize("environment", ["local", "production_like", "production"])
def test_database_bound_environments_reject_in_memory(environment: str) -> None:
    with pytest.raises(ValidationError, match="In-memory|REPOSITORY_ADAPTER"):
        Settings(
            app_env=environment,
            database_url="postgresql+psycopg://user:pass@db/app",
            migration_policy="require_head" if environment != "local" else "warn",
            repository_adapter="in_memory",
            auth_adapter="google",
        )
