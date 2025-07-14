from lib.datamodels import Folders
from lib.utils import search, transform_folders
from lib.constants import GEMINI_CLIENT, GEMINI_MODEL

def process(user_input: str) -> Folders:
    """
    Performs how the algorithm processes the freeform input and produces the output.

    This function returns a dictionary where:
    - keys = folder names
    - values = the folder's files
    """
    folders = {}
    queries = _generate_queries(user_input)

    for query in queries:
        folders[query] = search(query)

    return transform_folders(folders)


def _generate_queries(prompt: str) -> list[str]:
    """Generates several search queries from Gemini."""
    try:
        response = GEMINI_CLIENT.models.generate_content(
            model=GEMINI_MODEL,
            contents=f'Generate 4 Google search queries to find revision PDFs for this prompt make sure they are not overspecific and return relaible results from google give them as a list only:\n\n\'{prompt}\''
        )
        queries = [
            _sanitize_query(line)
            for line in response.text.splitlines()
            if line.strip()
        ]
        return queries
    except Exception as e:
        print('Gemini error:', e)
        return []


def _sanitize_query(raw_query: str) -> str:
    """Returns the clean and user-readable form of the given raw query."""
    query = raw_query.strip()

    if query.startswith('* "'):
        query = query[3:]

    if query.endswith('"') and query.count('"') % 2 != 0:
        query = query[:len(query)-1]

    return query