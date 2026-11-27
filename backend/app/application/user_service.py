from app.domain.entities.general_responses import GeneralResponse
from app.domain.entities.image import Image
from app.domain.entities.user import User
from app.domain.exceptions import ImageNotFound, ImageTooLarge, InvalidImage, UserNotFound
from app.domain.ports import ImageRepository, UserRepository

MAX_PROFILE_IMAGE_BYTES = 2 * 1024 * 1024
MAX_PROFILE_GIF_BYTES = 10 * 1024 * 1024


def detect_image_type(data: bytes) -> str | None:
    if data.startswith(b"\x89PNG\r\n\x1a\n"):
        return "image/png"
    if data.startswith(b"\xff\xd8\xff"):
        return "image/jpeg"
    if data.startswith((b"GIF87a", b"GIF89a")):
        return "image/gif"
    if data[:4] == b"RIFF" and data[8:12] == b"WEBP":
        return "image/webp"
    return None


class UserService:
    def __init__(self, user_repository: UserRepository, image_repository: ImageRepository):
        self._repository = user_repository
        self._images = image_repository

    async def get_user_by_id(self, user_id: int) -> User | None:
        user = await self._repository.get_user_by_id(user_id=user_id)

        if not user:
            raise UserNotFound(user_id)

        return user

    async def get_user_by_email(self, email: str) -> User:
        user = await self._repository.get_user_by_email(email=email)

        if not user:
            raise UserNotFound(email)

        return user

    async def set_profile_image(self, user_id: int, name: str, data: bytes) -> User:
        mime_type = detect_image_type(data)
        if mime_type is None:
            raise InvalidImage("Unsupported image; send a JPG, PNG, GIF or WebP file")

        limit = MAX_PROFILE_GIF_BYTES if mime_type == "image/gif" else MAX_PROFILE_IMAGE_BYTES
        if len(data) > limit:
            raise ImageTooLarge(limit)

        await self._images.save_profile_image(
            Image(user_id=user_id, name=name[:255] or "profile", mime_type=mime_type, data=data)
        )

        return await self.get_user_by_id(user_id)

    async def get_profile_image(self, user_id: int) -> Image:
        image = await self._images.get_profile_image(user_id)

        if image is None:
            raise ImageNotFound()

        return image

    async def delete_profile_image(self, user_id: int) -> None:
        await self._images.delete_profile_image(user_id)

    async def delete_user(self, user_id: int) -> GeneralResponse | None:
        response = await self._repository.delete_user(user_id=user_id)

        if not response:
            raise UserNotFound(user_id)

        return response
