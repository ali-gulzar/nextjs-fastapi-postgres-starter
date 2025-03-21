from sqlalchemy import create_engine
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy.orm import sessionmaker

from models.base import Base
from models.message import Message
from models.thread import Thread

_main_uri = "postgres:postgres@localhost:5432/postgres"
_sync_uri = f"postgresql://{_main_uri}"
_async_uri = f"postgresql+asyncpg://{_main_uri}"

sync_engine = create_engine(_sync_uri)

Base.metadata.create_all(sync_engine)

engine = create_async_engine(_async_uri)

# Define the async session maker
async_session_maker = sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=False)


async def get_async_session():
    async with async_session_maker() as session:
        yield session


async def add_thread(user_id: int, db: AsyncSession):
    thread = Thread(user_id=user_id)
    db.add(thread)
    await db.commit()
    await db.refresh(thread)
    return thread


async def add_message(thread_id: int, content: str, is_bot: bool, db: AsyncSession):
    message = Message(thread_id=thread_id, content=content, is_bot=is_bot)
    db.add(message)
    await db.commit()
    await db.refresh(message)
    return message
