from domain.entities.user import User, UserRead
from domain.ports import UserRepository
from models import User as UserModel
from sqlalchemy.ext.asyncio import AsyncSession


class DbUserRepository(UserRepository):
    def __init__(self, session: AsyncSession):
        self._session = session

    async def create_user(self, user: User) -> UserRead:
        self._session.add(user)

        await self._session.commit()
        await self._session.refresh(user)

        return user

    async def get_user_by_id(self, user_id: int) -> UserRead | None:
        user = (
            await self._session.query(UserModel).filter(UserModel.id == user_id).first()
        )

        return user

    async def get_user_by_email(self, email: str) -> UserRead | None:
        user = (
            await self._session.query(UserModel)
            .filter(UserModel.email == email)
            .first()
        )

        return user
