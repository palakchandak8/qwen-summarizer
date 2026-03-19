document.addEventListener("DOMContentLoaded", () => {
  const mainView = document.getElementById("main-view");
  const settingsView = document.getElementById("settings-view");
  const btnSettings = document.getElementById("btn-settings");
  const btnBack = document.getElementById("btn-back");
  const btnSummarize = document.getElementById("btn-summarize");
  const btnCopy = document.getElementById("btn-copy");
  const btnSave = document.getElementById("btn-save");
  
  const modeBadge = document.getElementById("mode-badge");
  const mainHeader = document.getElementById("main-header");
  
  const toggleLocal = document.getElementById("mode-local");
  const toggleCloud = document.getElementById("mode-cloud");
  const geminiKeyGroup = document.getElementById("gemini-key-group");
  const inputApiKey = document.getElementById("input-api-key");
  
  const statusLine = document.getElementById("status-line");
  const outputPanel = document.getElementById("output-panel");
  const badgeThinking = document.getElementById("badge-thinking");
  
  let currentMode = "local";
  let geminiApiKey = "";
  let thinkInterval = null;
  let abortController = null;
  let streamTimeout = null;

  // Render current mode
  const updateModeUI = (mode) => {
    currentMode = mode;
    if (mode === "local") {
      modeBadge.textContent = "LOCAL▼";
      modeBadge.style.backgroundColor = "#B8FF57";
      mainHeader.className = "header green-bg";
      toggleLocal.classList.add("active");
      toggleCloud.classList.remove("active");
      geminiKeyGroup.classList.add("hidden");
    } else {
      modeBadge.textContent = "CLOUD▼";
      modeBadge.style.backgroundColor = "#FF6BFF";
      mainHeader.className = "header pink-bg";
      toggleLocal.classList.remove("active");
      toggleCloud.classList.add("active");
      geminiKeyGroup.classList.remove("hidden");
    }
  };

  // Load setttings
  chrome.storage.local.get(["mode", "geminiApiKey"], (res) => {
    if (res.mode) currentMode = res.mode;
    if (res.geminiApiKey) geminiApiKey = res.geminiApiKey;
    updateModeUI(currentMode);
    inputApiKey.value = geminiApiKey;
    checkHealth();
  });

  // Health check
  const checkHealth = async () => {
    try {
      const res = await fetch("http://localhost:7864/health");
      const data = await res.json();
      if (!data.ollama_reachable && currentMode === "local") {
        setStatus("⚠ Ollama not detected. Switch to CLOUD mode or start Ollama.", "status-warning");
      }
    } catch (e) {
      if (currentMode === "local") {
        setStatus("⚠ Backend/Ollama not reachable.", "status-warning");
      }
    }
  };

  const setStatus = (msg, className = "") => {
    statusLine.textContent = msg;
    statusLine.className = "status-line " + className;
  };

  // Navigation
  btnSettings.addEventListener("click", () => {
    mainView.classList.add("hidden");
    settingsView.classList.remove("hidden");
  });
  
  btnBack.addEventListener("click", () => {
    settingsView.classList.add("hidden");
    mainView.classList.remove("hidden");
    checkHealth();
  });

  // Settings logic
  toggleLocal.addEventListener("click", () => updateModeUI("local"));
  toggleCloud.addEventListener("click", () => updateModeUI("cloud"));
  
  btnSave.addEventListener("click", () => {
    geminiApiKey = inputApiKey.value.trim();
    chrome.storage.local.set({
      mode: currentMode,
      geminiApiKey: geminiApiKey
    }, () => {
      btnSave.textContent = "SAVED!";
      setTimeout(() => btnSave.textContent = "SAVE SETTINGS", 1000);
    });
  });

  // copy
  btnCopy.addEventListener("click", () => {
    navigator.clipboard.writeText(outputPanel.innerText);
    btnCopy.textContent = "COPIED!";
    setTimeout(() => btnCopy.textContent = "📋 COPY", 2000);
  });

  const resetTimeout = () => {
    if (streamTimeout) clearTimeout(streamTimeout);
    streamTimeout = setTimeout(() => {
      if (abortController) {
        abortController.abort();
        setStatus("Stream timeout (15s)", "status-error");
        stopThinking();
      }
    }, 15000);
  };

  const startThinking = () => {
    badgeThinking.classList.remove("hidden");
    const dot = document.getElementById("thinking-dot");
    let visible = true;
    thinkInterval = setInterval(() => {
      visible = !visible;
      dot.style.opacity = visible ? "1" : "0";
    }, 500);
  };

  const stopThinking = () => {
    badgeThinking.classList.add("hidden");
    if (thinkInterval) {
      clearInterval(thinkInterval);
      thinkInterval = null;
    }
  };

  // Summarize logic
  btnSummarize.addEventListener("click", () => {
    // validations
    if (currentMode === "cloud" && !geminiApiKey) {
      setStatus("Gemini API key required. Open Settings.", "status-error");
      return;
    }

    btnSummarize.textContent = "SUMMARIZING...";
    btnSummarize.disabled = true;
    outputPanel.textContent = "";
    btnCopy.classList.add("hidden");
    stopThinking();

    chrome.runtime.sendMessage({ action: "getPageText" }, async (response) => {
      if (response && response.error) {
        setStatus(response.error, "status-error");
        endSummarize();
        return;
      }
      
      const pageData = response.data;
      if (!pageData || !pageData.text || pageData.text.length < 200) {
        setStatus("This page doesn't have enough content to summarize.", "status-error");
        endSummarize();
        return;
      }

      setStatus(`Page: ${pageData.charCount.toLocaleString()} chars extracted`);

      abortController = new AbortController();
      resetTimeout();

      try {
        const fetchRes = await fetch("http://localhost:7864/summarize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content: pageData.text,
            mode: currentMode,
            gemini_api_key: geminiApiKey
          }),
          signal: abortController.signal
        });

        if (!fetchRes.ok) {
          throw new Error("Backend connection failed.");
        }

        const reader = fetchRes.body.getReader();
        const decoder = new TextDecoder("utf-8");
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          resetTimeout();
          buffer += decoder.decode(value, { stream: true });
          
          let lines = buffer.split("\n\n");
          buffer = lines.pop(); // last partial line
          
          for (let line of lines) {
            if (line.startsWith("data: ")) {
              let tokenStr = line.substring(6);
              
              if (tokenStr === "[START]") {
                // start
              } else if (tokenStr === "[THINKING]") {
                startThinking();
              } else if (tokenStr === "[DONE]") {
                stopThinking();
                btnCopy.classList.remove("hidden");
              } else if (tokenStr.startsWith("[ERROR]")) {
                let errMsg = tokenStr.substring(7).trim();
                setStatus(errMsg, "status-error");
                stopThinking();
              } else if (tokenStr.startsWith("[⚠ Low confidence summary]")) {
                outputPanel.textContent += "[⚠ Low confidence summary]\n\n";
              } else {
                stopThinking(); // Any token hides reasoning badge
                try {
                  // decode JSON char
                  let char = JSON.parse(tokenStr);
                  outputPanel.textContent += char;
                  outputPanel.scrollTop = outputPanel.scrollHeight;
                } catch(e) {
                  // Fallback
                  outputPanel.textContent += tokenStr;
                  outputPanel.scrollTop = outputPanel.scrollHeight;
                }
              }
            }
          }
        }
      } catch (err) {
        if (err.name !== "AbortError") {
          setStatus(err.message, "status-error");
          stopThinking();
        }
      } finally {
        endSummarize();
      }
    });

  });

  const endSummarize = () => {
    btnSummarize.textContent = "⚡ SUMMARIZE THIS PAGE";
    btnSummarize.disabled = false;
    if (streamTimeout) clearTimeout(streamTimeout);
  };
});
