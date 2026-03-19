<div align="center">

```
████████╗██╗      ██████╗ ██████╗ ███████╗ █████╗ ██████╗
╚══██╔══╝██║     ██╔════╝██╔══██╗██╔══██╗██╔══██╗██╔══██╗
   ██║   ██║     ╚█████╗ ██║  ██║██████╔╝█████╔╝██║  ██║
   ██║   ██║      ╚═══██╗██║  ██║██╔══██╗██╔══██╗██║  ██║
   ██║   ███████╗██████╔╝██████╔╝██║  ██║██║  ██║██████╔╝
   ╚═╝   ╚══════╝╚═════╝ ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝╚═════╝
```

### *Too Long; Didn't Read — So We Did It For You.*

**An AI-powered Chrome Extension that distills any webpage into razor-sharp summaries in real time.**<br>
Choose your engine — run completely **private & local** with Qwen3, or tap into the **cloud** with Google Gemini.

<br>

`Chrome Extension` · `FastAPI` · `ReAct Agent` · `SSE Streaming` · `Qwen3` · `Gemini 2.5 Flash` · `MongoDB`

---

</div>

<br>

## ✦ Why TL;DRead?

| | |
|---|---|
| 🔒 **Privacy First** | Local mode runs entirely on your machine via Ollama — nothing leaves localhost |
| ⚡ **Real-Time Streaming** | Watch your summary materialize token-by-token through Server-Sent Events |
| 🧠 **ReAct Agent Loop** | Not just a prompt-and-pray — an intelligent agent that extracts, reasons, generates, and self-corrects |
| 🔀 **Dual Engine** | Flip between local Qwen3 (1.7B) and cloud Gemini 2.5 Flash with one toggle |
| 📊 **Live Dashboard** | Every summary is persisted to MongoDB and displayed on a real-time web dashboard |
| 🎨 **Neobrutalist UI** | A bold, grid-based Chrome side panel that looks as good as it works |

<br>

## ✦ Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              TL;DRead  SYSTEM                                  │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│   ┌─────────────────────┐          ┌──────────────────────────────────────┐     │
│   │  CHROME EXTENSION   │          │         FASTAPI BACKEND              │     │
│   │  (Side Panel UI)    │   POST   │         port 7864                    │     │
│   │                     │ ────────►│                                      │     │
│   │  ┌───────────────┐  │          │  ┌──────────────────────────────┐   │     │
│   │  │ sidepanel.js   │  │   SSE    │  │     ReAct Agent Loop         │   │     │
│   │  │ ┌─────────────┐│  │ ◄────── │  │                              │   │     │
│   │  │ │ SSE Parser  ││  │ stream  │  │  ┌────────┐   ┌──────────┐  │   │     │
│   │  │ └─────────────┘│  │         │  │  │EXTRACT │──►│ REASON   │  │   │     │
│   │  └───────────────┘  │          │  │  │CONTENT │   │ + PROMPT │  │   │     │
│   │                     │          │  │  └────────┘   └────┬─────┘  │   │     │
│   │  ┌───────────────┐  │          │  │                    │        │   │     │
│   │  │ content.js    │  │          │  │              ┌─────▼─────┐  │   │     │
│   │  │ (DOM Scraper) │  │          │  │              │ GENERATE  │  │   │     │
│   │  └───────────────┘  │          │  │              │ SUMMARY   │  │   │     │
│   │                     │          │  │              └─────┬─────┘  │   │     │
│   │  ┌───────────────┐  │          │  │                    │        │   │     │
│   │  │ background.js │  │          │  │              ┌─────▼─────┐  │   │     │
│   │  │ (Svc Worker)  │  │          │  │              │ QUALITY   │  │   │     │
│   │  └───────────────┘  │          │  │              │  CHECK    │  │   │     │
│   └─────────────────────┘          │  │              └─────┬─────┘  │   │     │
│                                    │  │                    │        │   │     │
│                                    │  │           PASS ◄───┤        │   │     │
│                                    │  │                    │ FAIL   │   │     │
│                                    │  │               RETRY (max 2) │   │     │
│                                    │  └──────────────────────────────┘   │     │
│                                    │                                      │     │
│                                    │  ┌──────────┐     ┌──────────────┐  │     │
│                                    │  │ config.py│     │    db.py     │  │     │
│                                    │  │ (env)    │     │  (MongoDB)   │  │     │
│                                    │  └──────────┘     └──────┬───────┘  │     │
│                                    └──────────────────────────┼──────────┘     │
│                                                               │                 │
│                 ┌─────────────────────────────────────────────┼───────┐         │
│                 │        AI   INFERENCE   LAYER               │       │         │
│                 │                                             │       │         │
│                 │    ┌──────────────┐    ┌──────────────┐     │       │         │
│                 │    │ 🖥  LOCAL     │    │ ☁  CLOUD     │     │       │         │
│                 │    │              │    │              │     │       │         │
│                 │    │  Ollama      │    │  Gemini API  │     │       │         │
│                 │    │  Qwen3:1.7b  │    │  2.5 Flash   │     │       │         │
│                 │    │              │    │  (SSE/REST)  │     │       │         │
│                 │    │ localhost    │    │  googleapis  │     │       │         │
│                 │    │ :11434       │    │  .com        │     │       │         │
│                 │    └──────────────┘    └──────────────┘     │       │         │
│                 └────────────────────────────────────────────-┘       │         │
│                                                                       │         │
│   ┌───────────────────────────────────────────────────────────────┐   │         │
│   │                     WEBSITE DASHBOARD                         │   │         │
│   │                                                               │   │         │
│   │    Polls GET /recent ──► Renders summary cards in real time   │◄──┘         │
│   │    Auto-refresh every 30s   ·   Copy-to-clipboard             │  (MongoDB)  │
│   │    Live/Offline indicator   ·   Responsive grid layout        │             │
│   └───────────────────────────────────────────────────────────────┘             │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

<br>

## ✦ The ReAct Agent — Under the Hood

TL;DRead doesn't just fire a prompt at an LLM and hope for the best. It runs a **multi-step ReAct (Reason + Act) agent loop** with tool use:

```
  ┌──────────────────────────────────────────────────────────────────┐
  │                                                                  │
  │   Step 1 ─── extract_content()                                   │
  │              Clean raw DOM text, strip noise, truncate to 12k    │
  │                           │                                      │
  │   Step 2 ─── Reasoning                                           │
  │              Agent evaluates the cleaned content                 │
  │                           │                                      │
  │   Step 3 ─── Generate Summary                                    │
  │              LLM produces: TL;DR → Bullets → "Why it matters"   │
  │                           │                                      │
  │   Step 4 ─── quality_check()                                     │
  │              Word count ≥ 60? No hallucination markers?          │
  │                           │                                      │
  │              ┌────── PASS ┴ FAIL ──────┐                         │
  │              ▼                          ▼                         │
  │         Stream to UI            Retry Step 3 (max 2)             │
  │                                                                  │
  └──────────────────────────────────────────────────────────────────┘
```

The summary output format:
- **TL;DR** — A single-line distillation
- **Key Points** — 3–5 bullet points capturing the core information
- **Why It Matters** — One sentence on broader relevance

<br>

## ✦ Data Flow

```
  User clicks              Content script            Background              Backend
  "SUMMARIZE"              (content.js)              (background.js)         (app.py)
       │                        │                         │                      │
       │  click event           │                         │                      │
       ├───────────────────────►│                         │                      │
       │                        │  chrome.runtime         │                      │
       │                        │  .sendMessage           │                      │
       │                        ├────────────────────────►│                      │
       │                        │                         │  POST /summarize     │
       │                        │                         ├─────────────────────►│
       │                        │                         │                      │
       │                        │                         │    SSE stream        │
       │                        │                         │◄─────────────────────┤
       │    tokens rendered      │                         │                      │
       │◄───────────────────────┼─────────────────────────┤                      │
       │    in side panel        │                         │                      │
       │                        │                         │               ┌──────┤
       │                        │                         │               │MONGO │
       │                        │                         │               │ save │
       │                        │                         │               └──────┘
```

<br>

## ✦ Project Structure

```
qwen-summarizer/
│
├── backend/                    # FastAPI + AI Agent
│   ├── app.py                  # Routes: /health, /summarize (SSE), /recent
│   ├── agent.py                # SummarizerAgent — ReAct loop, dual-mode LLM
│   ├── tools.py                # extract_content & quality_check tools
│   ├── config.py               # Environment config (ports, models, keys)
│   ├── db.py                   # MongoDB persistence layer
│   ├── run.sh                  # One-command startup (venv + deps + server)
│   ├── requirements.txt        # Python dependencies
│   └── generate_favicon.py     # Favicon generator utility
│
├── extension/                  # Chrome Extension (Manifest V3)
│   ├── manifest.json           # Permissions, side panel, service worker
│   ├── sidepanel.html          # Main UI — neobrutalist side panel
│   ├── sidepanel.css           # Grid backgrounds, blue palette, bold type
│   ├── sidepanel.js            # SSE parser, mode toggle, streaming renderer
│   ├── content.js              # DOM text extractor (injected per page)
│   ├── background.js           # Service worker — messaging bridge
│   └── favicon.png             # Extension icon
│
├── website/                    # Live Summary Dashboard
│   ├── index.html              # Dashboard shell
│   ├── style.css               # Dark terminal-inspired UI
│   ├── app.js                  # Polls /recent, renders card grid
│   └── favicon.png             # Site icon
│
├── HOW_TO_RUN.md               # ⚡ Setup & running instructions
└── README.md                   # ← You are here
```

<br>

## ✦ Tech Stack

| Layer | Technology | Role |
|---|---|---|
| **Extension** | Chrome Manifest V3, Vanilla JS | Side panel UI, DOM scraping, SSE consumption |
| **Backend** | Python, FastAPI, Uvicorn | API server, streaming responses, agent orchestration |
| **Local AI** | Ollama, Qwen3 1.7B, qwen-agent | Private on-device inference |
| **Cloud AI** | Google Gemini 2.5 Flash (REST SSE) | Cloud-based high-speed inference |
| **Database** | MongoDB (PyMongo) | Summary persistence & retrieval |
| **Dashboard** | Vanilla HTML/CSS/JS | Real-time summary feed with auto-refresh |

<br>

## ✦ Getting Started

> **📖 Full setup & running instructions → [`HOW_TO_RUN.md`](./HOW_TO_RUN.md)**

Quick overview:

```bash
# 1. Start the backend
cd backend && chmod +x run.sh && ./run.sh

# 2. Load extension in Chrome
#    chrome://extensions → Developer Mode → Load Unpacked → select extension/

# 3. Click the TL;DRead icon on any webpage and hit ⚡ SUMMARIZE
```

<br>

## ✦ Modes at a Glance

```
  ┌────────────────────────────────────────────────────────────┐
  │                                                            │
  │    🖥  LOCAL MODE                ☁  CLOUD MODE              │
  │                                                            │
  │    Engine:  Qwen3 1.7B           Engine:  Gemini 2.5 Flash │
  │    Via:     Ollama (localhost)    Via:     Google API        │
  │    Privacy: 100% offline         Privacy: Data sent to API │
  │    Speed:   Hardware-dependent   Speed:   Fast              │
  │    Cost:    Free                 Cost:    Free tier avail.  │
  │    Setup:   Install Ollama       Setup:   Get API key       │
  │                                                            │
  └────────────────────────────────────────────────────────────┘
```

<br>

---

<div align="center">

Built with stubbornness and caffeine ☕

**[`HOW_TO_RUN.md →`](./HOW_TO_RUN.md)** for setup instructions

</div>
