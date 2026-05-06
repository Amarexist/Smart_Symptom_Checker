"""
config.py — Application settings loaded from .env
"""
from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    gemini_api_key: str = ""
    app_host: str = "0.0.0.0"
    app_port: int = 8000
    cors_origins: List[str] = ["*"]

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


settings = Settings()
