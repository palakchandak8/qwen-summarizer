const API_BASE = "http://localhost:3000";
const REFRESH_INTERVAL = 30000;

async function fetchSummaries() {
  try {
    const res = await fetch(`${API_BASE}/recent`);
    if (!res.ok) throw new Error("Network error");
    const data = await res.json();
    hideError();
    renderCards(data.summaries || []);
  } catch (e) {
    console.error(e);
    showError();
  }
}

function renderCards(summaries) {
  const grid = document.getElementById("cards-grid");
  const emptyState = document.getElementById("empty-state");
  
  grid.innerHTML = "";
  
  if (summaries.length === 0) {
    emptyState.classList.remove("hidden");
  } else {
    emptyState.classList.add("hidden");
    summaries.forEach(s => {
      grid.appendChild(createCard(s));
    });
  }
}

function createCard(summary) {
  const card = document.createElement("div");
  card.className = "summary-card";
  
  const header = document.createElement("div");
  header.className = "card-header";
  
  const url = document.createElement("div");
  url.className = "card-url";
  url.textContent = summary.url || "Original Page";
  
  const mode = document.createElement("div");
  mode.className = "card-mode";
  mode.textContent = (summary.mode || "LOCAL").toUpperCase();
  if (summary.mode === "cloud") {
    mode.style.color = "var(--pink)";
  } else {
    mode.style.color = "var(--green)";
  }
  
  header.appendChild(url);
  header.appendChild(mode);
  
  const body = document.createElement("div");
  body.className = "card-body";

  const title = document.createElement("div");
  title.className = "card-title";
  title.textContent = summary.page_title || "Untitled Summary";
  
  const sumText = document.createElement("div");
  sumText.className = "card-summary";
  sumText.textContent = summary.summary || "";
  
  body.appendChild(title);
  body.appendChild(sumText);
  
  const footer = document.createElement("div");
  footer.className = "card-footer";
  
  const meta = document.createElement("div");
  meta.className = "card-meta-group";
  
  const dateStr = document.createElement("div");
  dateStr.className = "card-date";
  dateStr.textContent = formatDate(summary.created_at);
  
  const chars = document.createElement("div");
  chars.className = "card-chars";
  chars.textContent = `${(summary.char_count || 0).toLocaleString()} chars`;
  
  meta.appendChild(dateStr);
  meta.appendChild(chars);
  
  const copyBtn = document.createElement("button");
  copyBtn.className = "copy-btn";
  copyBtn.textContent = "COPY";
  copyBtn.onclick = () => copyToClipboard(summary.summary || "", copyBtn);
  
  footer.appendChild(meta);
  footer.appendChild(copyBtn);
  
  card.appendChild(header);
  card.appendChild(body);
  card.appendChild(footer);
  
  return card;
}

function formatDate(isoString) {
  if (!isoString) return "";
  const d = new Date(isoString);
  const month = d.toLocaleString('en-US', { month: 'short' });
  const day = d.getDate();
  const year = d.getFullYear();
  const time = d.toLocaleString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  return `${month} ${day}, ${year} · ${time}`;
}

function copyToClipboard(text, btn) {
  navigator.clipboard.writeText(text).then(() => {
    btn.textContent = "COPIED!";
    setTimeout(() => {
      btn.textContent = "COPY";
    }, 1500);
  });
}

function showError() {
  document.getElementById("error-banner").classList.remove("hidden");
  const badge = document.getElementById("status-badge");
  badge.textContent = "OFFLINE";
  badge.className = "badge badge-offline";
}

function hideError() {
  document.getElementById("error-banner").classList.add("hidden");
  const badge = document.getElementById("status-badge");
  badge.textContent = "LIVE FEED";
  badge.className = "badge badge-live";
}

// On load
fetchSummaries();
setInterval(fetchSummaries, REFRESH_INTERVAL);
