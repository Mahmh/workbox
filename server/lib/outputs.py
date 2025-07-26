from ddgs import DDGS
from lib.types import Folders
from lib.datamodels import File
from lib.constants import SEARCH_CONFIG, SEARCH_DELAY, RELEVANCE_MODEL
import time, random, requests, numpy as np


def search(query: str) -> list[File]:
    """Searches the internet using DuckDuckGo's search API, and returns the results as a list of `File`s."""
    results = []
    try:
        search_results = DDGS().text(query + " filetype:pdf", **SEARCH_CONFIG)
        for result in search_results:
            file = File(filename=result["title"], link=result["href"])
            results.append(file)
    except Exception as e:
        print(f"Error during search: {e}")
    finally:
        time.sleep(SEARCH_DELAY)
        return results


def check_url(url: str, timeout: float) -> bool:
    """Returns True if `url` responds with a status code <400 (i.e. not 404/500/etc)."""
    try:
        # HEAD is lighter, but some servers reject it => fallback to GET
        r = requests.head(url, allow_redirects=True, timeout=timeout)
        if r.status_code >= 400 or r.status_code == 405:
            r = requests.get(url, allow_redirects=True, timeout=timeout)
        return r.status_code < 400
    except requests.RequestException:
        return False


def transform_folders(
    folders: Folders,
    max_files_per_folder: int = 6,
    threshold: float = 0.4,
    url_check_timeout: float = 4.0,
) -> Folders:
    """Applies all folder operations at once."""
    folders = _sort_by_relevance(folders)
    folders = _limit_num_files(folders, max_files_per_folder)
    folders = _filter_irrelevant(folders, threshold)
    folders = _validate_files(folders, url_check_timeout)
    return folders


def _limit_num_files(folders: Folders, max_files_per_folder: int) -> Folders:
    """
    Return a new Folders dict where each list of File objects
    is truncated to at most `max_files_per_folder` items.
    """
    result = {}

    for folder_name, files in folders.items():
        random.shuffle(files)
        result[folder_name] = files[:max_files_per_folder]

    return result


def _sort_by_relevance(folders: Folders) -> Folders:
    """
    For each folder, compute a relevance score for each `File`
    and sort that folder's list in-place (highest score first).
    Returns the same dict with lists now ordered by relevance.
    """
    for folder_name, files in folders.items():
        files.sort(
            key=lambda file: _get_relevance_score(folder_name, file), reverse=True
        )
    return folders


def _filter_irrelevant(folders: Folders, threshold: float) -> Folders:
    """
    Return a new Folders dict where each list of File objects
    only includes those with a relevance score >= threshold.
    """
    return {
        folder_name: [
            file
            for file in files
            if _get_relevance_score(folder_name, file) >= threshold
        ]
        for folder_name, files in folders.items()
    }


def _get_relevance_score(folder_name: str, file: File) -> float:
    """
    Returns a cosine-similarity score between the folder name
    and the file's filename as a proxy for "relevance".
    """
    # encode both texts into 384‐dim embeddings
    folder_emb, file_emb = RELEVANCE_MODEL.encode(
        [folder_name, file.filename], convert_to_numpy=True
    )

    # compute cosine similarity
    norm_product = np.linalg.norm(folder_emb) * np.linalg.norm(file_emb)
    if norm_product == 0:
        return 0.0
    return float(np.dot(folder_emb, file_emb) / norm_product)


def _validate_files(folders: Folders, url_check_timeout: float) -> Folders:
    """
    Validates all URLs in the folders and removes those that are not reachable.
    Returns a new Folders dict with only valid URLs.
    """
    valid_folders = {}
    for folder_name, files in folders.items():
        valid_files = [
            file for file in files if check_url(file.link, url_check_timeout)
        ]
        valid_folders[folder_name] = valid_files
    return valid_folders
