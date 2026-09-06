from app.domain.entities.user import User
from app.domain.exceptions import EmailAlreadyRegistered, InvalidCredentials
from app.domain.ports import PasswordHasher, TokenProvider, UserRepository


class AuthService:
    def __init__(
        self,
        repository: UserRepository,
        password_hasher: PasswordHasher,
        token_provider: TokenProvider,
    ):
        self._repository = repository
        self._password_hasher = password_hasher
        self._token_provider = token_provider

    async def register_user(self, name: str, email: str, password: str) -> User:
        existing = await self._repository.get_user_by_email(email=email)

        if existing is not None:
            raise EmailAlreadyRegistered(email)

        user = User(
            name=name,
            email=email,
            password_hash=self._password_hasher.hash(password),
        )

        return await self._repository.create_user(user=user)

    async def authenticate(self, email: str, password: str) -> str:
        user = await self._repository.get_user_by_email(email=email)

        if user is None:
            raise InvalidCredentials()

        if not self._password_hasher.verify(password, user.password_hash):
            raise InvalidCredentials()

        return self._token_provider.create_access_token(subject=str(user.id))