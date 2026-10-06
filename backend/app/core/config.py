"""
Application configuration.
Reads settings from environment variables / .env file.
"""
from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # Application
    app_name: str = "AI Oil Spill Intelligence API"
    app_version: str = "0.1.0"
    app_env: str = "development"
    debug: bool = True
    app_host: str = "0.0.0.0"
    app_port: int = 8000

    # Database
    database_url: str = "postgresql+psycopg://oilspill_user:changeme@localhost:5432/oilspill_db"

    # Security
    secret_key: str = "CHANGE_ME_IN_PRODUCTION"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60

    # Development admin seed (defaults enable zero-config out of the box demo)
    initial_admin_email: str = "admin@maritime.gov.in"
    initial_admin_password: str = "Admin@Maritime2026"
    initial_admin_name: str = "Authorized Administrator"

    # Upload limits for citizen report media
    max_image_bytes: int = 10 * 1024 * 1024
    max_video_bytes: int = 50 * 1024 * 1024

    # CORS
    frontend_url: str = "http://localhost:5173"


@lru_cache()
def get_settings() -> Settings:
    """Return cached settings instance."""
    return Settings()
