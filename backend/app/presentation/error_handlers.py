from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse

from app.domain.exceptions import (
    DomainError,
    EmailAlreadyRegistered,
    InvalidCredentials,
    UserNotFound,
)

STATUS_BY_ERROR = {
    EmailAlreadyRegistered: status.HTTP_409_CONFLICT,
    InvalidCredentials: status.HTTP_401_UNAUTHORIZED,
    UserNotFound: status.HTTP_404_NOT_FOUND,
}


def register_error_handlers(app: FastAPI) -> None:
    @app.exception_handler(DomainError)
    async def handle_domain_error(request: Request, error: DomainError) -> JSONResponse:
        status_code = STATUS_BY_ERROR.get(type(error), status.HTTP_400_BAD_REQUEST)

        return JSONResponse(status_code=status_code, content={"detail": str(error)})