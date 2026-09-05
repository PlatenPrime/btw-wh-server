const STORAGE_KEYS = {
  apiBase: "apiBase",
  jwt: "jwt",
  pageMinMs: "pageMinMs",
  pageMaxMs: "pageMaxMs",
  groupMinMs: "groupMinMs",
  groupMaxMs: "groupMaxMs",
};

const DEFAULTS = {
  pageMinMs: 2000,
  pageMaxMs: 4000,
  groupMinMs: 10000,
  groupMaxMs: 20000,
};

let running = false;
let stopRequested = false;

function jitter(minMs, maxMs) {
  const lo = Number(minMs);
  const hi = Number(maxMs);
  if (!Number.isFinite(lo) || !Number.isFinite(hi) || hi <= lo) {
    return Math.max(0, lo || 0);
  }
  return lo + Math.floor(Math.random() * (hi - lo + 1));
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizeApiBase(raw) {
  return String(raw || "").trim().replace(/\/+$/, "");
}

function apiUrl(apiBase, path) {
  return `${normalizeApiBase(apiBase)}${path}`;
}

async function getSettings() {
  const stored = await chrome.storage.local.get({
    [STORAGE_KEYS.apiBase]: "",
    [STORAGE_KEYS.jwt]: "",
    [STORAGE_KEYS.pageMinMs]: DEFAULTS.pageMinMs,
    [STORAGE_KEYS.pageMaxMs]: DEFAULTS.pageMaxMs,
    [STORAGE_KEYS.groupMinMs]: DEFAULTS.groupMinMs,
    [STORAGE_KEYS.groupMaxMs]: DEFAULTS.groupMaxMs,
  });
  return stored;
}

function log(payload) {
  chrome.runtime.sendMessage({ type: "LOG", payload }).catch(() => {});
}

async function apiFetch(apiBase, jwt, path, options) {
  const res = await fetch(apiUrl(apiBase, path), {
    ...options,
    headers: {
      Authorization: `Bearer ${jwt}`,
      "Content-Type": "application/json",
      ...(options && options.headers),
    },
  });
  const body = await res.json().catch(() => ({}));
  return { res, body };
}

function waitTabComplete(tabId) {
  return new Promise((resolve) => {
    const listener = (id, info) => {
      if (id === tabId && info.status === "complete") {
        chrome.tabs.onUpdated.removeListener(listener);
        resolve();
      }
    };
    chrome.tabs.onUpdated.addListener(listener);
  });
}

async function getHtmlFromTab(tabId) {
  let lastError = "no html";
  for (let attempt = 0; attempt < 8; attempt += 1) {
    try {
      const response = await chrome.tabs.sendMessage(tabId, { type: "GET_HTML" });
      if (response && typeof response.html === "string" && response.html.length > 0) {
        return response.html;
      }
      lastError = "empty html";
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err);
      try {
        await chrome.scripting.executeScript({
          target: { tabId },
          files: ["content.js"],
        });
      } catch {
        /* ignore inject races */
      }
    }
    await delay(400);
  }
  throw new Error(`Failed to read page HTML: ${lastError}`);
}

async function openOrNavigate(tabId, url) {
  if (tabId == null) {
    const tab = await chrome.tabs.create({ url, active: false });
    if (tab.status !== "complete") {
      await waitTabComplete(tab.id);
    }
    await delay(800);
    return tab.id;
  }
  const done = waitTabComplete(tabId);
  await chrome.tabs.update(tabId, { url });
  await done;
  await delay(800);
  return tabId;
}

async function fillPage(apiBase, jwt, group, pageUrl, html) {
  const { res, body } = await apiFetch(
    apiBase,
    jwt,
    `/api/skugrs/client/air/id/${group.skugrId}/fill-page`,
    {
      method: "POST",
      body: JSON.stringify({
        sourceUrl: group.url,
        pageUrl,
        html,
      }),
    }
  );
  return { status: res.status, body };
}

async function runFill() {
  if (running) {
    log({ level: "warn", message: "Уже запущено" });
    return;
  }

  const settings = await getSettings();
  const apiBase = normalizeApiBase(settings[STORAGE_KEYS.apiBase]);
  const jwt = String(settings[STORAGE_KEYS.jwt] || "").trim();
  if (!apiBase || !jwt) {
    log({ level: "error", message: "Заполни API origin и JWT" });
    return;
  }

  running = true;
  stopRequested = false;
  log({ level: "info", message: "Старт очереди" });

  try {
    const { res, body } = await apiFetch(
      apiBase,
      jwt,
      "/api/skugrs/client/air/pending",
      { method: "GET" }
    );
    if (!res.ok) {
      log({
        level: "error",
        message: `pending ${res.status}: ${body.message || JSON.stringify(body)}`,
      });
      return;
    }

    const items = Array.isArray(body.data && body.data.items)
      ? body.data.items
      : [];
    log({ level: "info", message: `Групп в очереди: ${items.length}` });

    for (let i = 0; i < items.length; i += 1) {
      if (stopRequested) {
        log({ level: "warn", message: "Остановлено" });
        break;
      }

      const group = items[i];
      log({
        level: "info",
        message: `[${i + 1}/${items.length}] ${group.title} (${group.prodName})`,
      });

      let pageUrl = group.url;
      let tabId = null;
      let pageIndex = 0;

      try {
        while (pageUrl && !stopRequested) {
          pageIndex += 1;
          tabId = await openOrNavigate(tabId, pageUrl);
          const html = await getHtmlFromTab(tabId);

          let result = await fillPage(apiBase, jwt, group, pageUrl, html);
          if (result.status === 422) {
            log({
              level: "warn",
              message: `стр. ${pageIndex} 422, retry`,
            });
            await delay(jitter(3000, 6000));
            tabId = await openOrNavigate(tabId, pageUrl);
            const htmlRetry = await getHtmlFromTab(tabId);
            result = await fillPage(apiBase, jwt, group, pageUrl, htmlRetry);
          }

          if (result.status === 401 || result.status === 403) {
            log({
              level: "error",
              message: `auth ${result.status}: ${result.body.message || ""}`,
            });
            stopRequested = true;
            break;
          }

          if (!result.body || result.status >= 400) {
            log({
              level: "error",
              message: `стр. ${pageIndex} ${result.status} ${result.body.code || ""} ${result.body.message || ""}`,
            });
            break;
          }

          const data = result.body.data || {};
          log({
            level: "ok",
            message: `стр. ${pageIndex}: products=${data.productsOnPage} created=${data.stats && data.stats.created} linked=${data.stats && data.stats.linkedExisting}`,
          });

          pageUrl = data.nextPageUrl || null;
          if (pageUrl) {
            await delay(
              jitter(
                settings[STORAGE_KEYS.pageMinMs],
                settings[STORAGE_KEYS.pageMaxMs]
              )
            );
          }
        }
      } finally {
        if (tabId != null) {
          try {
            await chrome.tabs.remove(tabId);
          } catch {
            /* tab already closed */
          }
        }
      }

      if (!stopRequested && i < items.length - 1) {
        await delay(
          jitter(
            settings[STORAGE_KEYS.groupMinMs],
            settings[STORAGE_KEYS.groupMaxMs]
          )
        );
      }
    }

    log({ level: "info", message: "Готово" });
  } catch (err) {
    log({
      level: "error",
      message: err instanceof Error ? err.message : String(err),
    });
  } finally {
    running = false;
    chrome.runtime.sendMessage({ type: "DONE" }).catch(() => {});
  }
}

chrome.runtime.onMessage.addListener((message) => {
  if (message && message.type === "START") {
    runFill();
  }
  if (message && message.type === "STOP") {
    stopRequested = true;
    log({ level: "warn", message: "Stop запрошен" });
  }
});
