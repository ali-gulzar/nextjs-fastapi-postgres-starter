from datetime import datetime

from pydantic import BaseModel
from sqlalchemy import ForeignKey
from sqlalchemy.orm import Mapped
from sqlalchemy.orm import mapped_column
from sqlalchemy.orm import relationship

from models.base import Base


class Thread(Base):
    __tablename__ = "thread"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("user.id"))
    created_at: Mapped[datetime] = mapped_column(default=datetime.now)

    user = relationship("User", back_populates="threads")
    messages = relationship("Message", back_populates="thread")


class ThreadCreate(BaseModel):
    id: int
