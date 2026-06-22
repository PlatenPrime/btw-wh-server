import { beforeEach, describe, expect, it, vi } from "vitest";
import { AxiosError } from "axios";
import { formatBrowserFetchError, getBrowserFetchLogLevel, logBrowserError, resolveAxiosError, } from "../browserRequest.js";
const mockError = vi.hoisted(() => vi.fn());
const mockWarn = vi.hoisted(() => vi.fn());
vi.mock("../../../../logging/createLogger.js", () => ({
    createLogger: () => ({
        error: mockError,
        warn: mockWarn,
        info: vi.fn(),
        debug: vi.fn(),
    }),
}));
function axCfg(url) {
    return { url };
}
function axiosHttpError(url, status, statusText = "Error") {
    const response = {
        status,
        statusText,
        data: {},
        headers: {},
        config: axCfg(url),
    };
    return new AxiosError(`Request failed with status code ${status}`, "ERR_BAD_RESPONSE", axCfg(url), undefined, response);
}
describe("formatBrowserFetchError", () => {
    it("форматирует таймаут Axios", () => {
        const url = "https://yumi.market/api/products?x=1";
        const err = new AxiosError("timeout of 30000ms exceeded", "ECONNABORTED", axCfg(url), undefined, undefined);
        expect(formatBrowserFetchError(url, err)).toBe("Browser GET timeout (30000ms): https://yumi.market/api/products?x=1");
    });
    it("форматирует HTTP-ответ", () => {
        const url = "https://example.com/page";
        const err = axiosHttpError(url, 502, "Bad Gateway");
        expect(formatBrowserFetchError(url, err)).toBe("Browser GET HTTP 502 Bad Gateway: https://example.com/page");
    });
    it("пробрасывает message обычного Error", () => {
        expect(formatBrowserFetchError("https://a", new Error("plain failure"))).toBe("plain failure");
    });
    it("усекает слишком длинный message", () => {
        const longMessage = "x".repeat(500);
        const formatted = formatBrowserFetchError("https://a", new Error(longMessage));
        expect(formatted.endsWith("... [truncated]")).toBe(true);
        expect(formatted.length).toBeLessThan(300);
    });
});
describe("resolveAxiosError", () => {
    it("находит AxiosError в cause обёрнутого Error", () => {
        const url = "https://sharte.net/page";
        const axiosErr = axiosHttpError(url, 404, "Not Found");
        const wrapped = new Error(formatBrowserFetchError(url, axiosErr), {
            cause: axiosErr,
        });
        expect(resolveAxiosError(wrapped)).toBe(axiosErr);
    });
});
describe("getBrowserFetchLogLevel", () => {
    it("4xx → warn", () => {
        const url = "https://sharte.net/page";
        expect(getBrowserFetchLogLevel(axiosHttpError(url, 404, "Not Found"))).toBe("warn");
    });
    it("5xx → error", () => {
        const url = "https://example.com/page";
        expect(getBrowserFetchLogLevel(axiosHttpError(url, 502, "Bad Gateway"))).toBe("error");
    });
    it("timeout → error", () => {
        const url = "https://yumi.market/api";
        const err = new AxiosError("timeout of 30000ms exceeded", "ECONNABORTED", axCfg(url), undefined, undefined);
        expect(getBrowserFetchLogLevel(err)).toBe("error");
    });
});
describe("logBrowserError", () => {
    beforeEach(() => {
        mockError.mockClear();
        mockWarn.mockClear();
    });
    it("пишет error для не-Axios ошибок", () => {
        logBrowserError("[ctx]", new Error("plain failure"));
        expect(mockError).toHaveBeenCalledWith({ context: "[ctx]", details: "plain failure" }, "browser fetch failed");
        expect(mockWarn).not.toHaveBeenCalled();
    });
    it("пишет warn для HTTP 404", () => {
        const url = "https://sharte.net/page";
        const err = axiosHttpError(url, 404, "Not Found");
        logBrowserError("Error fetching data from sharte:", err);
        expect(mockWarn).toHaveBeenCalledWith({
            context: "Error fetching data from sharte:",
            details: "Browser GET HTTP 404 Not Found: https://sharte.net/page",
            httpStatus: 404,
        }, "browser fetch failed");
        expect(mockError).not.toHaveBeenCalled();
    });
    it("пишет error для HTTP 502", () => {
        const url = "https://example.com/page";
        const err = axiosHttpError(url, 502, "Bad Gateway");
        logBrowserError("[ctx]", err);
        expect(mockError).toHaveBeenCalledWith({
            context: "[ctx]",
            details: "Browser GET HTTP 502 Bad Gateway: https://example.com/page",
            httpStatus: 502,
        }, "browser fetch failed");
        expect(mockWarn).not.toHaveBeenCalled();
    });
    it("пишет warn для Error с cause Axios 404 (browserGet)", () => {
        const url = "https://sharte.net/page";
        const axiosErr = axiosHttpError(url, 404, "Not Found");
        const wrapped = new Error(formatBrowserFetchError(url, axiosErr), {
            cause: axiosErr,
        });
        logBrowserError("Error fetching data from sharte:", wrapped);
        expect(mockWarn).toHaveBeenCalledWith({
            context: "Error fetching data from sharte:",
            details: "Browser GET HTTP 404 Not Found: https://sharte.net/page",
            httpStatus: 404,
        }, "browser fetch failed");
        expect(mockError).not.toHaveBeenCalled();
    });
});
