// content js
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "extractText") {
    let rawText = document.body.innerText;
    
    // Clean it slightly: trim, collapse 3+ newlines to 2
    rawText = rawText.trim();
    rawText = rawText.replace(/\n{3,}/g, '\n\n');
    
    sendResponse({
      text: rawText,
      charCount: rawText.length
    });
  }
  return true;
});
