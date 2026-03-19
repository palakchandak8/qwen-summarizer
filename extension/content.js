// Tool 1: Content extraction script
// Listens for messages requesting page text and responds with document body content

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === "GET_PAGE_TEXT") {
        try {
            const bodyText = document.body.innerText.trim();
            console.log('[content.js] Extracted', bodyText.length, 'characters');
            sendResponse({ text: bodyText || null });
        } catch (e) {
            console.error('[content.js] Error extracting text:', e);
            sendResponse({ text: null, error: e.message });
        }
    }
    return true; // Keep message channel open for async response
});