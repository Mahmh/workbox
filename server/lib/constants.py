from dotenv import load_dotenv
from google import genai
from sentence_transformers import SentenceTransformer
import os

load_dotenv()
_CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
_locate = lambda x: os.path.join(_CURRENT_DIR, x)

# Gemini
GEMINI_MODEL = "gemini-1.5-flash"
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_CLIENT = genai.Client(api_key=GEMINI_API_KEY)

# DuckDuckGo
SEARCH_CONFIG = dict(region="wt-wt", max_results=32)
SEARCH_DELAY = 1.5

# DB
SUPABASE_ANON_PUBLIC_KEY = os.getenv("SUPABASE_ANON_PUBLIC_KEY")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
SUPABASE_PROJECT_URL = os.getenv("SUPABASE_PROJECT_URL")

# Logging
ENABLE_LOGGING = bool(int(os.getenv("ENABLE_LOGGING", "1")))
LOG_DIR = _locate("../logs/")
os.makedirs(LOG_DIR, exist_ok=True)

# Misc
WEB_SERVER_URL = "http://localhost:3000"
RELEVANCE_MODEL = SentenceTransformer("all-MiniLM-L6-v2")


assert (
    GEMINI_API_KEY
    and SUPABASE_ANON_PUBLIC_KEY
    and SUPABASE_SERVICE_ROLE_KEY
    and SUPABASE_PROJECT_URL
), "GEMINI_API_KEY, SUPABASE_ANON_PUBLIC_KEY, SUPABASE_SERVICE_ROLE_KEY, and SUPABASE_PROJECT_URL must be defined in a .env file in the project root directory"
