from app.infrastructure.database.database import Base
from sqlalchemy import Column, DateTime, Integer, String
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)

    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)

    created_at = Column(DateTime, nullable=False, default=func.now())

    friends = relationship(
        "Friend",
        foreign_keys="Friend.user_id",
        back_populates="user",
        cascade="all, delete-orphan",
        lazy="selectin",
    )
    friend_of = relationship(
        "Friend",
        foreign_keys="Friend.friend_id",
        back_populates="friend",
        cascade="all, delete-orphan",
        lazy="selectin",
    )
