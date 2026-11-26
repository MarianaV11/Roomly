from dataclasses import dataclass
from datetime import datetime


@dataclass
class Conversation:
    member_ids: list[int]
    name: str | None = None
    is_group: bool = False
    owner_id: int | None = None
    password_hash: str | None = None

    id: int | None = None
    created_at: datetime | None = None

    @property
    def has_password(self) -> bool:
        return self.password_hash is not None


@dataclass
class Message:
    conversation_id: int
    sender_id: int
    content: str

    id: int | None = None
    created_at: datetime | None = None
