from datetime import datetime
from typing import Annotated

from pydantic import BaseModel, ConfigDict, Field, StringConstraints

GroupName = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=100)]


class DirectCreate(BaseModel):
    user_id: int


class GroupCreate(BaseModel):
    name: GroupName
    member_ids: list[int] = Field(default_factory=list, max_length=100)


class MembersAdd(BaseModel):
    member_ids: list[int] = Field(min_length=1, max_length=100)


GroupPassword = Annotated[str, StringConstraints(min_length=4, max_length=128)]


class GroupJoin(BaseModel):
    password: str | None = Field(default=None, max_length=128)


class GroupPasswordSet(BaseModel):
    password: GroupPassword | None


class ConversationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str | None
    is_group: bool
    owner_id: int | None
    has_password: bool
    member_ids: list[int]
    created_at: datetime


class MessageCreate(BaseModel):
    content: str = Field(min_length=1, max_length=4000)


class MessageResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    conversation_id: int
    sender_id: int
    content: str
    created_at: datetime
