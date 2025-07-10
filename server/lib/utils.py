from typing import List, Dict
from urllib.parse import urlsplit
from ddgs import DDGS
import os, time
from datamodels import File

def process(grade: int, curriculum: str, topics: List[str]) -> Dict[str, List[File]]:
    """Performs how the algorithm processes input and produces the output."""
    folders = {}
    for topic in topics:
        folders[topic] = _search(f'{curriculum} grade {grade} {topic} filetype:pdf')
        time.sleep(1.5)
    return folders


def _search(query: str) -> List[File]:
    """Searches the internet using DuckDuckGo's search API, and returns the results as a list of `File`s."""
    results = []
    try:
        search_results = DDGS().text(
            keywords=query,
            region='wt-wt',
            max_results=10
        )
        for result in search_results:
            file = File(filename=_extract_filename(result['title']), link=result['href'])
            results.append(file)
    except Exception as e:
        print(f"Error during search: {e}")
    finally:
        return results


def _extract_filename(url: str) -> str:
    """Returns the filename at the end of a URL. Example: `https://example.com/file.pdf` -> `file.pdf`"""
    path = urlsplit(url).path
    filename = os.path.basename(path)
    return filename