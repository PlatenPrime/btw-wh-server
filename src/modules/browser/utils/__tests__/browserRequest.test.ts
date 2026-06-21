import { describe, expect, it, vi } from "vitest";
import { AxiosError, type InternalAxiosRequestConfig } from "axios";
import {
  formatBrowserFetchError,
  logBrowserError,
} from "../browserRequest.js";

const mockError = vi.hoisted(() => vi.fn());

vi.mock("../../../../logging/createLogger.js", () => ({
  createLogger: () => ({
    error: mockError,
    info: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  }),
}));

function axCfg(url: string): InternalAxiosRequestConfig {
  return { url } as InternalAxiosRequestConfig;
}

describe("formatBrowserFetchError", () => {
  it("форматирует таймаут Axios", () => {
    const url = "https://yumi.market/api/products?x=1";
    const err = new AxiosError(
      "timeout of 30000ms exceeded",
      "ECONNABORTED",
      axCfg(url),
      undefined,
      undefined,
    );
    expect(formatBrowserFetchError(url, err)).toBe(
      "Browser GET timeout (30000ms): https://yumi.market/api/products?x=1",
    );
  });

  it("форматирует HTTP-ответ", () => {
    const url = "https://example.com/page";
    const response = {
      status: 502,
      statusText: "Bad Gateway",
      data: {},
      headers: {},
      config: axCfg(url),
    };
    const err = new AxiosError(
      "Request failed with status code 502",
      "ERR_BAD_RESPONSE",
      axCfg(url),
      undefined,
      response,
    );
    expect(formatBrowserFetchError(url, err)).toBe(
      "Browser GET HTTP 502 Bad Gateway: https://example.com/page",
    );
  });

  it("пробрасывает message обычного Error", () => {
    expect(
      formatBrowserFetchError("https://a", new Error("plain failure")),
    ).toBe("plain failure");
  });

  it("усекает слишком длинный message", () => {
    const longMessage = "x".repeat(500);
    const formatted = formatBrowserFetchError("https://a", new Error(longMessage));
    expect(formatted.endsWith("... [truncated]")).toBe(true);
    expect(formatted.length).toBeLessThan(300);
  });
});

describe("logBrowserError", () => {
  it("пишет structured error", () => {
    mockError.mockClear();
    logBrowserError("[ctx]", new Error("plain failure"));
    expect(mockError).toHaveBeenCalledWith(
      { context: "[ctx]", details: "plain failure" },
      "browser fetch failed"
    );
  });
});
