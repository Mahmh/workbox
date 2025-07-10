from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from lib.datamodels import UserInput
from lib.utils import process

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

@app.get('/process')
def process_(user_input: UserInput):
    return process(user_input)