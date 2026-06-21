import { randomUUID } from "node:crypto";

import type { IncomingMessage, ServerResponse } from "node:http";
import type { Request, Response } from "express";
import pinoHttp from "pino-http";

import { isHttpLogEnabled } from "./isHttpLogEnabled.js";
import { rootLogger } from "./logger.js";

const SLOW_REQUEST_MS = 5_000;

function readRequestId(req: Request): string | undefined {
  const header = req.headers["x-request-id"];
  if (typeof header === "string" && header.trim().length > 0) {
    return header.trim();
  }
  if (Array.isArray(header) && header[0]?.trim()) {
    return header[0].trim();
  }
  return undefined;
}

export function createHttpLogger() {
  if (!isHttpLogEnabled()) {
    return (_req: Request, _res: Response, next: () => void) => next();
  }

  const middleware = pinoHttp.default({
    logger: rootLogger.child({ module: "http" }),
    genReqId(
      req: IncomingMessage,
      res: ServerResponse<IncomingMessage>
    ) {
      const existing = readRequestId(req as Request);
      const requestId = existing ?? randomUUID();
      res.setHeader("x-request-id", requestId);
      return requestId;
    },
    customLogLevel(
      _req: IncomingMessage,
      res: ServerResponse<IncomingMessage>,
      err?: Error
    ) {
      if (err || res.statusCode >= 500) {
        return "error";
      }
      if (res.statusCode >= 400) {
        return "warn";
      }
      return "info";
    },
    customSuccessMessage(req: IncomingMessage, res: ServerResponse<IncomingMessage>) {
      return `${req.method} ${req.url} ${res.statusCode}`;
    },
    customErrorMessage(
      req: IncomingMessage,
      res: ServerResponse<IncomingMessage>,
      err: Error
    ) {
      return `${req.method} ${req.url} ${res.statusCode} — ${err.message}`;
    },
    customAttributeKeys: {
      req: "req",
      res: "res",
      err: "err",
      responseTime: "responseTime",
    },
    serializers: {
      req(req: IncomingMessage & { id?: string }) {
        return {
          id: req.id,
          method: req.method,
          url: req.url,
        };
      },
      res(res: ServerResponse<IncomingMessage>) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  });

  return middleware;
}

export function createSlowRequestLogger() {
  return (req: Request, res: Response, next: () => void) => {
    const startedAt = Date.now();

    res.on("finish", () => {
      const durationMs = Date.now() - startedAt;

      if (durationMs < SLOW_REQUEST_MS) {
        return;
      }

      rootLogger.warn(
        {
          module: "http",
          requestId: req.id,
          method: req.method,
          url: req.url,
          statusCode: res.statusCode,
          durationMs,
          userId: req.user?.id,
        },
        "slow request"
      );
    });

    next();
  };
}
