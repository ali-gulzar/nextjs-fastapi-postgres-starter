from datetime import datetime

from pydantic import BaseModel
from sqlalchemy import ForeignKey
from sqlalchemy.orm import Mapped
from sqlalchemy.orm import mapped_column
from sqlalchemy.orm import relationship

from models.base import Base
from models.user import Sender


class Message(Base):
    __tablename__ = "message"

    id: Mapped[int] = mapped_column(primary_key=True)
    thread_id: Mapped[int] = mapped_column(ForeignKey("thread.id"))
    content: Mapped[str]
    is_bot: Mapped[bool]
    created_at: Mapped[datetime] = mapped_column(default=datetime.now)

    thread = relationship("Thread", back_populates="messages")


class MessageRead(BaseModel):
    content: str
    created_at: datetime
    sender: Sender

    def to_dict(self) -> dict:
        message_dict = self.model_dump()
        message_dict["created_at"] = self.created_at.isoformat()
        return message_dict
