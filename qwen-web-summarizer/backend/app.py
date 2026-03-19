import logging
from fastapi import FastAPI, Request
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from agent import SummarizerAgent
import uvicorn
import json
import traceback
from config import GEMINI_API_KEY

logging.basicConfig(
    filename='agent_trace.log',
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
async def health():
    import httpx
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get("http://localhost:11434/", timeout=2.0)
            return {"status": "ok", "ollama_reachable": resp.status_code == 200}
    except Exception:
        return {"status": "ok", "ollama_reachable": False}

@app.post("/summarize")
async def summarize(request: Request):
    data = await request.json()
    content = data.get("content", "")
    mode = data.get("mode", "local")
    api_key = data.get("gemini_api_key") or GEMINI_API_KEY
    
    async def event_stream():
        yield "data: [START]\n\n"
        try:
            agent = SummarizerAgent(mode=mode, gemini_api_key=api_key)
            async for token in agent.run_stream(content):
                if token in ["[THINKING]", "[START]", "[DONE]"]:
                    yield f"data: {token}\n\n"
                elif token.startswith("[ERROR]"):
                    yield f"data: {token}\n\n"
                else:
                    # JSON encode the character to safely handle newlines
                    safe_char = json.dumps(token)
                    yield f"data: {safe_char}\n\n"
            yield "data: [DONE]\n\n"
        except Exception as e:
            logger.error(f"Error during summarization: {traceback.format_exc()}")
            yield f"data: [ERROR] {str(e)}\n\n"

    return StreamingResponse(event_stream(), media_type="text/event-stream")
