# main.py (or your main FastAPI app file)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from lib.constants import WEB_SERVER_URL
from routers import auth, history, input, output

app = FastAPI()

origins = [
    WEB_SERVER_URL,
    "http://localhost:3001",
    "http://127.0.0.1:3001",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

for r in (auth.router, history.router, input.router, output.router):
    app.include_router(r)