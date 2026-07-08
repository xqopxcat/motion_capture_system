from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "Motion Capture Platform API"
    cors_origins: list[str] = ["http://localhost:5173"]
    database_url: str | None = None
    session_cookie_name: str = "mocap_session"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
