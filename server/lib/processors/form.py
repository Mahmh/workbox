from lib.types import Folders
from lib.datamodels import StructuredForm
from lib.outputs import search, transform_folders

def process(user_input: StructuredForm) -> Folders:
    """
    Performs how the algorithm processes the structured input and produces the output.

    This function returns a dictionary where:
    - keys = folder names
    - values = the folder's files
    """
    folders = {}

    for topic in user_input.topics:
        folders[topic] = search(f'{user_input.curriculum} grade {user_input.grade} {user_input.subject} {topic}')

    return transform_folders(folders)