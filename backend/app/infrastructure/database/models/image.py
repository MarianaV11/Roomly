from app.infrastructure.database.database import Base
from app.infrastructure.database.models.user import User
from sqlalchemy import Column, DateTime, ForeignKey, Integer, LargeBinary, String, select
from sqlalchemy.orm import column_property, deferred
from sqlalchemy.sql import func


class Image(Base):
    __tablename__ = "images"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True
    )

    name = Column(String, nullable=False)
    mime_type = Column(String, nullable=False)

    data = deferred(Column(LargeBinary, nullable=False))

    updated_at = Column(DateTime, nullable=False, default=func.now(), onupdate=func.now())


# Loaded with every user (one small subquery), so any user payload can carry the avatar URL.
User.avatar_updated_at = column_property(
    select(Image.updated_at).where(Image.user_id == User.id).scalar_subquery()
)
