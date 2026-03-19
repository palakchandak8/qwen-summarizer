# TL;DRead

A neobrutalist Chrome Extension that summarizes any webpage in real-time. It supports both a local, private model (Qwen via Ollama) and a cloud-based model (Google Gemini).

## Architecture

```text
┌─────────────────┐       ┌──────────────────────┐
│                 │ POST  │                      │
│ Chrome Extension├──────►│ FastAPI Backend      │
│ (Neobrutalist)  │◄──────┤ (ReAct Streaming)    │
│                 │ SSE   │                      │
└─────────────────┘       └──────┬───────┬───────┘
                                 │       │
                        LOCAL    │       │ CLOUD
                       (Ollama)  ▼       ▼ (Gemini API)
                    ┌────────────┐   ┌────────────┐
                    │ Qwen3:1.7b │   │ Gemini-1.5 │
                    └────────────┘   └────────────┘
```

## Setup & Running

### LOCAL Mode
1. **Install Ollama**: Download from [ollama.com](https://ollama.com) and ensure it's running.
2. **Pull the Model**: Run `ollama run qwen3:1.7b` to download the model.
3. **Start Backend**: 
   ```bash
   cd backend
   chmod +x run.sh
   ./run.sh
   ```
4. **Load Extension**:
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked" and select the `extension/` folder
5. Click the extension icon and select LOCAL mode.

### CLOUD Mode
1. **Get API Key**: Obtain a free Gemini API key from [Google AI Studio](https://aistudio.google.com/).
2. **Start Backend**: (Same as above, Ollama is not required for cloud mode).
3. **Configure Extension**:
   - Open the extension settings (⚙ icon)
   - Switch to **CLOUD** mode
   - Paste your Gemini API key and hit **SAVE SETTINGS**.

## File Structure

| Directory/File | Description |
|---|---|
| `backend/` | Contains the FastAPI application and agent ReAct loop logic. |
| `backend/app.py` | FastAPI application, handles routing and streaming response. |
| `backend/agent.py` | Implementation of `SummarizerAgent` for both local and cloud modes. |
| `backend/tools.py` | Tools used by the ReAct agent (`extract_content`, `quality_check`). |
| `backend/config.py` | Application configuration. |
| `extension/` | Chrome extension files (Neobrutalist UI). |
| `extension/manifest.json` | Extension manifest file. |
| `extension/popup.html` | User interface structure. |
| `extension/popup.css` | Neobrutalist design implementation. |
| `extension/popup.js` | Extension logic and streaming parser. |
| `extension/content.js` | Extracts webpage text. |
| `extension/background.js` | Service worker for messaging. |

## Troubleshooting

- **Ollama Unreachable (`⚠ Ollama not detected`)**: Ensure the Ollama app is running in the background and listening on `http://localhost:11434`. By default, Ollama only allows local connections which is correct for this project.
- **Gemini API Errors**: Make sure your API key is correct and valid. Errors like 403 or quota exceeded will be streamed back and shown in red.
