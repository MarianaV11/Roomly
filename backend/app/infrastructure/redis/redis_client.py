from functools import lru_cache

import redis.asyncio as redis

from app.core import get_config


@lru_cache
def get_redis_client() -> redis.Redis:
    return redis.from_url(get_config().redis_url, decode_responses=True)
