chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });

// Let's implement background listener for popup to request text
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getPageText") {
    // Get active tab and send message to content script
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length === 0) {
        sendResponse({ error: "No active tab" });
        return;
      }
      chrome.tabs.sendMessage(tabs[0].id, { action: "extractText" }, (response) => {
        if (chrome.runtime.lastError) {
          sendResponse({ error: "Cannot extract text from this page (try a normal URL instead of chrome:// tab)." });
        } else {
          sendResponse({ data: response });
        }
      });
    });
    return true; // async response
  }
});
