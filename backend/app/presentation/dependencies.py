from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.application.auth_service import AuthService
from app.core import Config, get_config
from app.infrastructure.database.database import get_db_session
from app.infrastructure.database.repositories import DbUserRepository
from app.infrastructure.security import Argon2PasswordHasher, JwtTokenProvider


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