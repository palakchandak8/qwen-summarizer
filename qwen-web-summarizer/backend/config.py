# All configuration lives here, imported everywhere else

OLLAMA_BASE_URL = "http://localhost:11434"
OLLAMA_MODEL = "qwen3:1.7b"

GEMINI_MODEL = "gemini-2.5-flash"
GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta"

FASTAPI_PORT = 7864
MAX_CONTEXT_CHARS = 12000   # Truncate page text beyond this before sending to LLM
