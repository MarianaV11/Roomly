from dataclasses import dataclass
from datetime import datetime
from typing import Literal

from app.domain.entities.user import User

FriendshipStatus = Literal["pending", "accepted"]


@dataclass
class Friendship:
    requester: User
    addressee: User
    status: FriendshipStatus

    id: int | None = None
    created_at: datetime | None = None

    def other(self, user_id: int) -> User:
        return self.addressee if self.requester.id == user_id else self.requester

    @property
    def user_ids(self) -> list[int]:
        return [self.requester.id, self.addressee.id]
