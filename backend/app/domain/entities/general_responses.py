from dataclasses import dataclass


@dataclass
class GeneralResponse:
    status_code: int
    message: str
