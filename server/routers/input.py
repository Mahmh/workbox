from fastapi import APIRouter, Body
from lib.logger import endpoint
from lib.types import Folders
from lib.datamodels import StructuredForm, CustomFileTypes
from lib.input import form, freeform

router = APIRouter(prefix="/input")


@router.post("/form")
@endpoint
async def process_form(
    file_types: CustomFileTypes, user_input: StructuredForm
) -> Folders:
    return form.process(user_input, file_types)


@router.post("/freeform")
@endpoint
async def process_freeform(
    file_types: CustomFileTypes, user_input: str = Body(..., embed=True)
) -> Folders:
    return freeform.process(user_input, file_types)
