from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field

from app.domain.entities.friendship import Friendship
from app.presentation.schemas.user import UserResponse


class FriendRequestCreate(BaseModel):
    email: str = Field(min_length=3, max_length=255)


class FriendshipResponse(BaseModel):
    id: int
    status: Literal["pending", "accepted"]
    # "incoming": the other person asked you; "outgoing": you asked them.
    direction: Literal["incoming", "outgoing"]
    user: UserResponse
    created_at: datetime

    @classmethod
    def for_viewer(cls, friendship: Friendship, viewer_id: int) -> "FriendshipResponse":
        return cls(
            id=friendship.id,
            status=friendship.status,
            direction="outgoing" if friendship.requester.id == viewer_id else "incoming",
            user=UserResponse.model_validate(friendship.other(viewer_id)),
            created_at=friendship.created_at,
        )
