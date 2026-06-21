export type LogFormat = "json" | "pretty";

export function getLogFormat(): LogFormat {
  const raw = process.env.LOG_FORMAT?.trim().toLowerCase();
  if (raw === "pretty") {
    return "pretty";
  }
  return "json";
}
