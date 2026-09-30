from fastapi import APIRouter, Depends, status

from app.application.user_service import UserService
from app.presentation.dependencies import get_current_user, get_user_service
from app.presentation.schemas import GeneralResponse, UserResponse

router = APIRouter(dependencies=[Depends(get_current_user)])


@router.get("/{user_id}", status_code=status.HTTP_200_OK, response_model=UserResponse)
async def get_user_by_id(
    user_id: int, user_service: UserService = Depends(get_user_service)
):
    user = await user_service.get_user_by_id(user_id=user_id)

    return UserResponse.model_validate(user)


@router.get(
    "/delete/{user_id}", status_code=status.HTTP_200_OK, response_model=GeneralResponse
)
async def delete_user(
    user_id: int, user_service: UserService = Depends(get_user_service)
):
    response = await user_service.delete_user(user_id=user_id)

    return GeneralResponse.model_validate(response)
