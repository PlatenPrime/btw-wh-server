import type { AppLogger } from "./createLogger.js";

export function registerProcessHandlers(log: AppLogger): void {
  process.on("uncaughtException", (err) => {
    log.fatal({ err }, "uncaught exception");
    process.exit(1);
  });

  process.on("unhandledRejection", (reason) => {
    log.error({ err: reason }, "unhandled rejection");
  });
}
