# All configuration lives here, imported everywhere else
import os
from dotenv import load_dotenv

load_dotenv()
OLLAMA_BASE_URL = "http://localhost:11434"
OLLAMA_MODEL = "llama3.2:1b"

GEMINI_MODEL = "gemini-2.5-flash"
GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta"
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

FASTAPI_PORT = 7864
MAX_CONTEXT_CHARS = 4500    # Truncate page text beyond this before sending to LLM

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
MONGO_DB = "tldread"
MONGO_COLLECTION = "summaries"
