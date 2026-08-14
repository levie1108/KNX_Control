"""Application configuration via environment variables."""

from pathlib import Path

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Server and KNX defaults loaded from .env or environment."""

    APP_HOST: str = "0.0.0.0"
    APP_PORT: int = 8000
    DEFAULT_KNX_PORT: int = 3671
    DB_PATH: str = "knx_registry.db"

    # PMJ Flavor API
    PMJ_BASE_URL: str = ""
    PMJ_API_KEY: str = ""

    model_config = {"env_file": Path(__file__).resolve().parent.parent / ".env"}


settings = Settings()
