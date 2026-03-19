# How to Run the Qwen + Gemini Web Summarizer

Follow these step-by-step instructions to get both the backend and the Chrome Extension running locally on your machine.

---

## Part 1: Start the Backend Server

The backend acts as the bridge that connects the Chrome extension to either the local Ollama Qwen model or the cloud-based Gemini API.

1. **Open your Terminal** and navigate to the `backend` folder:
   ```bash
   cd /Users/mac/Desktop/qwen-summarizer/qwen-web-summarizer/backend
   ```

2. **Run the startup script**:
   ```bash
   ./run.sh
   ```
   *Note: This script will automatically install all the required Python libraries using pip, and then it will start the FastAPI server on port `7864`.*
   
   If everything succeeds, you should see a message in the terminal saying the `uvicorn` server is running on `http://127.0.0.1:7864`. Keep this terminal window open!

---

## Part 2: (Optional) Prepare Local Mode (Ollama)

If you plan to use the **LOCAL** mode feature (which processes everything privately on your computer), make sure Ollama is set up.

1. Install **Ollama** from [ollama.com](https://ollama.com/) if you haven't already.
2. Open a new Terminal window and download the target model by running:
   ```bash
   ollama run qwen3:1.7b
   ```
   *Note: You only need to let this download once. After it succeeds, you can close that prompt. Ensure the Ollama app itself is running in your Mac's menu bar.*

---

## Part 3: Install the Chrome Extension

Now we'll load the extension into your browser.

1. Open **Google Chrome**.
2. Type `chrome://extensions/` into your address bar and press **Enter**.
3. In the top right corner of the Extensions page, turn on the **Developer mode** toggle.
4. Click the newly appeared **Load unpacked** button in the top left.
5. In the file picker, select the `extension` folder located at:
   `/Users/mac/Desktop/qwen-summarizer/qwen-web-summarizer/extension`
6. You should now see the "Web Summarizer — Qwen + Gemini" extension in your list, and the puzzle piece/icon will appear in your Chrome toolbar.

---

## Part 4: Use the Summarizer

1. Navigate to any webpage you want to summarize (e.g., a news article or a blog post).
2. Click the **Web Summarizer** icon in your Chrome toolbar.
3. **Choose your Mode**:
   - The extension defaults to **LOCAL (Qwen3)**.
   - To use Gemini, click the **⚙ SETTINGS** gear icon. Select **CLOUD — Gemini**.
   - *(Your Gemini API key has already been pre-loaded into the extension!)*
4. Click the big **⚡ SUMMARIZE THIS PAGE** button.
5. The extension will scrape the page, stream the reasoning, and give you a beautiful set of summarized bullet points in real time!
