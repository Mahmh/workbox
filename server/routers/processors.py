from urllib.parse import urlparse
from fastapi import APIRouter, Body, HTTPException
from fastapi.responses import StreamingResponse
from lib.datamodels import StructuredForm, Folders
from lib.processors import form, freeform
import os, requests, zipstream

router = APIRouter(prefix='/processors')


@router.post('/form')
def process_form(user_input: StructuredForm) -> Folders:
    return form.process(user_input)


@router.post('/freeform')
def process_freeform(user_input: str = Body(..., embed=True)) -> Folders:
    return freeform.process(user_input)


@router.post('/download')
def download_zip(folders: Folders = Body(...)) -> StreamingResponse:
    z = zipstream.ZipFile(mode='w', compression=zipstream.ZIP_DEFLATED)

    for folder_name, files in folders.items():
        for file in files:
            # parse out extension from the URL path
            parsed = urlparse(file.link)
            _, ext = os.path.splitext(parsed.path)

            if ext:
                # real file: stream it in chunks
                try:
                    r = requests.get(file.link, stream=True)
                    r.raise_for_status()
                except Exception as e:
                    raise HTTPException(502, f"Error fetching {file.link}: {e}")
                # put it under folder_name/filename.ext
                arcname = f"{folder_name}/{file.filename}"
                z.write_iter(arcname, r.iter_content(chunk_size=8192))

            else:
                # no extension: create a .url shortcut file
                shortcut_name = f"{file.filename}.url"
                content = (
                    '[InternetShortcut]\r\n'
                    f'URL={file.link}\r\n'
                )
                # write shortcut as a tiny text‐file stream
                arcname = f'{folder_name}/{shortcut_name}'
                z.write_iter(arcname, iter([content.encode('utf-8')]))

    return StreamingResponse(
        z,
        media_type="application/zip",
        headers={"Content-Disposition": 'attachment; filename="download.zip"'}
    )