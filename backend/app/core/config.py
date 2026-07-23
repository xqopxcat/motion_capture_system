from typing import Literal

from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


AppEnvironment = Literal["local", "test", "production_like", "production"]
MigrationPolicy = Literal["disabled", "warn", "require_head"]
RepositoryAdapter = Literal["postgresql", "in_memory"]
AuthAdapter = Literal["google", "dev", "test"]
CookieSameSite = Literal["lax", "strict", "none"]
CsrfMode = Literal["origin", "disabled"]


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
    auth_adapter: AuthAdapter = "google"
    google_client_id: str | None = None
    google_client_secret: str | None = None
    google_oauth_redirect_uri: str | None = None
    google_oauth_allowed_redirect_uris: list[str] = []
    frontend_origin: str = "http://localhost:5173"
    auth_allowed_origins: list[str] = ["http://localhost:5173"]
    session_cookie_name: str = "mocap_session"
    session_cookie_secure: bool = False
    session_cookie_http_only: bool = True
    session_cookie_same_site: CookieSameSite = "lax"
    session_cookie_domain: str | None = None
    session_cookie_path: str = "/"
    session_lifetime_seconds: int = 86400
    oauth_attempt_lifetime_seconds: int = 600
    dev_auth_enabled: bool = False
    dev_auth_allowed_origins: list[str] = ["http://localhost:5173"]
    csrf_mode: CsrfMode = "origin"
    csrf_allowed_origins: list[str] = ["http://localhost:5173"]

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
        if self.session_lifetime_seconds <= 0:
            raise ValueError("SESSION_LIFETIME_SECONDS must be positive.")
        if self.oauth_attempt_lifetime_seconds <= 0:
            raise ValueError("OAUTH_ATTEMPT_LIFETIME_SECONDS must be positive.")
        if not self.session_cookie_name or not self.session_cookie_path:
            raise ValueError("Session cookie name and path must be non-empty.")
        if "*" in self.cors_origins or "*" in self.auth_allowed_origins or "*" in self.csrf_allowed_origins:
            raise ValueError("Credentialed authentication allowlists cannot contain wildcards.")
        if self.session_cookie_same_site == "none" and not self.session_cookie_secure:
            raise ValueError("SameSite=None requires a Secure session cookie.")

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

        if self.app_env in {"production", "production_like"}:
            if self.auth_adapter != "google":
                raise ValueError("AUTH_ADAPTER must be 'google' in production and production_like.")
            if self.dev_auth_enabled:
                raise ValueError("DEV_AUTH_ENABLED is forbidden in production and production_like.")
            if not self.session_cookie_secure or not self.session_cookie_http_only:
                raise ValueError("Production session cookies must be Secure and HttpOnly.")
            if self.csrf_mode != "origin":
                raise ValueError("CSRF_MODE must be 'origin' in production and production_like.")
            required = {
                "GOOGLE_CLIENT_ID": self.google_client_id,
                "GOOGLE_CLIENT_SECRET": self.google_client_secret,
                "GOOGLE_OAUTH_REDIRECT_URI": self.google_oauth_redirect_uri,
                "FRONTEND_ORIGIN": self.frontend_origin,
            }
            missing = [name for name, value in required.items() if not value]
            if missing:
                raise ValueError(f"Missing production authentication configuration: {', '.join(missing)}.")
            if self.google_oauth_redirect_uri not in self.google_oauth_allowed_redirect_uris:
                raise ValueError("GOOGLE_OAUTH_REDIRECT_URI must be explicitly allowlisted.")
            if (
                self.frontend_origin not in self.auth_allowed_origins
                or self.frontend_origin not in self.csrf_allowed_origins
            ):
                raise ValueError("FRONTEND_ORIGIN must be included in authentication and CSRF allowlists.")

        if self.dev_auth_enabled:
            if self.app_env != "local" or self.auth_adapter != "dev":
                raise ValueError("Development authentication requires APP_ENV=local and AUTH_ADAPTER=dev.")
            if any(not self._is_localhost_origin(origin) for origin in self.dev_auth_allowed_origins):
                raise ValueError("Development authentication origins must be localhost origins.")

        if self.auth_adapter == "test" and self.app_env != "test":
            raise ValueError("The test authentication adapter is allowed only when APP_ENV=test.")

        return self

    @staticmethod
    def _require_postgresql_url(value: str | None, *, variable_name: str) -> None:
        if not value:
            raise ValueError(f"{variable_name} is required and must target PostgreSQL.")
        if not value.startswith(("postgresql://", "postgresql+psycopg://")):
            raise ValueError(f"{variable_name} must use PostgreSQL with the psycopg driver.")

    @staticmethod
    def _is_localhost_origin(value: str) -> bool:
        return value.startswith(("http://localhost:", "http://127.0.0.1:"))


settings = Settings()
