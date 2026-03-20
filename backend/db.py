import json
import os
import uuid
from datetime import datetime, timezone

DB_FILE = os.path.join(os.path.dirname(__file__), "summaries.json")

def _load_db() -> list:
    if not os.path.exists(DB_FILE):
        return []
    try:
        with open(DB_FILE, "r") as f:
            return json.load(f)
    except (json.JSONDecodeError, IOError):
        return []

def _save_db(data: list):
    with open(DB_FILE, "w") as f:
        json.dump(data, f, indent=2, default=str)

def save_summary(url: str, page_title: str, char_count: int, mode: str, summary: str):
    docs = _load_db()
    doc = {
        "_id": str(uuid.uuid4()),
        "url": url,
        "page_title": page_title,
        "char_count": char_count,
        "mode": mode,
        "summary": summary,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    docs.insert(0, doc)  # newest first
    _save_db(docs)
    return doc["_id"]

def get_recent_summaries(limit: int = 20) -> list:
    docs = _load_db()
    return docs[:limit]
