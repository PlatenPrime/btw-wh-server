import type { NextFunction, Request, Response } from "express";

import { createLogger } from "./createLogger.js";

export function createErrorLogger() {
  return (
    err: unknown,
    req: Request,
    res: Response,
    _next: NextFunction
  ): void => {
    if (err instanceof SyntaxError && "body" in err) {
      res.status(400).json({ message: "Invalid or empty data" });
      return;
    }

    const requestId = typeof req.id === "string" ? req.id : undefined;
    const log = createLogger({ module: "http", requestId });
    log.error({ err }, "unhandled request error");

    const message =
      err instanceof Error ? err.message : "Something went wrong";
    const isDev = process.env.NODE_ENV === "development";

    res.status(400).json({
      message,
      ...(isDev && err instanceof Error ? { stack: err.stack ?? null } : {}),
    });
  };
}
