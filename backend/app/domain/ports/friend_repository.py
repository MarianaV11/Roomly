from abc import ABC, abstractmethod

from app.domain.entities.friendship import Friendship


class FriendRepository(ABC):
    @abstractmethod
    async def get(self, friendship_id: int) -> Friendship | None: ...

    @abstractmethod
    async def get_between(self, user_id: int, other_id: int) -> Friendship | None: ...

    @abstractmethod
    async def list_for_user(self, user_id: int) -> list[Friendship]: ...

    @abstractmethod
    async def create_request(self, requester_id: int, addressee_id: int) -> Friendship: ...

    @abstractmethod
    async def accept(self, friendship_id: int) -> Friendship: ...

    @abstractmethod
    async def delete(self, friendship_id: int) -> None: ...
