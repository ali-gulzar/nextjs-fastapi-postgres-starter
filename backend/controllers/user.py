from fastapi import APIRouter
from fastapi import Depends
from fastapi import HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from models.user import User
from services import db as db_service
from services.db import engine

router = APIRouter()


class UserRead(BaseModel):
    id: int
    name: str


class ThreadCreate(BaseModel):
    id: int


@router.get("/users/me")
async def get_my_user():
    async with AsyncSession(engine) as session:
        async with session.begin():
            # Sample logic to simplify getting the current user. There's only one user.
            result = await session.execute(select(User))
            user = result.scalars().first()

            if user is None:
                raise HTTPException(status_code=404, detail="User not found")
            return UserRead(id=user.id, name=user.name)


@router.post("/user/{user_id}/thread", response_model=ThreadCreate)
async def create_thread(user_id: int, db: AsyncSession = Depends(db_service.get_async_session)):
    thread = await db_service.add_thread(user_id=user_id, db=db)

    content = "Welcome to the chatbot! How can I assist you today?"
    await db_service.add_message(thread_id=thread.id, content=content, is_bot=True, db=db)

    return ThreadCreate(id=thread.id)
