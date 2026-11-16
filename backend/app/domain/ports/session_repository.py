from abc import ABC, abstractmethod


class SessionRepository(ABC):
    @abstractmethod
    async def is_online(self, user_id: int) -> bool: ...

    @abstractmethod
    async def mark_online(self, user_id: int) -> None: ...

    @abstractmethod
    async def mark_offline(self, user_id: int) -> None: ...

    @abstractmethod
    async def list_online(self) -> list[int]: ...
