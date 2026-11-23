from sqlalchemy import and_, or_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.domain.entities.friendship import Friendship
from app.domain.exceptions import FriendshipAlreadyExists
from app.domain.ports import FriendRepository
from app.infrastructure.database.models import Friend as FriendModel
from app.infrastructure.database.repositories.db_user_repository import DbUserRepository


def _with_users():
    return select(FriendModel).options(
        selectinload(FriendModel.user), selectinload(FriendModel.friend)
    )


class DbFriendRepository(FriendRepository):
    def __init__(self, session: AsyncSession):
        self._session = session

    async def get(self, friendship_id: int) -> Friendship | None:
        result = await self._session.execute(_with_users().where(FriendModel.id == friendship_id))
        model = result.scalar_one_or_none()

        return self._to_entity(model) if model is not None else None

    async def get_between(self, user_id: int, other_id: int) -> Friendship | None:
        result = await self._session.execute(
            _with_users().where(
                or_(
                    and_(FriendModel.user_id == user_id, FriendModel.friend_id == other_id),
                    and_(FriendModel.user_id == other_id, FriendModel.friend_id == user_id),
                )
            )
        )
        model = result.scalar_one_or_none()

        return self._to_entity(model) if model is not None else None

    async def list_for_user(self, user_id: int) -> list[Friendship]:
        result = await self._session.execute(
            _with_users()
            .where(or_(FriendModel.user_id == user_id, FriendModel.friend_id == user_id))
            .order_by(FriendModel.id.desc())
        )

        return [self._to_entity(model) for model in result.scalars()]

    async def create_request(self, requester_id: int, addressee_id: int) -> Friendship:
        model = FriendModel(user_id=requester_id, friend_id=addressee_id, status="pending")
        self._session.add(model)

        try:
            await self._session.commit()
        except IntegrityError:
            # Both people sent a request at the same moment: the unique pair index caught it.
            await self._session.rollback()
            raise FriendshipAlreadyExists() from None

        return await self.get(model.id)

    async def accept(self, friendship_id: int) -> Friendship:
        model = await self._session.get(FriendModel, friendship_id)
        model.status = "accepted"

        await self._session.commit()

        return await self.get(friendship_id)

    async def delete(self, friendship_id: int) -> None:
        model = await self._session.get(FriendModel, friendship_id)

        if model is not None:
            await self._session.delete(model)
            await self._session.commit()

    @staticmethod
    def _to_entity(model: FriendModel) -> Friendship:
        return Friendship(
            id=model.id,
            requester=DbUserRepository._to_entity(model.user),
            addressee=DbUserRepository._to_entity(model.friend),
            status=model.status,
            created_at=model.created_at,
        )
