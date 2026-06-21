import type { Logger } from "pino";

import { rootLogger } from "./logger.js";

export type LoggerBindings = Record<
  string,
  string | number | boolean | undefined
>;

export type AppLogger = Logger;

export function createLogger(bindings: LoggerBindings): AppLogger {
  return rootLogger.child(bindings);
}
