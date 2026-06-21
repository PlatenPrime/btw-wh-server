export function getLogFormat() {
    const raw = process.env.LOG_FORMAT?.trim().toLowerCase();
    if (raw === "pretty") {
        return "pretty";
    }
    return "json";
}
