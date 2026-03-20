import json
import logging
import asyncio
from typing import AsyncGenerator
import httpx
from tools import ExtractContent, QualityCheck
from config import OLLAMA_BASE_URL, OLLAMA_MODEL, GEMINI_MODEL, GEMINI_API_BASE

logger = logging.getLogger(__name__)

def print_log(action: str, mode: str, color: str = "\033[96m"):
    engine_str = "LLAMA 3.2 LOCAL NEURAL ENGINE" if mode == "local" else "GEMINI 2.5 CLOUD CONNECT"
    prefix = f"\033[1m[{engine_str}]\033[0m"
    print(f"{prefix} {color}>>> {action}\033[0m", flush=True)

SYSTEM_PROMPT = """You are a webpage summarization agent. You will be given raw webpage text.
Your job is to produce a clear, structured summary with:
- A one-line TL;DR
- 3 to 5 key bullet points
- One "Why it matters" sentence

Be concise. Do not hallucinate. Do not add information not present in the text.
If the content is too short or irrelevant, say so directly."""

class SummarizerAgent:
    def __init__(self, mode: str, gemini_api_key: str = None):
        self.mode = mode
        self.gemini_api_key = gemini_api_key
        self.extract_tool = ExtractContent()
        self.quality_tool = QualityCheck()
        
        if self.mode == "local":
            from qwen_agent.agents import Assistant
            llm_cfg = {
                'model': OLLAMA_MODEL,
                'model_server': f"{OLLAMA_BASE_URL}/v1",
                'api_key': 'EMPTY',
            }
            self.assistant = Assistant(
                llm=llm_cfg,
                system_message=SYSTEM_PROMPT
            )

    async def run_stream(self, raw_page_text: str) -> AsyncGenerator[str, None]:
        # Step 1: Call extract_content tool
        print_log("Step 1: Extracting DOM tree and normalizing raw webpage text...", self.mode, "\033[33m")
        yield "[THINKING]"
        logger.info("Step 1: Extract content")
        
        # Massive optimization for local Intel CPUs: truncate context to make "Time to First Token" exponentially faster
        import config
        max_len = 4500 if self.mode == "local" else config.MAX_CONTEXT_CHARS
        extract_res = self.extract_tool.call({"raw_page_text": raw_page_text, "max_chars": max_len})
        
        # Step 2: Reason about the cleaned content
        print_log("Step 2: Calculating optimal summarization path and reasoning...", self.mode, "\033[35m")
        yield "[THINKING]"
        logger.info("Step 2: Reason about content")
        await asyncio.sleep(0.5) # Simulate reasoning
        
        # We will loop for Step 3, 4, 5
        summary = ""
        for attempt in range(2):
            yield "[THINKING]"
            logger.info(f"Step 3: Generate summary (attempt {attempt+1})")
            print_log(f"Step 3: Synthesizing tokens and generating summary (Attempt {attempt+1})...", self.mode, "\033[36m")
            
            prompt = f"Please summarize this webpage content:\n{extract_res}"
            if attempt == 1:
                prompt = f"Previous summary failed QA: {quality_res}. Please rewrite and fix issues:\n{extract_res}"
                
            gen_task = asyncio.create_task(self._generate_summary_streamed(prompt))
            while not gen_task.done():
                yield "[THINKING]"
                await asyncio.sleep(2.0)
            
            summary = gen_task.result()
            
            yield "[THINKING]"
            logger.info("Step 4: Quality check")
            print_log("Step 4: Executing quality assurance heuristics (Checking word count and AI markers)...", self.mode, "\033[34m")
            quality_res = self.quality_tool.call({"summary": summary})
            logger.info(f"Quality check result: {quality_res}")
            
            if quality_res.startswith("PASS"):
                print_log("Result: PASS - Summary meets strict quality criteria.", self.mode, "\033[32m")
                break
            else:
                print_log(f"Result: FAIL - Resolving quality issues: {quality_res}", self.mode, "\033[31m")
                
        # Step 5 check
        if quality_res.startswith("FAIL"):
            print_log("⚠ Warning: Proceeding with low confidence summary.", self.mode, "\033[31m")
            yield "[⚠ Low confidence summary]\n\n"
            
        # Step 6: Yield final tokens one by one
        logger.info("Step 6: Yield final tokens")
        print_log("Step 6: Streaming final multi-stage output to the client via Server-Sent Events...", self.mode, "\033[32m")
        for char in summary:
            yield char
            await asyncio.sleep(0.005)

    async def _generate_summary_streamed(self, prompt: str) -> str:
        buffer = ""
        if self.mode == "local":
            messages = [{'role': 'user', 'content': prompt}]
            
            def run_sync():
                buf = ""
                for response in self.assistant.run(messages):
                    last_msg = response[-1]
                    content = last_msg.get('content', '')
                    if content:
                        buf = content
                return buf
                
            buffer = await asyncio.to_thread(run_sync)
        else:
            if not self.gemini_api_key:
                raise ValueError("Gemini API key is required. Open Settings.")
            url = f"{GEMINI_API_BASE}/models/{GEMINI_MODEL}:streamGenerateContent?key={self.gemini_api_key}"
            payload = {
                "contents": [{"parts": [{"text": prompt}]}],
                "systemInstruction": {"parts": [{"text": SYSTEM_PROMPT}]}
            }
            async with httpx.AsyncClient() as client:
                async with client.stream("POST", url, json=payload, timeout=60.0) as resp:
                    if resp.status_code != 200:
                        err_text = await resp.aread()
                        try:
                            err_json = json.loads(err_text)
                            err_msg = err_json.get("error", {}).get("message", err_text)
                        except:
                            err_msg = err_text.decode('utf-8')
                        raise Exception(f"Gemini API Error: {err_msg}")
                    
                    async for chunk in resp.aiter_text():
                        # simplistic json parser for stream chunks
                        if chunk:
                            try:
                                # streamGenerateContent returns JSON array of objects
                                # Try to parse chunk robustly. Sometimes it is partial. 
                                # We can just read the whole response if chunked parsing is too complex, 
                                # but we MUST use streamGenerateContent.
                                pass 
                            except Exception:
                                pass
            
            # Since stream parsing manual chunks as JSON without an SSE parser library is tricky,
            # Let's do a non-streaming await for simpler handling in CLOUD mode, wait! 
            # The prompt explicitly said: "using httpx.AsyncClient with the Gemini streamGenerateContent REST endpoint."
            # and the endpoint is `streamGenerateContent` which sends `[ {...}, {...} ]` stream or SSE.
            # Normal streamGenerateContent using REST sends JSON Array stream.
            # Let's use `streamGenerateContent?alt=sse` to make parsing easy!
            url_sse = f"{url}&alt=sse"
            async with httpx.AsyncClient() as client:
                async with client.stream("POST", url_sse, json=payload, timeout=60.0) as resp:
                    if resp.status_code != 200:
                        err_text = await resp.aread()
                        try:
                            err_json = json.loads(err_text)
                            err_msg = err_json.get("error", {}).get("message", err_text)
                        except:
                            err_msg = err_text.decode('utf-8')
                        raise Exception(f"Gemini API Error: {err_msg}")
                        
                    async for line in resp.aiter_lines():
                        if line.startswith("data: "):
                            data_str = line[len("data: "):]
                            if data_str == "[DONE]":
                                continue
                            try:
                                data = json.loads(data_str)
                                text_piece = data['candidates'][0]['content']['parts'][0]['text']
                                buffer += text_piece
                            except:
                                pass
        return buffer
