from textwrap import dedent
from fastapi import APIRouter, Body
from lib.logger import endpoint, errlog
from lib.types import Folders, APIError
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
) -> Folders | APIError:
    try:
        return freeform.process(user_input, file_types)
    except Exception as e:
        errlog("process_freeform", e, "input")
        if "model is overloaded" in str(e):
            return {
                "error": dedent(
                    """
                    The freeform service is temporarily unavailable due to system overload.
                    Please try again later.
                    If the issue persists, consider using the structured form input instead.
                    """
                )
            }
        raise e
