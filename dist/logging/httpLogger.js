import { randomUUID } from "node:crypto";
import pinoHttp from "pino-http";
import { isHttpLogEnabled } from "./isHttpLogEnabled.js";
import { rootLogger } from "./logger.js";
const SLOW_REQUEST_MS = 5_000;
function readRequestId(req) {
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
        return (_req, _res, next) => next();
    }
    const middleware = pinoHttp.default({
        logger: rootLogger.child({ module: "http" }),
        genReqId(req, res) {
            const existing = readRequestId(req);
            const requestId = existing ?? randomUUID();
            res.setHeader("x-request-id", requestId);
            return requestId;
        },
        customLogLevel(_req, res, err) {
            if (err || res.statusCode >= 500) {
                return "error";
            }
            if (res.statusCode >= 400) {
                return "warn";
            }
            return "info";
        },
        customSuccessMessage(req, res) {
            return `${req.method} ${req.url} ${res.statusCode}`;
        },
        customErrorMessage(req, res, err) {
            return `${req.method} ${req.url} ${res.statusCode} — ${err.message}`;
        },
        customAttributeKeys: {
            req: "req",
            res: "res",
            err: "err",
            responseTime: "responseTime",
        },
        serializers: {
            req(req) {
                return {
                    id: req.id,
                    method: req.method,
                    url: req.url,
                };
            },
            res(res) {
                return {
                    statusCode: res.statusCode,
                };
            },
        },
    });
    return middleware;
}
export function createSlowRequestLogger() {
    return (req, res, next) => {
        const startedAt = Date.now();
        res.on("finish", () => {
            const durationMs = Date.now() - startedAt;
            if (durationMs < SLOW_REQUEST_MS) {
                return;
            }
            rootLogger.warn({
                module: "http",
                requestId: req.id,
                method: req.method,
                url: req.url,
                statusCode: res.statusCode,
                durationMs,
                userId: req.user?.id,
            }, "slow request");
        });
        next();
    };
}
