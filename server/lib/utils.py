from urllib.parse import urlsplit
from ddgs import DDGS
import os, re, time
from lib.datamodels import File
from lib.constants import SEARCH_CONFIG, SEARCH_DELAY

def search(query: str) -> list[File]:
    """Searches the internet using DuckDuckGo's search API, and returns the results as a list of `File`s."""
    results = []
    try:
        search_results = DDGS().text(query + ' filetype:pdf', **SEARCH_CONFIG)
        for result in search_results:
            file = File(
                filename=result['title'],
                link=result['href']
            )
            results.append(file)
    except Exception as e:
        print(f"Error during search: {e}")
    finally:
        time.sleep(SEARCH_DELAY)
        return results


def _extract_filename(url: str) -> str:
    """Returns the filename at the end of a URL. Example: `https://example.com/file.pdf` -> `file.pdf`"""
    path = urlsplit(url).path
    filename = os.path.basename(path)
    filename = _sanitize_filename(filename)
    return filename


def _sanitize_filename(filename: str) -> str:
    """Removes some metacharacters from the given filename to clean it."""
    return re.sub(r'[\\/*?:"<>|]', "", filename)