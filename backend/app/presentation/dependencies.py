from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.application.auth_service import AuthService
from app.application.user_service import UserService
from app.core import Config, get_config
from app.domain.ports import TokenProvider
from app.infrastructure.database.database import get_db_session
from app.infrastructure.database.repositories import DbUserRepository
from app.infrastructure.security import Argon2PasswordHasher, JwtTokenProvider

bearer = HTTPBearer()


def get_token_provider(config: Config = Depends(get_config)) -> TokenProvider:
    return JwtTokenProvider(
        secret_key=config.jwt_secret_key,
        algorithm=config.jwt_algorithm,
        expire_minutes=config.jwt_access_token_expire_minutes,
    )


def get_current_user_id(
    credentials: HTTPAuthorizationCredentials = Depends(bearer),
    token_provider: TokenProvider = Depends(get_token_provider),
) -> int:
    subject = token_provider.read_subject(credentials.credentials)

    if subject is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return int(subject)


def get_auth_service(
    session: AsyncSession = Depends(get_db_session),
    token_provider: TokenProvider = Depends(get_token_provider),
) -> AuthService:
    return AuthService(
        repository=DbUserRepository(session=session),
        password_hasher=Argon2PasswordHasher(),
        token_provider=token_provider,
    )


def get_user_service(session: AsyncSession = Depends(get_db_session)) -> UserService:
    return UserService(user_repository=DbUserRepository(session=session))
