const FIELDS = [
  "apiBase",
  "jwt",
  "pageMinMs",
  "pageMaxMs",
  "groupMinMs",
  "groupMaxMs",
];

const DEFAULTS = {
  apiBase: "http://localhost:3232",
  jwt: "",
  pageMinMs: 2000,
  pageMaxMs: 4000,
  groupMinMs: 10000,
  groupMaxMs: 20000,
};

const logEl = document.getElementById("log");

function appendLog(entry) {
  const level = (entry && entry.level) || "info";
  const message = (entry && entry.message) || JSON.stringify(entry);
  const line = `[${new Date().toISOString().slice(11, 19)}] ${level}: ${message}\n`;
  logEl.textContent += line;
  logEl.scrollTop = logEl.scrollHeight;
}

async function load() {
  const stored = await chrome.storage.local.get(DEFAULTS);
  for (const key of FIELDS) {
    const el = document.getElementById(key);
    if (el) {
      el.value = stored[key] ?? DEFAULTS[key];
    }
  }
}

async function save() {
  const payload = {};
  for (const key of FIELDS) {
    const el = document.getElementById(key);
    payload[key] = el.type === "number" ? Number(el.value) : el.value.trim();
  }
  await chrome.storage.local.set(payload);
  appendLog({ level: "info", message: "Настройки сохранены" });
}

document.getElementById("save").addEventListener("click", () => {
  save();
});

document.getElementById("start").addEventListener("click", async () => {
  await save();
  appendLog({ level: "info", message: "Start" });
  chrome.runtime.sendMessage({ type: "START" });
});

document.getElementById("stop").addEventListener("click", () => {
  chrome.runtime.sendMessage({ type: "STOP" });
});

chrome.runtime.onMessage.addListener((message) => {
  if (message && message.type === "LOG") {
    appendLog(message.payload);
  }
  if (message && message.type === "DONE") {
    appendLog({ level: "info", message: "Worker idle" });
  }
});

load();
