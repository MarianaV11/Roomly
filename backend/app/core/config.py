from functools import lru_cache
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Config(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    database_url: str

    redis_url: str

    jwt_secret_key: str
    jwt_algorithm: str
    jwt_access_token_expire_minutes: int = 60

    cors_origins: list[str] = ["http://localhost:3000"]
    # Dev only: e.g. any LAN IP on port 3001, to open the app from a phone.
    cors_origin_regex: str | None = None

    echo: bool = True

    # Accepts the URL as Neon/Render hand it out (postgresql://...?sslmode=require):
    # asyncpg needs the +asyncpg driver and "ssl" instead of sslmode/channel_binding.
    @field_validator("database_url")
    @classmethod
    def _asyncpg_url(cls, url: str) -> str:
        parts = urlsplit(url)
        scheme = "postgresql+asyncpg" if parts.scheme in ("postgres", "postgresql") else parts.scheme
        query = dict(parse_qsl(parts.query))
        query.pop("channel_binding", None)
        if "sslmode" in query:
            query["ssl"] = query.pop("sslmode")
        return urlunsplit(parts._replace(scheme=scheme, query=urlencode(query)))


@lru_cache
def get_config() -> Config:
    return Config()