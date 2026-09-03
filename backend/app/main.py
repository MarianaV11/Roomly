import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from presentation.auth_router import router as auth_router


def create_app():
    app = FastAPI(
        title="Roomly",
        version="1.0.0",
        docs_url="/api/docs",
        description="""
        Roomly is an app to chat with different people, with multiples groups and differents chats to talk with anyone.
        """,
    )

    origins = ["*"]

    app.include_router(auth_router, prefix="/api/auth", tags=["Auth"])

    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    return app


if __name__ == "__main__":
    app = create_app()

    uvicorn.run(app, host="127.0.0.1", port=8000)
