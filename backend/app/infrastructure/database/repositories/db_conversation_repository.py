from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.entities.conversation import Conversation, Message
from app.domain.ports import ConversationRepository
from app.infrastructure.database.models import Conversation as ConversationModel
from app.infrastructure.database.models import ConversationMember as MemberModel
from app.infrastructure.database.models import Message as MessageModel


class DbConversationRepository(ConversationRepository):
    def __init__(self, session: AsyncSession):
        self._session = session

    async def create_conversation(self, conversation: Conversation) -> Conversation:
        model = ConversationModel(
            name=conversation.name,
            is_group=conversation.is_group,
            members=[MemberModel(user_id=user_id) for user_id in conversation.member_ids],
        )

        self._session.add(model)

        await self._session.commit()
        await self._session.refresh(model)

        return self._to_conversation(model)

    async def get_conversation(self, conversation_id: int) -> Conversation | None:
        model = await self._session.get(ConversationModel, conversation_id)

        return self._to_conversation(model) if model is not None else None

    async def list_user_conversations(self, user_id: int) -> list[Conversation]:
        result = await self._session.execute(
            select(ConversationModel)
            .join(MemberModel)
            .where(MemberModel.user_id == user_id)
            .order_by(ConversationModel.id.desc())
        )

        return [self._to_conversation(model) for model in result.scalars()]

    async def search_groups(self, search: str, limit: int) -> list[Conversation]:
        query = (
            select(ConversationModel)
            .where(ConversationModel.is_group.is_(True))
            .order_by(ConversationModel.id.desc())
            .limit(limit)
        )

        if search:
            escaped = search.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")
            query = query.where(ConversationModel.name.ilike(f"%{escaped}%", escape="\\"))

        result = await self._session.execute(query)

        return [self._to_conversation(model) for model in result.scalars()]

    async def add_members(self, conversation_id: int, user_ids: list[int]) -> Conversation:
        model = await self._session.get(ConversationModel, conversation_id)

        # Appending to the relationship (not adding rows directly) keeps the
        # in-memory model.members in sync, so the returned entity is complete.
        model.members.extend(MemberModel(user_id=user_id) for user_id in user_ids)

        await self._session.commit()

        return self._to_conversation(model)

    async def add_message(self, message: Message) -> Message:
        model = MessageModel(
            conversation_id=message.conversation_id,
            sender_id=message.sender_id,
            content=message.content,
        )

        self._session.add(model)

        await self._session.commit()
        await self._session.refresh(model)

        return self._to_message(model)

    async def list_messages(
        self, conversation_id: int, before_id: int | None, limit: int
    ) -> list[Message]:
        query = (
            select(MessageModel)
            .where(MessageModel.conversation_id == conversation_id)
            .order_by(MessageModel.id.desc())
            .limit(limit)
        )

        if before_id is not None:
            query = query.where(MessageModel.id < before_id)

        result = await self._session.execute(query)

        # Fetched newest-first to get the latest page; returned oldest-first for display.
        return [self._to_message(model) for model in reversed(result.scalars().all())]

    @staticmethod
    def _to_conversation(model: ConversationModel) -> Conversation:
        return Conversation(
            id=model.id,
            name=model.name,
            is_group=model.is_group,
            member_ids=sorted(member.user_id for member in model.members),
            created_at=model.created_at,
        )

    @staticmethod
    def _to_message(model: MessageModel) -> Message:
        return Message(
            id=model.id,
            conversation_id=model.conversation_id,
            sender_id=model.sender_id,
            content=model.content,
            created_at=model.created_at,
        )
