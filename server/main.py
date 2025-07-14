from fastapi import FastAPI, Body
from fastapi.middleware.cors import CORSMiddleware
from lib.datamodels import StructuredForm
from lib.constants import WEB_SERVER_URL
from lib.processors.form import process_form
from lib.processors.freeform import process_freeform

# Init
app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=[WEB_SERVER_URL],
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*']
)

# Endpoints
@app.post('/process_form')
def process_form_(user_input: StructuredForm):
    return process_form(user_input)

@app.post('/process_freeform')
def process_freeform_(user_input: str = Body(..., embed=True)):
    return process_freeform(user_input)