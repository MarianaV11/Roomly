from fastapi import APIRouter, Depends, Query, status

from app.application.user_service import UserService
from app.presentation.dependencies import (
    get_current_user,
    get_current_user_id,
    get_user_service,
)
from app.presentation.schemas import UserResponse

router = APIRouter(dependencies=[Depends(get_current_user)])


@router.get("/me", response_model=UserResponse)
async def get_me(
    user_id: int = Depends(get_current_user_id),
    user_service: UserService = Depends(get_user_service),
):
    return await user_service.get_user_by_id(user_id=user_id)


@router.delete("/me", status_code=status.HTTP_204_NO_CONTENT)
async def delete_me(
    user_id: int = Depends(get_current_user_id),
    user_service: UserService = Depends(get_user_service),
) -> None:
    await user_service.delete_user(user_id=user_id)


@router.get("/search", response_model=UserResponse)
async def search_user(
    email: str = Query(min_length=3, max_length=255),
    _: int = Depends(get_current_user_id),
    user_service: UserService = Depends(get_user_service),
):
    """Exact email match only, so the user list can't be browsed."""
    return await user_service.get_user_by_email(email=email)


@router.get("/{user_id}", response_model=UserResponse)
async def get_user_by_id(
    user_id: int, user_service: UserService = Depends(get_user_service)
):
    return await user_service.get_user_by_id(user_id=user_id)
