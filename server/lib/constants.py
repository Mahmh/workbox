from dotenv import load_dotenv; load_dotenv()
from google import genai
import os

# Gemini
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')
CLIENT = genai.Client(api_key=GEMINI_API_KEY)
GEMINI_MODEL = 'gemini-1.5-flash'

# DuckDuckGo
SEARCH_CONFIG = dict(
    region='wt-wt',
    max_results=10
)
SEARCH_DELAY = 1.5