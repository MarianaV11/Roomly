from app.domain.entities.general_responses import GeneralResponse
from app.domain.entities.user import User
from app.domain.exceptions import UserNotFound
from app.domain.ports import UserRepository


class UserService:
    def __init__(self, user_repository: UserRepository):
        self._repository = user_repository

    async def get_user_by_id(self, user_id: int) -> User | None:
        user = await self._repository.get_user_by_id(user_id=user_id)

        if not user:
            raise UserNotFound(identifier=user_id)

        return user

    async def delete_user(self, user_id: int) -> GeneralResponse | None:
        response = await self._repository.delete_user(user_id=user_id)

        if not response:
            raise UserNotFound(identifier=user_id)

        return response
