from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, computed_field


class UserCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    email: str = Field(min_length=3, max_length=255)
    password: str = Field(min_length=8, max_length=128)


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    email: str
    created_at: datetime
    avatar_updated_at: datetime | None = Field(default=None, exclude=True)

    # The version in the URL changes with every new picture, so browsers can cache it forever.
    @computed_field
    @property
    def avatar_url(self) -> str | None:
        if self.avatar_updated_at is None:
            return None
        return f"/api/user/{self.id}/avatar?v={int(self.avatar_updated_at.timestamp() * 1000)}"
