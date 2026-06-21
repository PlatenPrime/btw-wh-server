const LEVELS = new Set([
    "fatal",
    "error",
    "warn",
    "info",
    "debug",
    "trace",
]);
export function getLogLevel() {
    const raw = process.env.LOG_LEVEL?.trim().toLowerCase();
    if (raw && LEVELS.has(raw)) {
        return raw;
    }
    return process.env.NODE_ENV === "production" ? "info" : "debug";
}
