const activeTabs = new Set();

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'ACTIVATE_TAB') {
    handleActivate(msg.tabId, msg.importedTokens || null)
      .then(r => sendResponse(r))
      .catch(e => sendResponse({ ok: false, error: e.message }));
    return true;
  }

  if (msg.type === 'DEACTIVATE_TAB') {
    activeTabs.delete(msg.tabId);
    chrome.tabs.sendMessage(msg.tabId, { type: 'DEACTIVATE' }).catch(() => {});
    sendResponse({ ok: true });
    return false;
  }

  if (msg.type === 'IMPORT_TOKENS') {
    chrome.tabs.sendMessage(msg.tabId, {
      type: 'IMPORT_TOKENS',
      tokens: msg.tokens
    }).catch(() => {});
    sendResponse({ ok: true });
    return false;
  }

  if (msg.type === 'GET_REMAPPINGS') {
    chrome.tabs.sendMessage(msg.tabId, { type: 'GET_REMAPPINGS' }, r => {
      sendResponse(r || { remappings: [] });
    });
    return true;
  }
});

async function handleActivate(tabId, importedTokens) {
  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ['content.js']
    });
  } catch (e) {
    return { ok: false, error: `Could not inject: ${e.message}` };
  }

  try {
    await chrome.tabs.sendMessage(tabId, {
      type: 'ACTIVATE',
      importedTokens
    });
    activeTabs.add(tabId);
  } catch (e) {
    return { ok: false, error: `Could not communicate with page: ${e.message}` };
  }

  return { ok: true };
}

chrome.tabs.onRemoved.addListener(tabId => activeTabs.delete(tabId));
