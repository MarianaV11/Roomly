from fastapi import APIRouter, Depends, status

from app.application.friend_service import FriendService
from app.domain.entities.friendship import Friendship
from app.presentation.connection_manager import connections
from app.presentation.dependencies import get_current_user_id, get_friend_service
from app.presentation.schemas import FriendRequestCreate, FriendshipResponse

router = APIRouter()


async def _notify(friendship: Friendship) -> None:
    await connections.send(friendship.user_ids, {"type": "friends_changed", "data": None})


@router.get("", response_model=list[FriendshipResponse])
async def list_friendships(
    user_id: int = Depends(get_current_user_id),
    friend_service: FriendService = Depends(get_friend_service),
):
    friendships = await friend_service.list_friendships(user_id=user_id)
    return [FriendshipResponse.for_viewer(f, user_id) for f in friendships]


@router.post("", response_model=FriendshipResponse, status_code=status.HTTP_201_CREATED)
async def send_request(
    payload: FriendRequestCreate,
    user_id: int = Depends(get_current_user_id),
    friend_service: FriendService = Depends(get_friend_service),
):
    friendship = await friend_service.send_request(user_id=user_id, email=payload.email.strip())
    await _notify(friendship)
    return FriendshipResponse.for_viewer(friendship, user_id)


@router.post("/{friendship_id}/accept", response_model=FriendshipResponse)
async def accept_request(
    friendship_id: int,
    user_id: int = Depends(get_current_user_id),
    friend_service: FriendService = Depends(get_friend_service),
):
    friendship = await friend_service.accept_request(user_id=user_id, friendship_id=friendship_id)
    await _notify(friendship)
    return FriendshipResponse.for_viewer(friendship, user_id)


@router.delete("/{friendship_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove(
    friendship_id: int,
    user_id: int = Depends(get_current_user_id),
    friend_service: FriendService = Depends(get_friend_service),
) -> None:
    friendship = await friend_service.remove(user_id=user_id, friendship_id=friendship_id)
    await _notify(friendship)
