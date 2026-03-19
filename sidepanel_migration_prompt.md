# ONE-SHOT PROMPT
# Migrate Chrome Extension from Popup to Side Panel

---

**Read this file completely before writing a single line of code. Follow it exactly, in order, with no deviations. Do not ask questions.**

---

## WHAT CHANGES

Replace the popup entirely with a Chrome Side Panel. The side panel opens alongside the page (not over it), giving full vertical space for summaries. Everything else — backend, agent, tools, streaming logic — stays identical.

---

## FILE CHANGES

**Remove:**
- `popup.html`
- `popup.css`
- `popup.js`

**Add:**
- `sidepanel.html`
- `sidepanel.css`
- `sidepanel.js`

**Update:**
- `manifest.json`
- `background.js`

---

## manifest.json

Remove the `"action"` key entirely. Add:

```json
{
  "side_panel": {
    "default_path": "sidepanel.html"
  },
  "permissions": ["activeTab", "scripting", "storage", "sidePanel"]
}
```

Full updated permissions array must be: `["activeTab", "scripting", "storage", "sidePanel"]`

---

## background.js

Remove any popup-related click handler. Replace with:

```javascript
chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
```

This makes clicking the extension icon open/close the side panel automatically. No other changes to background.js.

---

## sidepanel.html + sidepanel.css + sidepanel.js

Identical behavior and logic to the old popup, with these layout changes:

**Dimensions:** Width is `100%` of the side panel container (Chrome sets this, do not hardcode width). Min-width `360px`. Height is `100vh`. The panel must fill the entire available vertical space.

**Layout — top to bottom, full height flex column:**

```
┌─────────────────────────────────┐
│  ██ WEB SUMMARIZER  [⚙] [MODE] │  ← Header, yellow bg, fixed at top
├─────────────────────────────────┤
│  [ ⚡ SUMMARIZE THIS PAGE ]     │  ← Full width chunky button
├─────────────────────────────────┤
│  Page: 4,821 chars extracted    │  ← Status line, monospace
├─────────────────────────────────┤
│                                 │
│  OUTPUT PANEL                   │
│  [Reasoning...●]                │  ← flex-grow: 1, fills all
│                                 │    remaining vertical space,
│  TL;DR: ...text streams here... │    overflow-y: auto
│  • Bullet point one             │
│  • Bullet point two             │
│  • Bullet point three           │
│  Why it matters: ...            │
│                                 │
├─────────────────────────────────┤
│  [ 📋 COPY ]                    │  ← Fixed at bottom, only after DONE
└─────────────────────────────────┘
```

**Critical layout rules:**
- Use `display: flex; flex-direction: column; height: 100vh` on the body
- Output panel must have `flex: 1; overflow-y: auto` so it stretches to fill all space between the button and the copy footer
- Header and copy button are `flex-shrink: 0` — they never compress
- Remove any `max-height` that was on the old popup output panel — there is no height cap now, the panel itself scrolls

**Settings view** replaces the main content (same as before) when gear icon is clicked. It must also be full height, same flex column structure.

**All existing UI styles carry over without exception** — preserve all borders, shadows, colors, fonts, and button styles exactly as they are in your current implementation.

---

## BEHAVIOR — NO CHANGES

All streaming logic, SSE parsing, `[START]` `[THINKING]` `[DONE]` `[ERROR]` handling, health check on open, edge cases, chrome.storage.local persistence — all identical to the original popup implementation. Just copy the logic from `popup.js` into `sidepanel.js` and update DOM selectors to match the new HTML.

---

## CHECKLIST

- [ ] `manifest.json` has `side_panel` key and `sidePanel` permission
- [ ] `background.js` uses `setPanelBehavior` — no popup references remain
- [ ] `popup.html`, `popup.css`, `popup.js` are deleted
- [ ] Output panel uses `flex: 1` and fills all vertical space
- [ ] No hardcoded `max-height` on the output panel
- [ ] All existing UI styles intact and unchanged
- [ ] All streaming and edge case logic carried over exactly
- [ ] Settings panel is also full-height flex layout

---

Do not modify any backend files. Do not ask questions. Make only the changes described above.
