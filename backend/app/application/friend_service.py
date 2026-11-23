from app.domain.entities.friendship import Friendship
from app.domain.exceptions import (
    FriendshipAlreadyExists,
    FriendshipNotFound,
    InvalidFriendship,
    UserNotFound,
)
from app.domain.ports import FriendRepository, UserRepository


class FriendService:
    def __init__(self, friend_repository: FriendRepository, user_repository: UserRepository):
        self._friends = friend_repository
        self._users = user_repository

    async def list_friendships(self, user_id: int) -> list[Friendship]:
        return await self._friends.list_for_user(user_id=user_id)

    async def send_request(self, user_id: int, email: str) -> Friendship:
        other = await self._users.get_user_by_email(email=email)

        if other is None:
            raise UserNotFound(email)
        if other.id == user_id:
            raise InvalidFriendship("You can't add yourself as a friend")

        existing = await self._friends.get_between(user_id, other.id)

        if existing is None:
            return await self._friends.create_request(requester_id=user_id, addressee_id=other.id)

        # They had already asked you: sending one back means yes.
        if existing.status == "pending" and existing.addressee.id == user_id:
            return await self._friends.accept(existing.id)

        raise FriendshipAlreadyExists()

    async def accept_request(self, user_id: int, friendship_id: int) -> Friendship:
        friendship = await self._get_involving(user_id, friendship_id)

        if friendship.status == "accepted":
            return friendship
        if friendship.addressee.id != user_id:
            raise InvalidFriendship("Only who received the request can accept it")

        return await self._friends.accept(friendship_id)

    async def remove(self, user_id: int, friendship_id: int) -> Friendship:
        friendship = await self._get_involving(user_id, friendship_id)
        await self._friends.delete(friendship_id)

        return friendship

    async def _get_involving(self, user_id: int, friendship_id: int) -> Friendship:
        friendship = await self._friends.get(friendship_id)

        # Someone else's friendship looks the same as a missing one.
        if friendship is None or user_id not in friendship.user_ids:
            raise FriendshipNotFound(friendship_id)

        return friendship
