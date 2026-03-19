import logging
from fastapi import FastAPI, Request
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from agent import SummarizerAgent
import uvicorn
import json
import traceback
from config import GEMINI_API_KEY
from pydantic import BaseModel
from db import save_summary, get_recent_summaries

logging.basicConfig(
    filename='agent_trace.log',
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = FastAPI(title="TL;DRead API")

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

class SummarizeRequest(BaseModel):
    content: str
    mode: str
    gemini_api_key: str = ""
    url: str = ""
    page_title: str = ""

@app.post("/summarize")
async def summarize(req: SummarizeRequest):
    content = req.content
    mode = req.mode
    api_key = req.gemini_api_key or GEMINI_API_KEY
    url = req.url
    page_title = req.page_title
    
    async def event_stream():
        yield "data: [START]\n\n"
        full_summary = ""
        try:
            agent = SummarizerAgent(mode=mode, gemini_api_key=api_key)
            async for token in agent.run_stream(content):
                if token in ["[THINKING]", "[START]", "[DONE]"]:
                    yield f"data: {token}\n\n"
                elif token.startswith("[ERROR]"):
                    yield f"data: {token}\n\n"
                else:
                    full_summary += token
                    safe_char = json.dumps(token)
                    yield f"data: {safe_char}\n\n"
            
            # Save to MongoDB
            try:
                save_summary(
                    url=url,
                    page_title=page_title,
                    char_count=len(content),
                    mode=mode,
                    summary=full_summary
                )
            except Exception as db_err:
                logger.warning(f"Failed to save summary to MongoDB: {db_err}")

            yield "data: [DONE]\n\n"
        except Exception as e:
            logger.error(f"Error during summarization: {traceback.format_exc()}")
            yield f"data: [ERROR] {str(e)}\n\n"

    return StreamingResponse(event_stream(), media_type="text/event-stream")

@app.get("/recent")
async def recent_summaries():
    try:
        summaries = get_recent_summaries(limit=20)
        return {"summaries": summaries}
    except Exception as e:
        logger.error(f"Error fetching recent summaries: {traceback.format_exc()}")
        return {"summaries": []}
