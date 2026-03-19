chrome.action.onClicked.addListener((tab) => {
  if (tab.id) {
    chrome.tabs.sendMessage(tab.id, { action: "extractText" }, (response) => {
      if (chrome.runtime.lastError) {
        // Injection failed or content script not present (e.g., chrome:// url)
        console.error(chrome.runtime.lastError);
      } else if (response) {
        // Forward back to popup? Actually the spec says:
        // "Listen for the extension icon click -> send {action: "extractText"} -> Forward the result back to popup.js"
        // Wait, the popup handles its own clicking!
        // "On 'Summarize' button click: Request page text from background.js"
        // Wait, the spec says:
        // "background.js: Listen for the extension icon click, On click, send {action: "extractText"}... Forward the result back to popup.js"
        // But popup.js says: "On 'Summarize' button click: Request page text from background.js"
        // Actually, if a popup is active, clicking the extension icon inside the chrome toolbar just opens the popup. The Background script isn't triggered by icon click if popup is defined.
        // What it probably meant is the popup asks background, or popup asks content script directly. I will implement a listener in background so popup can message it.
      }
    });
  }
});

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
