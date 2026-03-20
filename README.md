<div align="center">

<br>

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:0f0c29,50:302b63,100:24243e&height=200&section=header&text=TL%3BDRead&fontSize=80&fontColor=ffffff&fontAlignY=38&desc=Too%20Long%3B%20Didn't%20Read%20—%20So%20We%20Did%20It%20For%20You&descAlignY=60&descSize=18&descColor=a78bfa&animation=fadeIn" width="100%"/>

<br>

<p>
  <img src="https://img.shields.io/badge/-%E2%9A%A1%20AI%20Lab%20%E2%80%94%20CA1-black?style=for-the-badge&labelColor=6d28d9&color=0f0c29"/>
  &nbsp;
  <img src="https://img.shields.io/badge/Chrome-Manifest%20V3-4285F4?style=for-the-badge&logo=googlechrome&logoColor=white"/>
  &nbsp;
  <img src="https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white"/>
  &nbsp;
  <img src="https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white"/>
</p>

<p>
  <img src="https://img.shields.io/badge/Qwen3-Local%20AI-FF6B35?style=for-the-badge"/>
  &nbsp;
  <img src="https://img.shields.io/badge/Gemini%202.5%20Flash-Cloud%20AI-8E75B2?style=for-the-badge&logo=google&logoColor=white"/>
  &nbsp;
  <img src="https://img.shields.io/badge/ReAct-Agentic%20Loop-22c55e?style=for-the-badge"/>
</p>

<br>

> **An AI-powered Chrome Extension that distills any webpage into razor-sharp summaries — in real time.**
> Choose your engine: run 100% **private & local** with Qwen3, or unleash the **cloud** with Gemini 2.5 Flash.

<br>

</div>

---

<br>

## 👥 &nbsp; AI Lab CA1

<br>

| Name | Roll No. | GitHub |
|:---|:---:|:---|
| Palak Chandak | 16010123226 | [@palakchandak8](https://github.com/palakchandak8) |
| Palak Nagar | 16010123227 | [@palak642](https://github.com/palak642) |
| Omik Acharya | 16010123218 | [@OmikAcharya](https://github.com/OmikAcharya) |

<br>

> 🎓 **Guided by:** Prof. Rohini Nair Ma'am

<br>

---
<br>

## 🌌 &nbsp;What Makes TL;DRead Different

<br>

| &nbsp; | Feature | Why It Matters |
|:---:|:---|:---|
| 🔒 | **Privacy First** | Local mode runs entirely on your machine via Ollama — nothing leaves localhost |
| ⚡ | **Real-Time Streaming** | Watch your summary materialize token-by-token through Server-Sent Events |
| 🧠 | **True Agentic Loop** | Not prompt-and-pray — a ReAct agent that extracts, reasons, generates, and self-corrects |
| 🔀 | **Dual Engine** | Flip between local Qwen3 1.7B and cloud Gemini 2.5 Flash with one toggle |
| 📊 | **Live Dashboard** | Every summary persisted to MongoDB and rendered on a real-time web dashboard |
| 🎨 | **Side Panel UI** | A bold Chrome side panel that stays open alongside the page — your full reading room |

<br>

---

<br>

## 🏗️ &nbsp;System Architecture

<br>

```
╔══════════════════════════════════════════════════════════════════════════════════╗
║                         TL;DRead — FULL SYSTEM                                   ║
╠══════════════════════╦════════════════════════════════╦══════════════════════════╣
║   CHROME EXTENSION   ║   FASTAPI BACKEND :7864        ║   INFERENCE LAYER        ║
║                      ║                                ║                          ║
║  ┌───────────────┐   ║  ┌──────────────────────────┐  ║  ┌────────────────────┐  ║
║  │ sidepanel.js  │   ║  │   ReAct Agent Loop       │  ║  │ 🖥 LOCAL           │  ║
║  │ • SSE Reader  │◄──╬──│ • stream tokens          │  ║  │ Ollama + Qwen3:1.7B│  ║
║  │ • Mode Toggle │   ║  │ • ① extract_content()    │  ║  │ localhost:11434    │  ║
║  │ • Settings    │   ║  │ • ② reason + plan        │  ║  │ 100% offline · free│  ║
║  └───────────────┘   ║  │ • ③ generate summary     │  ║  └────────────────────┘  ║
║                      ║  │ • ④ quality_check()      │  ║  ┌────────────────────┐  ║
║  ┌───────────────┐   ║  │     PASS │ FAIL          │  ║  │ ☁ CLOUD           │  ║
║  │ content.js    │   ║  │          └─► retry ×2    │  ║  │ Google Gemini 2.5  │  ║
║  │ • DOM scraper │   ║  │ • ⑤ stream to client     │  ║  │ Flash (SSE REST)   │  ║
║  └───────────────┘   ║  └──────────────────────────┘  ║  │ API key required   │  ║
║                      ║              │ save on [DONE]  ║  └────────────────────┘  ║
║  ┌───────────────┐   ║              ▼                 ╠══════════════════════════╣
║  │ background.js │   ║  ┌──────────────────────────┐  ║ DATABASE                 ║
║  │ • service wkr │   ║  │ MongoDB :27017           │  ║ db  : tldread            ║
║  └──────┬────────┘   ║  │ • url · title · summary  │  ║ col : summaries          ║
╠═════════╪════════════╣  └──────────────────────────┘  ║                          ║
║ POST /summarize ─────╬──────────────────────────────►║                           ║
╠══════════════════════╩═══════════════════════════════╩═══════════════════════════╣
║ WEBSITE DASHBOARD /website ─ polls every 30s ─ summary cards · live feed         ║
╚══════════════════════════════════════════════════════════════════════════════════╝
```

<br>

---

<br>

## 🤖 &nbsp;The ReAct Agent Loop

<br>

```
  DOM TEXT
     │
     ▼
  ┌─────────────────────────────────────────────────────┐
  │  ① extract_content()                                │
  │  Strip noise · dedupe blanks · truncate → 12k chars │
  └───────────────────────┬─────────────────────────────┘
                          │
                          ▼
  ┌─────────────────────────────────────────────────────┐
  │  ② Reason + Plan                                    │
  │  Emits [THINKING] → "Reasoning...●" badge in UI     │
  └───────────────────────┬─────────────────────────────┘
                          │
                          ▼
  ┌─────────────────────────────────────────────────────┐
  │  ③ Generate Summary                                 │
  │  LOCAL  →  Qwen3:1.7B via Ollama                    │
  │  CLOUD  →  Gemini 2.5 Flash via REST SSE            │
  │                                                     │
  │  TL;DR ─── one-line distillation                    │
  │  • 3–5 core bullet points                           │
  │  Why it matters ─── broader relevance               │
  └───────────────────────┬─────────────────────────────┘
                          │
                          ▼
  ┌─────────────────────────────────────────────────────┐
  │  ④ quality_check()                                 │
  │  ✓ word count ≥ 60                                 │
  │  ✓ no "I cannot" / "as an AI" markers              │
  │  ✓ non-empty string                                │
  └──────────┬──────────────────────┬───────────────────┘
           PASS                   FAIL
             │                      │
             ▼                      ▼
      Stream to UI           Retry Step ③
      → MongoDB save         (max 2 attempts)
      → [DONE]               → yield with ⚠ prefix
```

<br>

---

<br>

## ⚙️ &nbsp;SSE Control Tokens

<br>

| Token | Frontend Reaction |
|:---|:---|
| `[START]` | Clear the output panel |
| `[THINKING]` | Show pulsing **"Reasoning...●"** badge |
| `<token>` | Append character to output live |
| `[DONE]` | Hide badge · show **Copy** button · save to MongoDB |
| `[ERROR] <msg>` | Show red error banner |

<br>

---

<br>

## 🖥️ vs ☁️ &nbsp;Modes at a Glance

<br>

| | 🖥️ Local Mode | ☁️ Cloud Mode |
|:---|:---|:---|
| **Engine** | Qwen3 1.7B | Gemini 2.5 Flash |
| **Via** | Ollama (localhost) | Google REST API |
| **Privacy** | 100% offline | Data leaves device |
| **Speed** | Hardware-dependent | Fast & consistent |
| **Cost** | Free | Free tier available |
| **Setup** | Install Ollama | Get API key → Settings |

<br>

---

<br>

## 📁 &nbsp;Project Structure

<br>

```
tldread/
│
├── 🐍 backend/
│   ├── app.py            Routes: /health  /summarize  /recent
│   ├── agent.py          SummarizerAgent — ReAct loop, dual-mode LLM
│   ├── tools.py          extract_content() and quality_check()
│   ├── config.py         Ports, model names, Mongo URI
│   ├── db.py             MongoDB save + fetch layer (PyMongo)
│   ├── requirements.txt  Python dependencies
│   └── run.sh            One-command install + start
│
├── 🧩 extension/
│   ├── manifest.json     Permissions, side panel, service worker
│   ├── sidepanel.html    Side panel shell
│   ├── sidepanel.css     Styles
│   ├── sidepanel.js      SSE parser, mode toggle, streaming renderer
│   ├── content.js        DOM text extractor (injected per page)
│   ├── background.js     Service worker — setPanelBehavior + messaging
│   └── favicon.png       Extension icon (128×128)
│
├── 🌐 website/
│   ├── index.html        Dashboard shell
│   ├── style.css         Matches extension design tokens exactly
│   └── app.js            Polls /recent · renders cards · auto-refresh
│
├── HOW_TO_RUN.md         ⚡ Full setup instructions
└── README.md             You are here
```

<br>

---

<br>

## 🚀 &nbsp;Getting Started

<br>

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

<br>

## 🛠️ &nbsp;Tech Stack

<br>

| Layer | Technology | Role |
|:---|:---|:---|
| **Extension** | Chrome MV3 · Vanilla JS | Side panel UI, DOM scraping, SSE consumption |
| **Backend** | Python · FastAPI · Uvicorn | API server, streaming, agent orchestration |
| **Local AI** | Ollama · Qwen3 1.7B · qwen-agent | Private on-device inference |
| **Cloud AI** | Gemini 2.5 Flash (REST SSE) | Cloud-based high-speed inference |
| **Database** | MongoDB · PyMongo | Summary persistence and retrieval |
| **Dashboard** | Vanilla HTML / CSS / JS | Real-time summary feed, auto-refresh every 30s |

<br>

---


<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:24243e,50:302b63,100:0f0c29&height=120&section=footer" width="100%"/>

<br>

*built with 💜 by PPO*

</div>
