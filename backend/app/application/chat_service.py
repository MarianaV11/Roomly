from app.domain.entities.conversation import Conversation, Message
from app.domain.exceptions import ConversationNotFound, InvalidConversation, UserNotFound
from app.domain.ports import ConversationRepository, SessionRepository, UserRepository


class ChatService:
    def __init__(
        self,
        conversation_repository: ConversationRepository,
        user_repository: UserRepository,
        session_repository: SessionRepository,
    ):
        self._conversations = conversation_repository
        self._users = user_repository
        self._sessions = session_repository

    async def open_direct(self, user_id: int, other_id: int) -> Conversation:
        """The direct conversation between two people; reused if it already exists."""
        if other_id == user_id:
            raise InvalidConversation("You can't start a conversation with yourself")

        await self._ensure_users_exist([other_id])

        for conversation in await self._conversations.list_user_conversations(user_id=user_id):
            if not conversation.is_group and other_id in conversation.member_ids:
                return conversation

        return await self._conversations.create_conversation(
            Conversation(member_ids=sorted({user_id, other_id}), is_group=False)
        )

    async def create_group(
        self, creator_id: int, name: str, member_ids: list[int]
    ) -> Conversation:
        # Groups are public, so starting alone and letting people join is fine.
        members = sorted(set(member_ids) | {creator_id})
        await self._ensure_users_exist(members)

        return await self._conversations.create_conversation(
            Conversation(member_ids=members, name=name, is_group=True)
        )

    async def search_groups(self, search: str, limit: int) -> list[Conversation]:
        return await self._conversations.search_groups(search=search, limit=limit)

    async def join_group(self, conversation_id: int, user_id: int) -> Conversation:
        conversation = await self._conversations.get_conversation(conversation_id)

        if conversation is None or not conversation.is_group:
            raise ConversationNotFound(conversation_id)

        if user_id in conversation.member_ids:
            return conversation

        return await self._conversations.add_members(conversation_id, [user_id])

    async def add_members(
        self, conversation_id: int, actor_id: int, member_ids: list[int]
    ) -> Conversation:
        conversation = await self._get_as_member(conversation_id, actor_id)

        if not conversation.is_group:
            raise InvalidConversation(
                "People can't be added to a direct conversation; create a group instead"
            )

        new_members = sorted(set(member_ids) - set(conversation.member_ids))
        if not new_members:
            return conversation

        await self._ensure_users_exist(new_members)

        return await self._conversations.add_members(conversation_id, new_members)

    async def list_conversations(self, user_id: int) -> list[Conversation]:
        return await self._conversations.list_user_conversations(user_id=user_id)

    async def list_contact_ids(self, user_id: int) -> list[int]:
        """Everyone who shares at least one conversation with the user."""
        conversations = await self._conversations.list_user_conversations(user_id=user_id)

        return sorted({m for c in conversations for m in c.member_ids} - {user_id})

    async def online_contacts(self, user_id: int, user_ids: list[int]) -> list[int]:
        # Only contacts' presence is visible, so strangers can't track who is online.
        contacts = set(await self.list_contact_ids(user_id))

        return await self._sessions.filter_online(sorted(contacts & set(user_ids)))

    async def send_message(
        self, conversation_id: int, sender_id: int, content: str
    ) -> tuple[Conversation, Message]:
        conversation = await self._get_as_member(conversation_id, sender_id)

        message = await self._conversations.add_message(
            Message(conversation_id=conversation_id, sender_id=sender_id, content=content)
        )

        return conversation, message

    async def list_messages(
        self, conversation_id: int, user_id: int, before_id: int | None, limit: int
    ) -> list[Message]:
        await self._get_as_member(conversation_id, user_id)

        return await self._conversations.list_messages(
            conversation_id=conversation_id, before_id=before_id, limit=limit
        )

    async def _ensure_users_exist(self, user_ids: list[int]) -> None:
        for user_id in user_ids:
            if await self._users.get_user_by_id(user_id=user_id) is None:
                raise UserNotFound(user_id)

    async def _get_as_member(self, conversation_id: int, user_id: int) -> Conversation:
        conversation = await self._conversations.get_conversation(conversation_id)

        # Not a member gets the same 404 as "doesn't exist", so ids can't be probed.
        if conversation is None or user_id not in conversation.member_ids:
            raise ConversationNotFound(conversation_id)

        return conversation
