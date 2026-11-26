from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager

from fastapi import Depends
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.application.auth_service import AuthService
from app.application.chat_service import ChatService
from app.application.friend_service import FriendService
from app.application.user_service import UserService
from app.core import Config, get_config
from app.domain.entities.user import User
from app.domain.ports import SessionRepository, TokenProvider
from app.infrastructure.database.database import SessionLocal, get_db_session
from app.infrastructure.database.repositories import (
    DbConversationRepository,
    DbFriendRepository,
    DbUserRepository,
)
from app.infrastructure.redis import RedisSessionRepository, get_redis_client
from app.infrastructure.security import Argon2PasswordHasher, JwtTokenProvider

# Reads "Authorization: Bearer <token>". tokenUrl makes Swagger's "Authorize"
# button log in through /api/auth/token. auto_error=False: a missing token
# reaches get_current_user and becomes InvalidToken → 401, like a bad one.
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/token", auto_error=False)


def get_token_provider(config: Config = Depends(get_config)) -> TokenProvider:
    return JwtTokenProvider(
        secret_key=config.jwt_secret_key,
        algorithm=config.jwt_algorithm,
        expire_minutes=config.jwt_access_token_expire_minutes,
    )


def get_auth_service(
    session: AsyncSession = Depends(get_db_session),
    token_provider: TokenProvider = Depends(get_token_provider),
) -> AuthService:
    return AuthService(
        repository=DbUserRepository(session=session),
        password_hasher=Argon2PasswordHasher(),
        token_provider=token_provider,
    )


async def get_current_user(
    token: str | None = Depends(oauth2_scheme),
    auth_service: AuthService = Depends(get_auth_service),
) -> User:
    """The logged-in user. Also rejects tokens of users that were deleted."""
    return await auth_service.get_current_user(token=token)


async def get_current_user_id(user: User = Depends(get_current_user)) -> int:
    return user.id


def get_user_service(session: AsyncSession = Depends(get_db_session)) -> UserService:
    return UserService(user_repository=DbUserRepository(session=session))


def get_friend_service(session: AsyncSession = Depends(get_db_session)) -> FriendService:
    return FriendService(
        friend_repository=DbFriendRepository(session=session),
        user_repository=DbUserRepository(session=session),
    )


def get_session_repository() -> SessionRepository:
    return RedisSessionRepository(get_redis_client())


def _build_chat_service(session: AsyncSession) -> ChatService:
    return ChatService(
        conversation_repository=DbConversationRepository(session=session),
        user_repository=DbUserRepository(session=session),
        session_repository=get_session_repository(),
        friend_repository=DbFriendRepository(session=session),
        password_hasher=Argon2PasswordHasher(),
    )


def get_chat_service(session: AsyncSession = Depends(get_db_session)) -> ChatService:
    return _build_chat_service(session)


@asynccontextmanager
async def chat_service_scope() -> AsyncGenerator[ChatService]:
    """For long-lived WebSockets: holds a DB connection only for the duration of the block."""
    async with SessionLocal() as session:
        yield _build_chat_service(session)
