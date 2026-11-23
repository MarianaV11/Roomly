import redis.asyncio as redis

from app.domain.ports import SessionRepository

# A connected user is re-marked online every PRESENCE_REFRESH_SECONDS (see
# chat_router). If the server dies, nobody refreshes and the key expires on its own.
ONLINE_TTL_SECONDS = 60


def _key(user_id: int) -> str:
    return f"online:{user_id}"


class RedisSessionRepository(SessionRepository):
    def __init__(self, client: redis.Redis):
        self._client = client

    async def is_online(self, user_id: int) -> bool:
        return await self._client.exists(_key(user_id)) == 1

    async def mark_online(self, user_id: int) -> None:
        await self._client.set(_key(user_id), 1, ex=ONLINE_TTL_SECONDS)

    async def mark_offline(self, user_id: int) -> None:
        await self._client.delete(_key(user_id))

    async def filter_online(self, user_ids: list[int]) -> list[int]:
        if not user_ids:
            return []

        values = await self._client.mget([_key(user_id) for user_id in user_ids])

        return [user_id for user_id, value in zip(user_ids, values) if value is not None]
