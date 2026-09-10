from fastapi import APIRouter, Depends, status

from app.application.user_service import UserService
from app.presentation.dependencies import get_user_service

router = APIRouter()


@router.get("/{user_id}", status_code=status.HTTP_200_OK)
async def get_user_by_id(
    user_id: int, user_service: UserService = Depends(get_user_service)
):
    user = await user_service.get_user_by_id(user_id=user_id)
    return user


@router.get("/delete/{user_id}", status_code=status.HTTP_200_OK)
async def delete_user(
    user_id: int, user_service: UserService = Depends(get_user_service)
):
    return await user_service.delete_user(user_id=user_id)
