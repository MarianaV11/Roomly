from abc import ABC, abstractmethod

from app.domain.entities.image import Image


class ImageRepository(ABC):
    @abstractmethod
    async def save_profile_image(self, image: Image) -> Image: ...

    @abstractmethod
    async def get_profile_image(self, user_id: int) -> Image | None: ...

    @abstractmethod
    async def delete_profile_image(self, user_id: int) -> bool: ...
