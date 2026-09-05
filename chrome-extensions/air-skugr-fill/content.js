/**
 * Content script: отдаёт outerHTML страницы листинга Air.
 */
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message && message.type === "GET_HTML") {
    sendResponse({ html: document.documentElement.outerHTML });
  }
  return false;
});
