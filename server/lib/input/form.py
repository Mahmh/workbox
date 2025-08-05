from concurrent.futures import ThreadPoolExecutor, as_completed
from lib.logger import errlog
from lib.types import Folders
from lib.datamodels import StructuredForm, CustomFileTypes
from lib.output.search import search
from lib.output.folders import transform_folders


def process(user_input: StructuredForm, file_types: CustomFileTypes) -> Folders:
    """
    Performs how the algorithm processes the structured input and produces the output.

    Returns a dictionary where:
    - keys = folder names
    - values = the folder's files
    """
    folders = {}
    futures = {}

    with ThreadPoolExecutor() as executor:
        for topic in user_input.topics:
            query = f"{user_input.curriculum} grade {user_input.grade} {user_input.subject} {topic}"
            futures[executor.submit(search, query, file_types)] = topic

        for future in as_completed(futures):
            topic = futures[future]
            try:
                folders[topic] = future.result()
            except Exception as e:
                errlog("process", e, "form")
                folders[topic] = []

    return transform_folders(folders)
