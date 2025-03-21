import asyncio
import json

from fastapi import APIRouter
from fastapi import Depends
from fastapi import HTTPException
from fastapi import WebSocket
from fastapi.websockets import WebSocketDisconnect
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from models.message import MessageRead
from models.thread import ThreadCreate
from models.user import Sender
from models.user import User
from models.user import UserRead
from services import ai as ai_service
from services import db as db_service

router = APIRouter()


@router.get("/users/me")
async def get_my_user():
    async with AsyncSession(db_service.engine) as session:
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


@router.get("/user/{user_id}/{thread_id}/messages", response_model=list[MessageRead])
async def get_messages(user_id: int, thread_id: int, db: AsyncSession = Depends(db_service.get_async_session)):
    if await db_service.get_user(user_id=user_id, db=db) and await db_service.get_thread(thread_id=thread_id, db=db):
        messages = await db_service.get_messages(thread_id=thread_id, db=db)

        return [
            MessageRead(
                content=message.content,
                created_at=message.created_at,
                sender=Sender.BOT if message.is_bot else Sender.USER,
            )
            for message in messages
        ]
    raise HTTPException(status_code=404, detail=f"Messages for user ${user_id} and thread ${thread_id} not found.")


@router.websocket("/ws/{user_id}/{thread_id}")
async def websocket_endpoint(
    websocket: WebSocket, user_id: int, thread_id: int, db: AsyncSession = Depends(db_service.get_async_session)
):
    await websocket.accept()

    if not await db_service.get_user(user_id=user_id, db=db) or not await db_service.get_thread(
        thread_id=thread_id, db=db
    ):
        await websocket.close()
        return

    try:
        while True:
            data = await websocket.receive_text()
            message_data = json.loads(data)

            await db_service.add_message(thread_id=thread_id, content=message_data["content"], is_bot=False, db=db)
            await asyncio.sleep(1)
            bot_message = await db_service.add_message(
                thread_id=thread_id, content=ai_service.generate_ai_response(), is_bot=True, db=db
            )

            message = MessageRead(
                content=bot_message.content, created_at=bot_message.created_at.isoformat(), sender=Sender.BOT
            )
            await websocket.send_json(message.to_dict())
    except WebSocketDisconnect:
        print("Websocket disconnecting...")
    except Exception as e:
        print(f"Websocket error {e}...")
    finally:
        print("Connection is closed...")
