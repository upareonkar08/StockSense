from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List
import json

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", case_sensitive=False, extra="ignore")

    # App
    APP_NAME: str = "StockSense API"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    ENVIRONMENT: str = "development"

    # Database
    DATABASE_URL: str = "postgresql+asyncpg://stocksense:stocksense@localhost:5432/stocksense"
    DATABASE_URL_SYNC: str = "postgresql://stocksense:stocksense@localhost:5432/stocksense"

    # Redis
    REDIS_URL: str = "redis://localhost:6379"

    # Security
    SECRET_KEY: str = "9a2f6fb4c4d5d3e0921868351cc9ab890c0efbdc9d2f218765432101abcdef"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # CORS
    ALLOWED_ORIGINS: List[str] = ["http://localhost:3000", "http://localhost:5173"]

    # Market Data
    MARKET_DATA_PROVIDER: str = "yahoo_finance"

    # AI
    OPENAI_API_KEY: str | None = None
    ANTHROPIC_API_KEY: str | None = None

    # Rate Limiting
    RATE_LIMIT_PER_MINUTE: int = 60

settings = Settings()
