document.addEventListener('DOMContentLoaded', function () {
    const serverAddress = '127.0.0.1';
    const port = '7864';
    const btn = document.getElementById('summarizeBtn');
    const output = document.getElementById('output');
    const status = document.getElementById('status');

    btn.addEventListener('click', async () => {
        btn.disabled = true;
        btn.textContent = '⏳ Working...';
        output.textContent = '';
        status.textContent = '🔍 Extracting page content...';

        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

            // TOOL 1: Extract page text using scripting API
            chrome.scripting.executeScript(
                {
                    target: { tabId: tab.id },
                    func: () => {
                        try {
                            return document.body?.innerText || 'EMPTY';
                        } catch (e) {
                            return 'SCRIPT_ERROR';
                        }
                    }
                },
                async (results) => {
                    const pageText = results?.[0]?.result || '';
                    console.log('[TOOL 1] Extracted text preview:', pageText.slice(0, 300));

                    if (pageText === 'SCRIPT_ERROR') {
                        output.textContent = '⚠️ Could not access this page (script error).';
                        resetButton();
                        return;
                    }

                    if (!pageText || pageText.trim() === 'EMPTY') {
                        output.textContent = '⚠️ No readable text found on this page.';
                        resetButton();
                        return;
                    }

                    status.textContent = '🧠 Agent is reasoning and summarizing...';

                    try {
                        // TOOL 2: Send to FastAPI backend for LLM summarization
                        console.log(`[TOOL 2] Sending POST to http://${serverAddress}:${port}/summarize_stream_status`);

                        const res = await fetch(`http://${serverAddress}:${port}/summarize_stream_status`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ content: pageText }),
                        });

                        // Stream tokens as they arrive
                        const reader = res.body.getReader();
                        const decoder = new TextDecoder();
                        let resultText = '';

                        while (true) {
                            const { done, value } = await reader.read();
                            if (done) break;
                            const chunk = decoder.decode(value, { stream: true });
                            resultText += chunk;
                            output.textContent = resultText;
                        }

                        status.textContent = '✅ Summary complete.';
                        console.log('[DONE] Summary streamed successfully');

                    } catch (err) {
                        console.error('[ERROR] Fetch failed:', err);
                        output.textContent = '⚠️ Failed to connect to backend.\n\nMake sure the FastAPI server is running at port 7864.\n\nError: ' + err.message;
                        status.textContent = '❌ Backend connection failed.';
                    }

                    resetButton();
                }
            );

        } catch (err) {
            output.textContent = '⚠️ Extension error: ' + err.message;
            status.textContent = '❌ Error occurred.';
            resetButton();
        }
    });

    function resetButton() {
        btn.disabled = false;
        btn.textContent = '⚡ Summarize This Page';
    }
});