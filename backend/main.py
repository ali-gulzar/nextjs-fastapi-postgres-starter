from fastapi import FastAPI

from controllers.user import router as user_router
from scripts.seed import seed_user_if_needed

seed_user_if_needed()

app = FastAPI()
app.include_router(user_router)
