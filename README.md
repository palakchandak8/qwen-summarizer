<div align="center">

```
╔══════════════════════════════════════════════════════════════════╗
║                                                                  ║
║   ████████╗██╗         ██████╗  ██████╗  ███████╗ █████╗ ██████╗║
║      ██╔══╝██║        ██╔══██╗ ██╔══██╗ ██╔════╝██╔══██╗██╔══██╗║
║      ██║   ██║        ██║  ██║ ██████╔╝ █████╗  ███████║██║  ██║║
║      ██║   ██║        ██║  ██║ ██╔══██╗ ██╔══╝  ██╔══██║██║  ██║║
║      ██║   ███████╗   ██████╔╝ ██║  ██║ ███████╗██║  ██║██████╔╝║
║      ╚═╝   ╚══════╝   ╚═════╝  ╚═╝  ╚═╝ ╚══════╝╚═╝  ╚═╝╚═════╝ ║
║                                                                  ║
║            Too Long; Didn't Read — So We Did It For You          ║
║                                                                  ║
╚══════════════════════════════════════════════════════════════════╝
```

**An AI-powered Chrome Extension that distills any webpage into razor-sharp summaries in real time.**

Choose your engine — run completely **private & local** with Qwen3, or tap into the **cloud** with Gemini 2.5 Flash.

<br>

![Chrome Extension](https://img.shields.io/badge/Chrome_Extension-Manifest_V3-4285F4?style=flat-square&logo=googlechrome&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-Backend-009688?style=flat-square&logo=fastapi&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-Persistence-47A248?style=flat-square&logo=mongodb&logoColor=white)
![Qwen3](https://img.shields.io/badge/Qwen3-Local_AI-FF6B35?style=flat-square)
![Gemini](https://img.shields.io/badge/Gemini_2.5_Flash-Cloud_AI-8E75B2?style=flat-square&logo=google&logoColor=white)

</div>

<br>

---

## ✦ Why TL;DRead?

| | |
|---|---|
| 🔒 **Privacy First** | Local mode runs entirely on your machine via Ollama — nothing leaves localhost |
| ⚡ **Real-Time Streaming** | Watch your summary materialize token-by-token through Server-Sent Events |
| 🧠 **True Agentic Loop** | Not prompt-and-pray — a ReAct agent that extracts, reasons, generates, and self-corrects |
| 🔀 **Dual Engine** | Flip between local Qwen3 1.7B and cloud Gemini 2.5 Flash with one toggle |
| 📊 **Live Dashboard** | Every summary persisted to MongoDB and rendered on a real-time web dashboard |
| 🎨 **Side Panel UI** | A bold Chrome side panel that stays open alongside the page — full reading room |

<br>

---

## ✦ System Architecture

```
╔═══════════════════════════════════════════════════════════════════════════════════╗
║                            TL;DRead  —  FULL SYSTEM                              ║
╠══════════════════╦════════════════════════════════╦══════════════════════════════╣
║  CHROME          ║  FASTAPI BACKEND  :7864         ║  INFERENCE LAYER             ║
║  EXTENSION       ║                                ║                              ║
║                  ║                                ║  ┌─────────────────────────┐ ║
║  ┌────────────┐  ║  ┌──────────────────────────┐  ║  │  🖥  LOCAL               │ ║
║  │sidepanel.js│  ║  │      ReAct Agent Loop     │  ║  │                         │ ║
║  │            │  ║  │                          │  ║  │  Ollama  +  Qwen3:1.7B  │ ║
║  │ SSE Reader │◄─╬──│ stream tokens            │  ║  │  localhost:11434         │ ║
║  │            │  ║  │                          │  ║  │  100% offline · free     │ ║
║  │ Mode Toggle│  ║  │  ① extract_content()     │  ║  └─────────────────────────┘ ║
║  │            │  ║  │         │                │  ║                              ║
║  │ Settings   │  ║  │         ▼                │  ║  ┌─────────────────────────┐ ║
║  └────────────┘  ║  │  ② reason + plan         │  ║  │  ☁  CLOUD               │ ║
║        │         ║  │         │                │  ║  │                         │ ║
║  ┌─────┴──────┐  ║  │         ▼                │  ║  │  Google Gemini 2.5      │ ║
║  │ content.js │  ║  │  ③ generate summary      │  ║  │  Flash  (SSE REST)      │ ║
║  │            │  ║  │         │                │  ║  │  API key required        │ ║
║  │ DOM scraper│  ║  │         ▼                │  ║  └─────────────────────────┘ ║
║  └─────┬──────┘  ║  │  ④ quality_check()       │  ║                              ║
║        │         ║  │         │                │  ╠══════════════════════════════╣
║  ┌─────┴──────┐  ║  │    PASS ┤ FAIL           │  ║  DATABASE                    ║
║  │background  │  ║  │         │  └─► retry ×2  │  ║                              ║
║  │.js         │  ║  │         ▼                │  ║  ┌─────────────────────────┐ ║
║  │svc worker  │  ║  │  ⑤ stream to client      │  ║  │  MongoDB  :27017         │ ║
║  └─────┬──────┘  ║  └──────────────────────────┘  ║  │                         │ ║
║        │         ║           │                    ║  │  db: tldread             │ ║
╠════════╪═════════╬═══════════╪════════════════════╣  │  col: summaries          │ ║
║        │  POST   ║           │ save on [DONE]      ║  │                         │ ║
║        └─────────╬───────────┴────────────────────╬─►│  url · title · summary   │ ║
║                  ║                                ║  │  mode · chars · ts       │ ║
╠══════════════════╩════════════════════════════════╩══╪══════════════════════════╣
║  WEBSITE DASHBOARD  /website                         │                          ║
║                                                      │  GET /recent             ║
║  index.html  ──  polls every 30s  ◄──────────────────┘                          ║
║  Renders summary cards  ·  mode badges  ·  copy button  ·  live/offline status  ║
╚══════════════════════════════════════════════════════════════════════════════════╝
```

<br>

---

## ✦ The ReAct Agent Loop

```
╔══════════════════════════════════════════════════════════════════════╗
║                    REACT AGENT  —  STEP BY STEP                     ║
╠══════════════════════════════════════════════════════════════════════╣
║                                                                      ║
║   RAW PAGE TEXT (DOM)                                                ║
║         │                                                            ║
║         ▼                                                            ║
║   ┌─────────────────────────────────────────────────────────────┐   ║
║   │  STEP 1 · extract_content()                                 │   ║
║   │                                                             │   ║
║   │  • Strip whitespace noise          • Remove short lines     │   ║
║   │  • Deduplicate blank lines         • Truncate → 12k chars   │   ║
║   │                            returns: [CONTENT: N chars]      │   ║
║   └───────────────────────────────────┬─────────────────────────┘   ║
║                                       │                              ║
║                                       ▼                              ║
║   ┌─────────────────────────────────────────────────────────────┐   ║
║   │  STEP 2 · Reason + Plan                                     │   ║
║   │                                                             │   ║
║   │  Agent evaluates content quality and plans summarization    │   ║
║   │  Emits:  [THINKING] token → UI shows "Reasoning..." badge   │   ║
║   └───────────────────────────────────┬─────────────────────────┘   ║
║                                       │                              ║
║                                       ▼                              ║
║   ┌─────────────────────────────────────────────────────────────┐   ║
║   │  STEP 3 · Generate Summary                                  │   ║
║   │                                                             │   ║
║   │  LOCAL  →  Qwen3:1.7B via Ollama  (qwen-agent Assistant)   │   ║
║   │  CLOUD  →  Gemini 2.5 Flash via REST SSE  (httpx async)    │   ║
║   │                                                             │   ║
║   │  Output format:                                             │   ║
║   │    TL;DR ──────── one-line distillation                     │   ║
║   │    • Point 1 ──── 3–5 core bullets                         │   ║
║   │    • Point 2                                                │   ║
║   │    • Point 3                                                │   ║
║   │    Why it matters ── one sentence on broader relevance      │   ║
║   └───────────────────────────────────┬─────────────────────────┘   ║
║                                       │                              ║
║                                       ▼                              ║
║   ┌─────────────────────────────────────────────────────────────┐   ║
║   │  STEP 4 · quality_check()                                   │   ║
║   │                                                             │   ║
║   │  ✓  word count ≥ 60                                         │   ║
║   │  ✓  no "I cannot" / "as an AI" markers                      │   ║
║   │  ✓  non-empty string                                        │   ║
║   └────────────────┬────────────────────┬────────────────────────┘   ║
║                    │                    │                            ║
║                  PASS                 FAIL                          ║
║                    │                    │                            ║
║                    ▼                    ▼                            ║
║             Stream to UI          Retry Step 3                      ║
║             → MongoDB save        (max 2 attempts)                  ║
║             → [DONE]              → yield anyway with ⚠ prefix      ║
║                                                                      ║
╚══════════════════════════════════════════════════════════════════════╝
```

<br>

---

## ✦ Data Flow

```
╔════════════════╦════════════════╦════════════════╦════════════════╗
║   USER         ║  EXTENSION     ║  BACKGROUND    ║  BACKEND       ║
╠════════════════╬════════════════╬════════════════╬════════════════╣
║                ║                ║                ║                ║
║  clicks icon   ║                ║                ║                ║
║  ─────────────►║                ║                ║                ║
║                ║ executeScript  ║                ║                ║
║                ║ ──────────────►║                ║                ║
║                ║ page text      ║                ║                ║
║                ║ ◄──────────────║                ║                ║
║                ║                ║  POST          ║                ║
║                ║                ║  /summarize    ║                ║
║                ║                ║ ───────────────►                ║
║                ║                ║                ║  ReAct loop    ║
║                ║                ║                ║  runs...       ║
║                ║    [THINKING]  ║                ║                ║
║  badge pulses  ║ ◄──────────────╬────────────────║  SSE stream    ║
║                ║                ║                ║                ║
║                ║    tokens...   ║                ║                ║
║  text renders  ║ ◄──────────────╬────────────────║  streaming...  ║
║  live          ║                ║                ║                ║
║                ║    [DONE]      ║                ║                ║
║  copy btn      ║ ◄──────────────╬────────────────║                ║
║  appears       ║                ║                ║  save →        ║
║                ║                ║                ║  MongoDB ✓     ║
╚════════════════╩════════════════╩════════════════╩════════════════╝
```

<br>

---

## ✦ SSE Control Tokens

```
  Backend emits                  Frontend reacts
  ─────────────────────────────────────────────────────────
  [START]          ──────────►   clear output panel
  [THINKING]       ──────────►   show pulsing "Reasoning...●" badge
  <token>          ──────────►   append character to output
  [DONE]           ──────────►   hide badge · show Copy button · save to DB
  [ERROR] <msg>    ──────────►   show red error banner
```

<br>

---

## ✦ Modes at a Glance

```
╔══════════════════════════════════╦═══════════════════════════════════╗
║   🖥  LOCAL MODE                  ║   ☁  CLOUD MODE                   ║
╠══════════════════════════════════╬═══════════════════════════════════╣
║  Engine   Qwen3 1.7B             ║  Engine   Gemini 2.5 Flash        ║
║  Via      Ollama (localhost)     ║  Via      Google REST API         ║
║  Privacy  100% offline           ║  Privacy  Data leaves device      ║
║  Speed    Hardware-dependent     ║  Speed    Fast, consistent        ║
║  Cost     Free                   ║  Cost     Free tier available     ║
║  Setup    Install Ollama         ║  Setup    Get API key → Settings  ║
╚══════════════════════════════════╩═══════════════════════════════════╝
```

<br>

---

## ✦ Project Structure

```
tldread/
│
├── backend/                    FastAPI + AI Agent
│   ├── app.py                  Routes: /health  /summarize  /recent
│   ├── agent.py                SummarizerAgent — ReAct loop, dual-mode LLM
│   ├── tools.py                extract_content() and quality_check() tools
│   ├── config.py               Ports, model names, Mongo URI
│   ├── db.py                   MongoDB save + fetch layer (PyMongo)
│   ├── requirements.txt        Python dependencies
│   └── run.sh                  One-command install + start
│
├── extension/                  Chrome Extension (Manifest V3)
│   ├── manifest.json           Permissions, side panel, service worker
│   ├── sidepanel.html          Side panel shell
│   ├── sidepanel.css           Styles
│   ├── sidepanel.js            SSE parser, mode toggle, streaming renderer
│   ├── content.js              DOM text extractor (injected per page)
│   ├── background.js           Service worker — setPanelBehavior + messaging
│   └── favicon.png             Extension icon (128×128)
│
├── website/                    Live Summary Dashboard
│   ├── index.html              Dashboard shell
│   ├── style.css               Matches extension design tokens exactly
│   └── app.js                  Polls /recent · renders cards · auto-refresh
│
├── HOW_TO_RUN.md               ⚡ Full setup instructions
└── README.md                   You are here
```

<br>

---

## ✦ Getting Started

> **Full setup instructions → [`HOW_TO_RUN.md`](./HOW_TO_RUN.md)**

```bash
# 1. Start the backend
cd backend && chmod +x run.sh && ./run.sh

# 2. Load the extension
# chrome://extensions → Enable Developer Mode → Load Unpacked → select /extension

# 3. Open any webpage, click the TL;DRead icon, hit ⚡ SUMMARIZE

# 4. View your summary history
# Open /website/index.html in any browser
```

<br>

---

## ✦ Tech Stack

| Layer | Technology | Role |
|---|---|---|
| **Extension** | Chrome MV3, Vanilla JS | Side panel UI, DOM scraping, SSE consumption |
| **Backend** | Python, FastAPI, Uvicorn | API server, streaming, agent orchestration |
| **Local AI** | Ollama + Qwen3 1.7B + qwen-agent | Private on-device inference |
| **Cloud AI** | Gemini 2.5 Flash (REST SSE) | Cloud-based high-speed inference |
| **Database** | MongoDB + PyMongo | Summary persistence and retrieval |
| **Dashboard** | Vanilla HTML / CSS / JS | Real-time summary feed, auto-refresh every 30s |

<br>

---

<div align="center">

built by PPO (chk 👍 🦁)

**[`HOW_TO_RUN.md →`](./HOW_TO_RUN.md)**

</div>