import asyncio

from fastapi import APIRouter, Depends, Query, WebSocket, WebSocketDisconnect, status
from pydantic import ValidationError

from app.application.chat_service import ChatService
from app.domain.entities.conversation import Conversation
from app.domain.exceptions import DomainError
from app.domain.ports import SessionRepository, TokenProvider
from app.presentation.call_manager import calls
from app.presentation.connection_manager import connections
from app.presentation.dependencies import (
    chat_service_scope,
    get_chat_service,
    get_current_user_id,
    get_session_repository,
    get_token_provider,
)
from app.presentation.schemas import (
    CallJoin,
    CallLeave,
    CallSignal,
    CallState,
    ClientEvent,
    ConversationResponse,
    DirectCreate,
    GroupCreate,
    GroupJoin,
    GroupPasswordSet,
    MembersAdd,
    MessageCreate,
    MessageResponse,
)

# Must stay below ONLINE_TTL_SECONDS in redis_session_repository, or a connected
# user would expire between refreshes.
PRESENCE_REFRESH_SECONDS = 30

# SDP offers are a few KB; anything far bigger isn't a call signal.
MAX_CLIENT_EVENT_BYTES = 64_000

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
    payload: GroupJoin | None = None,
    user_id: int = Depends(get_current_user_id),
    chat_service: ChatService = Depends(get_chat_service),
):
    conversation = await chat_service.join_group(
        conversation_id=conversation_id,
        user_id=user_id,
        password=payload.password if payload else None,
    )
    return await _publish_conversation(conversation)


@router.put("/conversations/{conversation_id}/password", response_model=ConversationResponse)
async def set_group_password(
    conversation_id: int,
    payload: GroupPasswordSet,
    user_id: int = Depends(get_current_user_id),
    chat_service: ChatService = Depends(get_chat_service),
):
    conversation = await chat_service.set_group_password(
        conversation_id=conversation_id, actor_id=user_id, password=payload.password
    )
    return await _publish_conversation(conversation)


@router.post("/conversations/{conversation_id}/leave", status_code=status.HTTP_204_NO_CONTENT)
async def leave_group(
    conversation_id: int,
    user_id: int = Depends(get_current_user_id),
    chat_service: ChatService = Depends(get_chat_service),
) -> None:
    remaining = await chat_service.leave_group(conversation_id=conversation_id, user_id=user_id)

    if calls.leave(conversation_id, user_id):
        await _publish_call_state(conversation_id)

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


@router.get("/calls", response_model=list[CallState])
async def active_calls(
    user_id: int = Depends(get_current_user_id),
    chat_service: ChatService = Depends(get_chat_service),
):
    conversations = await chat_service.list_conversations(user_id=user_id)

    return [
        CallState(conversation_id=c.id, participant_ids=participants)
        for c in conversations
        if (participants := calls.participants(c.id))
    ]


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


async def _publish_call_state(conversation_id: int) -> None:
    async with chat_service_scope() as chat_service:
        member_ids = await chat_service.member_ids(conversation_id)

    participant_ids = calls.participants(conversation_id)
    state = CallState(conversation_id=conversation_id, participant_ids=participant_ids)

    await connections.send(
        sorted(set(member_ids) | set(participant_ids)),
        {"type": "call_state", "data": state.model_dump()},
    )


async def _end_call_in(websocket: WebSocket, conversation_id: int) -> None:
    try:
        await websocket.send_json({"type": "call_ended", "data": {"conversation_id": conversation_id}})
    except Exception:
        pass


async def _join_call(user_id: int, websocket: WebSocket, conversation_id: int) -> None:
    async with chat_service_scope() as chat_service:
        await chat_service.get_member_ids(conversation_id, user_id)

    previous_call, previous_socket = calls.join(conversation_id, user_id, websocket)

    # Joined from another tab, or moved to another call: the old one hangs up.
    if previous_socket is not None and previous_socket is not websocket:
        await _end_call_in(previous_socket, previous_call)
    if previous_call is not None and previous_call != conversation_id:
        await _publish_call_state(previous_call)

    await _publish_call_state(conversation_id)


async def _relay_signal(user_id: int, websocket: WebSocket, event: CallSignal) -> None:
    conversation_id = event.data.conversation_id

    # Only between two people who are both in the call.
    if calls.socket_of(conversation_id, user_id) is not websocket:
        return

    target = calls.socket_of(conversation_id, event.data.to)
    if target is None:
        return

    try:
        await target.send_json(
            {
                "type": "call_signal",
                "data": {
                    "conversation_id": conversation_id,
                    "from": user_id,
                    "payload": event.data.payload,
                },
            }
        )
    except Exception:
        pass


async def _handle_client_event(user_id: int, websocket: WebSocket, raw: str) -> None:
    if len(raw) > MAX_CLIENT_EVENT_BYTES:
        return

    try:
        event = ClientEvent.validate_json(raw)

        if isinstance(event, CallJoin):
            await _join_call(user_id, websocket, event.data.conversation_id)
        elif isinstance(event, CallLeave):
            if calls.leave(event.data.conversation_id, user_id, websocket):
                await _publish_call_state(event.data.conversation_id)
        else:
            await _relay_signal(user_id, websocket, event)
    except (ValidationError, DomainError) as error:
        detail = str(error) if isinstance(error, DomainError) else "Invalid event"
        await websocket.send_json({"type": "error", "data": {"detail": detail}})


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
            # Messages are sent via POST; the socket only carries call events.
            await _handle_client_event(user_id, websocket, await websocket.receive_text())
    except WebSocketDisconnect:
        pass
    finally:
        refresher.cancel()

        left_call = calls.leave_socket(user_id, websocket)
        if left_call is not None:
            await _publish_call_state(left_call)

        if connections.disconnect(user_id, websocket):
            await sessions.mark_offline(user_id)
            await _broadcast_presence(user_id, online=False)
