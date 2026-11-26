from app.infrastructure.database.database import Base
from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String, false
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func


class Conversation(Base):
    __tablename__ = "conversations"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=True)
    created_at = Column(DateTime, nullable=False, default=func.now())

    is_group = Column(Boolean, nullable=False, default=False, server_default=false(), index=True)


    owner_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    password_hash = Column(String, nullable=True)

    members = relationship(
        "ConversationMember",
        cascade="all, delete-orphan",
        lazy="selectin",
    )
