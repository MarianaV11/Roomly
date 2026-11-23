from app.infrastructure.database.database import Base
from sqlalchemy import Column, ForeignKey, Integer


class ConversationMember(Base):
    __tablename__ = "conversation_members"

    conversation_id = Column(
        Integer,
        ForeignKey("conversations.id", ondelete="CASCADE"),
        primary_key=True,
    )
    user_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        primary_key=True,
        index=True,
    )
