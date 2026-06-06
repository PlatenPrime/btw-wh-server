import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
const ENV_KEYS = [
    "BTW_TOKEN",
    "BTW_CHAT_ID",
    "KASA_CHAT_ID",
    "BTW_DEFS_CHAT_ID",
    "BTW_ANALITICS_CHAT_ID",
    "BTW_PLATEN_ID",
];
describe("telegram constants", () => {
    const originalEnv = {};
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => { });
    beforeEach(() => {
        vi.resetModules();
        consoleErrorSpy.mockClear();
        for (const key of ENV_KEYS) {
            originalEnv[key] = process.env[key];
            delete process.env[key];
        }
    });
    afterEach(() => {
        for (const key of ENV_KEYS) {
            if (originalEnv[key] === undefined) {
                delete process.env[key];
            }
            else {
                process.env[key] = originalEnv[key];
            }
        }
    });
    it("getBtwToken returns value from env", async () => {
        process.env.BTW_TOKEN = "test-token";
        const { getBtwToken } = await import("../telegram.js");
        expect(getBtwToken()).toBe("test-token");
    });
    it("getBtwToken throws and logs when env is missing", async () => {
        const { getBtwToken } = await import("../telegram.js");
        expect(() => getBtwToken()).toThrow("Telegram configuration error: BTW_TOKEN is not set");
        expect(consoleErrorSpy).toHaveBeenCalledWith("Missing required environment variable: BTW_TOKEN");
    });
    it("getBtwChatId returns value from env", async () => {
        process.env.BTW_CHAT_ID = "-1002121224059";
        const { getBtwChatId } = await import("../telegram.js");
        expect(getBtwChatId()).toBe("-1002121224059");
    });
    it("getKasaChatId throws when env is empty string", async () => {
        process.env.KASA_CHAT_ID = "   ";
        const { getKasaChatId } = await import("../telegram.js");
        expect(() => getKasaChatId()).toThrow("Telegram configuration error: KASA_CHAT_ID is not set");
        expect(consoleErrorSpy).toHaveBeenCalledWith("Missing required environment variable: KASA_CHAT_ID");
    });
    it("getBtwDefsChatId returns trimmed value", async () => {
        process.env.BTW_DEFS_CHAT_ID = "  -1003183753234  ";
        const { getBtwDefsChatId } = await import("../telegram.js");
        expect(getBtwDefsChatId()).toBe("-1003183753234");
    });
    it("getBtwPlatenId throws when env is missing", async () => {
        const { getBtwPlatenId } = await import("../telegram.js");
        expect(() => getBtwPlatenId()).toThrow("Telegram configuration error: BTW_PLATEN_ID is not set");
    });
    it("getBtwAnalyticsChatId returns trimmed value", async () => {
        process.env.BTW_ANALITICS_CHAT_ID = "  -100555444333  ";
        const { getBtwAnalyticsChatId } = await import("../telegram.js");
        expect(getBtwAnalyticsChatId()).toBe("-100555444333");
    });
    it("getBtwAnalyticsChatId throws when env is missing", async () => {
        const { getBtwAnalyticsChatId } = await import("../telegram.js");
        expect(() => getBtwAnalyticsChatId()).toThrow("Telegram configuration error: BTW_ANALITICS_CHAT_ID is not set");
    });
});
