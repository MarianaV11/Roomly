from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import undefer

from app.domain.entities.image import Image
from app.domain.ports import ImageRepository
from app.infrastructure.database.models import Image as ImageModel


class DbImageRepository(ImageRepository):
    def __init__(self, session: AsyncSession):
        self._session = session

    async def save_profile_image(self, image: Image) -> Image:
        model = await self._get_model(image.user_id)

        if model is None:
            model = ImageModel(user_id=image.user_id)
            self._session.add(model)

        model.name = image.name
        model.mime_type = image.mime_type
        model.data = image.data

        await self._session.commit()
        await self._session.refresh(model, ["updated_at"])

        return self._to_entity(model)

    async def get_profile_image(self, user_id: int) -> Image | None:
        model = await self._get_model(user_id)

        return self._to_entity(model) if model is not None else None

    async def delete_profile_image(self, user_id: int) -> bool:
        result = await self._session.execute(
            delete(ImageModel).where(ImageModel.user_id == user_id)
        )
        await self._session.commit()

        return result.rowcount > 0

    async def _get_model(self, user_id: int) -> ImageModel | None:
        result = await self._session.execute(
            select(ImageModel).options(undefer(ImageModel.data)).where(ImageModel.user_id == user_id)
        )

        return result.scalar_one_or_none()

    @staticmethod
    def _to_entity(model: ImageModel) -> Image:
        return Image(
            user_id=model.user_id,
            name=model.name,
            mime_type=model.mime_type,
            data=model.data,
            updated_at=model.updated_at,
        )
