import { describe, expect, it } from "vitest";
import { createLogger } from "../createLogger.js";
describe("createLogger", () => {
    it("создаёт child logger с bindings", () => {
        const log = createLogger({ module: "test", job: "unit" });
        expect(typeof log.info).toBe("function");
        expect(typeof log.error).toBe("function");
        expect(log.bindings()).toMatchObject({ module: "test", job: "unit" });
    });
});
