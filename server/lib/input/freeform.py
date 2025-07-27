from concurrent.futures import ThreadPoolExecutor, as_completed
from lib.types import Folders
from lib.datamodels import CustomFileTypes
from lib.output.search import search
from lib.output.folders import transform_folders
from lib.constants import GEMINI_CLIENT, GEMINI_MODEL


def process(user_input: str, file_types: CustomFileTypes) -> Folders:
    """
    Processes the freeform input and produces the output.

    Returns a dictionary where:
    - keys = folder names (queries)
    - values = the folder's files
    """
    folders = {}
    futures = {}
    queries = _generate_queries(user_input)

    with ThreadPoolExecutor() as executor:
        for query in queries:
            futures[executor.submit(search, query, file_types)] = query

        for future in as_completed(futures):
            query = futures[future]
            try:
                folders[query] = future.result()
            except Exception as e:
                print(f"Search failed for query '{query}': {e}")
                folders[query] = []

    return transform_folders(folders)


def _generate_queries(prompt: str) -> list[str]:
    """Generates several search queries from Gemini."""
    try:
        response = GEMINI_CLIENT.models.generate_content(
            model=GEMINI_MODEL,
            contents=f"Generate 4 Google search queries to find revision documents for this prompt make sure they are not overspecific and return relaible results from google give them as a list only:\n\n'{prompt}'",
        )
        queries = [
            _sanitize_query(line) for line in response.text.splitlines() if line.strip()
        ]
        return queries
    except Exception as e:
        print("Gemini error:", e)
        return []


def _sanitize_query(raw_query: str) -> str:
    """Returns the clean and user-readable form of the given raw query."""
    query = raw_query.strip()

    if query.startswith('* "'):
        query = query[3:]
    elif query.startswith("* "):
        query = query[2:]

    if query.endswith('"') and query.count('"') % 2 != 0:
        query = query[: len(query) - 1]

    return query
