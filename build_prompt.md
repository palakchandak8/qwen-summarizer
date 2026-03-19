# ONE-SHOT BUILD PROMPT
# Hybrid Web Summarizer Chrome Extension — Qwen (Local) + Gemini (Cloud)
# Neobrutalist UI | Agentic ReAct Backend | Full Streaming

---

## WHAT YOU ARE BUILDING

A Chrome Extension that summarizes any webpage in real-time. The user can toggle between two inference backends:

- **LOCAL MODE** — Qwen3:1.7B running on Ollama at localhost:11434 (offline, private, no API key)
- **CLOUD MODE** — Google Gemini 1.5 Flash via Gemini API (fast, no local setup required, needs API key)

Both modes go through the same FastAPI backend. The backend detects which mode is active and routes accordingly. Both modes stream tokens back to the extension in real-time.

The UI must be **neobrutalist** — bold black borders, hard box shadows, flat primary colors, chunky typography, zero rounded corners, raw and loud aesthetic.

---

## COMPLETE FILE STRUCTURE

Build exactly this structure, no deviations:

```
qwen-web-summarizer/
├── backend/
│   ├── app.py
│   ├── agent.py
│   ├── tools.py
│   ├── config.py
│   ├── requirements.txt
│   └── run.sh
├── extension/
│   ├── manifest.json
│   ├── popup.html
│   ├── popup.js
│   ├── popup.css
│   ├── content.js
│   ├── background.js
│   └── icon.png  ← placeholder, 128x128 any solid color PNG
└── README.md
```

---

## BACKEND — FULL SPECIFICATION

### config.py

```python
# All configuration lives here, imported everywhere else

OLLAMA_BASE_URL = "http://localhost:11434"
OLLAMA_MODEL = "qwen3:1.7b"

GEMINI_MODEL = "gemini-1.5-flash"
GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta"

FASTAPI_PORT = 7864
MAX_CONTEXT_CHARS = 12000   # Truncate page text beyond this before sending to LLM
```

### tools.py

Define exactly two tools as plain Python functions decorated with `@tool` from qwen-agent:

**Tool 1 — `extract_content`**
- Receives raw text string (already extracted by the extension)
- Cleans it: strip excessive whitespace, remove lines under 20 chars, deduplicate blank lines
- Truncates to MAX_CONTEXT_CHARS
- Returns cleaned string with a char count prefix like: `[CONTENT: 4821 chars] <cleaned text>`

**Tool 2 — `quality_check`**
- Receives a summary string
- Checks: word count >= 60, no "I cannot", no "as an AI", no empty string
- Returns: `PASS: <summary>` or `FAIL: <reason>`

### agent.py

Build a class `SummarizerAgent` with this exact interface:

```python
class SummarizerAgent:
    def __init__(self, mode: str, gemini_api_key: str = None):
        # mode is either "local" or "cloud"
        # If mode == "local": use Qwen3 via Ollama OpenAI-compatible endpoint
        # If mode == "cloud": use Gemini API directly via httpx async streaming
        ...

    async def run_stream(self, raw_page_text: str) -> AsyncGenerator[str, None]:
        # Full ReAct loop — yields token strings
        # Step 1: Call extract_content tool on raw_page_text
        # Step 2: Reason about the cleaned content
        # Step 3: Generate summary using the active LLM (local or cloud)
        # Step 4: Call quality_check tool on the summary
        # Step 5: If FAIL, retry once with a refined prompt
        # Step 6: Yield final summary tokens one by one
        # Every step must emit a [THINKING] prefix token first so the UI can show reasoning state
        ...
```

**For LOCAL mode**, use the qwen-agent `Assistant` class with the two tools above, backed by Ollama's OpenAI-compatible endpoint at `http://localhost:11434/v1`.

**For CLOUD mode**, do NOT use qwen-agent. Instead, manually implement the ReAct loop using `httpx.AsyncClient` with the Gemini `streamGenerateContent` REST endpoint. The system prompt must instruct Gemini to behave as the same summarizer agent.

The system prompt for both modes must be identical in intent:

```
You are a webpage summarization agent. You will be given raw webpage text.
Your job is to produce a clear, structured summary with:
- A one-line TL;DR
- 3 to 5 key bullet points
- One "Why it matters" sentence

Be concise. Do not hallucinate. Do not add information not present in the text.
If the content is too short or irrelevant, say so directly.
```

### app.py

FastAPI application with exactly these routes:

**POST `/summarize`**
Request body:
```json
{
  "content": "<raw page text string>",
  "mode": "local" or "cloud",
  "gemini_api_key": "<string, required only when mode is cloud>"
}
```
Response: `StreamingResponse` with `media_type="text/event-stream"`

Each SSE event must be formatted as:
```
data: <token>\n\n
```

Special control tokens the frontend listens for:
- `data: [START]\n\n` — emit this before the first token
- `data: [THINKING]\n\n` — emit before each ReAct reasoning step
- `data: [DONE]\n\n` — emit when stream is complete
- `data: [ERROR] <message>\n\n` — emit on any exception

**GET `/health`**
Returns `{"status": "ok", "ollama_reachable": true/false}` — checks if Ollama is up by pinging localhost:11434.

**CORS**: Allow all origins (this is a local dev tool).

**Logging**: Use Python's `logging` module. Every tool call, observation, and final answer must be logged with timestamps to `agent_trace.log` in the backend folder.

### requirements.txt

```
fastapi
uvicorn[standard]
httpx
qwen-agent[code_interpreter]
python-dotenv
pydantic
```

### run.sh

A single convenience script that installs dependencies and starts the backend. Must be executable (`chmod +x run.sh`).

```bash
#!/bin/bash
# Hybrid Web Summarizer — Backend Startup Script
# Run this once from the /backend directory

echo "Installing dependencies..."
pip install -r requirements.txt

echo "Starting FastAPI backend on port 7864..."
uvicorn app:app --host 127.0.0.1 --port 7864 --reload
```

No Docker. The backend is a plain Python process. Ollama runs natively on the host machine so it can access the GPU directly — containerizing the backend would break localhost:11434 access in LOCAL mode.

---

## CHROME EXTENSION — FULL SPECIFICATION

### manifest.json

```json
{
  "manifest_version": 3,
  "name": "Web Summarizer — Qwen + Gemini",
  "version": "1.0",
  "description": "Summarize any page locally with Qwen or via Gemini API",
  "permissions": ["activeTab", "scripting", "storage"],
  "action": {
    "default_popup": "popup.html"
  },
  "background": {
    "service_worker": "background.js"
  },
  "content_scripts": [
    {
      "matches": ["<all_urls>"],
      "js": ["content.js"]
    }
  ]
}
```

### content.js

- On message `{action: "extractText"}`, extract `document.body.innerText`
- Clean it slightly: trim, collapse 3+ newlines to 2
- Reply with `{text: <cleaned string>, charCount: <number>}`

### background.js

- Listen for the extension icon click
- On click, send `{action: "extractText"}` to the active tab's content script
- Forward the result back to popup.js via `chrome.runtime.sendMessage`

### popup.js

Full logic:

1. On load, read saved settings from `chrome.storage.local`: `mode` (default: "local") and `geminiApiKey` (default: "")
2. Render the current mode in the toggle
3. On "Summarize" button click:
   a. Request page text from background.js
   b. Show char count in the UI
   c. POST to `http://localhost:7864/summarize` with `{content, mode, gemini_api_key}`
   d. Open the response as a `ReadableStream`
   e. Parse SSE lines: strip `data: ` prefix, handle `[START]`, `[THINKING]`, `[DONE]`, `[ERROR]`
   f. On `[THINKING]`: show a pulsing "Reasoning..." badge in the output area
   g. On normal tokens: append to the output panel character by character
   h. On `[DONE]`: hide the pulsing badge, show a "Copy" button
   i. On `[ERROR]`: show error text in red
4. Settings panel (toggled by a gear icon):
   - Mode toggle: LOCAL / CLOUD (styled as a big chunky switch)
   - Gemini API Key input: text field, only shown when CLOUD is selected
   - "Save" button: persists to `chrome.storage.local`

---

## UI — NEOBRUTALIST DESIGN SPEC

This is the most important section. The UI must look deliberately raw, bold, and loud. Follow every rule.

### Core Neobrutalist Rules

- **Borders**: All interactive elements and panels have `border: 3px solid #000000`. No exceptions.
- **Box shadows**: All cards and buttons use `box-shadow: 4px 4px 0px #000000`. No blur, no spread, solid offset only.
- **Border radius**: `0px` everywhere. No rounded corners anywhere.
- **Colors**: Use this exact palette:
  - Background: `#FFFFFF`
  - Primary accent: `#FFE500` (loud yellow)
  - Secondary accent: `#00CFFF` (electric blue)
  - Local mode color: `#B8FF57` (acid green)
  - Cloud mode color: `#FF6BFF` (hot pink/magenta)
  - Danger/error: `#FF3333`
  - Text: `#000000`
- **Typography**: `font-family: 'Space Grotesk', sans-serif` loaded from Google Fonts. Titles bold 700, body 500.
- **Hover state on buttons**: `transform: translate(2px, 2px); box-shadow: 2px 2px 0px #000000`
- **Active/pressed state**: `transform: translate(4px, 4px); box-shadow: 0px 0px 0px #000000`
- **No gradients. No transitions longer than 100ms. No shadows with blur.**

### popup.html Layout

The popup must be exactly **420px wide** and **auto height** (min 500px). Structure from top to bottom:

```
┌─────────────────────────────────────────────────────┐
│  ██ WEB SUMMARIZER          [⚙ SETTINGS] [LOCAL▼]  │  ← Header bar, yellow background
├─────────────────────────────────────────────────────┤
│  [ ⚡ SUMMARIZE THIS PAGE ]                          │  ← Big chunky button, full width, black bg white text
├─────────────────────────────────────────────────────┤
│  Page: 4,821 chars extracted                         │  ← Status line, small monospace
├─────────────────────────────────────────────────────┤
│                                                      │
│  ░ OUTPUT PANEL                                      │  ← Output area, bordered box
│  [Reasoning...●]                                     │  ← Pulsing badge, only visible when thinking
│                                                      │
│  TL;DR: ...streamed text appears here...             │
│                                                      │
│                                                      │
├─────────────────────────────────────────────────────┤
│  [ 📋 COPY ]                                         │  ← Only visible after DONE
└─────────────────────────────────────────────────────┘
```

**Settings panel** slides in from the right (or replaces main content) when gear icon is clicked:

```
┌─────────────────────────────────────────────────────┐
│  ← BACK        SETTINGS                             │
├─────────────────────────────────────────────────────┤
│  INFERENCE MODE                                      │
│  [ LOCAL — Qwen3 ]  [ CLOUD — Gemini ]              │  ← Toggle, active has yellow bg + border
├─────────────────────────────────────────────────────┤
│  GEMINI API KEY      (only shown in CLOUD mode)      │
│  [________________________________]                  │  ← Text input
├─────────────────────────────────────────────────────┤
│  [ SAVE SETTINGS ]                                   │
└─────────────────────────────────────────────────────┘
```

**Header badge** changes color based on active mode:
- LOCAL: acid green `#B8FF57` background with text "LOCAL"
- CLOUD: hot pink `#FF6BFF` background with text "CLOUD"

**"Reasoning..." badge** in the output area: yellow background, black border, bold text, a blinking dot after it (`●` character toggled by `setInterval`).

**Output panel**: white background, 3px black border, 4px 4px black box-shadow, `padding: 16px`, `font-size: 14px`, `line-height: 1.7`, `min-height: 200px`, `overflow-y: auto`, `max-height: 320px`.

**Summarize button**: Full width, `background: #000000`, `color: #FFFFFF`, `font-size: 18px`, `font-weight: 700`, `padding: 14px`, `letter-spacing: 0.05em`, `text-transform: uppercase`, 3px black border, 4px 4px 0px `#FFE500` box-shadow (yellow shadow on black button).

---

## BEHAVIOR AND EDGE CASES

Handle all of these explicitly:

1. **Ollama not running in LOCAL mode**: The `/health` endpoint will return `ollama_reachable: false`. The extension should check health on popup open and show a warning banner: "⚠ Ollama not detected. Switch to CLOUD mode or start Ollama."

2. **Missing Gemini API key in CLOUD mode**: Before sending the request, check if the key is empty. If so, show inline error: "Gemini API key required. Open Settings."

3. **Page text too short (under 200 chars)**: Show message "This page doesn't have enough content to summarize."

4. **Stream timeout**: If no token received for 15 seconds, abort the stream and show error.

5. **quality_check returns FAIL**: The agent retries once automatically. If it fails twice, yield the raw summary anyway with a `[⚠ Low confidence summary]` prefix token.

6. **CLOUD mode Gemini error (bad key, quota exceeded)**: Parse the error JSON from Gemini's response and forward the message via `[ERROR]` SSE token.

---

## README.md

Write a complete README with:
- Project description (2 sentences)
- Architecture diagram as ASCII
- Setup: LOCAL mode (install Ollama, pull qwen3:1.7b, run `run.sh`, load extension)
- Setup: CLOUD mode (get Gemini API key, run `run.sh`, load extension, enter key in settings)
- File structure table
- Troubleshooting: what to do if Ollama is unreachable or Gemini returns 403

---

## FINAL CHECKLIST — DO NOT SKIP ANY OF THESE

Before considering this complete, verify:

- [ ] Both LOCAL and CLOUD modes produce a streaming summary end to end
- [ ] The UI is 420px wide, neobrutalist, zero border-radius, all borders 3px solid black
- [ ] Mode badge changes color correctly
- [ ] Settings are persisted via chrome.storage.local
- [ ] Health check warns if Ollama is down
- [ ] All 5 edge cases are handled
- [ ] agent_trace.log is written on every run
- [ ] [START], [THINKING], [DONE], [ERROR] control tokens are all handled in popup.js
- [ ] quality_check tool retries once on FAIL
- [ ] run.sh installs deps and starts uvicorn correctly
- [ ] No hardcoded API keys anywhere in code

---

Build everything in one pass. Do not ask clarifying questions. If anything is ambiguous, make the most reasonable choice and document it in a comment.
