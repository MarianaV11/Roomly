from dataclasses import dataclass
from datetime import datetime


@dataclass
class Image:
    user_id: int
    name: str
    mime_type: str
    data: bytes

    updated_at: datetime | None = None
