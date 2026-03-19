import re
from qwen_agent.tools.base import BaseTool, register_tool

@register_tool("extract_content")
class ExtractContent(BaseTool):
    description = "Cleans and truncates raw webpage content."
    parameters = [{
        "name": "raw_page_text",
        "type": "string",
        "description": "Raw text string extracted from the webpage",
        "required": True
    }]

    def call(self, params: str, **kwargs) -> str:
        # In newer qwen_agent versions, params may come as dict
        if isinstance(params, dict):
            raw_text = params.get("raw_page_text", "")
        else:
            raw_text = params
            
        # Clean excessive whitespace
        lines = [line.strip() for line in raw_text.split('\n')]
        # Remove lines under 20 chars
        lines = [line for line in lines if len(line) >= 20]
        # Deduplicate blank lines using re
        cleaned_text = '\n'.join(lines)
        cleaned_text = re.sub(r'\n{2,}', '\n\n', cleaned_text).strip()
        
        # Truncate to MAX_CONTEXT_CHARS
        from config import MAX_CONTEXT_CHARS
        cleaned_text = cleaned_text[:MAX_CONTEXT_CHARS]
        
        return f"[CONTENT: {len(cleaned_text)} chars]\n{cleaned_text}"

@register_tool("quality_check")
class QualityCheck(BaseTool):
    description = "Checks the quality of the generated summary."
    parameters = [{
        "name": "summary",
        "type": "string",
        "description": "The generated summary text",
        "required": True
    }]

    def call(self, params: str, **kwargs) -> str:
        if isinstance(params, dict):
            summary = params.get("summary", "")
        else:
            summary = params
            
        if not summary:
            return "FAIL: Summary is empty"
            
        words = summary.split()
        if len(words) < 60:
            return f"FAIL: Word count is {len(words)}, expected >= 60"
            
        lower_summary = summary.lower()
        if "i cannot" in lower_summary:
            return "FAIL: Contains 'I cannot'"
        if "as an ai" in lower_summary:
            return "FAIL: Contains 'as an AI'"
            
        return f"PASS: {summary}"
