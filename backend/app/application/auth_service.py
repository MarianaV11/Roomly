from app.core import Config, get_config
from app.domain.entities.user import User, UserRead
from app.domain.ports import UserRepository


class AuthService:
    def __init__(self, repository: UserRepository, config: Config = get_config()):
        self._repository = repository
        self._config = config

    async def register_user(self, user: User) -> UserRead:
        existing = await self._repository.get_user_by_email(email=user.email)

        if existing:
            raise ValueError("User with this email already exists")

        return await self._repository.create_user(user=user)
