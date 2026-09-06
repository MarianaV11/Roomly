from app.infrastructure.database.database import Base
from sqlalchemy import Column, DateTime, ForeignKey, Integer
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func


class Friend(Base):
    __tablename__ = "friends"

    id = Column(Integer, primary_key=True, index=True)
    created_at = Column(DateTime, nullable=False, default=func.now())

    user_id = Column(
        Integer, ForeignKey("users.id", ondelete="CASCADE", nullable=False, index=True)
    )
    friend_id = Column(
        Integer, ForeignKey("users.id", ondelete="CASCADE", nullable=False, index=True)
    )

    user = relationship("User", foreign_keys=[user_id], back_populates="friends")
    friend = relationship("User", foreign_keys=[friend_id], back_populates="friend_of")
