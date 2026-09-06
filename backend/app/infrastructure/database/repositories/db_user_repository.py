from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.entities.user import User
from app.domain.ports import UserRepository
from app.infrastructure.database.models import User as UserModel


class DbUserRepository(UserRepository):
    def __init__(self, session: AsyncSession):
        self._session = session

    async def create_user(self, user: User) -> User:
        model = UserModel(
            name=user.name,
            email=user.email,
            password_hash=user.password_hash,
        )

        self._session.add(model)

        await self._session.commit()
        await self._session.refresh(model)

        return self._to_entity(model)

    async def get_user_by_id(self, user_id: int) -> User | None:
        result = await self._session.execute(
            select(UserModel).where(UserModel.id == user_id)
        )

        return self._to_entity_or_none(result.scalar_one_or_none())

    async def get_user_by_email(self, email: str) -> User | None:
        result = await self._session.execute(
            select(UserModel).where(UserModel.email == email)
        )

        return self._to_entity_or_none(result.scalar_one_or_none())

    @staticmethod
    def _to_entity(model: UserModel) -> User:
        return User(
            id=model.id,
            name=model.name,
            email=model.email,
            password_hash=model.password_hash,
            created_at=model.created_at,
        )

    @classmethod
    def _to_entity_or_none(cls, model: UserModel | None) -> User | None:
        return cls._to_entity(model) if model is not None else None