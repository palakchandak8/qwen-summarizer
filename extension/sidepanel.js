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
  
  const statusLine = document.getElementById("status-line");
  const outputPanel = document.getElementById("output-panel");
  const badgeThinking = document.getElementById("badge-thinking");
  
  let currentMode = "local";
  let thinkInterval = null;
  let abortController = null;
  let streamTimeout = null;

  // Render current mode
  const updateModeUI = (mode) => {
    currentMode = mode;
    if (mode === "local") {
      modeBadge.textContent = "LOCAL MODE";
      toggleLocal.classList.add("active");
      toggleCloud.classList.remove("active");
    } else {
      modeBadge.textContent = "CLOUD MODE";
      toggleLocal.classList.remove("active");
      toggleCloud.classList.add("active");
    }
  };

  // Load setttings
  chrome.storage.local.get(["mode"], (res) => {
    if (res.mode) currentMode = res.mode;
    updateModeUI(currentMode);
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
    statusLine.className = "status-time " + className;
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
    chrome.storage.local.set({
      mode: currentMode
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
        setStatus("Stream timeout (60s)", "status-error");
        stopThinking();
      }
    }, 60000);
  };

  const startThinking = () => {
    badgeThinking.classList.remove("hidden");
  };

  const stopThinking = () => {
    badgeThinking.classList.add("hidden");
  };

  // Summarize logic
  btnSummarize.addEventListener("click", () => {
    btnSummarize.textContent = "SUMMARIZING...";
    btnSummarize.disabled = true;
    outputPanel.innerHTML = "";
    let fullOutputText = "";
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

      const url = pageData.url || "";
      const page_title = pageData.title || "";

      abortController = new AbortController();
      resetTimeout();

      try {
        const fetchRes = await fetch("http://localhost:7864/summarize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content: pageData.text,
            mode: currentMode,
            url: url,
            page_title: page_title
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
                fullOutputText += "[⚠ Low confidence summary]\n\n";
                outputPanel.innerHTML = fullOutputText;
              } else {
                stopThinking(); // Any token hides reasoning badge
                try {
                  // decode JSON char
                  let char = JSON.parse(tokenStr);
                  fullOutputText += char;
                } catch(e) {
                  // Fallback
                  fullOutputText += tokenStr;
                }
                
                let safeHTML = fullOutputText
                    .replace(/&/g, "&amp;")
                    .replace(/</g, "&lt;")
                    .replace(/>/g, "&gt;")
                    .replace(/\*\*(.*?)\*\*/g, '<b class="bold">$1</b>');
                outputPanel.innerHTML = safeHTML;
                outputPanel.scrollTop = outputPanel.scrollHeight;
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
