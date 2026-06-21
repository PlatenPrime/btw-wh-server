import pino, { type Logger } from "pino";

import { getLogFormat } from "./getLogFormat.js";
import { getLogLevel } from "./getLogLevel.js";
import { REDACT_PATHS } from "./redact.js";

function buildLoggerOptions(): pino.LoggerOptions {
  return {
    level: getLogLevel(),
    redact: [...REDACT_PATHS],
    timestamp: pino.stdTimeFunctions.isoTime,
  };
}

function createRootLogger(): Logger {
  const usePretty =
    getLogFormat() === "pretty" && process.env.NODE_ENV !== "production";

  if (usePretty) {
    return pino({
      ...buildLoggerOptions(),
      transport: {
        target: "pino-pretty",
        options: { colorize: true, translateTime: "SYS:standard" },
      },
    });
  }

  return pino(buildLoggerOptions());
}

export const rootLogger = createRootLogger();
