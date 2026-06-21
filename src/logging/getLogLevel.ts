import type { Level } from "pino";

const LEVELS: ReadonlySet<string> = new Set([
  "fatal",
  "error",
  "warn",
  "info",
  "debug",
  "trace",
]);

export function getLogLevel(): Level {
  const raw = process.env.LOG_LEVEL?.trim().toLowerCase();
  if (raw && LEVELS.has(raw)) {
    return raw as Level;
  }
  return process.env.NODE_ENV === "production" ? "info" : "debug";
}
