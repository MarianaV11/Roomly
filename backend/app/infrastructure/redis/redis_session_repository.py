import redis.asyncio as redis

from app.domain.ports import SessionRepository

ONLINE_KEY = "online_users"


class RedisSessionRepository(SessionRepository):
    def __init__(self, client: redis.Redis):
        self._client = client

    async def is_online(self, user_id: int) -> bool:
        return bool(await self._client.sismember(ONLINE_KEY, user_id))

    async def mark_online(self, user_id: int) -> None:
        await self._client.sadd(ONLINE_KEY, user_id)

    async def mark_offline(self, user_id: int) -> None:
        await self._client.srem(ONLINE_KEY, user_id)

    async def list_online(self) -> list[int]:
        return [int(user_id) for user_id in await self._client.smembers(ONLINE_KEY)]
