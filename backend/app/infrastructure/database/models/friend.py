from app.infrastructure.database.database import Base
from sqlalchemy import CheckConstraint, Column, DateTime, ForeignKey, Index, Integer, String, func
from sqlalchemy.orm import relationship


class Friend(Base):
    __tablename__ = "friends"
    __table_args__ = (
        CheckConstraint("user_id <> friend_id", name="ck_friends_not_self"),
        CheckConstraint("status IN ('pending', 'accepted')", name="ck_friends_status"),
        # One row per pair, whichever direction the request went.
        Index(
            "uq_friends_pair",
            func.least("user_id", "friend_id"),
            func.greatest("user_id", "friend_id"),
            unique=True,
        ),
    )

    id = Column(Integer, primary_key=True, index=True)
    created_at = Column(DateTime, nullable=False, default=func.now())
    status = Column(String(16), nullable=False, default="pending", server_default="pending")

    user_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    friend_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    user = relationship("User", foreign_keys=[user_id], back_populates="friends")
    friend = relationship("User", foreign_keys=[friend_id], back_populates="friend_of")
