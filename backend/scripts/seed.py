from sqlalchemy import select
from sqlalchemy.orm import Session

from models.user import User
from services.db import sync_engine


def seed_user_if_needed():
    with Session(sync_engine) as session:
        with session.begin():
            if session.execute(select(User)).scalar_one_or_none() is not None:
                print("User already exists, skipping seeding")
                return
            print("Seeding user")
            session.add(User(name="Alice"))
            session.commit()
