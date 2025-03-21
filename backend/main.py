from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from controllers.user import router as user_router
from scripts.seed import seed_user_if_needed

seed_user_if_needed()

app = FastAPI()
app.include_router(user_router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
