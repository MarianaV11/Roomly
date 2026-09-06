from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Config(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    database_url: str

    redis_url: str

    jwt_secret_key: str
    jwt_algorithm: str
    jwt_access_token_expire_minutes: int = 60

    cors_origins: list[str] = ["http://localhost:3000"]

    echo: bool = True


@lru_cache
def get_config() -> Config:
    return Config()