from pydantic import BaseModel


class GeneralResponse(BaseModel):
    status_code: int
    message: str
