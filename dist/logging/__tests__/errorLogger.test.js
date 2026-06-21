import { describe, expect, it, vi } from "vitest";
import { createErrorLogger } from "../errorLogger.js";
describe("createErrorLogger", () => {
    it("возвращает 400 для SyntaxError body", () => {
        const handler = createErrorLogger();
        const json = vi.fn();
        const status = vi.fn().mockReturnValue({ json });
        const res = { status, headersSent: false };
        const syntaxError = Object.assign(new SyntaxError("bad json"), {
            body: "{",
        });
        handler(syntaxError, {}, res, vi.fn());
        expect(status).toHaveBeenCalledWith(400);
        expect(json).toHaveBeenCalledWith({ message: "Invalid or empty data" });
    });
    it("не отдаёт stack в production", () => {
        const originalEnv = process.env.NODE_ENV;
        process.env.NODE_ENV = "production";
        const handler = createErrorLogger();
        const json = vi.fn();
        const status = vi.fn().mockReturnValue({ json });
        const res = { status, headersSent: false, statusCode: 500 };
        const err = new Error("boom");
        handler(err, { id: "req-1" }, res, vi.fn());
        expect(status).toHaveBeenCalledWith(400);
        expect(json).toHaveBeenCalledWith({ message: "boom" });
        process.env.NODE_ENV = originalEnv;
    });
    it("отдаёт stack в development", () => {
        const originalEnv = process.env.NODE_ENV;
        process.env.NODE_ENV = "development";
        const handler = createErrorLogger();
        const json = vi.fn();
        const status = vi.fn().mockReturnValue({ json });
        const res = { status, headersSent: false, statusCode: 500 };
        const err = new Error("boom");
        handler(err, { id: "req-1" }, res, vi.fn());
        expect(json).toHaveBeenCalledWith({
            message: "boom",
            stack: expect.any(String),
        });
        process.env.NODE_ENV = originalEnv;
    });
});
