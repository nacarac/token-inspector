const activateBtn = document.getElementById('activate-btn');
const deactivateBtn = document.getElementById('deactivate-btn');
const exportBtn = document.getElementById('export-btn');
const statusEl = document.getElementById('status');
const fileInput = document.getElementById('file-input');
const pasteBtn = document.getElementById('paste-btn');
const pasteArea = document.getElementById('paste-area');
const importBtn = document.getElementById('import-btn');
const importStatus = document.getElementById('import-status');

let currentTabId = null;
let isActive = false;
let pendingImportData = null;

chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
  if (tabs[0]) currentTabId = tabs[0].id;
});

// ---- Activate / Deactivate ----

activateBtn.addEventListener('click', () => {
  if (!currentTabId) return;
  activateBtn.disabled = true;
  setStatus('Scanning page\u2026', '');

  chrome.runtime.sendMessage(
    { type: 'ACTIVATE_TAB', tabId: currentTabId, importedTokens: pendingImportData },
    response => {
      if (response?.ok) {
        isActive = true;
        deactivateBtn.disabled = false;
        exportBtn.disabled = false;
        setStatus('Inspecting\u2026', 'active');
      } else {
        activateBtn.disabled = false;
        setStatus(response?.error || 'Failed to activate', 'error');
      }
    }
  );
});

deactivateBtn.addEventListener('click', () => {
  if (!currentTabId) return;
  chrome.runtime.sendMessage({ type: 'DEACTIVATE_TAB', tabId: currentTabId }, () => {
    isActive = false;
    activateBtn.disabled = false;
    deactivateBtn.disabled = true;
    exportBtn.disabled = true;
    setStatus('Stopped', '');
  });
});

// ---- Stats from content script ----

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === 'STATS') {
    const parts = [];
    if (msg.vars) parts.push(`${msg.vars} CSS vars`);
    if (msg.badges) parts.push(`${msg.badges} elements`);
    if (msg.imported) parts.push(`${msg.imported} imported tokens`);
    setStatus(parts.join(' \u00b7 ') || 'Active', 'active');
  }
});

// ---- Import: File ----

fileInput.addEventListener('change', async () => {
  const file = fileInput.files[0];
  if (!file) return;

  try {
    const text = await file.text();
    const data = file.name.endsWith('.css') ? text : JSON.parse(text);
    pendingImportData = data;
    setImportStatus(`Loaded ${file.name}`, 'ok');

    if (isActive && currentTabId) {
      chrome.runtime.sendMessage({ type: 'IMPORT_TOKENS', tabId: currentTabId, tokens: data }, r => {
        if (r?.ok) setImportStatus(`${r.count} tokens imported`, 'ok');
        else setImportStatus(r?.error || 'Import failed', 'error');
      });
    }
  } catch (e) {
    setImportStatus('Invalid file: ' + e.message, 'error');
  }
});

// ---- Import: Paste ----

pasteBtn.addEventListener('click', () => {
  const showing = !pasteArea.hidden;
  pasteArea.hidden = showing;
  importBtn.hidden = showing;
  if (!showing) pasteArea.focus();
});

importBtn.addEventListener('click', () => {
  const text = pasteArea.value.trim();
  if (!text) { setImportStatus('Nothing to import', 'error'); return; }

  try {
    const data = text.startsWith('{') || text.startsWith('[') ? JSON.parse(text) : text;
    pendingImportData = data;
    setImportStatus('Tokens loaded from paste', 'ok');

    if (isActive && currentTabId) {
      chrome.runtime.sendMessage({ type: 'IMPORT_TOKENS', tabId: currentTabId, tokens: data }, r => {
        if (r?.ok) setImportStatus(`${r.count} tokens imported`, 'ok');
        else setImportStatus(r?.error || 'Import failed', 'error');
      });
    }
  } catch (e) {
    setImportStatus('Parse error: ' + e.message, 'error');
  }
});

// ---- Export ----

exportBtn.addEventListener('click', () => {
  if (!currentTabId) return;

  chrome.runtime.sendMessage({ type: 'GET_REMAPPINGS', tabId: currentTabId }, response => {
    const remappings = response?.remappings || [];
    if (!remappings.length) { setStatus('No remappings yet', ''); return; }

    const json = JSON.stringify(remappings, null, 2);
    navigator.clipboard.writeText(json).then(() => {
      setStatus(`${remappings.length} remapping(s) copied`, 'active');
    }).catch(() => {
      const blob = new Blob([json], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `token-remappings-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(a.href);
      setStatus(`${remappings.length} remapping(s) saved`, 'active');
    });
  });
});

// ---- Helpers ----

function setStatus(text, cls) {
  statusEl.textContent = text;
  statusEl.className = `status ${cls || ''}`.trim();
}

function setImportStatus(text, cls) {
  importStatus.textContent = text;
  importStatus.className = `import-status ${cls || ''}`.trim();
}
