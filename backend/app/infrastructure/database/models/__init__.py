from app.infrastructure.database.database import Base

from .friend import Friend
from .user import User

__all__ = ["Friend", "User", "Base"]
