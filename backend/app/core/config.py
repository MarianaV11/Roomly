from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache


class Config(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    database_url: str

    redis_url: str

    jwt_secret_key: str
    jwt_algorithm: str
    
    echo: bool = True

@lru_cache
def get_config() -> Config:
    return Config()