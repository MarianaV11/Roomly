from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import declarative_base

from app.core import get_config

Base = declarative_base()

engine = create_async_engine(get_config().database_url, echo=get_config().echo)
SessionLocal = async_sessionmaker(expire_on_commit=False, bind=engine)

async def get_db_session() -> AsyncSession:
    async with SessionLocal() as session:
        yield session