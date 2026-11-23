from dataclasses import dataclass
from datetime import datetime


@dataclass
class Conversation:
    member_ids: list[int]
    name: str | None = None
    is_group: bool = False

    id: int | None = None
    created_at: datetime | None = None


@dataclass
class Message:
    conversation_id: int
    sender_id: int
    content: str

    id: int | None = None
    created_at: datetime | None = None
