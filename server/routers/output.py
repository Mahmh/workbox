from fastapi import APIRouter, Body
from fastapi.responses import StreamingResponse
from lib.logger import endpoint
from lib.types import Folders
from lib.output import download

router = APIRouter(prefix="/output")


@router.post("/download")
@endpoint
async def download_zip(folders: Folders = Body(...)) -> StreamingResponse:
    return StreamingResponse(
        download.make_zip_file(folders),
        media_type="application/zip",
        headers={"Content-Disposition": 'attachment; filename="download.zip"'},
    )
