from typing import LiteralString, Optional
from concurrent.futures import ThreadPoolExecutor
from ddgs import DDGS
from lib.datamodels import File, CustomFileTypes
from lib.logger import errlog
from lib.constants import SEARCH_CONFIG, SEARCH_DELAY, DOCUMENT_EXT_TO_MIME
from lib.output.url import matches_type
import time


def search(query: str, file_types: CustomFileTypes) -> list[File]:
    """
    Dispatches to text, image, and/or video search based on the flags in `file_types`.
    If no flags are set, treats all flags as True.
    """
    results: list[File] = []

    if not any(
        [file_types.webpage, file_types.document, file_types.images, file_types.videos]
    ):
        # avoid mutating the original; create an updated copy
        file_types = file_types.model_copy(
            update={"webpage": True, "document": True, "images": True, "videos": True}
        )

    if file_types.webpage or file_types.document:
        results.extend(_search_text(query, file_types))

    if file_types.images:
        results.extend(_search_images(query))

    if file_types.videos:
        results.extend(_search_videos(query))

    return results


def _search_text(query: str, file_types: CustomFileTypes) -> list[File]:
    """
    Searches DuckDuckGo text results, filtering to webpages and/or documents.
    Processes each URL in parallel for better performance with simpler logic.
    """
    results: list[File] = []

    # build allowed extensions
    exts: list[LiteralString] = []
    if file_types.document:
        exts.extend(list(DOCUMENT_EXT_TO_MIME.keys()))
    if file_types.webpage:
        exts.append("html")

    # build query string
    if exts:
        filter_str = " OR ".join(f"filetype:{ext}" for ext in exts)
        search_str = f"{query} {filter_str}"
    else:
        search_str = query

    # fetch search hits
    try:
        hits = list(DDGS().text(search_str, **SEARCH_CONFIG))
    except Exception as e:
        errlog("_search_text", e, "search")
        time.sleep(SEARCH_DELAY)
        return results

    # process hits in parallel
    def _process_hit(hit) -> Optional[File]:
        """Worker to filter & classify a single hit."""
        url = hit["href"]

        # if we're filtering by exts, skip non-matches
        if exts and not any(matches_type(url, ext) for ext in exts):
            return None

        file_type = "webpage" if matches_type(url, "html") else "document"
        return File(filename=hit["title"], link=url, type=file_type)

    with ThreadPoolExecutor() as executor:
        for file in executor.map(_process_hit, hits):
            if file:
                results.append(file)

    time.sleep(SEARCH_DELAY)
    return results


def _search_images(query: str) -> list[File]:
    """
    Searches DuckDuckGo image results and returns them as Files with type 'image'.
    """
    results: list[File] = []

    try:
        for r in DDGS().images(query, **SEARCH_CONFIG):
            # use the direct image URL if available, else fallback to page URL
            title = r.get("title", "")
            image_url = r.get("image") or r.get("href")
            results.append(File(filename=title, link=image_url, type="image"))
    except Exception as e:
        errlog("_search_images", e, "search")
    finally:
        time.sleep(SEARCH_DELAY)

    return results


def _search_videos(query: str) -> list[File]:
    """
    Searches DuckDuckGo video results and returns them as Files with type 'video'.
    """
    results: list[File] = []

    try:
        for r in DDGS().videos(query, **SEARCH_CONFIG):
            title = r.get("title", "")
            results.append(File(filename=title, link=r["href"], type="video"))
    except Exception as e:
        errlog("_search_videos", e, "search")
    finally:
        time.sleep(SEARCH_DELAY)

    return results
