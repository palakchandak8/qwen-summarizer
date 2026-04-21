# TL;DRead Full Technical Walkthrough

This document explains exactly how the project works end-to-end, and how each file connects to the rest of the system.

If you present this in class, this is the core idea:

TL;DRead is a Chrome side-panel extension that extracts webpage text, sends it to a FastAPI backend, streams summary output back live through Server-Sent Events (SSE), saves the result in a local JSON database, and shows recent summaries in a dashboard page.

## 1) System At A Glance

Main runtime components:

1. Chrome extension UI and browser integration
2. FastAPI backend API
3. Summarizer agent (local Ollama model or cloud Gemini model)
4. Local persistence in JSON file
5. Website dashboard that polls recent summaries

High-level flow:

1. User clicks Summarize in [../extension/sidepanel.html](../extension/sidepanel.html) UI controlled by [../extension/sidepanel.js](../extension/sidepanel.js).
2. Extension asks [../extension/background.js](../extension/background.js) for active tab text.
3. Background script asks [../extension/content.js](../extension/content.js) to extract page text.
4. Side panel sends text to POST /summarize in [../backend/app.py](../backend/app.py).
5. Backend runs [../backend/agent.py](../backend/agent.py) and streams tokens/events.
6. Side panel renders streamed output and stage updates.
7. Backend saves final summary through [../backend/db.py](../backend/db.py) into [../backend/summaries.json](../backend/summaries.json).
8. Website at [../website/index.html](../website/index.html) uses [../website/app.js](../website/app.js) to poll GET /recent and render cards.

## 2) End-To-End Request Lifecycle (Exact)

### A. Extension Side

1. User opens side panel configured in [../extension/manifest.json](../extension/manifest.json).
2. User clicks Summarize button in [../extension/sidepanel.js](../extension/sidepanel.js).
3. [../extension/sidepanel.js](../extension/sidepanel.js) sends:
   - action: getPageText
4. [../extension/background.js](../extension/background.js):
   - finds active tab
   - sends action extractText to [../extension/content.js](../extension/content.js)
5. [../extension/content.js](../extension/content.js):
   - reads document.body.innerText
   - trims and collapses excessive newlines
   - returns text, charCount, url, title
6. [../extension/sidepanel.js](../extension/sidepanel.js) validates minimum content length and sends POST request to backend.

### B. Backend Side

1. POST /summarize endpoint in [../backend/app.py](../backend/app.py) receives:
   - content
   - mode (local/cloud)
   - optional gemini_api_key
   - url
   - page_title
2. Endpoint creates async SSE stream:
   - sends [START]
   - instantiates SummarizerAgent from [../backend/agent.py](../backend/agent.py)
   - iterates over agent.run_stream(content)
3. Agent pipeline in [../backend/agent.py](../backend/agent.py):
   - Stage EXTRACT: uses ExtractContent in [../backend/tools.py](../backend/tools.py)
   - Stage REASON: reasoning placeholder and stage signal
   - Stage GENERATE: builds summary via local or cloud model
   - Stage QUALITY: runs QualityCheck from [../backend/tools.py](../backend/tools.py)
   - retries generation up to 2 attempts if quality fails
   - yields final summary character-by-character
4. [../backend/app.py](../backend/app.py):
   - accumulates final summary text while streaming
   - calls save_summary in [../backend/db.py](../backend/db.py)
   - emits [DONE]

### C. Dashboard Side

1. [../website/app.js](../website/app.js) calls GET /recent every 30 seconds.
2. GET /recent in [../backend/app.py](../backend/app.py) returns list from [../backend/db.py](../backend/db.py).
3. [../website/app.js](../website/app.js) renders one card per summary.

## 3) API Contracts

### GET /health

- File: [../backend/app.py](../backend/app.py)
- Purpose: confirms backend is up and checks Ollama reachability at localhost:11434
- Returns:
  - status
  - ollama_reachable

### POST /summarize

- File: [../backend/app.py](../backend/app.py)
- Request body fields:
  - content (string)
  - mode (local or cloud)
  - gemini_api_key (optional string)
  - url (string)
  - page_title (string)
- Response type: text/event-stream (SSE)
- SSE tokens/events used by frontend:
  - [START]
  - [STAGE:EXTRACT]
  - [STAGE:REASON]
  - [STAGE:GENERATE]
  - [STAGE:QUALITY]
  - [ERROR] ...
  - [DONE]
  - plus JSON-encoded character chunks for the summary body

### GET /recent

- File: [../backend/app.py](../backend/app.py)
- Purpose: return latest summaries for dashboard
- Response shape:
  - summaries: list

## 4) Data Model And Storage

Storage file:

- [../backend/summaries.json](../backend/summaries.json)

Storage logic:

- Write/read functions in [../backend/db.py](../backend/db.py)

Each stored summary record has:

1. _id (UUID)
2. url
3. page_title
4. char_count
5. mode
6. summary
7. created_at (UTC ISO string)

## 5) File-By-File Dependency Map

### Root-Level Files

1. [../README.md](../README.md)
   - Main project README with architecture and setup narrative.
   - Links conceptually to backend, extension, and website folders.

2. [../HOW_TO_RUN.md](../HOW_TO_RUN.md)
   - Step-by-step run instructions.
   - References backend startup and extension loading.

3. [../.gitignore](../.gitignore)
   - Ignore rules for Python and local/dev artifacts across project.

### Backend Files

1. [../backend/app.py](../backend/app.py)
   - Main FastAPI entry.
   - Imports [../backend/agent.py](../backend/agent.py), [../backend/config.py](../backend/config.py), [../backend/db.py](../backend/db.py).
   - Exposes /health, /summarize, /recent.
   - Streams SSE and saves final summaries.

2. [../backend/agent.py](../backend/agent.py)
   - Core summarization logic.
   - Imports [../backend/tools.py](../backend/tools.py) and [../backend/config.py](../backend/config.py).
   - Uses local model via qwen_agent + Ollama or cloud model via Gemini SSE REST.
   - Emits stage markers and summary text.

3. [../backend/tools.py](../backend/tools.py)
   - Defines tool classes:
     - ExtractContent
     - QualityCheck
   - Used by [../backend/agent.py](../backend/agent.py).

4. [../backend/config.py](../backend/config.py)
   - Central config constants and environment loading.
   - Used by [../backend/app.py](../backend/app.py), [../backend/agent.py](../backend/agent.py), and [../backend/tools.py](../backend/tools.py).

5. [../backend/db.py](../backend/db.py)
   - Local JSON persistence layer.
   - Used by [../backend/app.py](../backend/app.py).

6. [../backend/run.sh](../backend/run.sh)
   - One-command backend bootstrap and launch.
   - Creates/activates virtual environment, installs [../backend/requirements.txt](../backend/requirements.txt), optionally runs [../backend/generate_favicon.py](../backend/generate_favicon.py), then starts Uvicorn.

7. [../backend/requirements.txt](../backend/requirements.txt)
   - Python dependencies for backend runtime.

8. [../backend/.env.example](../backend/.env.example)
   - Example environment variable template.
   - Copied to [../backend/.env](../backend/.env) in local setup.

9. [../backend/.env](../backend/.env)
   - Local machine secrets/config values (runtime only).
   - Read by [../backend/config.py](../backend/config.py).

10. [../backend/summaries.json](../backend/summaries.json)
    - Actual summary data store.
    - Written and read through [../backend/db.py](../backend/db.py).

11. [../backend/generate_favicon.py](../backend/generate_favicon.py)
    - Utility that generates icon image.
    - Writes to [../extension/favicon.png](../extension/favicon.png).

12. [../backend/agent_trace.log](../backend/agent_trace.log)
    - Runtime log output from [../backend/app.py](../backend/app.py).

13. [../backend/.gitignore](../backend/.gitignore)
    - Backend-focused ignore file.

14. [../backend/workspace/tools/doc_parser](../backend/workspace/tools/doc_parser)
    - Empty placeholder directory (currently unused).

15. [../backend/workspace/tools/simple_doc_parser](../backend/workspace/tools/simple_doc_parser)
    - Empty placeholder directory (currently unused).

16. [../backend/venv](../backend/venv)
    - Local virtual environment folder, created by [../backend/run.sh](../backend/run.sh).
    - Runtime dependency container, not application source code.

### Extension Files

1. [../extension/manifest.json](../extension/manifest.json)
   - Declares MV3 config, permissions, side panel page, service worker, and content script injection.

2. [../extension/background.js](../extension/background.js)
   - Service worker bridge between side panel UI and content script.
   - Receives getPageText and forwards extractText requests.

3. [../extension/content.js](../extension/content.js)
   - Runs in active webpage context.
   - Extracts raw DOM text and metadata (URL/title).

4. [../extension/sidepanel.html](../extension/sidepanel.html)
   - Side panel structure and element IDs used by JS.
   - Loads [../extension/sidepanel.css](../extension/sidepanel.css) and [../extension/sidepanel.js](../extension/sidepanel.js).

5. [../extension/sidepanel.css](../extension/sidepanel.css)
   - UI styling for main and settings views, flowchart, status, and controls.

6. [../extension/sidepanel.js](../extension/sidepanel.js)
   - Main extension orchestrator:
     - mode selection via chrome.storage
     - health checks
     - text extraction request
     - POST /summarize call
     - SSE parsing and live rendering
     - copy-to-clipboard

7. [../extension/favicon.png](../extension/favicon.png)
   - Icon used by manifest action and icon sizes.

8. [../extension/icon.png](../extension/icon.png)
   - Additional extension asset image.

### Website Files

1. [../website/index.html](../website/index.html)
   - Dashboard HTML shell.
   - Loads [../website/style.css](../website/style.css) and [../website/app.js](../website/app.js).

2. [../website/style.css](../website/style.css)
   - Dashboard visual design, card layout, status badges, and responsive grid styling.

3. [../website/app.js](../website/app.js)
   - Dashboard controller:
     - polls /recent
     - renders summary cards
     - handles copy action
     - shows offline/online badge state

4. [../website/favicon.png](../website/favicon.png)
   - Website favicon.

## 6) Local Mode vs Cloud Mode (Actual Code Behavior)

### Local Mode

1. Side panel sends mode: local in POST body.
2. [../backend/agent.py](../backend/agent.py) creates qwen_agent Assistant with:
   - model from [../backend/config.py](../backend/config.py)
   - server from OLLAMA_BASE_URL
3. Current configured local model string is OLLAMA_MODEL = llama3.2:1b.

### Cloud Mode

1. Side panel sends mode: cloud.
2. [../backend/agent.py](../backend/agent.py) calls Gemini streamGenerateContent endpoint using httpx streaming.
3. API key is required:
   - from request field gemini_api_key, or
   - fallback from GEMINI_API_KEY in environment via [../backend/config.py](../backend/config.py).

## 7) Important Reality Checks (Good For Viva/Presentation)

These points are useful to mention if asked about implementation details:

1. Current persistence is JSON file based, not MongoDB.
   - Evidence: [../backend/db.py](../backend/db.py) reads/writes [../backend/summaries.json](../backend/summaries.json).

2. Documentation and UI text mention Qwen3, but current config sets local model to llama3.2:1b.
   - Evidence: [../backend/config.py](../backend/config.py) and UI labels in [../extension/sidepanel.html](../extension/sidepanel.html).

3. Extension settings currently save only mode in chrome.storage.
   - The side panel does not send a user-entered Gemini key; backend typically uses .env key.
   - Evidence: [../extension/sidepanel.js](../extension/sidepanel.js), [../backend/.env.example](../backend/.env.example), [../backend/config.py](../backend/config.py).

4. /health always checks Ollama availability, so cloud mode may still show warnings tied to local checks.
   - Evidence: [../backend/app.py](../backend/app.py) and health messaging in [../extension/sidepanel.js](../extension/sidepanel.js).

5. The parser directories exist but are empty right now.
   - Evidence: [../backend/workspace/tools/doc_parser](../backend/workspace/tools/doc_parser), [../backend/workspace/tools/simple_doc_parser](../backend/workspace/tools/simple_doc_parser).

## 8) Quick Presentation Script You Can Use

You can explain the project in this order:

1. "The extension side panel is the user interface."
2. "When the user clicks summarize, the extension extracts text from the active page using a content script."
3. "It sends text, URL, and title to a FastAPI backend through POST /summarize."
4. "The backend runs a staged agent pipeline: extract, reason, generate, and quality check."
5. "The backend streams result tokens live via SSE, and the panel renders them in real time."
6. "After generation completes, the backend stores the summary in summaries.json."
7. "A separate dashboard polls /recent and displays stored summaries as cards."
8. "The project supports local and cloud inference modes, selected from extension settings."

## 9) Where To Start Reading Code First

If someone asks "show me the core flow," open these in order:

1. [../extension/sidepanel.js](../extension/sidepanel.js)
2. [../extension/background.js](../extension/background.js)
3. [../extension/content.js](../extension/content.js)
4. [../backend/app.py](../backend/app.py)
5. [../backend/agent.py](../backend/agent.py)
6. [../backend/tools.py](../backend/tools.py)
7. [../backend/db.py](../backend/db.py)
8. [../website/app.js](../website/app.js)

This order shows the exact data path from click to storage to dashboard.