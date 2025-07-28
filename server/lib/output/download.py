from urllib.parse import urlparse
from zipstream import ZipFile, ZIP_DEFLATED
from lib.types import Folders
from lib.datamodels import File
import os, requests


def make_zip_file(folders: Folders) -> ZipFile:
    """Converts the given folders into a zip file and returns it."""
    z = ZipFile(mode="w", compression=ZIP_DEFLATED)

    for folder_name, files in folders.items():
        for file in files:
            ext = _get_file_extension(file)

            if ext and ext.lower() not in {".html", ".htm", ".php", ".asp", ".aspx"}:
                # real file: stream it in chunks
                try:
                    r = requests.get(file.link, stream=True)
                    r.raise_for_status()
                except Exception as e:
                    print(f"Error fetching {file.link}: {e}")
                    z = _add_url_file(file, folder_name, z)
                    continue

                # put it under folder_name/filename.ext
                arcname = f"{folder_name}/{file.filename}"
                z.write_iter(arcname, r.iter_content(chunk_size=8192))
            else:
                z = _add_url_file(file, folder_name, z)

    return z


def _get_file_extension(file: File) -> str:
    """Parses out and returns the extension from the file's URL path."""
    parsed = urlparse(file.link)
    _, ext = os.path.splitext(parsed.path)
    return ext


def _add_url_file(file: File, folder_name: str, z: ZipFile) -> ZipFile:
    """Adds a `.url` shortcut file to the zip file and returns it."""
    # no extension: create a .url shortcut file
    shortcut_name = f"{file.filename}.url"
    content = "[InternetShortcut]\r\n" f"URL={file.link}\r\n"
    # write shortcut as a tiny text‐file stream
    arcname = f"{folder_name}/{shortcut_name}"
    z.write_iter(arcname, iter([content.encode("utf-8")]))
    return z
