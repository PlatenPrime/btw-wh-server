const DISABLED_VALUES = new Set(["0", "false", "no", "off"]);

export function isHttpLogEnabled(): boolean {
  const raw = process.env.LOG_HTTP?.trim().toLowerCase();
  if (!raw) {
    return true;
  }
  if (DISABLED_VALUES.has(raw)) {
    return false;
  }
  return true;
}
