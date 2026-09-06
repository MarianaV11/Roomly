from abc import ABC, abstractmethod

from app.domain.entities.user import User


class UserRepository(ABC):
    @abstractmethod
    async def create_user(self, user: User) -> User: ...

    @abstractmethod
    async def get_user_by_id(self, user_id: int) -> User | None: ...

    @abstractmethod
    async def get_user_by_email(self, email: str) -> User | None: ...