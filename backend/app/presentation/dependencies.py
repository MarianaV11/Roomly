from app.application.auth_service import AuthService
from app.infrastructure.database.repositories import DbUserRepository
from app.infrastructure.database.database import get_db_session
from fastapi import Depends


def get_auth_service(db=Depends(get_db_session)):
    db_user_repository = DbUserRepository(session=db)

    return AuthService(repository=db_user_repository)
