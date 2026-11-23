import asyncio

from fastapi import APIRouter, Depends, Query, WebSocket, WebSocketDisconnect, status

from app.application.chat_service import ChatService
from app.domain.entities.conversation import Conversation
from app.domain.ports import SessionRepository, TokenProvider
from app.presentation.connection_manager import connections
from app.presentation.dependencies import (
    chat_service_scope,
    get_chat_service,
    get_current_user_id,
    get_session_repository,
    get_token_provider,
)
from app.presentation.schemas import (
    ConversationResponse,
    DirectCreate,
    GroupCreate,
    MembersAdd,
    MessageCreate,
    MessageResponse,
)

# Must stay below ONLINE_TTL_SECONDS in redis_session_repository, or a connected
# user would expire between refreshes.
PRESENCE_REFRESH_SECONDS = 30

router = APIRouter()


async def _publish_conversation(conversation: Conversation) -> ConversationResponse:
    """Pushes the conversation to every member: new members learn it exists, old ones
    see the updated member list. The frontend treats the event as an upsert."""
    response = ConversationResponse.model_validate(conversation)
    await connections.send(
        conversation.member_ids,
        {"type": "conversation", "data": response.model_dump(mode="json")},
    )
    return response


@router.post("/conversations/direct", response_model=ConversationResponse)
async def open_direct(
    payload: DirectCreate,
    user_id: int = Depends(get_current_user_id),
    chat_service: ChatService = Depends(get_chat_service),
):
    """Opens the direct conversation with someone; returns the existing one if any."""
    conversation = await chat_service.open_direct(user_id=user_id, other_id=payload.user_id)
    return await _publish_conversation(conversation)


@router.post(
    "/conversations/groups",
    response_model=ConversationResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_group(
    payload: GroupCreate,
    user_id: int = Depends(get_current_user_id),
    chat_service: ChatService = Depends(get_chat_service),
):
    conversation = await chat_service.create_group(
        creator_id=user_id, name=payload.name, member_ids=payload.member_ids
    )
    return await _publish_conversation(conversation)


@router.get("/conversations/groups", response_model=list[ConversationResponse])
async def search_groups(
    search: str = Query(default="", max_length=100),
    limit: int = Query(default=20, ge=1, le=50),
    _: int = Depends(get_current_user_id),
    chat_service: ChatService = Depends(get_chat_service),
):
    """Public groups, newest first, optionally filtered by name."""
    return await chat_service.search_groups(search=search.strip(), limit=limit)


@router.post("/conversations/{conversation_id}/join", response_model=ConversationResponse)
async def join_group(
    conversation_id: int,
    user_id: int = Depends(get_current_user_id),
    chat_service: ChatService = Depends(get_chat_service),
):
    conversation = await chat_service.join_group(conversation_id=conversation_id, user_id=user_id)
    return await _publish_conversation(conversation)


@router.post("/conversations/{conversation_id}/leave", status_code=status.HTTP_204_NO_CONTENT)
async def leave_group(
    conversation_id: int,
    user_id: int = Depends(get_current_user_id),
    chat_service: ChatService = Depends(get_chat_service),
) -> None:
    remaining = await chat_service.leave_group(conversation_id=conversation_id, user_id=user_id)

    # The leaver's other tabs drop it; whoever stays sees the shorter member list.
    await connections.send(
        [user_id], {"type": "conversation_removed", "data": {"id": conversation_id}}
    )
    if remaining is not None:
        await _publish_conversation(remaining)


@router.post("/conversations/{conversation_id}/members", response_model=ConversationResponse)
async def add_members(
    conversation_id: int,
    payload: MembersAdd,
    user_id: int = Depends(get_current_user_id),
    chat_service: ChatService = Depends(get_chat_service),
):
    conversation = await chat_service.add_members(
        conversation_id=conversation_id, actor_id=user_id, member_ids=payload.member_ids
    )
    return await _publish_conversation(conversation)


@router.get("/conversations", response_model=list[ConversationResponse])
async def list_conversations(
    user_id: int = Depends(get_current_user_id),
    chat_service: ChatService = Depends(get_chat_service),
):
    return await chat_service.list_conversations(user_id=user_id)


@router.get(
    "/conversations/{conversation_id}/messages",
    response_model=list[MessageResponse],
)
async def list_messages(
    conversation_id: int,
    before_id: int | None = Query(default=None, description="Load messages older than this id"),
    limit: int = Query(default=50, ge=1, le=100),
    user_id: int = Depends(get_current_user_id),
    chat_service: ChatService = Depends(get_chat_service),
):
    return await chat_service.list_messages(
        conversation_id=conversation_id, user_id=user_id, before_id=before_id, limit=limit
    )


@router.post(
    "/conversations/{conversation_id}/messages",
    response_model=MessageResponse,
    status_code=status.HTTP_201_CREATED,
)
async def send_message(
    conversation_id: int,
    payload: MessageCreate,
    user_id: int = Depends(get_current_user_id),
    chat_service: ChatService = Depends(get_chat_service),
):
    conversation, message = await chat_service.send_message(
        conversation_id=conversation_id, sender_id=user_id, content=payload.content
    )

    response = MessageResponse.model_validate(message)
    await connections.send(
        conversation.member_ids,
        {"type": "message", "data": response.model_dump(mode="json")},
    )

    return response


@router.get("/online", response_model=list[int])
async def online_users(
    user_ids: list[int] = Query(max_length=100, description="Ids to check, e.g. ?user_ids=1&user_ids=2"),
    user_id: int = Depends(get_current_user_id),
    chat_service: ChatService = Depends(get_chat_service),
):
    """Which of the given users are online. Only contacts are reported."""
    return await chat_service.online_contacts(user_id=user_id, user_ids=user_ids)


async def _broadcast_presence(user_id: int, online: bool) -> None:
    async with chat_service_scope() as chat_service:
        contact_ids = await chat_service.list_contact_ids(user_id=user_id)

    await connections.send(
        contact_ids, {"type": "presence", "data": {"user_id": user_id, "online": online}}
    )


async def _keep_online(sessions: SessionRepository, user_id: int) -> None:
    while True:
        await asyncio.sleep(PRESENCE_REFRESH_SECONDS)
        await sessions.mark_online(user_id)


@router.websocket("/ws")
async def chat_socket(
    websocket: WebSocket,
    token: str = Query(),
    token_provider: TokenProvider = Depends(get_token_provider),
    sessions: SessionRepository = Depends(get_session_repository),
):
    # Browsers can't set headers on a WebSocket, so the JWT comes as ?token=...
    subject = token_provider.read_subject(token)

    if subject is None:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    user_id = int(subject)

    await websocket.accept()
    # Register before any other await: an event sent while we wait on Redis
    # would otherwise be lost, even though the client already sees the socket open.
    first_connection = connections.connect(user_id, websocket)
    await sessions.mark_online(user_id)

    if first_connection:
        await _broadcast_presence(user_id, online=True)

    refresher = asyncio.create_task(_keep_online(sessions, user_id))

    try:
        while True:
            # Messages are sent via POST; this loop only keeps the socket open
            # and notices when the client disconnects.
            await websocket.receive_text()
    except WebSocketDisconnect:
        pass
    finally:
        refresher.cancel()

        if connections.disconnect(user_id, websocket):
            await sessions.mark_offline(user_id)
            await _broadcast_presence(user_id, online=False)
