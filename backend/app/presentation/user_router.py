from fastapi import APIRouter, Depends, status

from app.application.user_service import UserService
from app.presentation.dependencies import get_current_user_id, get_user_service
from app.presentation.schemas import UserResponse

router = APIRouter()


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


@router.get("/{user_id}", response_model=UserResponse)
async def get_user_by_id(
    user_id: int, user_service: UserService = Depends(get_user_service)
):
    return await user_service.get_user_by_id(user_id=user_id)
