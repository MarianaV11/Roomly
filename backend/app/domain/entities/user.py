from dataclasses import dataclass
from datetime import datetime


@dataclass
class User:
    name: str
    email: str
    password_hash: str

    id: int | None = None
    created_at: datetime | None = None