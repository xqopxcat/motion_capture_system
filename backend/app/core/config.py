from typing import Literal

from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


AppEnvironment = Literal["local", "test", "production_like", "production"]
MigrationPolicy = Literal["disabled", "warn", "require_head"]
RepositoryAdapter = Literal["postgresql", "in_memory"]


class Settings(BaseSettings):
    app_name: str = "Motion Capture Platform API"
    app_env: AppEnvironment = "local"
    cors_origins: list[str] = ["http://localhost:5173"]
    database_url: str | None = None
    test_database_url: str | None = None
    database_connect_timeout_seconds: int = 10
    database_pool_size: int = 5
    database_max_overflow: int = 10
    database_pool_timeout_seconds: int = 30
    migration_policy: MigrationPolicy = "warn"
    repository_adapter: RepositoryAdapter = "postgresql"
    session_cookie_name: str = "mocap_session"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @model_validator(mode="after")
    def validate_database_configuration(self) -> "Settings":
        if self.database_connect_timeout_seconds <= 0:
            raise ValueError("DATABASE_CONNECT_TIMEOUT_SECONDS must be positive.")
        if self.database_pool_size <= 0:
            raise ValueError("DATABASE_POOL_SIZE must be positive.")
        if self.database_max_overflow < 0:
            raise ValueError("DATABASE_MAX_OVERFLOW cannot be negative.")
        if self.database_pool_timeout_seconds <= 0:
            raise ValueError("DATABASE_POOL_TIMEOUT_SECONDS must be positive.")

        if self.app_env in {"production", "production_like"}:
            self._require_postgresql_url(self.database_url, variable_name="DATABASE_URL")
            if self.migration_policy != "require_head":
                raise ValueError(
                    "MIGRATION_POLICY must be 'require_head' in production and production_like.",
                )
            if self.repository_adapter != "postgresql":
                raise ValueError(
                    "REPOSITORY_ADAPTER must be 'postgresql' in production and production_like.",
                )
        elif self.database_url is not None:
            self._require_postgresql_url(self.database_url, variable_name="DATABASE_URL")

        if self.test_database_url is not None:
            self._require_postgresql_url(self.test_database_url, variable_name="TEST_DATABASE_URL")

        if self.repository_adapter == "in_memory" and self.app_env != "test":
            raise ValueError("In-memory repositories are allowed only when APP_ENV=test.")

        if self.repository_adapter == "postgresql" and self.app_env != "test" and not self.database_url:
            raise ValueError("DATABASE_URL is required for the PostgreSQL repository adapter.")

        return self

    @staticmethod
    def _require_postgresql_url(value: str | None, *, variable_name: str) -> None:
        if not value:
            raise ValueError(f"{variable_name} is required and must target PostgreSQL.")
        if not value.startswith(("postgresql://", "postgresql+psycopg://")):
            raise ValueError(f"{variable_name} must use PostgreSQL with the psycopg driver.")


settings = Settings()
