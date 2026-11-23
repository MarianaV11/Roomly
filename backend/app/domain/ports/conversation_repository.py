from abc import ABC, abstractmethod

from app.domain.entities.conversation import Conversation, Message


class ConversationRepository(ABC):
    @abstractmethod
    async def create_conversation(self, conversation: Conversation) -> Conversation: ...

    @abstractmethod
    async def get_conversation(self, conversation_id: int) -> Conversation | None: ...

    @abstractmethod
    async def list_user_conversations(self, user_id: int) -> list[Conversation]: ...

    @abstractmethod
    async def search_groups(self, search: str, limit: int) -> list[Conversation]: ...

    @abstractmethod
    async def add_members(self, conversation_id: int, user_ids: list[int]) -> Conversation: ...

    @abstractmethod
    async def remove_member(self, conversation_id: int, user_id: int) -> Conversation | None: ...

    @abstractmethod
    async def add_message(self, message: Message) -> Message: ...

    @abstractmethod
    async def list_messages(
        self, conversation_id: int, before_id: int | None, limit: int
    ) -> list[Message]: ...
