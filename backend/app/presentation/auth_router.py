from app.application.auth_service import AuthService
from app.domain.entities import User, UserRead
from app.presentation.dependencies import get_auth_service
from fastapi import APIRouter, Depends, HTTPException

router = APIRouter()


@router.post("/register", response_model=UserRead)
async def register_user(
    user: User, auth_service: AuthService = Depends(get_auth_service)
):
    try:
        user = await auth_service.register_user(user=user)

        return user
    except Exception as error:
        raise HTTPException(status_code=500, detail=str(error))
