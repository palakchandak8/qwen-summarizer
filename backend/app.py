import re
from fastapi import FastAPI
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from qwen_agent.agents import Assistant
import logging

# Setup logging so you can see agent trace in terminal
logging.basicConfig(
    level=logging.INFO,
    format='[%(asctime)s] %(message)s'
)

app = FastAPI()

class RequestData(BaseModel):
    content: str

# Initialize the Qwen-Agent Assistant
bot = Assistant(
    llm={
        "model": "qwen3:1.7b",
        "model_server": "http://localhost:11434/v1",
        "api_key": "EMPTY"
    },
    system_message=(
        "You are a summarization assistant. "
        "Directly output the cleaned summary of the given text "
        "without any reasoning, self-talk, thoughts, or internal planning steps. "
        "Do not include phrases like 'I think', 'maybe', 'let's', "
        "'the user wants', or anything not part of the final summary. "
        "Your output must look like it was written by an editor, not a model."
    )
)

@app.post("/summarize_stream_status")
async def summarize_stream_status(data: RequestData):
    user_input = data.content

    def stream():
        try:
            # AGENT LOG — Step 1
            logging.info("[TOOL 1] Content received from Chrome Extension")
            logging.info(f"[OBS]    Text length: {len(user_input)} characters")
            yield "🔍 Reading content on website...\n"

            print("Received text preview:", user_input[:200])

            messages = [
                {
                    "role": "system",
                    "content": (
                        "You are a summarization assistant. "
                        "Directly output the cleaned summary of the given text "
                        "without any reasoning, self-talk, thoughts, or internal "
                        "planning steps. Do not include phrases like 'I think', "
                        "'maybe', 'let's', 'the user wants', or anything not part "
                        "of the final summary. Your output must look like it was "
                        "written by an editor, not a model."
                    )
                },
                {
                    "role": "user",
                    "content": (
                        "<nothink>\n"
                        "Summarize the following text clearly and concisely. "
                        "Do not include any internal thoughts, planning, or reasoning. "
                        "Just return the final summary:\n\n"
                        + user_input
                        + "\n</nothink>"
                    )
                }
            ]

            # AGENT LOG — Step 2
            logging.info("[THINK]  Agent reasoning: text sufficient, invoking Tool 2")
            logging.info("[TOOL 2] Calling Qwen3:1.7B via Ollama for summarization")
            yield "🧠 Generating summary...\n"

            result = bot.run(messages)
            result_list = list(result)

            print("Raw result:", result_list)

            # Extract the final content from agent output
            last_content = None
            for item in reversed(result_list):
                if isinstance(item, list):
                    for subitem in reversed(item):
                        if isinstance(subitem, dict) and "content" in subitem:
                            last_content = subitem["content"]
                            break
                if last_content:
                    break

            if not last_content:
                logging.warning("[WARN]   No valid summary content found in response")
                yield "⚠️ No valid summary found.\n"
                return

            # Clean up model output — remove <think> tags and extra whitespace
            summary = re.sub(r"</?think>", "", last_content)
            summary = re.sub(
                r"(?s)^.*?(Summary:|Here's a summary|The key points are|"
                r"Your tutorial|This tutorial|To summarize|Final summary:)",
                "",
                summary,
                flags=re.IGNORECASE
            )
            summary = re.sub(r"\n{3,}", "\n\n", summary)
            summary = summary.strip()

            # AGENT LOG — Final
            logging.info(f"[FINAL]  Summary generated: {len(summary.split())} words")
            logging.info("[DONE]   Streaming summary to Chrome Extension")

            yield "\n📄 Summary:\n" + summary + "\n"

        except Exception as e:
            logging.error(f"[ERROR]  {str(e)}")
            print("Error:", e)
            yield f"\n⚠️ Error: {str(e)}\n"

    return StreamingResponse(stream(), media_type="text/plain")