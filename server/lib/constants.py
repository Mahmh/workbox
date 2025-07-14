from dotenv import load_dotenv; load_dotenv()
from google import genai
from sentence_transformers import SentenceTransformer
import os

# Gemini
GEMINI_MODEL = 'gemini-1.5-flash'
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')
GEMINI_CLIENT = genai.Client(api_key=GEMINI_API_KEY)

# DuckDuckGo
SEARCH_CONFIG = dict(
    region='wt-wt',
    max_results=15
)
SEARCH_DELAY = 1.5

# Misc
WEB_SERVER_URL = 'http://localhost:3000'
RELEVANCE_MODEL = SentenceTransformer('all-MiniLM-L6-v2')