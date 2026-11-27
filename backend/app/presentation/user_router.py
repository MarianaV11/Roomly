from fastapi import APIRouter, Depends, File, Query, Response, UploadFile, status

from app.application.user_service import MAX_PROFILE_GIF_BYTES, UserService
from app.presentation.dependencies import (
    get_current_user,
    get_current_user_id,
    get_user_service,
)
from app.presentation.schemas import UserResponse

router = APIRouter(dependencies=[Depends(get_current_user)])

# No login here: an <img> tag can't send the Authorization header.
public_router = APIRouter()


@router.get("/me", response_model=UserResponse)
async def get_me(
    user_id: int = Depends(get_current_user_id),
    user_service: UserService = Depends(get_user_service),
):
    return await user_service.get_user_by_id(user_id=user_id)


@router.delete("/me", status_code=status.HTTP_204_NO_CONTENT)
async def delete_me(
    user_id: int = Depends(get_current_user_id),
    user_service: UserService = Depends(get_user_service),
) -> None:
    await user_service.delete_user(user_id=user_id)


@router.put("/me/avatar", response_model=UserResponse)
async def set_my_avatar(
    file: UploadFile = File(description="JPG, PNG or WebP up to 2 MB; GIF up to 10 MB"),
    user_id: int = Depends(get_current_user_id),
    user_service: UserService = Depends(get_user_service),
):
    # Reads one byte past the limit: enough to know it's too big without loading it all.
    data = await file.read(MAX_PROFILE_GIF_BYTES + 1)
    return await user_service.set_profile_image(
        user_id=user_id, name=file.filename or "profile", data=data
    )


@router.delete("/me/avatar", status_code=status.HTTP_204_NO_CONTENT)
async def delete_my_avatar(
    user_id: int = Depends(get_current_user_id),
    user_service: UserService = Depends(get_user_service),
) -> None:
    await user_service.delete_profile_image(user_id=user_id)


@public_router.get("/{user_id}/avatar", response_class=Response)
async def get_avatar(user_id: int, user_service: UserService = Depends(get_user_service)):
    image = await user_service.get_profile_image(user_id=user_id)

    return Response(
        content=image.data,
        media_type=image.mime_type,
        headers={
            "Cache-Control": "public, max-age=31536000, immutable",
            "Vary": "Origin",
            "X-Content-Type-Options": "nosniff",
            "Content-Security-Policy": "default-src 'none'",
        },
    )


@router.get("/search", response_model=UserResponse)
async def search_user(
    email: str = Query(min_length=3, max_length=255),
    _: int = Depends(get_current_user_id),
    user_service: UserService = Depends(get_user_service),
):
    """Exact email match only, so the user list can't be browsed."""
    return await user_service.get_user_by_email(email=email)


@router.get("/{user_id}", response_model=UserResponse)
async def get_user_by_id(
    user_id: int, user_service: UserService = Depends(get_user_service)
):
    return await user_service.get_user_by_id(user_id=user_id)
