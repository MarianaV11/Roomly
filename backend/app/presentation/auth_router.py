from fastapi import APIRouter, Depends, status
from fastapi.security import OAuth2PasswordRequestForm

from app.application.auth_service import AuthService
from app.presentation.dependencies import get_auth_service
from app.presentation.schemas import (
    LoginRequest,
    TokenResponse,
    UserCreate,
    UserResponse,
)

router = APIRouter()


@router.post(
    "/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED
)
async def register_user(
    payload: UserCreate, auth_service: AuthService = Depends(get_auth_service)
) -> UserResponse:
    user = await auth_service.register_user(
        name=payload.name, email=payload.email, password=payload.password
    )

    return UserResponse.model_validate(user)


@router.post("/login", response_model=TokenResponse)
async def login(
    payload: LoginRequest, auth_service: AuthService = Depends(get_auth_service)
) -> TokenResponse:
    access_token = await auth_service.authenticate(
        email=payload.email, password=payload.password
    )

    return TokenResponse(access_token=access_token)


@router.post("/token", response_model=TokenResponse)
async def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    auth_service: AuthService = Depends(get_auth_service),
) -> TokenResponse:
    access_token = await auth_service.authenticate(
        email=form_data.username, password=form_data.password
    )

    return TokenResponse(access_token=access_token)
