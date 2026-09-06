class DomainError(Exception):
    pass


class EmailAlreadyRegistered(DomainError):
    def __init__(self, email: str) -> None:
        self.email = email

        super().__init__(f"User with email {email} already exists")


class UserNotFound(DomainError):
    def __init__(self, identifier: str | int) -> None:
        self.identifier = identifier

        super().__init__(f"User not found: {identifier}")


class InvalidCredentials(DomainError):
    def __init__(self) -> None:
        super().__init__("Invalid email or password")