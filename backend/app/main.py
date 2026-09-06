import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core import get_config
from app.presentation.auth_router import router as auth_router
from app.presentation.error_handlers import register_error_handlers


def create_app() -> FastAPI:
    app = FastAPI(
        title="Roomly",
        version="1.0.0",
        docs_url="/api/docs",
        description="""
        Roomly is an app to chat with different people, with multiples groups and differents chats to talk with anyone.
        """,
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=get_config().cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    register_error_handlers(app)

    app.include_router(auth_router, prefix="/api/auth", tags=["Auth"])

    return app


app = create_app()


if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000)