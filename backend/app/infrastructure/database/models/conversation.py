from app.infrastructure.database.database import Base
from sqlalchemy import Boolean, Column, DateTime, Integer, String, false
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func


class Conversation(Base):
    __tablename__ = "conversations"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=True)
    created_at = Column(DateTime, nullable=False, default=func.now())

    # Direct conversation (False): always exactly two people.
    # Group (True): has a name, is public (anyone can find and join it) and can grow.
    is_group = Column(Boolean, nullable=False, default=False, server_default=false(), index=True)

    members = relationship(
        "ConversationMember",
        cascade="all, delete-orphan",
        lazy="selectin",
    )
