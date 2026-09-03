from application.auth_service import AuthService
from infrastructure.database.repositories import DbUserRepository
from infrastructure.database.database import get_db_session
from fastapi import Depends


def get_auth_service(db=Depends(get_db_session)):
    db_user_repository = DbUserRepository(session=db)

    return AuthService(repository=db_user_repository)
