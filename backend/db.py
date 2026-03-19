from pymongo import MongoClient
from config import MONGO_URI, MONGO_DB, MONGO_COLLECTION
from datetime import datetime, timezone

client = MongoClient(MONGO_URI)
db = client[MONGO_DB]
collection = db[MONGO_COLLECTION]

def save_summary(url: str, page_title: str, char_count: int, mode: str, summary: str):
    doc = {
        "url": url,
        "page_title": page_title,
        "char_count": char_count,
        "mode": mode,
        "summary": summary,
        "created_at": datetime.now(timezone.utc)
    }
    result = collection.insert_one(doc)
    return str(result.inserted_id)

def get_recent_summaries(limit: int = 20) -> list:
    docs = collection.find({}, {"_id": 1, "url": 1, "page_title": 1, "char_count": 1, "mode": 1, "summary": 1, "created_at": 1}) \
                     .sort("created_at", -1) \
                     .limit(limit)
    results = []
    for doc in docs:
        doc["_id"] = str(doc["_id"])
        doc["created_at"] = doc["created_at"].isoformat()
        results.append(doc)
    return results
