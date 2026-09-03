from pydantic import BaseModel


class User(BaseModel):
    name: str
    email: str
    password: str


class UserRead(User):
    id: int
    created_at: str

    class Config:
        orm_mode = True
