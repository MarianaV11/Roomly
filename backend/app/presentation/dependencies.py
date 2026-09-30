from fastapi import Depends
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.application.auth_service import AuthService
from app.application.user_service import UserService
from app.core import Config, get_config
from app.domain.entities.user import User
from app.infrastructure.database.database import get_db_session
from app.infrastructure.database.repositories import DbUserRepository
from app.infrastructure.security import (
    Argon2PasswordHasher,
    JwtTokenProvider,
)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/token", auto_error=False)


def get_auth_service(
    session: AsyncSession = Depends(get_db_session),
    config: Config = Depends(get_config),
) -> AuthService:
    return AuthService(
        repository=DbUserRepository(session=session),
        password_hasher=Argon2PasswordHasher(),
        token_provider=JwtTokenProvider(
            secret_key=config.jwt_secret_key,
            algorithm=config.jwt_algorithm,
            expire_minutes=config.jwt_access_token_expire_minutes,
        ),
    )


def get_user_service(
    session: AsyncSession = Depends(get_db_session),
    config: Config = Depends(get_config),
) -> UserService:
    return UserService(
        user_repository=DbUserRepository(session=session),
    )


async def get_current_user(
    token: str | None = Depends(oauth2_scheme),
    auth_service: AuthService = Depends(get_auth_service),
) -> User:

    return await auth_service.get_current_user(token=token)
