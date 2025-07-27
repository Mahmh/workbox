from concurrent.futures import ThreadPoolExecutor, as_completed
from lib.types import Folders
from lib.datamodels import File
from lib.logger import errlog
from lib.constants import RELEVANCE_MODEL
from lib.output.url import check_url
import random, numpy as np


def transform_folders(
    folders: Folders, max_files_per_folder: int = 6, threshold: float = 0.4
) -> Folders:
    """Applies all folder operations at once."""
    try:
        folders = _sort_by_relevance(folders)
        folders = _limit_num_files(folders, max_files_per_folder)
        folders = _filter_irrelevant(folders, threshold)
        folders = _validate_files(folders)
    except Exception as e:
        errlog("transform_folders", e, "folders")
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


def _validate_files(folders: Folders) -> Folders:
    """
    Validates all URLs in the folders concurrently and removes those that are not reachable.
    Returns a new Folders dict with only valid URLs.
    """
    valid_folders = {}

    for folder_name, files in folders.items():
        valid_files: list[File] = []

        # Submit all URL checks to a thread pool
        with ThreadPoolExecutor() as executor:
            future_to_file = {
                executor.submit(check_url, file.link): file for file in files
            }

            for future in as_completed(future_to_file):
                file = future_to_file[future]
                try:
                    if future.result():
                        valid_files.append(file)
                except Exception as e:
                    errlog("_validate_files", e, f"checking {file.link}")

        valid_folders[folder_name] = valid_files

    return valid_folders
