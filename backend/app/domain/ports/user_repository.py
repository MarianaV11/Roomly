from abc import ABC, abstractmethod

from entities.user import User, UserRead


class UserRepository(ABC):
    @abstractmethod
    async def create_user(self, user: User) -> UserRead: ...

    @abstractmethod
    async def get_user_by_id(self, user_id: int) -> UserRead: ...

    @abstractmethod
    async def get_user_by_email(self, email: str) -> UserRead: ...
