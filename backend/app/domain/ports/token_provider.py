from abc import ABC, abstractmethod


class TokenProvider(ABC):
    @abstractmethod
    def create_access_token(self, subject: str) -> str: ...

    @abstractmethod
    def read_subject(self, token: str) -> str | None: ...