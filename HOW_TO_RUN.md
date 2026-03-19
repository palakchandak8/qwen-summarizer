# How to Run TL;DRead

Follow these step-by-step instructions to get the backend, Chrome extension, and dashboard running locally.

---

## Prerequisites

| Requirement | Purpose |
|---|---|
| **Python 3.10+** | Backend server |
| **Google Chrome** | Extension host |
| **MongoDB** | Summary persistence (optional — app works without it) |
| **Ollama** *(optional)* | Local mode only — runs Qwen3 on your machine |
| **Gemini API Key** *(optional)* | Cloud mode only — free via [Google AI Studio](https://aistudio.google.com/) |

---

## Part 1: Start the Backend Server

The backend is a FastAPI server that handles summarization requests and serves the recent summaries API.

1. **Navigate to the backend directory** in your terminal:
   ```bash
   cd backend
   ```

2. **Make the startup script executable** (first time only):
   ```bash
   chmod +x run.sh
   ```

3. **Run the server**:
   ```bash
   ./run.sh
   ```
   This script will:
   - Create a Python virtual environment (if one doesn't exist)
   - Install all dependencies from `requirements.txt`
   - Generate the favicon (if missing)
   - Start the Uvicorn server on **`http://127.0.0.1:7864`**

   > Keep this terminal window open — the server must stay running.

4. **(Optional) Configure environment variables**: Copy `.env.example` to `.env` and fill in your Gemini API key:
   ```bash
   cp .env.example .env
   # Edit .env and add: GEMINI_API_KEY=your_key_here
   ```

---

## Part 2: Set Up Local Mode (Ollama + Qwen3)

> Skip this if you only plan to use **Cloud mode (Gemini)**.

1. **Install Ollama** from [ollama.com](https://ollama.com/).

2. **Pull the Qwen3 model**:
   ```bash
   ollama run qwen3:1.7b
   ```
   *This downloads the model (~1GB). You only need to do this once.*

3. **Ensure Ollama is running** — look for the Ollama icon in your menu bar. The backend checks `http://localhost:11434` for connectivity.

---

## Part 3: Install the Chrome Extension

1. Open **Google Chrome** and navigate to `chrome://extensions/`.
2. Toggle **Developer mode** ON (top-right corner).
3. Click **Load unpacked**.
4. Select the `extension/` folder from this project.
5. The **TL;DRead** icon will appear in your Chrome toolbar.

---

## Part 4: Launch the Dashboard (Optional)

The website dashboard displays all summaries stored in MongoDB.

1. Make sure **MongoDB** is running locally on port `27017` (default).
2. Open `website/index.html` directly in a browser, or serve it:
   ```bash
   cd website
   python3 -m http.server 8080
   ```
3. Visit `http://localhost:8080` — the dashboard auto-refreshes every 30 seconds.

---

## Part 5: Use TL;DRead

1. Navigate to any webpage you want to summarize.
2. Click the **TL;DRead** icon — a side panel will open.
3. **Choose your mode** via the ⚙ Settings panel:
   - **LOCAL** — Uses Qwen3 via Ollama (fully private, no internet required)
   - **CLOUD** — Uses Gemini 2.5 Flash via Google API
4. Click **⚡ SUMMARIZE PAGE →** and watch the summary stream in real time.
5. Hit **📋 COPY** to copy the summary to your clipboard.

---

## Troubleshooting

| Problem | Solution |
|---|---|
| `⚠ Ollama not detected` | Make sure the Ollama app is running and listening on `http://localhost:11434` |
| `⚠ Backend not reachable` | Ensure the backend server is running (`./run.sh`) on port `7864` |
| Gemini API errors (403, quota) | Verify your API key is correct and has available quota |
| Extension not appearing | Check that you loaded the correct `extension/` folder and Developer mode is ON |
| Dashboard shows "OFFLINE" | Backend must be running — the dashboard polls `http://localhost:7864/recent` |
| MongoDB connection failure | The app logs a warning but continues working — summaries just won't be persisted |
