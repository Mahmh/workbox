from fastapi import APIRouter, Body
from fastapi.responses import StreamingResponse
from lib.types import Folders
from lib.datamodels import StructuredForm
from lib.processors import form, freeform, download

router = APIRouter(prefix='/processors')


@router.post('/form')
async def process_form(user_input: StructuredForm) -> Folders:
    return form.process(user_input)


@router.post('/freeform')
async def process_freeform(user_input: str = Body(..., embed=True)) -> Folders:
    return freeform.process(user_input)


@router.post('/download')
async def download_zip(folders: Folders = Body(...)) -> StreamingResponse:
    return StreamingResponse(
        download.make_zip_file(folders),
        media_type="application/zip",
        headers={"Content-Disposition": 'attachment; filename="download.zip"'}
    )