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


class InvalidToken(DomainError):
    def __init__(self) -> None:
        super().__init__("Invalid token")


class ConversationNotFound(DomainError):
    def __init__(self, conversation_id: int) -> None:
        self.conversation_id = conversation_id

        super().__init__(f"Conversation not found: {conversation_id}")


class InvalidConversation(DomainError):
    pass


class NotGroupOwner(DomainError):
    def __init__(self) -> None:
        super().__init__("Only the group owner can do this")


class WrongGroupPassword(DomainError):
    def __init__(self) -> None:
        super().__init__("Wrong group password")


class FriendshipNotFound(DomainError):
    def __init__(self, friendship_id: int) -> None:
        self.friendship_id = friendship_id

        super().__init__(f"Friend request not found: {friendship_id}")


class FriendshipAlreadyExists(DomainError):
    def __init__(self) -> None:
        super().__init__("You are already friends or a request is already pending")


class InvalidFriendship(DomainError):
    pass
