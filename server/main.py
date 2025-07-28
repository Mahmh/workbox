from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from lib.constants import WEB_SERVER_URL
from routers import auth, history, input, output

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=[WEB_SERVER_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

for r in (auth.router, history.router, input.router, output.router):
    app.include_router(r)
