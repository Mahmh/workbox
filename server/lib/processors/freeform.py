from lib.utils import search
from lib.datamodels import Folders
from lib.constants import CLIENT, GEMINI_MODEL

def process_freeform(user_input: str) -> Folders:
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

    return folders


def _generate_queries(prompt: str) -> list[str]:
    """Generates search queries from Gemini."""
    try:
        response = CLIENT.models.generate_content(
            model=GEMINI_MODEL,
            contents=f'Generate 4 Google search queries to find revision PDFs for this prompt make sure they are not overspecific and return relaible results from google give them as a list only:\n\n\'{prompt}\''
        )
        queries = [line.strip() for line in response.text.splitlines() if line.strip()]
        return queries
    except Exception as e:
        print('Gemini error:', e)
        return []